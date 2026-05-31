from __future__ import annotations  # 타입 힌트를 더 유연하게 쓰기 위한 설정입니다.

import argparse  # 터미널에서 옵션(--query 같은 것)을 받을 때 사용하는 표준 라이브러리입니다.
import os  # 환경변수(OPENAI_API_KEY 등)를 읽을 때 사용하는 표준 라이브러리입니다.
from pathlib import Path  # 파일 경로를 운영체제에 맞게 안전하게 다루기 위한 도구입니다.

from dotenv import load_dotenv  # .env 파일에 저장한 환경변수를 읽어오는 라이브러리입니다.

from langchain_classic.chains import RetrievalQA  # 검색 + 답변 생성을 하나로 묶는 RetrievalQA 체인입니다.
from langchain_core.documents import Document  # LangChain 문서 객체 타입입니다.
from langchain_text_splitters import RecursiveCharacterTextSplitter  # 긴 문서를 작은 청크로 나누는 도구입니다.

from langchain_chroma import Chroma  # Chroma 벡터 DB를 LangChain에서 사용하기 위한 클래스입니다.
from langchain_community.document_loaders import PyPDFLoader, TextLoader  # PDF와 txt 파일을 읽는 로더입니다.
from langchain_openai import ChatOpenAI, OpenAIEmbeddings  # OpenAI 채팅 모델과 임베딩 모델을 사용하는 클래스입니다.


BASE_DIR = Path(__file__).resolve().parent  # 현재 파이썬 파일이 들어 있는 폴더 경로입니다.

DEFAULT_DOCS = [  # 기본으로 불러올 문서 목록입니다.
    BASE_DIR / "sample_investment_note.txt",  # 현재 파일과 같은 폴더의 txt 파일입니다.
    BASE_DIR / "2024ltr.pdf",  # 현재 파일과 같은 폴더의 PDF 파일입니다.
]

DEFAULT_DB_DIR = BASE_DIR / "multi_doc_db"  # Chroma DB를 저장할 기본 폴더 경로입니다.


def load_document(file_path: Path) -> list[Document]:
    """파일 하나를 읽어서 LangChain Document 리스트로 반환합니다."""

    # 파일 확장자가 .pdf이면 PDF 로더를 사용합니다.
    if file_path.suffix.lower() == ".pdf":
        loader = PyPDFLoader(str(file_path))
    else:
        # PDF가 아니면 텍스트 파일로 보고 TextLoader를 사용합니다.
        # autodetect_encoding=True를 주면 인코딩이 UTF-8이 아닐 때도 어느 정도 자동 대응할 수 있습니다.
        loader = TextLoader(str(file_path), encoding="utf-8", autodetect_encoding=True)

    # 읽어 온 결과를 Document 리스트 형태로 반환합니다.
    return loader.load()


def collect_documents(paths: list[Path]) -> list[Document]:
    """여러 파일을 읽어서 하나의 문서 리스트로 합칩니다."""

    documents: list[Document] = []  # 최종적으로 모인 문서를 담을 리스트입니다.

    # 전달받은 파일 경로들을 하나씩 확인합니다.
    for path in paths:
        # 파일이 실제로 존재하지 않으면 안내 메시지를 출력하고 건너뜁니다.
        if not path.exists():
            print(f"건너뜀: 파일을 찾을 수 없습니다 -> {path}")
            continue

        try:
            # 파일을 읽어서 Document 리스트를 가져옵니다.
            loaded = load_document(path)
        except Exception as e:
            # 파일을 읽는 도중 오류가 나면 이유를 출력하고 다음 파일로 넘어갑니다.
            print(f"건너뜀: 파일을 읽는 중 오류 발생 -> {path} / {e}")
            continue

        # 각 문서의 metadata에 원본 파일명을 기록해 둡니다.
        for doc in loaded:
            doc.metadata["source_name"] = path.name

        # 현재 파일에서 읽은 문서들을 전체 리스트에 추가합니다.
        documents.extend(loaded)

    # 최종 문서 리스트를 반환합니다.
    return documents


def build_vector_db(documents: list[Document], db_dir: Path, embedding_model: str) -> Chroma:
    """문서를 청크로 나누고 임베딩하여 Chroma 벡터 DB를 생성합니다."""

    # 긴 문서를 작은 조각(chunk)으로 나누기 위한 분할기를 만듭니다.
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,  # 한 청크의 최대 길이입니다.
        chunk_overlap=50,  # 청크끼리 일부를 겹치게 하여 문맥이 끊기지 않도록 합니다.
        length_function=len,  # 길이를 셀 때 파이썬의 len 함수를 사용합니다.
    )

    # 문서들을 여러 개의 청크로 분할합니다.
    chunks = splitter.split_documents(documents)

    # 청크가 하나도 없으면 벡터 DB를 만들 수 없으므로 오류를 발생시킵니다.
    if not chunks:
        raise ValueError("분할된 청크가 없습니다.")

    # 임베딩 모델을 준비합니다.
    embeddings = OpenAIEmbeddings(model=embedding_model)

    # 청크들을 임베딩하여 Chroma 벡터 DB를 생성하고 디스크에 저장합니다.
    vectordb = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=str(db_dir),
    )

    # 몇 개의 청크가 만들어졌는지 출력합니다.
    print(f"생성된 청크 수: {len(chunks)}")

    # 생성된 벡터 DB 객체를 반환합니다.
    return vectordb


