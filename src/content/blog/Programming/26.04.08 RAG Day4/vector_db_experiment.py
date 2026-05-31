from __future__ import annotations
# 파이썬 타입 힌트를 조금 더 유연하게 쓰기 위한 설정입니다.
# 지금 단계에서는 "타입 표기를 조금 편하게 해주는 문법" 정도로 이해하면 충분합니다.

import argparse
# 터미널에서 --file, --query 같은 옵션을 받을 수 있게 해주는 모듈입니다.

import os
# 환경변수(.env에서 불러온 값 포함)를 읽을 때 사용합니다.

import shutil
# 폴더 전체를 삭제할 때 사용합니다.
# 여기서는 기존 벡터 DB 폴더를 지우고 새로 만들기 위해 사용합니다.

from pathlib import Path
# 파일 경로를 다루기 쉽게 해주는 도구입니다.
# 문자열보다 더 안전하고 직관적으로 파일/폴더 경로를 다룰 수 있습니다.

from dotenv import load_dotenv
# .env 파일에 저장한 환경변수(예: OPENAI_API_KEY)를 불러오는 함수입니다.

from langchain_text_splitters import RecursiveCharacterTextSplitter
# 긴 문서를 작은 청크(chunk)로 나누는 도구입니다.

from langchain_chroma import Chroma
# Chroma 벡터 DB를 사용하기 위한 클래스입니다.

from langchain_community.document_loaders import PyPDFLoader, TextLoader
# PDF 파일은 PyPDFLoader로 읽고, txt 파일은 TextLoader로 읽기 위해 가져옵니다.

from langchain_openai import OpenAIEmbeddings
# 텍스트를 임베딩 벡터로 바꾸기 위한 OpenAI 임베딩 모델입니다.


# 현재 이 파이썬 파일이 들어 있는 폴더 경로를 기준점으로 잡습니다.
# 예를 들어 이 파일이 Week4 폴더 안에 있다면 BASE_DIR은 Week4 폴더가 됩니다.
BASE_DIR = Path(__file__).resolve().parent

# 기본으로 사용할 입력 파일 경로입니다.
# 따로 --file 옵션을 주지 않으면 RAG Day3의 sample_investment_note.txt 파일을 사용합니다.
DEFAULT_FILE = BASE_DIR.parent / "26.04.08 RAG Day3" / "sample_investment_note.txt"

# 벡터 DB를 저장할 기본 폴더 경로입니다.
# 실행하면 이 폴더 안에 Chroma DB 파일들이 저장됩니다.
DEFAULT_DB_DIR = BASE_DIR / "investment_db"


def load_documents(file_path: Path) -> list:
    """
    파일 경로를 받아 문서를 불러오는 함수입니다.

    지원 방식:
    - PDF 파일이면 PyPDFLoader 사용
    - 그 외 파일이면 텍스트 파일이라고 보고 TextLoader 사용
    """
    # 파일 확장자를 소문자로 가져옵니다.
    # 예: ".PDF"여도 ".pdf"로 통일해서 비교할 수 있게 합니다.
    suffix = file_path.suffix.lower()

    # PDF 파일이면 PDF 전용 로더 사용
    if suffix == ".pdf":
        loader = PyPDFLoader(str(file_path))
    else:
        # PDF가 아니면 텍스트 파일로 간주하고 utf-8 인코딩으로 읽습니다.
        loader = TextLoader(str(file_path), encoding="utf-8")

    # loader.load()를 실행하면 LangChain의 Document 객체 리스트가 반환됩니다.
    return loader.load()


def enrich_chunks(chunks: list, category: str) -> None:
    """
    청크마다 메타데이터를 추가하는 함수입니다.

    추가하는 정보:
    - chunk_id: 몇 번째 청크인지
    - category: 사용자가 지정한 문서 카테고리
    - source_name: 원본 파일 이름
    """
    # enumerate를 쓰면 index(번호)와 chunk를 함께 꺼낼 수 있습니다.
    for index, chunk in enumerate(chunks):
        # 각 chunk에는 metadata라는 딕셔너리가 있습니다.
        # 여기에 우리가 원하는 정보를 추가로 넣습니다.
        chunk.metadata.update(
            {
                "chunk_id": index,
                "category": category,
                "source_name": Path(chunk.metadata.get("source", "")).name,
                # source는 보통 원본 파일 전체 경로가 들어 있습니다.
                # 거기서 파일 이름만 뽑아 source_name으로 저장합니다.
            }
        )


