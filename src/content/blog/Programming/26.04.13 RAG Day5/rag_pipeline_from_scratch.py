from __future__ import annotations
# Python 3.9+에서 타입 힌트를 조금 더 유연하게 쓰도록 도와주는 설정입니다.
# 지금 단계에서는 "타입 표기를 편하게 해주는 옵션" 정도로 이해하시면 충분합니다.

import argparse
# 터미널에서 실행할 때 --file, --k 같은 옵션을 받을 수 있게 해주는 모듈입니다.

import os
# 환경변수(예: OPENAI_API_KEY)를 읽을 때 사용합니다.

import shutil
# 폴더를 통째로 삭제할 때 사용합니다.
# 여기서는 --rebuild 옵션을 줄 때 기존 DB 폴더를 지우는 데 사용합니다.

from pathlib import Path
# 파일 경로를 더 안전하고 편하게 다루기 위한 도구입니다.
# 문자열로 경로를 직접 이어 붙이는 것보다 실수할 가능성이 적습니다.

from dotenv import load_dotenv
# .env 파일에 저장된 환경변수(예: API 키)를 프로그램 안으로 불러오는 역할입니다.

from langchain_text_splitters import RecursiveCharacterTextSplitter
# 긴 문서를 작은 청크(chunk)로 나누는 도구입니다.
# RAG에서는 문서를 한 번에 다 넣지 않고, 잘게 나눠서 저장하는 것이 중요합니다.

from langchain_chroma import Chroma
# 벡터 DB 역할을 하는 Chroma를 LangChain과 함께 사용하기 위한 클래스입니다.
# 청크를 저장하고, 질문과 비슷한 청크를 검색할 때 사용합니다.

from langchain_community.document_loaders import PyPDFLoader, TextLoader
# 문서를 읽어오는 로더(loader)입니다.
# PDF는 PyPDFLoader, 일반 텍스트 파일은 TextLoader를 사용합니다.

from langchain_openai import OpenAIEmbeddings
# 문장을 임베딩 벡터로 바꿔주는 도구입니다.
# RAG에서 "질문과 비슷한 청크 찾기"를 하려면 임베딩이 필요합니다.

from openai import OpenAI
# OpenAI의 채팅 모델을 호출하기 위한 클라이언트입니다.
# 검색이 끝난 뒤, 찾은 컨텍스트를 바탕으로 답변을 생성할 때 사용합니다.


# 현재 파이썬 파일이 있는 폴더(Week5 폴더)를 기준으로 경로를 잡습니다.
BASE_DIR = Path(__file__).resolve().parent

# 기본 실습용 텍스트 파일 경로입니다.
# 별도로 --file 옵션을 주지 않으면 이 파일을 사용합니다.
DEFAULT_FILE = BASE_DIR.parent / "26.04.08 RAG Day3" / "sample_investment_note.txt"

# Chroma 벡터 DB를 저장할 기본 폴더입니다.
DEFAULT_DB_DIR = BASE_DIR / "investment_db"


def load_documents(file_path: Path):
    """
    전달받은 파일 경로를 보고,
    PDF면 PDF 로더로 읽고,
    그 외에는 텍스트 로더로 읽어서 문서 목록을 반환합니다.

    여기서 반환되는 값은 LangChain Document 객체들의 리스트입니다.
    """

    # 파일 확장자를 소문자로 가져옵니다.
    # 예: ".PDF"처럼 대문자로 되어 있어도 ".pdf"로 비교할 수 있게 합니다.
    suffix = file_path.suffix.lower()

    # PDF 파일이면 PDF 전용 로더 사용
    if suffix == ".pdf":
        loader = PyPDFLoader(str(file_path))
    else:
        # PDF가 아니면 일반 텍스트 파일로 간주하고 UTF-8로 읽습니다.
        loader = TextLoader(str(file_path), encoding="utf-8")

    # 실제 문서를 읽어서 반환합니다.
    return loader.load()


def get_model_names() -> tuple[str, str]:
    """
    .env 또는 시스템 환경변수에서
    채팅 모델 이름과 임베딩 모델 이름을 읽어옵니다.

    왜 함수로 따로 뺐을까요?
    -> load_dotenv()가 실행된 뒤에 읽어야 .env 값이 제대로 반영되기 때문입니다.
    """

    # 채팅 모델 이름을 읽습니다.
    # 환경변수가 없으면 기본값으로 gpt-4o-mini를 사용합니다.
    chat_model = os.getenv("OPENAI_CHAT_MODEL", "gpt-4o-mini")

    # 임베딩 모델 이름을 읽습니다.
    # 환경변수가 없으면 기본값으로 text-embedding-3-small을 사용합니다.
    embedding_model = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")

    return chat_model, embedding_model


