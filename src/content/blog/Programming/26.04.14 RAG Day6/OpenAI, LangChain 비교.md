---
title: "RAG Week6 OpenAI SDK와 LangChain RAG 비교"
description: "같은 2문서 RAG 예제를 OpenAI SDK 직접 구현 방식과 LangChain 구현 방식으로 비교합니다."
pubDate: "2026-04-14T00:00:00+09:00"
categories: "Programming"
tags: ["RAG", "OpenAI", "LangChain", "Vector DB", "LLM"]
slug: "rag-week6-openai-sdk-vs-langchain-rag"
---

좋아요. 이번에는 <strong>같은 “문서 2개로 RAG” 작업</strong>을

* <strong>OpenAI SDK만으로 구현한 버전</strong>
* <strong>LangChain으로 구현한 버전</strong>

이렇게 나란히 보여드릴게요.

핵심 차이는 이거예요.

OpenAI 공식 SDK는 `OpenAI()` 클라이언트로 직접 `Responses API`와 `Embeddings API`를 호출하는 방식이고, 새 프로젝트에는 `Responses API`가 권장됩니다. 임베딩은 검색용 벡터를 만들 때 쓰고, 여러 입력을 한 번에 임베딩할 수도 있습니다. ([OpenAI 개발자][1])

반면 LangChain은 RAG를 <strong>Load → Split → Store → Retrieve/Generate</strong> 같은 구성요소로 나눠서 조립하기 쉽게 해 줍니다. 공식 RAG 튜토리얼도 인덱싱 단계와 런타임의 retrieval/generation 단계를 분리해서 설명합니다. ([LangChain Docs][2])

<div style="display: flex; gap: 10px;">

<div style="flex: 1; min-width: 0;">

## 1) OpenAI SDK만으로 만드는 2문서 RAG

이 버전은 <strong>문서 읽기, 청킹, 임베딩, 유사도 검색, 프롬프트 조립</strong>을 전부 직접 합니다.
즉, “모델 호출은 OpenAI가 담당하고, RAG 파이프라인 구조는 내가 직접 짠다”에 가까워요. `OpenAI()` 클라이언트는 공식 Python SDK의 기본 진입점이고, 임베딩은 `client.embeddings.create(...)`, 답변 생성은 `client.responses.create(...)` 식으로 호출합니다. ([OpenAI 개발자][1])

```python
from __future__ import annotations

import math
import os
from pathlib import Path

from dotenv import load_dotenv
from openai import OpenAI
from pypdf import PdfReader


BASE_DIR = Path(__file__).resolve().parent
DOC_PATHS = [
    BASE_DIR / "sample_investment_note.txt",
    BASE_DIR / "2024ltr.pdf",
]

EMBEDDING_MODEL = "text-embedding-3-small"
CHAT_MODEL = os.getenv("OPENAI_CHAT_MODEL", "gpt-4o-mini")


def read_text_file(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def read_pdf_file(path: Path) -> list[dict]:
    pages = []
    reader = PdfReader(str(path))
    for page_num, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ""
        pages.append(
            {
                "source_name": path.name,
                "page": page_num,
                "text": text,
            }
        )
    return pages


def load_documents(paths: list[Path]) -> list[dict]:
    docs = []

    for path in paths:
        if not path.exists():
            print(f"건너뜀: 파일이 없습니다 -> {path}")
            continue

        if path.suffix.lower() == ".pdf":
            docs.extend(read_pdf_file(path))
        else:
            docs.append(
                {
                    "source_name": path.name,
                    "page": None,
                    "text": read_text_file(path),
                }
            )

    return docs


def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
    chunks = []
    start = 0

    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])

        if end >= len(text):
            break

        start = end - overlap

    return chunks


def build_chunks(docs: list[dict]) -> list[dict]:
    all_chunks = []

    for doc in docs:
        pieces = chunk_text(doc["text"], chunk_size=500, overlap=50)
        for piece in pieces:
            all_chunks.append(
                {
                    "source_name": doc["source_name"],
                    "page": doc["page"],
                    "text": piece,
                }
            )

    return all_chunks


def cosine_similarity(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(x * x for x in b))

    if norm_a == 0 or norm_b == 0:
        return 0.0

    return dot / (norm_a * norm_b)


def embed_texts(client: OpenAI, texts: list[str]) -> list[list[float]]:
    response = client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=texts,
    )
    return [item.embedding for item in response.data]


def retrieve_top_k(client: OpenAI, chunks: list[dict], query: str, k: int = 4) -> list[dict]:
    query_embedding = embed_texts(client, [query])[0]
    chunk_embeddings = embed_texts(client, [chunk["text"] for chunk in chunks])

    scored = []
    for chunk, emb in zip(chunks, chunk_embeddings):
        score = cosine_similarity(query_embedding, emb)
        scored.append((score, chunk))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [chunk for _, chunk in scored[:k]]


def make_context(retrieved_chunks: list[dict]) -> str:
    parts = []

    for chunk in retrieved_chunks:
        page_str = chunk["page"] if chunk["page"] is not None else "?"
        parts.append(
            f"[출처: {chunk['source_name']}, 페이지: {page_str}]\n{chunk['text']}"
        )

    return "\n\n---\n\n".join(parts)


def ask_with_rag(client: OpenAI, query: str, chunks: list[dict]) -> tuple[str, list[dict]]:
    top_chunks = retrieve_top_k(client, chunks, query, k=4)
    context = make_context(top_chunks)

    prompt = f"""아래의 참고 문서만 바탕으로 질문에 답하세요.
문서에 없는 내용은 모른다고 답하세요.

[참고 문서]
{context}

[질문]
{query}
"""

    response = client.responses.create(
        model=CHAT_MODEL,
        input=prompt,
    )

    return response.output_text, top_chunks


def main() -> None:
    load_dotenv()

    if not os.getenv("OPENAI_API_KEY"):
        raise SystemExit("OPENAI_API_KEY가 없습니다.")

    client = OpenAI()

    docs = load_documents(DOC_PATHS)
    chunks = build_chunks(docs)

    query = "삼성전자 실적 관련 핵심 내용을 요약해줘."
    answer, sources = ask_with_rag(client, query, chunks)

    print("=" * 60)
    print(f"질문: {query}")
    print("[답변]")
    print(answer)
    print("[출처]")
    for s in sources:
        print(f"- {s['source_name']} p.{s['page'] if s['page'] is not None else '?'}")


if __name__ == "__main__":
    main()
```

