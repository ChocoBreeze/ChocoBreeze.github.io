from __future__ import annotations

import argparse
import hashlib
import json
import os
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()
os.environ.setdefault("USER_AGENT", "investment-kb/0.1")

# from langchain.chains import RetrievalQA
from langchain_classic.chains import RetrievalQA
# from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_community.document_loaders import PyPDFLoader, TextLoader, WebBaseLoader
from langchain_openai import ChatOpenAI, OpenAIEmbeddings


BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "my_investment_kb"
METADATA_FILE = BASE_DIR / "kb_metadata.json"
DEFAULT_CHAT_MODEL = os.getenv("OPENAI_CHAT_MODEL", "gpt-4o-mini")
DEFAULT_EMBEDDING_MODEL = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")


def load_metadata() -> dict:
    if METADATA_FILE.exists():
        return json.loads(METADATA_FILE.read_text(encoding="utf-8"))
    return {"documents": [], "total_chunks": 0}


def save_metadata(meta: dict) -> None:
    METADATA_FILE.write_text(
        json.dumps(meta, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def get_file_hash(file_path: Path) -> str:
    return hashlib.md5(file_path.read_bytes()).hexdigest()


def get_url_hash(url: str) -> str:
    return hashlib.md5(url.encode("utf-8")).hexdigest()


def get_embeddings() -> OpenAIEmbeddings:
    return OpenAIEmbeddings(model=DEFAULT_EMBEDDING_MODEL)


def get_vectordb() -> Chroma:
    return Chroma(
        persist_directory=str(DB_PATH),
        embedding_function=get_embeddings(),
    )


def load_documents(source: str, doc_type: str):
    if doc_type == "pdf":
        return PyPDFLoader(source).load()
    if doc_type == "txt":
        return TextLoader(source, encoding="utf-8").load()
    if doc_type == "url":
        return WebBaseLoader(source).load()
    raise ValueError(f"지원하지 않는 문서 타입입니다: {doc_type}")


def add_document(source: str, category: str, doc_type: str) -> None:
    meta = load_metadata()

    if doc_type in {"pdf", "txt"}:
        source_path = Path(source).resolve()
        if not source_path.exists():
            raise SystemExit(f"파일을 찾을 수 없습니다: {source_path}")
        source_hash = get_file_hash(source_path)
        source_name = source_path.name
        source_value = str(source_path)
    else:
        source_hash = get_url_hash(source)
        source_name = source
        source_value = source

    if any(document["hash"] == source_hash for document in meta["documents"]):
        print(f"이미 추가된 문서입니다: {source_name}")
        return

    docs = load_documents(source_value, doc_type)
    added_date = datetime.now().strftime("%Y-%m-%d")

    for doc in docs:
        doc.metadata.update(
            {
                "category": category,
                "added_date": added_date,
                "doc_type": doc_type,
                "source_name": source_name,
            }
        )

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50,
        length_function=len,
    )
    chunks = splitter.split_documents(docs)

    for index, chunk in enumerate(chunks):
        chunk.metadata["chunk_id"] = index

    vectordb = get_vectordb()
    vectordb.add_documents(chunks)

    meta["documents"].append(
        {
            "source": source_value,
            "source_name": source_name,
            "hash": source_hash,
            "category": category,
            "doc_type": doc_type,
            "chunks": len(chunks),
            "added_date": added_date,
        }
    )
    meta["total_chunks"] += len(chunks)
    save_metadata(meta)

    print(f"추가 완료: {source_name} ({len(chunks)}개 청크)")


def ask_question(question: str, category_filter: str | None) -> None:
    if not DB_PATH.exists():
        raise SystemExit("아직 벡터 DB가 없습니다. 먼저 add 명령으로 문서를 추가하세요.")

    search_kwargs: dict = {"k": 4}
    if category_filter:
        search_kwargs["filter"] = {"category": category_filter}

    vectordb = get_vectordb()
    retriever = vectordb.as_retriever(search_kwargs=search_kwargs)
    llm = ChatOpenAI(model=DEFAULT_CHAT_MODEL, temperature=0)

    qa_chain = RetrievalQA.from_chain_type(
        llm=llm,
        retriever=retriever,
        return_source_documents=True,
    )

    result = qa_chain.invoke({"query": question})
    print(f"\n답변: {result['result']}\n")
    print("참고 자료:")
    for doc in result["source_documents"]:
        source_name = doc.metadata.get("source_name", doc.metadata.get("source", "알 수 없음"))
        page = doc.metadata.get("page", "?")
        category = doc.metadata.get("category", "")
        print(f"- [{category}] {source_name} p.{page}")


def list_documents() -> None:
    meta = load_metadata()
    print(f"\n총 문서: {len(meta['documents'])}개 | 총 청크: {meta['total_chunks']}개\n")
    for doc in meta["documents"]:
        print(
            f"- [{doc['category']}] {doc['source_name']} "
            f"({doc['doc_type']}, {doc['chunks']}청크, {doc['added_date']})"
        )


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="개인 투자 지식 베이스 CLI")
    subparsers = parser.add_subparsers(dest="command")

    add_parser = subparsers.add_parser("add", help="문서 추가")
    add_parser.add_argument("--file", help="PDF 또는 TXT 파일 경로")
    add_parser.add_argument("--url", help="웹 기사 URL")
    add_parser.add_argument("--category", default="일반", help="문서 카테고리")

    ask_parser = subparsers.add_parser("ask", help="질문하기")
    ask_parser.add_argument("question", help="질문 내용")
    ask_parser.add_argument("--category", help="특정 카테고리만 검색")

    subparsers.add_parser("list", help="저장된 문서 목록")
    return parser


def main() -> None:
    # load_dotenv()

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise SystemExit(
            "OPENAI_API_KEY가 없습니다. Week8 폴더 또는 상위 폴더의 .env 파일에 설정하세요."
        )

    parser = build_parser()
    args = parser.parse_args()

    if args.command == "add":
        if args.file:
            ext = Path(args.file).suffix.lower()
            doc_type = "pdf" if ext == ".pdf" else "txt"
            add_document(args.file, args.category, doc_type)
        elif args.url:
            add_document(args.url, args.category, "url")
        else:
            parser.error("add 명령에는 --file 또는 --url 중 하나가 필요합니다.")
    elif args.command == "ask":
        ask_question(args.question, getattr(args, "category", None))
    elif args.command == "list":
        list_documents()
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
