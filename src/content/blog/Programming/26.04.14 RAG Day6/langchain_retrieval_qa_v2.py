# 중복 검색 완화(MMR) + 청크 크기 확대
"""
chunk_size=1200
chunk_overlap=100

retriever = vectordb.as_retriever(
    search_type="mmr",
    search_kwargs={"k": 4, "fetch_k": 10},
)
"""

from __future__ import annotations

import argparse
import os
from pathlib import Path

from dotenv import load_dotenv

from langchain_classic.chains import RetrievalQA
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter

from langchain_chroma import Chroma
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_openai import ChatOpenAI, OpenAIEmbeddings


BASE_DIR = Path(__file__).resolve().parent

DEFAULT_DOCS = [
    BASE_DIR / "sample_investment_note.txt",
    BASE_DIR / "2024ltr.pdf",
]

DEFAULT_DB_DIR = BASE_DIR / "multi_doc_db_v2"


def load_document(file_path: Path) -> list[Document]:
    if file_path.suffix.lower() == ".pdf":
        loader = PyPDFLoader(str(file_path))
    else:
        loader = TextLoader(str(file_path), encoding="utf-8", autodetect_encoding=True)
    return loader.load()


def collect_documents(paths: list[Path]) -> list[Document]:
    documents: list[Document] = []

    for path in paths:
        if not path.exists():
            print(f"건너뜀: 파일을 찾을 수 없습니다 -> {path}")
            continue

        try:
            loaded = load_document(path)
        except Exception as e:
            print(f"건너뜀: 파일을 읽는 중 오류 발생 -> {path} / {e}")
            continue

        for doc in loaded:
            doc.metadata["source_name"] = path.name

        documents.extend(loaded)

    return documents


def build_vector_db(documents: list[Document], db_dir: Path, embedding_model: str) -> Chroma:
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1200,
        chunk_overlap=100,
        length_function=len,
    )

    chunks = splitter.split_documents(documents)

    if not chunks:
        raise ValueError("분할된 청크가 없습니다.")

    embeddings = OpenAIEmbeddings(model=embedding_model)

    vectordb = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=str(db_dir),
    )

    print(f"생성된 청크 수: {len(chunks)}")
    return vectordb


def format_source(doc: Document) -> str:
    source_name = doc.metadata.get("source_name", doc.metadata.get("source", "알 수 없음"))

    if "page" in doc.metadata:
        return f"- {source_name} p.{doc.metadata['page']}"

    return f"- {source_name}"


def main() -> None:
    load_dotenv()

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise SystemExit(
            "OPENAI_API_KEY가 없습니다. 현재 폴더 또는 상위 폴더의 .env 파일에 설정하세요."
        )

    chat_model = os.getenv("OPENAI_CHAT_MODEL", "gpt-4o-mini")
    embedding_model = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")

    parser = argparse.ArgumentParser(description="Week6 LangChain RetrievalQA 실습")
    parser.add_argument(
        "--db-dir",
        default=str(DEFAULT_DB_DIR),
        help="Chroma DB 저장 경로",
    )
    parser.add_argument(
        "--query",
        default="버크셔 해서웨이의 2024년 수익률은 몇 퍼센트인가요?",
        help="질문 내용",
    )
    args = parser.parse_args()

    documents = collect_documents(DEFAULT_DOCS)
    if not documents:
        raise SystemExit("로드할 문서가 없습니다.")

    print(f"로드된 문서 수: {len(documents)}")
    vectordb = build_vector_db(documents, Path(args.db_dir), embedding_model)

    llm = ChatOpenAI(model=chat_model, temperature=0)

    retriever = vectordb.as_retriever(
        search_type="mmr",
        search_kwargs={"k": 4, "fetch_k": 10},
    )

    qa_chain = RetrievalQA.from_chain_type(
        llm=llm,
        chain_type="stuff",
        retriever=retriever,
        return_source_documents=True,
    )

    result = qa_chain.invoke({"query": args.query})

    print("=" * 60)
    print(f"질문: {args.query}")
    print("[답변]")
    print(result["result"])
    print("=" * 60)
    print("[출처 문서]")
    for doc in result["source_documents"]:
        print(format_source(doc))

    print("=" * 60)
    print("[출처 문서 상세]")
    for i, doc in enumerate(result["source_documents"], start=1):
        print(f"[{i}] {format_source(doc)}")
        print(doc.page_content[:500])
        print("-" * 60)


if __name__ == "__main__":
    main()