이 코드의 핵심은 `OpenAI()`로 API를 직접 쓰되, RAG의 나머지 부분은 전부 직접 구현한다는 점이에요. 임베딩은 텍스트를 벡터로 바꿔 검색·유사도 계산에 쓸 수 있고, Responses API는 새 프로젝트의 기본 생성 API로 권장됩니다. ([OpenAI 개발자][3])

</div>

<div style="flex: 1; min-width: 0;">

## 2) LangChain으로 만드는 2문서 RAG

이 버전은 같은 일을 하지만, <strong>문서 로더 / 스플리터 / 벡터스토어 / 리트리버 / 모델</strong>을 부품처럼 연결합니다. 공식 LangChain 문서는 RAG를 인덱싱 단계와 런타임 retrieval/generation 단계로 나누고, 각 단계를 전용 구성요소로 설명합니다. ([LangChain Docs][2])

```python
from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv
from langchain_chroma import Chroma
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter


BASE_DIR = Path(__file__).resolve().parent
DOC_PATHS = [
    BASE_DIR / "sample_investment_note.txt",
    BASE_DIR / "2024ltr.pdf",
]

DB_DIR = BASE_DIR / "multi_doc_db"
CHAT_MODEL = os.getenv("OPENAI_CHAT_MODEL", "gpt-4o-mini")
EMBEDDING_MODEL = "text-embedding-3-small"


def load_documents(paths: list[Path]):
    documents = []

    for path in paths:
        if not path.exists():
            print(f"건너뜀: 파일이 없습니다 -> {path}")
            continue

        if path.suffix.lower() == ".pdf":
            loaded = PyPDFLoader(str(path)).load()
        else:
            loaded = TextLoader(str(path), encoding="utf-8").load()

        for doc in loaded:
            doc.metadata["source_name"] = path.name

        documents.extend(loaded)

    return documents


def build_vector_db(documents):
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50,
    )
    chunks = splitter.split_documents(documents)

    embeddings = OpenAIEmbeddings(model=EMBEDDING_MODEL)

    vectordb = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=str(DB_DIR),
    )
    return vectordb


def format_context(docs) -> str:
    parts = []
    for doc in docs:
        source_name = doc.metadata.get("source_name", "알 수 없음")
        page = doc.metadata.get("page", "?")
        parts.append(f"[출처: {source_name}, 페이지: {page}]\n{doc.page_content}")
    return "\n\n---\n\n".join(parts)


def main() -> None:
    load_dotenv()

    if not os.getenv("OPENAI_API_KEY"):
        raise SystemExit("OPENAI_API_KEY가 없습니다.")

    documents = load_documents(DOC_PATHS)
    vectordb = build_vector_db(documents)

    retriever = vectordb.as_retriever(search_kwargs={"k": 4})
    retrieved_docs = retriever.invoke("삼성전자 실적 관련 핵심 내용을 요약해줘.")

    context = format_context(retrieved_docs)

    llm = ChatOpenAI(model=CHAT_MODEL, temperature=0)
    answer = llm.invoke(
        f"""아래의 참고 문서만 바탕으로 질문에 답하세요.
문서에 없는 내용은 모른다고 답하세요.

[참고 문서]
{context}

[질문]
삼성전자 실적 관련 핵심 내용을 요약해줘.
"""
    )

    print("=" * 60)
    print("[답변]")
    print(answer.content)
    print("[출처]")
    for doc in retrieved_docs:
        print(f"- {doc.metadata.get('source_name', '알 수 없음')} p.{doc.metadata.get('page', '?')}")


if __name__ == "__main__":
    main()
```