def build_vector_db(
    file_path: Path,
    db_dir: Path,
    category: str,
    model_name: str,
) -> Chroma:
    """
    문서를 읽고 -> 청크로 나누고 -> 임베딩을 만들고 -> Chroma DB에 저장하는 함수입니다.
    """

    # 1. 원본 문서를 불러옵니다.
    documents = load_documents(file_path)

    # 2. 문서를 잘게 나누기 위한 청크 분할기 설정
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=300,
        # 청크 하나의 최대 길이입니다.
        # 여기서는 300자 정도 단위로 나눕니다.

        chunk_overlap=50,
        # 청크끼리 50자 정도 겹치게 만듭니다.
        # 이렇게 하면 문맥이 너무 뚝 끊기는 문제를 조금 줄일 수 있습니다.

        length_function=len,
        # 길이를 셀 때 파이썬 기본 len 함수를 사용하겠다는 뜻입니다.
    )

    # 3. 문서를 실제로 청크 단위로 쪼갭니다.
    chunks = splitter.split_documents(documents)

    # 4. 각 청크에 메타데이터를 추가합니다.
    enrich_chunks(chunks, category)

    # 5. OpenAI 임베딩 모델 준비
    embeddings = OpenAIEmbeddings(model=model_name)

    # 6. 청크들을 임베딩한 뒤 Chroma 벡터 DB에 저장합니다.
    # 문서 청크 목록을 받아서 임베딩을 만들고, 그 결과를 Chroma 벡터 DB에 넣어 vectordb 객체로 돌려주는 코드
    vectordb = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings, # 어떤 임베딩 모델로 벡터화할지 결정
        persist_directory=str(db_dir),
        # 이 폴더에 DB를 디스크 형태로 저장합니다.
        # ids, collection_name, client_settings, client, collection_metadata 등 추가 parameter 존재.
    )

    # 확인용 출력
    print(f"원본 문서 수: {len(documents)}")
    print(f"저장된 청크 수: {vectordb._collection.count()}")

    # 만들어진 벡터 DB 객체를 반환합니다.
    return vectordb


def reload_vector_db(db_dir: Path, model_name: str) -> Chroma:
    """
    디스크에 저장된 Chroma 벡터 DB를 다시 불러오는 함수입니다.
    """
    # 벡터 DB를 읽어올 때도 같은 임베딩 모델 설정이 필요합니다.
    embeddings = OpenAIEmbeddings(model=model_name)

    # 저장 폴더를 지정해서 기존 DB를 다시 엽니다.
    vectordb = Chroma(
        persist_directory=str(db_dir),
        embedding_function=embeddings,
    )

    # 재로드 후 개수 확인
    print(f"재로드 후 청크 수: {vectordb._collection.count()}")

    return vectordb


def run_similarity_search(vectordb: Chroma, query: str, k: int) -> None:
    """
    질문(query)을 받아 벡터 DB에서 비슷한 청크를 검색하고 출력하는 함수입니다.
    """
    print("=" * 60)
    print(f"질문: {query}")

    # similarity_search:
    # 질문도 임베딩 벡터로 바꾼 뒤,
    # DB 안에 있는 청크 벡터들과 비교해서 가장 가까운 것 k개를 찾습니다.
    results = vectordb.similarity_search(query, k=k)

    # 검색 결과를 하나씩 출력합니다.
    for index, doc in enumerate(results, start=1):
        # PDF 등에서는 줄바꿈이 많아 출력이 지저분할 수 있어서
        # 줄바꿈을 공백으로 바꾸고 앞부분 200자만 미리보기로 보여줍니다.
        preview = doc.page_content.replace("\n", " ")[:200]

        print("-" * 60)
        print(f"검색 결과 {index}")
        print(f"내용: {preview}")
        print(f"메타데이터: {doc.metadata}")