def get_embeddings() -> OpenAIEmbeddings:
    """
    현재 설정된 임베딩 모델 이름을 읽어
    OpenAIEmbeddings 객체를 만들어 반환합니다.
    """

    # get_model_names()는 (채팅모델, 임베딩모델) 순서로 반환합니다.
    _, embedding_model = get_model_names()

    # 임베딩 객체 생성
    return OpenAIEmbeddings(model=embedding_model)


def prepare_vector_db(file_path: Path, db_dir: Path, rebuild: bool) -> Chroma:
    """
    벡터 DB를 준비하는 함수입니다.

    동작 방식:
    1. --rebuild 옵션이 있으면 기존 DB 폴더 삭제
    2. 이미 DB가 있으면 그 DB를 다시 열어서 재사용
    3. DB가 없으면 문서를 읽고 청크로 나눈 뒤 새로 인덱싱

    즉, 이 함수가 인덱싱 단계 전체를 담당한다고 보면 됩니다.
    """

    # 임베딩 객체 준비
    embeddings = get_embeddings()

    # 사용자가 --rebuild 옵션을 줬고, 기존 DB 폴더가 실제로 존재하면
    # 그 폴더를 통째로 삭제합니다.
    if rebuild and db_dir.exists():
        shutil.rmtree(db_dir)
        print(f"기존 DB 삭제: {db_dir}")

    # DB 폴더가 이미 존재하면 새로 인덱싱하지 않고 그대로 재사용합니다.
    # 이렇게 하면 매번 같은 문서를 중복 저장하는 일을 줄일 수 있습니다.
    if db_dir.exists():
        vectordb = Chroma(
            persist_directory=str(db_dir),
            embedding_function=embeddings,
        )
        print(f"기존 DB 재사용: {db_dir}")
        return vectordb

    # 여기까지 왔다는 것은 DB가 아직 없다는 뜻입니다.
    # 이제 새로 문서를 읽고 인덱싱을 해야 합니다.

    # 문서 로드
    documents = load_documents(file_path)

    # 문서를 작은 청크로 나누는 설정입니다.
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=300,
        # 한 청크의 최대 길이입니다. 여기서는 300자 정도로 자릅니다.

        chunk_overlap=50,
        # 청크와 청크 사이에 50자를 겹치게 둡니다.
        # 겹침이 없으면 문장이 중간에서 잘려서 문맥이 끊길 수 있기 때문입니다.

        length_function=len,
        # 길이를 셀 때 Python의 len() 함수를 쓰겠다는 뜻입니다.
        # 즉, 여기서는 문자 수 기준으로 청크를 나눕니다.
    )

    # 실제로 문서를 청크로 분할합니다.
    chunks = splitter.split_documents(documents)

    # 각 청크에 메타데이터를 추가합니다.
    # 메타데이터는 "청크에 붙는 부가 정보"라고 보면 됩니다.
    for index, chunk in enumerate(chunks):
        # 원본 source 경로를 꺼내서 Path 객체로 바꿉니다.
        source_path = Path(chunk.metadata.get("source", ""))

        chunk.metadata.update(
            {
                "chunk_id": index,
                # 청크 번호를 붙입니다.
                # 나중에 디버깅하거나 추적할 때 도움이 됩니다.

                "source_name": source_path.name if source_path.name else "알 수 없음",
                # 전체 경로 대신 파일 이름만 따로 저장합니다.
                # 예: C:/.../2024ltr.pdf -> 2024ltr.pdf
            }
        )

    # 청크들을 임베딩해서 Chroma DB에 저장합니다.
    # Chroma DB에는 청크의 원문 텍스트와 그 청크의 임베딩 벡터, 그리고 메타데이터가 함께 저장
    vectordb = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=str(db_dir),
    )

    print(f"인덱싱 완료: {len(chunks)}개 청크 저장")
    return vectordb


def format_page(metadata: dict) -> str:
    """
    문서 메타데이터에서 페이지 번호를 사람이 보기 좋은 형태로 바꿔줍니다.

    PDF 로더는 페이지 번호를 0부터 저장하는 경우가 많아서,
    출력할 때는 +1 해서 1페이지부터 보이게 합니다.
    """

    page = metadata.get("page")

    # page가 정수라면 실제 출력용으로는 1을 더합니다.
    if isinstance(page, int):
        return str(page + 1)

    # 텍스트 파일처럼 페이지 개념이 없으면 ? 로 표시합니다.
    return "?"


