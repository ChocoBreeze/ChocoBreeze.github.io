from __future__ import annotations  # 타입 힌트를 더 유연하게 쓰기 위한 설정입니다.

import os  # 환경변수(예: OPENAI_API_KEY)를 읽을 때 사용합니다.
from pathlib import Path  # 파일/폴더 경로를 운영체제에 맞게 다루기 쉽게 해줍니다.

from dotenv import load_dotenv  # .env 파일에 저장된 환경변수를 불러오는 함수입니다.
from langchain_classic.chains import ConversationalRetrievalChain  # 대화형 RAG 체인을 만드는 클래스입니다.
from langchain_classic.memory import ConversationBufferMemory  # 이전 대화 내용을 기억해 주는 메모리 클래스입니다.
from langchain_text_splitters import RecursiveCharacterTextSplitter  # 긴 문서를 작은 청크로 나누는 도구입니다.
from langchain_chroma import Chroma  # Chroma 벡터 DB를 사용하는 클래스입니다.
from langchain_community.document_loaders import PyPDFLoader, TextLoader  # PDF와 txt 파일을 읽어오는 로더입니다.
from langchain_openai import ChatOpenAI, OpenAIEmbeddings  # OpenAI 채팅 모델과 임베딩 모델을 사용하는 클래스입니다.


BASE_DIR = Path(__file__).resolve().parent  # 현재 이 파이썬 파일이 들어 있는 폴더 경로입니다.

DEFAULT_DOCS = [  # 기본으로 불러올 문서 파일 목록입니다.
    BASE_DIR.parent / "Week3" / "sample_investment_note.txt",  # Week3 폴더 안의 txt 파일 경로입니다.
    BASE_DIR.parent / "Week3" / "2024ltr.pdf",  # Week3 폴더 안의 PDF 파일 경로입니다.
]

DEFAULT_DB_DIR = BASE_DIR / "chatbot_db"  # 벡터 DB를 저장할 폴더 경로입니다.

DEFAULT_CHAT_MODEL = os.getenv("OPENAI_CHAT_MODEL", "gpt-4o-mini")  
# 환경변수에서 채팅 모델 이름을 읽고,
# 없으면 기본값으로 "gpt-4o-mini"를 사용합니다.

DEFAULT_EMBEDDING_MODEL = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")
# 환경변수에서 임베딩 모델 이름을 읽고,
# 없으면 기본값으로 "text-embedding-3-small"을 사용합니다.


def load_document(file_path: Path):
    # 파일 하나를 읽어서 LangChain Document 리스트로 반환하는 함수입니다.

    if file_path.suffix.lower() == ".pdf":
        # 파일 확장자가 .pdf이면 PDF 로더를 사용합니다.
        loader = PyPDFLoader(str(file_path))
    else:
        # PDF가 아니면 텍스트 파일이라고 보고 TextLoader를 사용합니다.
        loader = TextLoader(str(file_path), encoding="utf-8")

    return loader.load()
    # 실제로 파일을 읽어서 Document 객체들의 리스트로 반환합니다.


# 여러 파일을 한 번에 읽어서, RAG가 쓰기 좋은 하나의 문서 묶음으로 합치는 역할
def collect_documents(paths: list[Path]):
    # 여러 파일을 한 번에 읽어서 하나의 문서 리스트로 합치는 함수입니다.

    documents = []
    # 최종적으로 모든 문서를 모아둘 빈 리스트를 만듭니다.

    for path in paths:
        # 전달받은 파일 경로 목록을 하나씩 확인합니다.

        if not path.exists():
            # 파일이 실제로 존재하지 않으면
            continue
            # 에러를 내지 않고 그냥 다음 파일로 넘어갑니다.

        loaded = load_document(path)
        # 현재 파일 하나를 읽어서 Document 리스트를 가져옵니다.

        for doc in loaded:
            # 방금 읽어온 각 Document를 하나씩 확인합니다.
            doc.metadata["source_name"] = path.name
            # metadata에 원본 파일 이름을 저장합니다.
            # 나중에 출처 출력할 때 쓰기 좋습니다.

        documents.extend(loaded)
        # 현재 파일에서 읽은 문서들을 전체 documents 리스트에 추가합니다.

    return documents
    # 최종적으로 모은 모든 문서 리스트를 반환합니다.