def main() -> None:
    """
    전체 실행 흐름을 담당하는 메인 함수입니다.
    """
    # 1. .env 파일을 읽어서 환경변수를 불러옵니다.
    load_dotenv()

    # 2. OpenAI API 키가 있는지 확인합니다.
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise SystemExit(
            "OPENAI_API_KEY가 없습니다. Week4 폴더 또는 상위 폴더의 .env 파일에 설정하세요."
        )

    # 3. 사용할 임베딩 모델 이름을 읽습니다.
    # .env 파일에 OPENAI_EMBEDDING_MODEL이 있으면 그 값을 쓰고,
    # 없으면 기본값으로 text-embedding-3-small을 사용합니다.
    model_name = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")

    # 4. 명령줄 인자(argparse) 설정
    parser = argparse.ArgumentParser(description="Week4 벡터 DB 실습")

    # 해당 인자가 없다면 default 값 추가.
    parser.add_argument(
        "--file",
        default=str(DEFAULT_FILE),
        help="벡터 DB에 저장할 TXT 또는 PDF 파일 경로",
    )

    parser.add_argument(
        "--db-dir",
        default=str(DEFAULT_DB_DIR),
        help="Chroma DB 저장 폴더 경로",
    )

    parser.add_argument(
        "--query",
        default="삼성전자 실적과 반도체 업황은 어떤가요?",
        help="유사도 검색에 사용할 질문",
    )

    parser.add_argument(
        "--category",
        default="투자보고서",
        help="청크 메타데이터에 저장할 카테고리",
    )

    parser.add_argument(
        "--k",
        type=int,
        default=3,
        help="검색할 청크 개수",
    )

    # 사용자가 터미널에 입력한 옵션들을 실제로 읽어옵니다.
    args = parser.parse_args()

    # 문자열 경로를 Path 객체로 바꿉니다.
    file_path = Path(args.file)
    db_dir = Path(args.db_dir)

    # 입력 파일이 실제로 존재하는지 확인합니다.
    if not file_path.exists():
        raise SystemExit(f"파일을 찾을 수 없습니다: {file_path}")

    # 학습용 실습에서는 기존 DB가 남아 있으면 헷갈릴 수 있으므로
    # DB 폴더가 이미 있으면 삭제하고 새로 만듭니다.
    if db_dir.exists():
        shutil.rmtree(db_dir)

    # 현재 어떤 설정으로 실행되는지 화면에 출력합니다.
    print(f"사용 임베딩 모델: {model_name}")
    print(f"대상 파일: {file_path}")
    print(f"DB 저장 경로: {db_dir}")
    print("=" * 60)

    # 5. 문서를 읽어서 벡터 DB 생성
    build_vector_db(file_path, db_dir, args.category, model_name)

    # 6. 저장된 벡터 DB를 다시 불러오기 (저장 후 재로드도 정상적으로 되는지 확인)
    vectordb = reload_vector_db(db_dir, model_name)

    # 7. 질문으로 유사한 청크 검색
    run_similarity_search(vectordb, args.query, args.k)

    # 마지막 관찰 포인트 출력
    print("=" * 60)
    print("관찰 포인트:")
    print("1. 문서를 벡터 DB에 저장하면 질문과 가까운 청크만 빠르게 찾을 수 있습니다.")
    print("2. 프로그램을 다시 실행해도 DB 폴더가 남아 있으면 이전 벡터를 재사용할 수 있습니다.")
    print("3. 검색 결과 메타데이터를 보면 출처 추적이 가능합니다.")


# 이 파일을 직접 실행했을 때만 main() 함수를 실행합니다.
# 다른 파일에서 import만 했을 때는 자동 실행되지 않게 해주는 파이썬의 기본 구조입니다.
if __name__ == "__main__":
    main()
