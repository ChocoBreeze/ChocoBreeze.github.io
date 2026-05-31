from __future__ import annotations

import argparse
import os
import shutil
from pathlib import Path

from dotenv import load_dotenv
# from langchain.retrievers import EnsembleRetriever
from langchain_classic.retrievers import EnsembleRetriever
# from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_community.retrievers import BM25Retriever
from langchain_openai import OpenAIEmbeddings

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
DEFAULT_DOCS = [
    BASE_DIR.parent / "26.04.08 RAG Day3" / "sample_investment_note.txt",
    BASE_DIR.parent / "26.04.08 RAG Day3" / "2024ltr.pdf",
]
DEFAULT_DB_DIR = BASE_DIR / "hybrid_db"
DEFAULT_EMBEDDING_MODEL = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")


def load_document(file_path: Path):
    if file_path.suffix.lower() == ".pdf":
        loader = PyPDFLoader(str(file_path))
    else:
        loader = TextLoader(str(file_path), encoding="utf-8")
    return loader.load()


def collect_documents(paths: list[Path]):
    documents = []
    for path in paths:
        if not path.exists():
            continue
        loaded = load_document(path)
        year = "2024" if "2024" in path.name else "sample"
        for doc in loaded:
            doc.metadata.update(
                {
                    "source_name": path.name,
                    "year": year,
                    "category": "투자보고서",
                }
            )
        documents.extend(loaded)
    return documents


def build_chunks(documents):
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50,
        length_function=len,
    )
    return splitter.split_documents(documents)


def build_vector_db(chunks, db_dir: Path) -> Chroma:
    embeddings = OpenAIEmbeddings(model=DEFAULT_EMBEDDING_MODEL)
    return Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=str(db_dir),
    )


def print_results(title: str, docs) -> None:
    print("=" * 60)
    print(title)
    for index, doc in enumerate(docs, start=1):
        preview = doc.page_content[:160].replace("\n", " ")
        print(f"{index}. {doc.metadata.get('source_name', '알 수 없음')} | p.{doc.metadata.get('page', '?')}")
        print(f"   {preview}")


def main() -> None:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise SystemExit(
            "OPENAI_API_KEY가 없습니다. Week7 폴더 또는 상위 폴더의 .env 파일에 설정하세요."
        )

    parser = argparse.ArgumentParser(description="Week7 하이브리드 검색 실습")
    parser.add_argument(
        "--query",
        default="HBM AI 반도체 수혜주는 어떤 흐름인가요?",
        help="비교할 질문",
    )
    parser.add_argument(
        "--db-dir",
        default=str(DEFAULT_DB_DIR),
        help="Chroma DB 저장 경로",
    )
    parser.add_argument(
        "--rebuild",
        action="store_true",
        help="기존 Chroma DB 폴더를 삭제하고 다시 생성합니다.",
    )
    args = parser.parse_args()

    db_dir = Path(args.db_dir)
    if args.rebuild and db_dir.exists():
        shutil.rmtree(db_dir)
        print(f"기존 DB 삭제: {db_dir}")

    documents = collect_documents(DEFAULT_DOCS)
    chunks = build_chunks(documents)
    vectordb = build_vector_db(chunks, db_dir)

    vector_results = vectordb.similarity_search(args.query, k=3)
    filtered_results = vectordb.similarity_search(
        args.query,
        k=3,
        filter={"year": "2024"},
    )
    mmr_results = vectordb.max_marginal_relevance_search(args.query, k=3, fetch_k=10)

    bm25_retriever = BM25Retriever.from_documents(chunks)
    bm25_retriever.k = 3
    vector_retriever = vectordb.as_retriever(search_kwargs={"k": 3})
    hybrid_retriever = EnsembleRetriever(
        retrievers=[bm25_retriever, vector_retriever],
        weights=[0.4, 0.6],
    )

    bm25_results = bm25_retriever.invoke(args.query)
    hybrid_results = hybrid_retriever.invoke(args.query)

    print(f"질문: {args.query}")
    print_results("벡터 검색 결과", vector_results)
    print_results("메타데이터 필터 적용 결과 (year=2024)", filtered_results)
    print_results("MMR 검색 결과", mmr_results)
    print_results("BM25 검색 결과", bm25_results)
    print_results("하이브리드 검색 결과", hybrid_results)

    print("=" * 60)
    print("관찰 포인트:")
    print("1. 메타데이터 필터를 걸면 검색 범위를 더 좁힐 수 있습니다.")
    print("2. BM25는 키워드가 정확히 들어간 문서에 강하고, 벡터 검색은 의미적 유사성에 강합니다.")
    print("3. 하이브리드 검색은 두 방식을 섞어 검색 편향을 줄이는 데 도움이 됩니다.")


if __name__ == "__main__":
    main()
