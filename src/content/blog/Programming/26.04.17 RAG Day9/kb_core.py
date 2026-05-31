from __future__ import annotations

import hashlib
import json
import os
from datetime import datetime
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

# .env 파일을 먼저 읽습니다.
# 이렇게 해야 OPENAI_API_KEY, OPENAI_CHAT_MODEL, USER_AGENT 등이 반영됩니다.
load_dotenv()

# WebBaseLoader를 사용할 때 USER_AGENT 경고가 뜨지 않도록 기본값을 설정합니다.
# .env에 USER_AGENT가 있으면 그 값을 우선 사용하고,
# 없으면 investment-kb-streamlit/0.1을 사용합니다.
os.environ.setdefault("USER_AGENT", "investment-kb-streamlit/0.1")

# LangChain 최신 구조에 맞춘 import입니다.
from langchain_classic.chains import RetrievalQA
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_community.document_loaders import PyPDFLoader, TextLoader, WebBaseLoader
from langchain_openai import ChatOpenAI, OpenAIEmbeddings


# 현재 파일이 있는 폴더를 기준 폴더로 설정합니다.
BASE_DIR = Path(__file__).resolve().parent

# Chroma 벡터 DB 저장 폴더입니다.
DB_PATH = BASE_DIR / "my_investment_kb"

# 문서 목록과 중복 방지 정보를 저장할 JSON 파일입니다.
METADATA_FILE = BASE_DIR / "kb_metadata.json"

# Streamlit에서 업로드한 파일을 저장할 폴더입니다.
UPLOAD_DIR = BASE_DIR / "uploaded_files"

# 사용할 채팅 모델입니다.
DEFAULT_CHAT_MODEL = os.getenv("OPENAI_CHAT_MODEL", "gpt-4o-mini")

# 사용할 임베딩 모델입니다.
DEFAULT_EMBEDDING_MODEL = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")


def has_api_key() -> bool:
    """
    OPENAI_API_KEY가 설정되어 있는지 확인합니다.

    Streamlit 화면에서 API Key가 없을 때 안내 메시지를 띄우기 위해 사용합니다.
    """
    return bool(os.getenv("OPENAI_API_KEY"))


def load_metadata() -> dict[str, Any]:
    """
    kb_metadata.json 파일을 읽어옵니다.

    파일이 없으면 기본 구조를 새로 만들어 반환합니다.
    """
    if METADATA_FILE.exists():
        return json.loads(METADATA_FILE.read_text(encoding="utf-8"))

    return {
        "documents": [],
        "total_chunks": 0,
    }