def format_source(doc: Document) -> str:
    """출처 문서를 보기 좋게 문자열로 바꿉니다."""

    # source_name이 있으면 그것을 사용하고, 없으면 source를 사용합니다.
    source_name = doc.metadata.get("source_name", doc.metadata.get("source", "알 수 없음"))

    # page 정보가 있으면 파일명과 페이지 번호를 함께 출력합니다.
    if "page" in doc.metadata:
        return f"- {source_name} p.{doc.metadata['page']}"

    # page 정보가 없으면 파일명만 출력합니다.
    return f"- {source_name}"


def main() -> None:
    """프로그램의 전체 실행 흐름을 담당하는 함수입니다."""

    # .env 파일을 읽어서 환경변수를 현재 파이썬 프로그램에 불러옵니다.
    load_dotenv()

    # OpenAI API 키를 환경변수에서 가져옵니다.
    api_key = os.getenv("OPENAI_API_KEY")

    # API 키가 없으면 프로그램을 종료합니다.
    if not api_key:
        raise SystemExit(
            "OPENAI_API_KEY가 없습니다. 현재 폴더 또는 상위 폴더의 .env 파일에 설정하세요."
        )

    # .env를 읽은 뒤에 모델 이름을 가져와야 사용자 설정값이 반영됩니다.
    chat_model = os.getenv("OPENAI_CHAT_MODEL", "gpt-4o-mini")
    embedding_model = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")

    # 터미널 인자를 처리하기 위한 파서를 만듭니다.
    parser = argparse.ArgumentParser(description="Week6 LangChain RetrievalQA 실습")

    # 벡터 DB 저장 경로를 옵션으로 받을 수 있게 합니다.
    parser.add_argument(
        "--db-dir",
        default=str(DEFAULT_DB_DIR),
        help="Chroma DB 저장 경로",
    )

    # 사용자 질문을 옵션으로 받을 수 있게 합니다.
    parser.add_argument(
        "--query",
        default="반도체 업황 회복 시기는 언제로 예상되나요?",
        help="질문 내용",
    )

    # 실제 입력된 인자를 읽어옵니다.
    args = parser.parse_args()

    # 기본 문서 목록을 읽어 하나의 문서 리스트로 합칩니다.
    documents = collect_documents(DEFAULT_DOCS)

    # 읽어 온 문서가 하나도 없으면 더 진행할 수 없으므로 종료합니다.
    if not documents:
        raise SystemExit("로드할 문서가 없습니다.")

    # 몇 개의 문서를 로드했는지 출력합니다.
    print(f"로드된 문서 수: {len(documents)}")

    # 문서들을 임베딩하여 Chroma 벡터 DB를 만듭니다.
    vectordb = build_vector_db(documents, Path(args.db_dir), embedding_model)

    # 답변 생성에 사용할 OpenAI 채팅 모델을 준비합니다.
    llm = ChatOpenAI(model=chat_model, temperature=0)

    # RetrievalQA 체인을 만듭니다.
    qa_chain = RetrievalQA.from_chain_type(
        llm=llm,  # 답변 생성에 사용할 LLM입니다.
        chain_type="stuff",  # 검색된 문서를 한 번에 프롬프트에 넣는 방식입니다.
        retriever=vectordb.as_retriever(search_kwargs={"k": 4}),  # 관련 청크 4개를 검색합니다.
        return_source_documents=True,  # 답변뿐 아니라 근거 문서도 함께 반환합니다.
    )

    # 사용자의 질문을 체인에 넣어 실행합니다.
    result = qa_chain.invoke({"query": args.query})

    # 결과를 보기 좋게 출력합니다.
    print("=" * 60)
    print(f"질문: {args.query}")
    print("[답변]")
    print(result["result"])
    print("=" * 60)
    print("[출처 문서]")

    # 검색에 사용된 출처 문서를 하나씩 출력합니다.
    for doc in result["source_documents"]:
        print(format_source(doc))


# 이 파일을 직접 실행했을 때만 main() 함수를 실행합니다.
if __name__ == "__main__":
    main()