def build_vector_db() -> Chroma:
    # 문서를 읽고, 청크로 나누고, 임베딩해서 Chroma 벡터 DB를 만드는 함수입니다.

    documents = collect_documents(DEFAULT_DOCS)
    # 기본 문서 목록(DEFAULT_DOCS)에 있는 파일들을 모두 읽어옵니다.

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        # 한 청크의 최대 길이를 500자로 설정합니다.

        chunk_overlap=50,
        # 청크끼리 50자 정도 겹치게 만듭니다.
        # 이렇게 하면 문맥이 중간에 끊기는 문제를 줄일 수 있습니다.

        length_function=len,
        # 길이를 잴 때 파이썬의 len 함수를 사용합니다.
    )

    chunks = splitter.split_documents(documents)
    # 읽어온 문서들을 여러 개의 작은 청크로 나눕니다.

    embeddings = OpenAIEmbeddings(model=DEFAULT_EMBEDDING_MODEL)
    # OpenAI 임베딩 모델을 준비합니다.
    # 이 모델이 각 청크를 숫자 벡터로 바꿔줍니다.

    # 기존에 DB를 재사용하지는 않음.
    return Chroma.from_documents(
        documents=chunks,
        # 벡터 DB에 넣을 문서 청크들입니다.

        embedding=embeddings,
        # 청크를 벡터로 바꾸는 임베딩 모델입니다.

        persist_directory=str(DEFAULT_DB_DIR),
        # 벡터 DB를 디스크에 저장할 폴더 경로입니다.
    )
    # 청크들을 임베딩해서 Chroma 벡터 DB를 만들고 반환합니다.


def main() -> None:
    # 프로그램의 전체 실행 흐름을 담당하는 함수입니다.

    load_dotenv()
    # .env 파일을 읽어서 환경변수를 현재 파이썬 프로그램에 불러옵니다.

    api_key = os.getenv("OPENAI_API_KEY")
    # 환경변수에서 OpenAI API 키를 읽어옵니다.

    if not api_key:
        # API 키가 없으면
        raise SystemExit(
            "OPENAI_API_KEY가 없습니다. Week6 폴더 또는 상위 폴더의 .env 파일에 설정하세요."
        )
        # 프로그램을 종료하면서 안내 메시지를 출력합니다.

    vectordb = build_vector_db()
    # 문서를 읽고 벡터 DB를 생성합니다.

    # LangChain 체인/리트리버/메모리와 쉽게 연결되도록 감싼 모델 객체
    llm = ChatOpenAI(model=DEFAULT_CHAT_MODEL, temperature=0)
    # OpenAI 채팅 모델을 준비합니다.
    # temperature=0은 답변을 좀 더 일관되게 하려는 설정입니다.

    # 이전 대화 내용을 저장해둘 메모리 객체 만들기
    memory = ConversationBufferMemory(
        memory_key="chat_history",
        # 메모리 안에서 대화 기록을 저장할 키 이름입니다.

        return_messages=True,
        # 대화 기록을 메시지 형태로 반환하게 합니다. (긴 문자열 형태가 아님)

        output_key="answer",
        # 체인의 출력값 중 어떤 키를 메모리에 저장할지 지정합니다.
        # 메모리에 저장해야 하는 값은 실제 답변 텍스트.
    )

    chat_chain = ConversationalRetrievalChain.from_llm(
        llm=llm,
        # 답변을 생성할 LLM입니다.

        retriever=vectordb.as_retriever(search_kwargs={"k": 4}),
        # 벡터 DB를 retriever 형태로 바꿉니다. (관련 문서를 찾아주는 검색기)
        # 벡터 DB에서 가장 관련 있는 청크 4개를 찾아서 LLM에게 넘긴다. (vectorDB를 검색기처럼 쓰겠다)
        # k=4는 질문과 관련 있는 청크 4개를 가져오겠다는 뜻입니다.

        memory=memory,
        # 이전 대화 내용을 기억하기 위한 메모리를 연결합니다.

        return_source_documents=True,
        # 답변뿐 아니라 출처 문서도 함께 반환하게 합니다.
    )

    questions = [
        "삼성전자 실적 관련 핵심 내용을 요약해줘.",
        "그중에서 반도체 쪽만 다시 설명해줘.",
    ]
    # 대화형 RAG가 실제로 문맥을 기억하는지 보기 위한 질문 목록입니다.
    # 두 번째 질문은 첫 번째 질문의 맥락을 이어받는 형태입니다.

    for question in questions:
        # 질문 목록을 하나씩 실행합니다.

        result = chat_chain.invoke({"question": question})
        # 현재 질문을 대화형 체인에 넣고 실행합니다.
        # 결과는 answer, source_documents 등을 담은 딕셔너리 형태로 반환됩니다.

        print("=" * 60)
        # 보기 좋게 구분선을 출력합니다.

        print(f"질문: {question}")
        # 현재 질문을 출력합니다.

        print("[답변]")
        # 답변 헤더를 출력합니다.

        print(result["answer"])
        # 실제 생성된 답변을 출력합니다.

        print("[출처 문서]")
        # 출처 문서 헤더를 출력합니다.

        for doc in result["source_documents"]:
            # 답변 생성에 사용된 출처 문서들을 하나씩 확인합니다.

            print(
                f"- {doc.metadata.get('source_name', doc.metadata.get('source', '알 수 없음'))} "
                f"p.{doc.metadata.get('page', '?')}"
            )
            # metadata에서 파일 이름과 페이지 번호를 꺼내서 출력합니다.
            # source_name이 있으면 그걸 쓰고,
            # 없으면 source를 쓰고,
            # 그것도 없으면 '알 수 없음'을 출력합니다.
            # page 정보가 없으면 '?'를 출력합니다.


if __name__ == "__main__":
    # 이 파일을 직접 실행했을 때만 아래 main()을 실행합니다.
    main()