def build_context(relevant_chunks) -> str:
    """
    검색된 청크들을 하나의 컨텍스트 문자열로 묶어
    LLM에게 전달할 준비를 하는 함수입니다.

    즉, 검색 결과를 "모델이 읽을 수 있는 참고자료 묶음"으로 만드는 단계입니다.
    """

    parts: list[str] = []

    for chunk in relevant_chunks:
        # 청크 메타데이터에서 파일 이름 가져오기
        source_name = chunk.metadata.get("source_name", "알 수 없음")

        # 사람이 읽기 좋은 페이지 번호 가져오기
        page = format_page(chunk.metadata)

        # 각 청크를 "출처 + 본문" 형태로 정리합니다.
        parts.append(f"[출처: {source_name}, 페이지: {page}]\n{chunk.page_content}")

    # 청크와 청크 사이를 구분선으로 나눠서 하나의 문자열로 합칩니다.
    return "\n\n---\n\n".join(parts)


def rag_query(vectordb: Chroma, client: OpenAI, question: str, k: int) -> str:
    """
    사용자의 질문 하나에 대해
    1. 관련 청크를 검색하고
    2. 컨텍스트를 만들고
    3. LLM에게 답변을 요청한 뒤
    4. 최종 답변 문자열을 반환하는 함수입니다.

    즉, 검색·생성 단계 전체를 담당합니다.
    """

    # 현재 사용할 채팅 모델 이름 가져오기
    chat_model, _ = get_model_names()

    # 벡터 DB에서 질문과 비슷한 청크 k개를 검색합니다.
    # 이 단계가 RAG의 "검색" 단계입니다.
    relevant_chunks = vectordb.similarity_search(question, k=k)

    # 검색된 청크들을 하나의 컨텍스트 문자열로 합칩니다.
    # 검색된 여러 청크를 LLM이 읽기 쉬운 한 덩어리의 입력으로 바꾸기 위해 필요
    # LLM은 청크들(Document 객체들)를 그대로 이해하지 않음. (text 형태의 context로 정리해서 줘야 함.)
    context = build_context(relevant_chunks)

    # 이제 OpenAI 채팅 모델에게 답변 생성을 요청합니다.
    # 이 단계가 RAG의 "생성" 단계입니다.
    response = client.chat.completions.create(
        model=chat_model,
        temperature=0,
        # temperature=0은 답변을 더 안정적이고 덜 랜덤하게 만들기 위한 설정입니다.
        # 실습에서는 보통 이렇게 두는 편이 좋습니다.

        messages=[
            {
                "role": "system",
                "content": (
                    "당신은 투자 자료 분석 도우미입니다. "
                    "반드시 제공된 컨텍스트만 사용해서 답하세요. "
                    "컨텍스트에 질문과 직접적으로 관련된 근거가 없으면 "
                    "'제공된 자료에서 찾을 수 없습니다'라고 답하세요. "
                    "추측하거나 일반 지식으로 보완하지 마세요."
                ),
            },
            # system 메시지는 모델의 행동 원칙을 정하는 역할을 합니다.
            # 여기서는 "컨텍스트 밖으로 나가지 말라"는 규칙을 강하게 넣었습니다.

            {
                "role": "user",
                "content": f"컨텍스트:\n{context}\n\n질문: {question}",
            },
            # user 메시지에는 실제 참고자료(context)와 질문(question)을 함께 넣습니다.
        ],
    )

    # 사람이 확인할 수 있도록 어떤 청크가 검색되었는지 콘솔에 출력합니다.
    print("[검색된 청크 출처]")

    if not relevant_chunks:
        print("검색 결과 없음")
    else:
        for index, chunk in enumerate(relevant_chunks, start=1):
            source_name = chunk.metadata.get("source_name", "알 수 없음")
            page = format_page(chunk.metadata)
            print(f"{index}. {source_name} p.{page}")

    # 모델의 답변 텍스트를 반환합니다.
    # 혹시 None일 가능성에 대비해 빈 문자열도 허용합니다.
    return response.choices[0].message.content or ""