여기서 중요한 건, OpenAI 모델을 쓰는 건 같지만 <strong>문서 로드, 분할, 저장, 검색</strong>을 LangChain 인터페이스로 처리한다는 점이에요. 공식 튜토리얼도 `DocumentLoaders`, `RecursiveCharacterTextSplitter`, embeddings, vector store, retrieval/generation 단계를 같은 흐름으로 보여줍니다. ([LangChain Docs][2])

</div> </div>

## 3) 둘을 진짜로 비교하면

<div style="display: flex;">

<div style="flex: 50%">

### OpenAI SDK만 쓰면

직접 해야 하는 일이 많아요.

* 파일 읽기
* PDF 텍스트 추출
* 청크 분할 함수 작성
* 임베딩 요청
* 유사도 계산
* top-k 검색
* 프롬프트 조립

이건 자유도가 높고 내부 구조를 배우기 좋아요. OpenAI 공식 문서도 embeddings를 검색·추천·클러스터링 같은 작업에 쓰는 기본 벡터 표현으로 설명합니다. ([OpenAI 개발자][3])

</div>

<div style="flex: 50%">

### LangChain을 쓰면

많은 부분이 이미 부품으로 나와 있어요.

* `PyPDFLoader`, `TextLoader`
* `RecursiveCharacterTextSplitter`
* `OpenAIEmbeddings`
* `Chroma`
* `as_retriever()`
* `ChatOpenAI`

그래서 코드가 더 구조적으로 바뀌고, 나중에 대화 메모리나 체인으로 확장하기 쉬워집니다. LangChain 문서는 이런 식의 통합을 RAG 앱의 표준 흐름으로 소개합니다. ([LangChain Docs][2])

</div> </div>

## 4) 초보자 기준으로 어디서 차이가 가장 크게 느껴지냐

<div style="display: flex;">

<div style="flex: 50%">

### OpenAI SDK 버전은

“RAG의 원리를 배우기 좋다” 쪽이에요.

왜냐하면 내가 직접

* 청킹이 뭔지
* 임베딩이 왜 필요한지
* 검색 top-k가 어떻게 되는지
* 컨텍스트를 어떻게 붙이는지

를 다 보게 되거든요. OpenAI의 Web QA with embeddings 튜토리얼도 임베딩으로 검색 기능을 만드는 흐름을 출발점으로 설명합니다. ([OpenAI 개발자][4])

</div>

<div style="flex: 50%">

### LangChain 버전은

“RAG 앱을 빠르게 조립하기 좋다” 쪽이에요.

한 번 구조를 익히면

* 다중 문서
* 대화형 RAG
* 벡터스토어 교체
* retriever 변경

같은 확장이 쉬워져요. 공식 LangChain 튜토리얼도 인덱싱과 retrieval/generation을 분리하고, 이를 조합해 실제 RAG 앱을 만든다고 설명합니다. ([LangChain Docs][2])

</div> </div>

## 5) 지금 사용자님 공부 단계에 맞춰 한 줄로 정리하면

* <strong>Week 5 느낌</strong>: OpenAI SDK에 가까움
  → 내가 직접 검색 결과를 만들어서 붙임
* <strong>Week 6 느낌</strong>: LangChain에 가까움
  → 검색기, 체인, 메모리 같은 부품으로 구조화함

그래서 둘 다 알아두는 게 좋아요.
OpenAI SDK 쪽은 <strong>원리 이해</strong>, LangChain 쪽은 <strong>구조화와 확장</strong>에 강합니다. OpenAI는 Python SDK로 직접 Responses API와 Embeddings API를 쓰게 하고, LangChain은 이를 더 큰 RAG 흐름 안에 넣기 쉽게 통합합니다. ([OpenAI 개발자][1])

원하시면 다음에는 이 두 코드에서 <strong>어느 줄이 서로 대응되는지</strong> 1:1로 짝지어서 설명해드릴게요.

[1]: https://developers.openai.com/api/reference/python/ "OpenAI Python API library"
[2]: https://docs.langchain.com/oss/python/langchain/rag "Build a RAG agent with LangChain"
[3]: https://developers.openai.com/api/docs/guides/embeddings "Vector embeddings | OpenAI API"
[4]: https://developers.openai.com/api/docs/tutorials/web-qa-embeddings "Web QA with embeddings | OpenAI API"