def save_metadata(meta: dict[str, Any]) -> None:
    """
    메타데이터를 kb_metadata.json 파일에 저장합니다.
    """
    METADATA_FILE.write_text(
        json.dumps(meta, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def get_file_hash(file_path: Path) -> str:
    """
    파일 내용을 기준으로 해시값을 만듭니다.

    같은 파일을 다시 추가하지 않도록 중복 방지에 사용합니다.
    """
    return hashlib.md5(file_path.read_bytes()).hexdigest()


def get_url_hash(url: str) -> str:
    """
    URL 문자열을 기준으로 해시값을 만듭니다.

    같은 URL을 다시 추가하지 않도록 중복 방지에 사용합니다.
    """
    return hashlib.md5(url.encode("utf-8")).hexdigest()


def get_embeddings() -> OpenAIEmbeddings:
    """
    OpenAI 임베딩 모델 객체를 생성합니다.
    """
    return OpenAIEmbeddings(model=DEFAULT_EMBEDDING_MODEL)


def get_vectordb() -> Chroma:
    """
    Chroma 벡터 DB 객체를 생성합니다.

    DB_PATH 폴더가 이미 있으면 기존 DB를 불러오고,
    없으면 새로 만들어 사용합니다.
    """
    return Chroma(
        persist_directory=str(DB_PATH),
        embedding_function=get_embeddings(),
    )


def detect_doc_type(file_path: Path) -> str:
    """
    파일 확장자를 보고 문서 타입을 판단합니다.
    """
    ext = file_path.suffix.lower()

    if ext == ".pdf":
        return "pdf"

    if ext == ".txt":
        return "txt"

    raise ValueError("PDF 또는 TXT 파일만 업로드할 수 있습니다.")


def load_documents(source: str, doc_type: str):
    """
    파일 또는 URL을 LangChain Document 형태로 읽어옵니다.
    """
    if doc_type == "pdf":
        return PyPDFLoader(source).load()

    if doc_type == "txt":
        return TextLoader(source, encoding="utf-8").load()

    if doc_type == "url":
        return WebBaseLoader(source).load()

    raise ValueError(f"지원하지 않는 문서 타입입니다: {doc_type}")


def add_document(source: str, category: str, doc_type: str) -> dict[str, Any]:
    """
    문서 또는 URL을 벡터 DB에 추가합니다.

    Week 8에서는 결과를 print()로 출력했지만,
    Streamlit에서는 화면에 보여줘야 하므로 dict로 결과를 return합니다.
    """
    meta = load_metadata()

    # 파일인 경우입니다.
    if doc_type in {"pdf", "txt"}:
        source_path = Path(source).resolve()

        if not source_path.exists():
            raise FileNotFoundError(f"파일을 찾을 수 없습니다: {source_path}")

        source_hash = get_file_hash(source_path)
        source_name = source_path.name
        source_value = str(source_path)

    # URL인 경우입니다.
    elif doc_type == "url":
        source_hash = get_url_hash(source)
        source_name = source
        source_value = source

    else:
        raise ValueError(f"지원하지 않는 문서 타입입니다: {doc_type}")

    # 이미 같은 해시값이 있는지 확인합니다.
    if any(document["hash"] == source_hash for document in meta["documents"]):
        return {
            "status": "duplicate",
            "message": f"이미 추가된 문서입니다: {source_name}",
            "source_name": source_name,
            "chunk_count": 0,
        }

    # 실제 문서를 읽어옵니다.
    docs = load_documents(source_value, doc_type)

    # 문서 추가 날짜입니다.
    added_date = datetime.now().strftime("%Y-%m-%d")

    # 각 Document에 메타데이터를 추가합니다.
    for doc in docs:
        doc.metadata.update(
            {
                "category": category,
                "added_date": added_date,
                "doc_type": doc_type,
                "source_name": source_name,
                "document_hash": source_hash,
            }
        )

    # 긴 문서를 작은 청크로 나눕니다.
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50,
        length_function=len,
    )

    chunks = splitter.split_documents(docs)

    if not chunks:
        raise ValueError("문서에서 청크를 만들 수 없습니다.")

    # 각 청크에 chunk_id를 추가합니다.
    for index, chunk in enumerate(chunks):
        chunk.metadata["chunk_id"] = index

    # 나중에 삭제나 수정 기능을 만들기 쉽도록 청크 ID를 직접 만듭니다.
    chunk_ids = [
        f"{source_hash}_{index}"
        for index in range(len(chunks))
    ]

    # Chroma DB에 청크를 추가합니다.
    vectordb = get_vectordb()
    vectordb.add_documents(chunks, ids=chunk_ids)

    # 메타데이터 파일에 문서 정보를 추가합니다.
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

    return {
        "status": "added",
        "message": f"추가 완료: {source_name} ({len(chunks)}개 청크)",
        "source_name": source_name,
        "chunk_count": len(chunks),
    }


def ask_question(question: str, category_filter: str | None = None) -> dict[str, Any]:
    """
    사용자의 질문에 답변합니다.

    답변과 참고 자료를 Streamlit 화면에서 보여줄 수 있도록 dict로 반환합니다.
    """
    if not DB_PATH.exists():
        raise FileNotFoundError("아직 벡터 DB가 없습니다. 먼저 문서를 추가하세요.")

    # 관련 청크 4개를 가져옵니다.
    search_kwargs: dict[str, Any] = {"k": 4}

    # 카테고리 필터가 있으면 해당 카테고리만 검색합니다.
    if category_filter:
        search_kwargs["filter"] = {"category": category_filter}

    vectordb = get_vectordb()

    retriever = vectordb.as_retriever(
        search_kwargs=search_kwargs
    )

    llm = ChatOpenAI(
        model=DEFAULT_CHAT_MODEL,
        temperature=0,
    )

    qa_chain = RetrievalQA.from_chain_type(
        llm=llm,
        retriever=retriever,
        return_source_documents=True,
    )

    result = qa_chain.invoke({"query": question})

    sources = []

    for doc in result["source_documents"]:
        source_name = doc.metadata.get(
            "source_name",
            doc.metadata.get("source", "알 수 없음"),
        )

        page = doc.metadata.get("page", "?")
        category = doc.metadata.get("category", "")
        doc_type = doc.metadata.get("doc_type", "")
        chunk_id = doc.metadata.get("chunk_id", "?")

        sources.append(
            {
                "category": category,
                "source_name": source_name,
                "doc_type": doc_type,
                "page": page,
                "chunk_id": chunk_id,
            }
        )

    return {
        "answer": result["result"],
        "sources": sources,
    }


def get_document_summary() -> dict[str, Any]:
    """
    저장된 문서 목록과 총 문서 수, 총 청크 수를 반환합니다.
    """
    meta = load_metadata()

    return {
        "total_documents": len(meta["documents"]),
        "total_chunks": meta["total_chunks"],
        "documents": meta["documents"],
    }


def get_categories() -> list[str]:
    """
    저장된 문서들의 카테고리 목록을 반환합니다.
    """
    meta = load_metadata()

    categories = {
        doc.get("category", "일반")
        for doc in meta["documents"]
    }

    return sorted(categories)