def main() -> None:
    """
    프로그램 전체 실행의 시작점입니다.

    순서:
    1. .env 로드
    2. API 키 확인
    3. 명령행 인자 읽기
    4. 파일/DB 경로 준비
    5. 벡터 DB 준비(재사용 또는 새 인덱싱)
    6. 질문 여러 개 테스트
    """

    # .env 파일을 읽어서 환경변수를 불러옵니다.
    load_dotenv()

    # API 키 읽기
    api_key = os.getenv("OPENAI_API_KEY")

    # API 키가 없으면 프로그램을 종료합니다.
    if not api_key:
        raise SystemExit(
            "OPENAI_API_KEY가 없습니다. Week5 폴더 또는 상위 폴더의 .env 파일에 설정하세요."
        )

    # 현재 사용할 모델 이름들 읽기
    chat_model, embedding_model = get_model_names()

    # 명령행 인자 설정
    parser = argparse.ArgumentParser(description="Week5 기본 RAG 파이프라인")

    parser.add_argument(
        "--file",
        default=str(DEFAULT_FILE),
        help="인덱싱할 TXT 또는 PDF 파일 경로",
    )
    # 예:
    # python rag_pipeline_from_scratch.py --file "..\26.04.08 RAG Day3\2024ltr.pdf"

    parser.add_argument(
        "--db-dir",
        default=str(DEFAULT_DB_DIR),
        help="Chroma DB 저장 경로",
    )
    # 벡터 DB를 저장할 폴더 경로를 바꿀 수 있습니다.

    parser.add_argument(
        "--k",
        type=int,
        default=3,
        help="질문마다 검색할 청크 수",
    )
    # 질문마다 몇 개의 청크를 가져올지 정합니다.

    parser.add_argument(
        "--rebuild",
        action="store_true",
        help="기존 DB를 삭제하고 다시 인덱싱합니다.",
    )
    # 이 옵션을 넣으면 기존 investment_db를 지우고 다시 만듭니다.

    # 실제로 명령행 인자 읽기
    args = parser.parse_args()

    # 문자열 경로를 Path 객체로 변환
    file_path = Path(args.file)
    db_dir = Path(args.db_dir)

    # 대상 파일이 실제로 존재하는지 확인
    if not file_path.exists():
        raise SystemExit(f"파일을 찾을 수 없습니다: {file_path}")

    # 현재 설정 상태를 화면에 출력
    print(f"채팅 모델: {chat_model}")
    print(f"임베딩 모델: {embedding_model}")
    print(f"대상 파일: {file_path}")
    print(f"DB 경로: {db_dir}")
    print("=" * 60)

    # 벡터 DB 준비
    # 이미 있으면 재사용, 없으면 인덱싱
    vectordb = prepare_vector_db(file_path, db_dir, args.rebuild)

    # OpenAI 클라이언트 생성
    client = OpenAI(api_key=api_key)

    # 실습용 질문들
    questions = [
        "삼성전자의 최근 영업이익 추이는 어떤가요?",
        "HBM 반도체 시장 전망은 어떻게 되나요?",
        "오늘 저녁 뭐 먹을까요?",
    ]

    # 질문들 (pdf)
    questions = [
        "버크셔 해서웨이의 2024년 operating earnings는 얼마인가요?",
        "2024년에 버크셔 실적이 예상보다 좋았던 이유는 무엇인가요?",
        "버크셔가 투자한 일본 5대 상사는 어디인가요?",
    ]

    # 추가 질문들 (pdf)
    questions = [
        "2024년 버크셔의 insurance-investment income은 얼마인가요?",
        "GEICO의 실적 개선은 어떻게 설명되나요?",
        "버크셔가 2024년에 IRS에 납부한 법인세는 얼마인가요?",
        "버크셔는 왜 현금보다 equities를 선호한다고 말하나요?",
        "보험 float는 얼마에서 얼마로 증가했나요?",
        "2024년 버크셔 성과는 S&P 500과 비교해 어땠나요?",
    ]

    # 질문을 하나씩 던져보면서 RAG가 어떻게 동작하는지 확인합니다.
    for question in questions:
        print("=" * 60)
        print(f"질문: {question}")

        # 검색 + 생성 수행
        answer = rag_query(vectordb, client, question, args.k)

        # 최종 답변 출력
        print("[답변]")
        print(answer)

    print("=" * 60)
    print("관찰 포인트:")
    print("1. 검색 단계와 생성 단계가 분리되어 있다는 점을 확인합니다.")
    print("2. 컨텍스트에 없는 질문에는 답변을 제한하도록 프롬프트를 설계했습니다.")
    print("3. 출처를 함께 출력하면 나중에 답변 근거를 검증할 수 있습니다.")


# 이 파일을 직접 실행했을 때만 main()을 실행합니다.
# 다른 파일에서 import할 때는 자동 실행되지 않게 해주는 아주 흔한 Python 문법입니다.
if __name__ == "__main__":
    main()
