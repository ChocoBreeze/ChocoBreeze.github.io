---
title: "RAG Week4 벡터 데이터베이스"
description: "다루기 좋은 작은 조각으로 나누기"
pubDate: "2026-04-08T00:00:00+09:00"
categories: "Programming"
tags: ["Chunking", "Chunk", "RAG"]
---

이번 주는 `Week2`에서 만든 임베딩과 `Week3`에서 만든 청크를 실제 저장소에 넣는 단계입니다.  
이제부터는 문서를 매번 다시 임베딩하지 않고, 벡터 DB에 저장해 두었다가 질문이 들어오면 관련 청크만 빠르게 꺼내게 됩니다.

## 이번 주 목표
- 벡터 DB가 왜 필요한지 이해한다.
- Chroma에 청크를 저장하고 다시 불러온다.
- 질문으로 유사한 청크를 검색해 본다.

## 핵심 개념
- **벡터 DB**: 임베딩 벡터를 저장하고 가까운 벡터를 빠르게 찾는 저장소
- **영속성**: 프로그램을 껐다 켜도 디스크에 저장된 DB를 다시 사용할 수 있는 성질
- **유사도 검색**: 질문 벡터와 가까운 문서 청크를 찾는 검색 방식
- **메타데이터 추적**: 검색 결과에서 파일명, 페이지, 카테고리 등을 함께 확인하는 방식

## 실습 순서

### 1. 패키지 설치
```bash
.\.venv\Scripts\activate
pip install chromadb langchain-chroma langchain-openai langchain langchain-community python-dotenv pypdf
```

### 2. `.env` 확인
```env
OPENAI_API_KEY=<YOUR_OPENAI_API_KEY>
```

### 3. 기본 샘플로 벡터 DB 실습
```bash
py vector_db_experiment.py
```

`sample_investment_note.txt`: Week3의 내용과 동일하다.
```
삼성전자는 2024년 들어 반도체 업황 회복의 영향을 받았다.
특히 HBM과 고대역폭 메모리 관련 수요가 늘어나면서 메모리 부문의 기대감이 커졌다.
일부 증권사는 서버용 메모리 판매 비중 확대를 긍정적으로 평가했다.

다만 스마트폰 출하량은 시장 경쟁 심화와 교체 수요 둔화의 영향을 받았다.
모바일 부문은 프리미엄 제품 중심 전략으로 수익성을 방어하려는 흐름을 보였다.
환율 변동과 마케팅 비용 증가는 단기 실적 변동성 요인으로 언급되었다.

투자 보고서를 RAG에 넣으려면 문서를 적절한 길이의 청크로 나눠야 한다.
청크가 너무 크면 한 벡터에 여러 주제가 섞여 검색 정확도가 떨어질 수 있다.
청크가 너무 작으면 문맥이 끊겨 답변에 필요한 정보가 사라질 수 있다.

따라서 청크 크기와 오버랩을 바꿔 보면서 검색 품질이 어떻게 달라지는지 관찰하는 과정이 중요하다.
각 청크에는 파일명, 페이지 번호, 생성 날짜, 카테고리 같은 메타데이터를 함께 저장하는 것이 좋다.
이 메타데이터는 나중에 출처를 표시하거나 특정 보고서만 필터링할 때 사용된다.
```

<details>
<summary> <b> 상세 코드 </b> </summary> <br/>

```py
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
# 따로 --file 옵션을 주지 않으면 Week3/sample_investment_note.txt 파일을 사용합니다.
DEFAULT_FILE = BASE_DIR.parent / "Week3" / "sample_investment_note.txt"

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
    vectordb = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=str(db_dir),
        # 이 폴더에 DB를 디스크 형태로 저장합니다.
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

    # 6. 저장된 벡터 DB를 다시 불러오기
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
```

</details> <br/>

```
py week4_vector_db_experiment.py
사용 임베딩 모델: text-embedding-3-small
대상 파일: sample_investment_note.txt
DB 저장 경로: investment_db
============================================================
원본 문서 수: 1
저장된 청크 수: 2
재로드 후 청크 수: 2
============================================================
질문: 삼성전자 실적과 반도체 업황은 어떤가요?
------------------------------------------------------------
검색 결과 1
내용: 삼성전자는 2024년 들어 반도체 업황 회복의 영향을 받았다.
특히 HBM과 고대역폭 메모리 관련 수요가 늘어나면서 메모리 부문의 기대감이 커졌다.
일부 증권사는 서버용 메모리 판매 비중 확대를 긍정적으로 평가했다.

다만 스마트폰 출하량은 시장 경쟁 심화와 교체 수요 둔화의 영향을 받았다.
모바일 부문은 프리미엄 제품 중심 전략으로 수익성을 방어하려는 흐
메타데이터: {'category': '투자보고서', 'source': 'sample_investment_note.txt', 'source_name': 'sample_investment_note.txt', 'chunk_id': 0}
------------------------------------------------------------
검색 결과 2
내용: 투자 보고서를 RAG에 넣으려면 문서를 적절한 길이의 청크로 나눠야 한다.
청크가 너무 크면 한 벡터에 여러 주제가 섞여 검색 정확도가 떨어질 수 있다.
청크가 너무 작으면 문맥이 끊겨 답변에 필요한 정보가 사라질 수 있다.

따라서 청크 크기와 오버랩을 바꿔 보면서 검색 품질이 어떻게 달라지는지 관찰하는 과정이 중요하다.
각 청크에는 파일명, 페이지 번호
메타데이터: {'chunk_id': 1, 'category': '투자보고서', 'source': 'sample_investment_note.txt', 'source_name': 'sample_investment_note.txt'}
============================================================
관찰 포인트:
1. 문서를 벡터 DB에 저장하면 질문과 가까운 청크만 빠르게 찾을 수 있습니다.
2. 프로그램을 다시 실행해도 DB 폴더가 남아 있으면 이전 벡터를 재사용할 수 있습니다.
3. 검색 결과 메타데이터를 보면 출처 추적이 가능합니다.
```

확인할 것:
- `Week3` 샘플 문서가 청크로 분할되어 DB에 저장되는지
- 저장 후 다시 로드했을 때 청크 수가 유지되는지
- 검색 결과에 내용과 메타데이터가 함께 출력되는지

<details>
<summary> <b> GPT 추가설명 </b> </summary> <br/>

<h2> 실행 결과 확인 정리 </h2>

<h3> 1. <code>Week3</code> 샘플 문서가 청크로 분할되어 DB에 저장되는지 </h3>

확인되었습니다.

실행 결과에서

```text
원본 문서 수: 1
저장된 청크 수: 2
```

라고 나왔으므로,
`Week3`의 샘플 문서 1개가 벡터 DB에 들어가기 전에 **2개의 청크로 분할되어 저장된 것**을 확인할 수 있습니다.

즉, 이번 실습에서는

* 원본 문서 1개를 불러왔고
* 이를 청크 단위로 나눈 뒤
* 총 2개의 청크를 벡터 DB에 저장했습니다.

<h3> 2. 저장 후 다시 로드했을 때 청크 수가 유지되는지 </h3>

확인되었습니다.

실행 결과에서

```text
저장된 청크 수: 2
재로드 후 청크 수: 2
```

라고 나왔습니다.

즉, 벡터 DB에 저장한 뒤 다시 불러왔을 때도 **청크 수가 동일하게 2개로 유지**되었습니다.  
이것은 Chroma DB가 디스크에 정상적으로 저장되었고, 재로드 후에도 같은 데이터를 다시 읽을 수 있음을 보여줍니다.

따라서 이번 결과를 통해 **영속성(persistence)** 이 정상적으로 작동함을 확인할 수 있습니다.

<h3> 3. 검색 결과에 내용과 메타데이터가 함께 출력되는지 </h3>

확인되었습니다.

실행 결과를 보면 각 검색 결과마다 다음 두 가지가 함께 출력되었습니다.

* **내용**
* **메타데이터**

예를 들어 검색 결과 1에서는

```text
내용: 삼성전자는 2024년 들어 반도체 업황 회복의 영향을 받았다...
메타데이터: {'category': '투자보고서', 'source': '..\\Week3\\sample_investment_note.txt', 'source_name': 'sample_investment_note.txt', 'chunk_id': 0}
```

가 출력되었습니다.

즉, 검색된 청크의 본문 일부뿐 아니라

* 카테고리(`category`)
* 원본 파일 경로(`source`)
* 원본 파일명(`source_name`)
* 청크 번호(`chunk_id`)

까지 함께 확인할 수 있었습니다.

따라서 검색 결과에서 **출처 추적이 가능한 형태로 메타데이터가 잘 포함되어 있음**을 확인할 수 있습니다.

<h2> 전체 결론 </h2>

이번 실행 결과를 통해 다음을 확인할 수 있었습니다.

1. `Week3` 샘플 문서가 **2개의 청크로 분할되어 벡터 DB에 저장되었다.**
2. 저장된 DB를 다시 불러왔을 때도 **청크 수가 2개로 유지되어 영속성이 확인되었다.**
3. 유사도 검색 결과에서 **청크 내용과 메타데이터가 함께 출력되어 출처 추적이 가능했다.**

<h2> 보고서/학습 기록용으로 짧게 쓰면 </h2>

아래처럼 써도 깔끔합니다.

> `sample_investment_note.txt` 파일을 로드한 결과, 원본 문서 1개가 총 2개의 청크로 분할되어 Chroma 벡터 DB에 저장되었다. 이후 DB를 다시 로드했을 때도 청크 수가 2개로 동일하게 유지되어 영속성이 정상적으로 작동함을 확인하였다. 또한 질문에 대한 유사도 검색 결과에서 각 청크의 내용과 함께 category, source, source_name, chunk_id 등의 메타데이터가 함께 출력되어 검색 결과의 출처 추적이 가능함을 확인하였다.

</details> <br/>

### 4. 직접 준비한 투자 문서로 실습
```bash
py week4_vector_db_experiment.py --file "2024ltr.pdf" --query "버크셔 해서웨이의 2024년 성과는 S&P 500과 비교해 어땠나요?"
py week4_vector_db_experiment.py --file "2024ltr.pdf" --query "버크셔 해서웨이의 장기 복리 수익률과 전체 수익률은 어떻게 되나요?"
```

확인할 것:
- PDF를 실제로 로드해 벡터 DB에 넣을 수 있는지
- 질문을 바꾸면 검색되는 청크가 달라지는지
- 카테고리나 파일명 메타데이터가 검색 결과에 남는지
- 상위 3개 정도의 관련 청크가 검색되는지

#### 1. 첫 질문만 진행
```
py week4_vector_db_experiment.py --file "2024ltr.pdf" --query "버크셔 해서웨이의 2024년 성과는 S&P 500과 비교해 어땠나요?"
사용 임베딩 모델: text-embedding-3-small
대상 파일: 2024ltr.pdf
DB 저장 경로: investment_db
============================================================
원본 문서 수: 15
저장된 청크 수: 461
재로드 후 청크 수: 461
============================================================
질문: 버크셔 해서웨이의 2024년 성과는 S&P 500과 비교해 어땠나요?
------------------------------------------------------------
검색 결과 1
내용: Berkshire’s Performance vs. the S&P 500
 Annual Percentage Change
Year
in Per-Share
Market Value of
Berkshire
in S&P 500
with Dividends
Included
1995 ......................................
메타데이터: {'chunk_id': 144, 'source_name': '2024ltr.pdf', 'moddate': '2025-02-22T07:14:40-06:00', 'creationdate': '2025-02-22T07:14:18-06:00', 'page_label': '15', 'producer': 'Acrobat Distiller 8.1.0 (Windows)', 'page': 14, 'category': '투자보고서', 'title': 'printmgr file', 'creator': 'PyPDF', 'total_pages': 15, 'source': '2024ltr.pdf'}
------------------------------------------------------------
검색 결과 2
내용: Berkshire’s Performance vs. the S&P 500
 Annual Percentage Change
Year
in Per-Share
Market Value of
Berkshire
in S&P 500
with Dividends
Included
1995 ......................................
메타데이터: {'total_pages': 15, 'title': 'printmgr file', 'creator': 'PyPDF', 'page': 14, 'category': '투자보고서', 'page_label': '15', 'chunk_id': 144, 'source_name': '2024ltr.pdf', 'source': '2024ltr.pdf', 'creationdate': '2025-02-22T07:14:18-06:00', 'moddate': '2025-02-22T07:14:40-06:00', 'producer': 'Acrobat Distiller 8.1.0 (Windows)'}
------------------------------------------------------------
검색 결과 3
내용: Berkshire’s Performance vs. the S&P 500
 Annual Percentage Change
Year
in Per-Share
Market Value of
Berkshire
in S&P 500
with Dividends
Included
1995 ......................................
메타데이터: {'total_pages': 15, 'page': 14, 'category': '투자보고서', 'creator': 'PyPDF', 'source': '2024ltr.pdf', 'creationdate': '2025-02-22T07:14:18-06:00', 'producer': 'Acrobat Distiller 8.1.0 (Windows)', 'source_name': '2024ltr.pdf', 'title': 'printmgr file', 'page_label': '15', 'moddate': '2025-02-22T07:14:40-06:00', 'chunk_id': 144}
============================================================
관찰 포인트:
1. 문서를 벡터 DB에 저장하면 질문과 가까운 청크만 빠르게 찾을 수 있습니다.
2. 프로그램을 다시 실행해도 DB 폴더가 남아 있으면 이전 벡터를 재사용할 수 있습니다.
3. 검색 결과 메타데이터를 보면 출처 추적이 가능합니다.
```

<details>
<summary> <b> GPT 추가설명 </b> </summary> <br/>

네, **핵심적으로는 제대로 찾은 거예요.**  
이유는 검색 결과 메타데이터에 **`page_label: '15'`** 가 있고, 내부 0-based 페이지 번호로도 **`page: 14`** 가 찍혀 있어서, 실제 PDF의 **15페이지**를 가져온 게 맞기 때문입니다.

<h2> 왜 “제대로 찾았다”고 볼 수 있나 </h2>

질문:

> 버크셔 해서웨이의 2024년 성과는 S&P 500과 비교해 어땠나요?

검색 결과 메타데이터:

```text
'page_label': '15'
'page': 14
```

이건 보통 이렇게 해석합니다.

* `page_label: '15'` → PDF에 표시되는 실제 페이지 번호 15
* `page: 14` → 파이썬 내부에서 0부터 세는 인덱스라서 15페이지가 14로 표시됨

즉, **사용자님이 노렸던 p.15를 정확히 찾았습니다.**

그리고 내용도

```text
Berkshire’s Performance vs. the S&P 500
Annual Percentage Change
```

로 시작하니까, p.15의 **성과 비교 표**를 가져온 것도 맞아요.

<h2> 다만 조금 아쉬운 점 </h2>

질문은 **“2024년 성과”** 를 물었는데,
미리보기 내용은 표의 위쪽만 잘려서 보여서 아직 **2024 행 자체는 안 보입니다.**

즉,

* **페이지는 맞게 찾았음**
* **주제도 맞게 찾았음**
* 하지만 **답에 바로 쓸 만큼 딱 2024 행만 뽑아오진 못함**

이라고 보면 됩니다.

<h2> 왜 검색 결과 1, 2, 3이 똑같이 나왔나 </h2>

이건 좀 눈여겨볼 포인트예요.
세 결과가 전부 같은 이유는, 현재 검색이 **사실상 같은 청크를 반복해서 반환한 것처럼 보이기 때문**입니다.

특히 아래가 모두 같아요.

* `chunk_id: 144`
* `page_label: '15'`
* 내용 미리보기
* 파일명

즉, 지금은 **“서로 다른 관련 청크 3개”** 를 찾았다기보다,
**“가장 유사한 같은 청크가 중복처럼 3번 나온 상태”** 에 가깝습니다.

<h2> 그래서 최종 판단은 </h2>

<h3> 맞게 찾은 부분 </h3>

* p.15를 찾았다
* 주제도 성과 비교 표라서 맞다
* 메타데이터 추적도 잘 된다

<h3> 아직 완벽하진 않은 부분 </h3>

* 질문이 원하는 **2024 수치** 자체가 미리보기에 직접 드러나지 않음
* 검색 결과 3개가 서로 다른 청크가 아니라 **사실상 같은 결과 반복**처럼 보임

<h2> 보고식으로 정리하면 </h2>

아래처럼 쓰면 깔끔합니다.

> 검색 결과의 메타데이터에서 `page_label: 15` 및 `page: 14`가 확인되어, 질문과 관련된 PDF 15페이지를 정확히 검색한 것으로 판단된다. 또한 내용이 “Berkshire’s Performance vs. the S&P 500” 표로 시작하므로, p.15의 성과 비교 표를 찾은 것도 맞다. 다만 검색 결과 3개가 동일한 청크(`chunk_id: 144`)로 반복 출력되어, 서로 다른 관련 청크를 다양하게 반환한 것은 아니며, 2024년 수치 자체가 미리보기에서 직접 드러나지는 않았다.

<h2> 더 잘 확인하려면 </h2>

다음 중 하나를 해보면 좋아요.

<h3> 1. 질문을 더 구체적으로 바꾸기 </h3>

이렇게 하면 2024 행 쪽을 더 직접 겨냥할 수 있어요.

```bash
py week4_vector_db_experiment.py --file "2024ltr.pdf" --query "버크셔 해서웨이의 2024년 수익률은 몇 퍼센트이며 S&P 500과 비교하면 어떠한가요?"
```

<h3> 2. <code>k=1</code>로 줄여 보기 </h3>

지금은 같은 결과가 반복되니까, 오히려 1개만 보는 게 더 깔끔할 수 있어요. (검색 결과 개수 파라미터)
- 3개의 답변이 다 유사하게 나와서, 가장 유사한 1개만 보는 게 더 깔끔할 수 있다.

```bash
py week4_vector_db_experiment.py --file "2024ltr.pdf" --query "버크셔 해서웨이의 2024년 성과는 S&P 500과 비교해 어땠나요?" --k 1
```

<h3> 3. 출력 글자 수를 늘리기 </h3>

지금 `[:200]`만 보여줘서 2024 행까지 안 보일 수 있습니다.
미리보기 길이를 400~600자로 늘리면 더 잘 보일 가능성이 커요.

<h2> 참고로 p.15의 실제 핵심 값 </h2>

업로드된 PDF 기준으로 p.15 표에는 2024년 값이 이렇게 있습니다:

* **Berkshire: 25.5%**
* **S&P 500: 25.0%** 

즉, 검색 방향 자체는 맞았습니다.

원하시면 다음으로 **왜 같은 결과가 3번 나왔는지 점검하는 체크포인트**도 정리해드릴게요.

</details> <br/>

```sh
py week4_vector_db_experiment.py --file "2024ltr.pdf" --query "버크셔 해서웨이의 2024년 수익률은 몇 퍼센트이며 S&P 500과 비교하면 어떠한가요?"
```

```
py week4_vector_db_experiment.py --file "2024ltr.pdf" --query "버크셔 해서웨이의 2024년 수익률은 몇 퍼센트이며 S&P 500과 비교하면 어떠한가요?"
사용 임베딩 모델: text-embedding-3-small
대상 파일: 2024ltr.pdf
DB 저장 경로: investment_db
============================================================
원본 문서 수: 15
저장된 청크 수: 614
재로드 후 청크 수: 614
============================================================
질문: 버크셔 해서웨이의 2024년 수익률은 몇 퍼센트이며 S&P 500과 비교하면 어떠한가요?
------------------------------------------------------------
검색 결과 1
내용: Berkshire’s Performance vs. the S&P 500
 Annual Percentage Change
Year
in Per-Share
Market Value of
Berkshire
in S&P 500
with Dividends
Included
1995 ......................................
메타데이터: {'source_name': '2024ltr.pdf', 'chunk_id': 144, 'category': '투자보고서', 'title': 'printmgr file', 'creator': 'PyPDF', 'total_pages': 15, 'page_label': '15', 'page': 14, 'creationdate': '2025-02-22T07:14:18-06:00', 'producer': 'Acrobat Distiller 8.1.0 (Windows)', 'source': '2024ltr.pdf', 'moddate': '2025-02-22T07:14:40-06:00'}
------------------------------------------------------------
검색 결과 2
내용: Berkshire’s Performance vs. the S&P 500
 Annual Percentage Change
Year
in Per-Share
Market Value of
Berkshire
in S&P 500
with Dividends
Included
1995 ......................................
메타데이터: {'category': '투자보고서', 'moddate': '2025-02-22T07:14:40-06:00', 'total_pages': 15, 'producer': 'Acrobat Distiller 8.1.0 (Windows)', 'creationdate': '2025-02-22T07:14:18-06:00', 'page_label': '15', 'chunk_id': 144, 'title': 'printmgr file', 'creator': 'PyPDF', 'source': '2024ltr.pdf', 'source_name': '2024ltr.pdf', 'page': 14}
------------------------------------------------------------
검색 결과 3
내용: Berkshire’s Performance vs. the S&P 500
 Annual Percentage Change
Year
in Per-Share
Market Value of
Berkshire
in S&P 500
with Dividends
Included
1995 ......................................
메타데이터: {'page_label': '15', 'producer': 'Acrobat Distiller 8.1.0 (Windows)', 'page': 14, 'total_pages': 15, 'title': 'printmgr file', 'category': '투자보고서', 'moddate': '2025-02-22T07:14:40-06:00', 'creationdate': '2025-02-22T07:14:18-06:00', 'creator': 'PyPDF', 'chunk_id': 144, 'source': '2024ltr.pdf', 'source_name': '2024ltr.pdf'}
============================================================
관찰 포인트:
1. 문서를 벡터 DB에 저장하면 질문과 가까운 청크만 빠르게 찾을 수 있습니다.
2. 프로그램을 다시 실행해도 DB 폴더가 남아 있으면 이전 벡터를 재사용할 수 있습니다.
3. 검색 결과 메타데이터를 보면 출처 추적이 가능합니다.
```

> ? 별로 바뀌는 게 없는데?..

<details>
<summary> <b> GPT 추가설명 </b> </summary> <br/>

네, 맞아요. **지금 사용자님 상황에서는 큰 문제 없어 보여요.**
제일 앞 결과가 같고, 그 결과가 **원하는 p.15**를 잘 가리키고 있으니까, **“잘 찾았는지 확인하는 실습” 목적에서는 충분히 성공적**입니다.

다만 질문하신 부분은 아주 좋아요.
정리하면:

<h2> 결론부터 </h2>

* **k 값이 커진다고 해서 1등 결과가 갑자기 틀려지는 건 아닙니다.**
* 보통은 **1등은 그대로이고, 뒤에 붙는 2등·3등·5등 결과의 관련성이 점점 약해질 수 있습니다.**
* 그래서 **제일 앞 답변이 맞다면, 지금처럼 실습에서는 큰 문제 없을 수 있습니다.**

<h2> k가 의미하는 것 </h2>

`k=3`이면
**가장 비슷한 청크 3개**를 가져오는 거예요.

즉:

* 1위 청크
* 2위 청크
* 3위 청크

를 보여주는 것이지,
1위를 바꾸는 옵션은 아니에요.

그래서 사용자님처럼

> 어차피 제일 앞에 나오는 답변은 동일하면 답변 찾는데에는 문제가 없는 거 같은데요.

이 말이 맞습니다.
**현재 코드처럼 단순 검색 확인용**이라면, 1등 결과가 맞으면 사실상 목적 달성이라고 봐도 돼요.

<h2> 그럼 k가 커지면 무슨 일이 생기나 </h2>

문제는 보통 **1등 결과**가 아니라 **뒤쪽 결과들**에서 생깁니다.

예를 들어:

* `k=1` → 가장 관련성 높은 것 1개만
* `k=3` → 꽤 관련성 있는 것 3개
* `k=10` → 뒤쪽 7~10번째는 질문과 덜 관련된 청크까지 섞일 수 있음

즉, **k가 커질수록 “정답 후보를 더 넓게 가져온다”**고 볼 수 있어요.
그래서 뒤로 갈수록:

* 비슷하지만 덜 중요한 청크
* 주변 문맥은 비슷한데 핵심 답은 아닌 청크
* 표 제목만 비슷한 청크

같은 것들이 들어올 수 있습니다.

<h2> “제대로 된 결과를 못 찾을 수도 있나요?” </h2>

이 표현을 정확히 나누면 두 경우가 있어요.

<h3> 1. 1등 결과 자체를 못 찾는 경우 </h3>

이건 보통 `k` 때문이라기보다

* 청킹 방식
* 임베딩 품질
* 질문 표현
* 문서 구조
* OCR/표 추출 품질

이런 쪽 영향이 더 큽니다.

즉, **“정답을 못 찾았다”의 주원인 = k값**은 보통 아니에요.

<h3> 2. 뒤쪽 결과에 잡음이 섞이는 경우 </h3>

이건 **k가 커질수록 충분히 생길 수 있어요.**

예를 들어 `k=10`으로 가져오면:

* 1~3위는 좋음
* 4~6위는 애매
* 7~10위는 거의 관련 없는 내용

이렇게 될 수 있습니다.

그래서 **k가 커질수록 precision(정확도 느낌)은 떨어지고**,
대신 **recall(놓치지 않으려는 성격)은 올라갈 수 있다**고 생각하면 됩니다.

초보자용으로 쉽게 말하면:

* **k 작게**: 덜 섞이고 깔끔함
* **k 크게**: 더 많이 가져오지만 잡음도 늘 수 있음

<h2> 지금 사용자님 결과에서는 왜 큰 변화가 없나 </h2>

이건 오히려 자연스러워요.

지금 질문:

> 버크셔 해서웨이의 2024년 수익률은 몇 퍼센트이며 S&P 500과 비교하면 어떠한가요?

이 질문은 p.15의 성과 표와 아주 잘 맞습니다.
그래서 검색기가 **같은 페이지, 같은 청크**를 계속 최상위로 잡는 거예요.

즉, 지금은:

* 질문이 비교적 명확하고
* 찾고 싶은 페이지도 분명하고
* 그 페이지에 관련 표가 딱 있음

그래서 `k=1`이든 `k=3`이든 체감 차이가 별로 없는 겁니다.

이건 **검색이 안정적으로 되고 있다는 신호**에 가까워요.

<h2> 사용자님 경우에 어떻게 이해하면 좋냐 </h2>

지금 실습 목표가

* PDF를 벡터 DB에 넣어보기
* 질문으로 관련 청크를 검색해보기
* 메타데이터로 출처 추적해보기

라면,
**제일 앞 결과가 원하는 페이지를 잘 가리키는 것만으로도 충분히 잘 된 것**입니다.

즉:

* `k=1`로 봐도 충분
* `k=3`으로 봐도 큰 문제 없음
* 지금은 k 조정보다 **질문과 메타데이터 확인**이 더 중요

이라고 보시면 됩니다.

<h2> 한 줄 요약 </h2>

> 네, 사용자님 말이 맞습니다. 현재처럼 가장 앞의 검색 결과가 계속 동일하고 그 결과가 원하는 페이지를 정확히 가리킨다면, `k` 값 차이는 실습상 큰 문제가 되지 않습니다. `k`가 커질수록 보통 뒤쪽 결과에 덜 관련된 청크가 섞일 수는 있지만, 1등 결과가 맞다면 답을 찾는 데에는 큰 지장이 없는 경우가 많습니다.

원하시면 제가 이어서 **“이번 실습에서 k보다 더 중요하게 봐야 할 것 3가지”**만 딱 정리해드릴게요.

---

좋아요. 이번 실습에서는 **k보다 더 중요하게 볼 것**이 따로 있어요.
딱 3가지만 보면 됩니다.

<h2> 1. 내가 원하는 페이지/내용을 실제로 찾았는가 </h2>

가장 중요한 건 **검색 결과 1등이 내가 찾고 싶던 정보와 실제로 맞느냐**예요.

이번 경우에는:

* 질문: 2024년 성과 vs S&P 500
* 결과 메타데이터: `page_label: '15'`
* 내용: `Berkshire’s Performance vs. the S&P 500`

이니까, **원하는 p.15를 제대로 찾은 것**이 가장 중요합니다.

즉, `k=1`이냐 `k=3`이냐보다 먼저 봐야 할 건
**“정답 후보를 맞는 페이지에서 가져왔는가?”** 입니다.

<h2> 2. 메타데이터로 출처 추적이 가능한가 </h2>

RAG에서는 단순히 비슷한 글을 찾는 것만 중요한 게 아니라,
**그 내용이 어디서 왔는지 확인할 수 있어야** 해요.

이번 결과에서는:

* `source_name: 2024ltr.pdf`
* `page_label: 15`
* `page: 14`
* `chunk_id: 144`

이런 정보가 같이 나왔죠.

이건 아주 중요합니다.
왜냐하면 나중에

* 이 답이 어느 문서에서 왔는지
* 몇 페이지인지
* 같은 PDF 안에서 어느 부분인지

를 다시 확인할 수 있기 때문이에요.

즉, 이번 실습에서 핵심은
**“검색 결과 + 출처 추적”이 같이 되는가**입니다.

<h2> 3. 질문에 따라 검색 결과가 적절하게 달라지는가 </h2>

벡터 DB 실습에서는
질문을 바꿨을 때 **항상 같은 결과만 나오는지**,
아니면 **질문에 따라 관련 청크가 달라지는지** 보는 것도 중요해요.

예를 들어:

* 성과 비교 질문 → p.15 표
* operating earnings 질문 → p.5 표
* 일본 투자 질문 → p.10~11 본문
* 보험 사업 질문 → p.8~10 본문

이렇게 달라지면 검색이 잘 되는 거예요.

즉, 이번에는 p.15를 잘 찾았으니 다음엔 질문을 바꿔서
**정말 다른 페이지도 잘 찾아가는지** 보면 더 좋습니다.

<h2> 학습 기록용 짧은 버전 </h2>

> 이번 실습에서는 `k` 값 자체보다, 질문에 맞는 페이지를 실제로 찾았는지, 검색 결과의 메타데이터를 통해 출처 추적이 가능한지, 그리고 질문을 바꿨을 때 검색 결과도 적절히 달라지는지를 더 중요하게 확인해야 한다.

원하시면 다음엔 제가 **버크셔 PDF로 질문 바꿔가며 해볼 만한 추가 실습 질문 5개**도 바로 적어드릴게요.

```
버크셔 해서웨이의 2024년 operating earnings는 얼마인가요?
2024년에 버크셔의 보험 사업, 특히 GEICO는 어떻게 설명되나요?
버크셔 해서웨이는 일본의 5개 종합상사에 대해 어떻게 설명하나요?
버크셔 해서웨이는 왜 현금보다 좋은 기업의 지분 보유를 선호한다고 설명하나요?
버크셔 해서웨이는 P/C 보험 사업의 특징과 위험을 어떻게 설명하나요?
```

</details> <br/>

```sh
py week4_vector_db_experiment.py --file "2024ltr.pdf" --query "버크셔 해서웨이는 일본의 5개 종합상사에 대해 어떻게 설명하나요?" --k 1
```

```
py week4_vector_db_experiment.py --file "2024ltr.pdf" --query "버크셔 해서웨이는 일본의 5개 종합상사에 대해 어떻게 설명하나요?" --k 1
사용 임베딩 모델: text-embedding-3-small
대상 파일: 2024ltr.pdf
DB 저장 경로: investment_db
============================================================
원본 문서 수: 15
저장된 청크 수: 767
재로드 후 청크 수: 767
============================================================
질문: 버크셔 해서웨이는 일본의 5개 종합상사에 대해 어떻게 설명하나요?
------------------------------------------------------------
검색 결과 1
내용: companies that very successfully operate in a manner somewhat similar to Berkshire itself. The
five are (alphabetically) ITOCHU, Marubeni, Mitsubishi, Mitsui and Sumitomo. Each of these
large enterp
메타데이터: {'creationdate': '2025-02-22T07:14:18-06:00', 'chunk_id': 105, 'page_label': '10', 'title': 'printmgr file', 'page': 9, 'source_name': '2024ltr.pdf', 'creator': 'PyPDF', 'source': '2024ltr.pdf', 'producer': 'Acrobat Distiller 8.1.0 (Windows)', 'moddate': '2025-02-22T07:14:40-06:00', 'category': '투자보고서', 'total_pages': 15}
============================================================
관찰 포인트:
1. 문서를 벡터 DB에 저장하면 질문과 가까운 청크만 빠르게 찾을 수 있습니다.
2. 프로그램을 다시 실행해도 DB 폴더가 남아 있으면 이전 벡터를 재사용할 수 있습니다.
3. 검색 결과 메타데이터를 보면 출처 추적이 가능합니다.
```

> 아무튼 제대로 찾는 듯?

## 파일 설명
- `vector_db_experiment.py`: 문서 로드, 청킹, Chroma 저장, 재로드, 유사도 검색까지 한 번에 수행
- `investment_db/`: 실행 후 생성되는 Chroma 저장 폴더

## 실습 후 직접 답해보기
- 벡터 DB가 없으면 매 질문마다 어떤 비효율이 생길까?
- 임베딩만 만들고 저장하지 않으면 왜 실전에서 불편할까?
- 검색 결과에 메타데이터가 같이 나오는 것이 왜 중요한가?

<details>
<summary> <b> GPT 추가설명 </b> </summary> <br/>

<h2> 1. 벡터 DB가 없으면 매 질문마다 어떤 비효율이 생길까? </h2>

<h3> 지금 답 </h3>

> 매번 기존 데이터에 대해 임베딩하는 작업이 필요하다

<h3> 평가 </h3>

맞는 답입니다.
아주 핵심을 잘 잡으셨어요.

다만 이것만 쓰면 **청킹, 로딩, 검색 속도, 비용** 부분이 빠져 있어서 조금 아쉬울 수 있어요.

<h3> 더 좋게 다듬으면 </h3>

> 벡터 DB가 없으면 질문이 들어올 때마다 문서를 다시 불러오고, 청크로 나누고, 각 청크를 다시 임베딩해야 한다. 따라서 처리 시간이 오래 걸리고, API 호출 비용도 반복적으로 발생하며, 문서가 많아질수록 비효율이 커진다.

<h2> 2. 임베딩만 만들고 저장하지 않으면 왜 실전에서 불편할까? </h2>

<h3> 지금 답 </h3>

> 벡터 DB에 저장하지 않는다는 말인가? 그럼 매번 임베딩해야 해서.

<h3> 평가 </h3>

이것도 맞아요.
오히려 질문의 뜻을 정확하게 이해하려고 한 점이 좋습니다.

다만 실제 답으로 적을 때는
`벡터 DB에 저장하지 않는다는 말인가?` 같은 문장은 빼고, 바로 답만 쓰는 게 더 깔끔해요.

<h3> 더 좋게 다듬으면 </h3>

> 임베딩을 만들기만 하고 저장하지 않으면 프로그램을 다시 실행할 때마다 문서의 임베딩을 새로 생성해야 한다. 이로 인해 시간과 비용이 반복해서 들고, 실제 서비스에서는 응답 속도와 운영 효율이 떨어진다.

<h2> 3. 검색 결과에 메타데이터가 같이 나오는 것이 왜 중요한가? </h2>

<h3> 지금 답 </h3>

> 출처를 알기 위해서.

<h3> 평가 </h3>

아주 정확합니다.
이건 짧지만 핵심을 정확히 찔렀어요.

다만 조금만 더 쓰면 더 좋아집니다.
왜냐하면 메타데이터는 단순히 “출처 확인”뿐 아니라 **페이지, 파일명, 청크 번호 확인**, 그리고 **디버깅**에도 중요하기 때문이에요.

<h3> 더 좋게 다듬으면 </h3>

> 검색 결과에 메타데이터가 같이 나오면 해당 청크가 어떤 파일, 어떤 페이지, 어떤 청크에서 왔는지 확인할 수 있어 출처 추적이 가능하다. 또한 검색이 적절하게 이루어졌는지 점검하고, 답변의 근거를 확인하는 데에도 도움이 된다.

---

<h3> 실습 후 직접 답해보기 </h3>

* **벡터 DB가 없으면 매 질문마다 어떤 비효율이 생길까?**
  벡터 DB가 없으면 질문이 들어올 때마다 문서를 다시 불러오고 청크로 나눈 뒤, 각 청크를 다시 임베딩해야 한다. 따라서 처리 시간이 오래 걸리고 비용도 반복적으로 발생한다.

* **임베딩만 만들고 저장하지 않으면 왜 실전에서 불편할까?**
  임베딩을 생성한 뒤 저장하지 않으면 프로그램을 다시 실행할 때마다 동일한 문서에 대해 임베딩을 다시 만들어야 한다. 이로 인해 시간과 비용이 낭비되어 실전 운영에 비효율적이다.

* **검색 결과에 메타데이터가 같이 나오는 것이 왜 중요한가?**
  메타데이터가 함께 나오면 검색된 청크가 어떤 파일과 어떤 위치에서 왔는지 확인할 수 있어 출처 추적이 가능하다. 또한 검색 결과의 적절성을 검토하고 답변의 근거를 확인하는 데에도 도움이 된다.

</details> <br/>

## 실습 시 같이 생각해 볼 점
- 질문도 결국 임베딩 벡터로 바뀐 뒤 문서 청크와 비교된다는 점을 이해했는가?
- 벡터 DB 검색은 단순 키워드 검색이 아니라 **의미 기반 검색**이라는 점을 이해했는가?
- 같은 DB를 다시 불러오는 것과, 기존 DB에 청크를 추가로 저장하는 것은 다를 수 있다는 점을 이해했는가?

<details>
<summary> <b> GPT 추가설명 (3번째 항목) </b> </summary> <br/>

네, 이건 처음 보면 좀 헷갈릴 수 있어요.  
질문이 묻고 싶은 핵심은 **“저장된 DB를 그냥 다시 여는 것”** 과 **“이미 있는 DB에 새 데이터를 더 넣는 것”** 은 전혀 다른 동작이라는 점을 이해했는가 입니다.

아래처럼 보면 쉬워요.

<h2> 1. 같은 DB를 다시 불러오는 것 </h2>

이건 이미 저장되어 있는 벡터 DB를 **읽기만 하는 것**에 가깝습니다.

예를 들어:

* 어제 `investment_db`에 청크 2개를 저장해 둠
* 오늘 그 `investment_db`를 다시 열어 봄

이 경우에는 보통 **기존에 있던 2개 청크를 그대로 다시 사용하는 것**입니다.

즉,

* 데이터 개수는 그대로이고
* 저장된 벡터를 재사용하고
* 검색만 다시 수행하는 것입니다.

이번 코드에서 이 부분은 대략 이런 느낌이었죠.

```python
vectordb = Chroma(
    persist_directory=str(db_dir),
    embedding_function=embeddings,
)
```

이건 **기존 DB 열기**에 해당합니다.

<h2> 2. 기존 DB에 청크를 추가로 저장하는 것 </h2>

이건 이미 있는 DB를 열어 놓고, 거기에 **새 청크를 더 넣는 것**입니다.

예를 들어:

* 원래 `investment_db`에 청크 2개가 있었음
* 새로운 문서를 또 넣어서 청크 3개를 추가함

그러면 DB 안에는 이제 총 5개가 될 수 있습니다.

즉, 이건 단순 재로드가 아니라
**기존 저장소를 확장하는 작업**입니다.

<h2> 3. 왜 이 차이가 중요하냐 </h2>

이걸 구분하지 못하면 실습할 때 개수가 헷갈릴 수 있어요.

예를 들어 사용자가 생각하기에:

> “나는 같은 파일로 다시 실행했으니까 청크 수가 또 2개여야지”

라고 생각했는데,

실제로는 코드가 기존 DB에 또 저장해버리면

* 첫 실행: 2개
* 두 번째 실행: 4개
* 세 번째 실행: 6개

처럼 늘어날 수 있습니다.

그러면 사용자는

* 청크가 왜 갑자기 늘었지?
* 재로드한 건가?
* 중복 저장된 건가?

이렇게 혼란스러워질 수 있어요.

그래서 이 질문은 사실상 이런 뜻입니다.

> **“DB를 다시 읽는 것과, DB에 새 데이터를 추가하는 것은 서로 다른 동작이며, 결과도 다르게 나타난다는 점을 이해했는가?”**

<h2> 4. 이번 실습 코드에서는 어떻게 되어 있었나 </h2>

지금 사용자님 코드에서는 이 부분이 있었죠.

```python
if db_dir.exists():
    shutil.rmtree(db_dir)
```

이 줄 때문에 매번 실행할 때 기존 DB 폴더를 지워버립니다.
즉, 지금 실습은 **기존 DB에 추가 저장하는 구조가 아니라, 매번 새로 만드는 구조**예요.

그래서 이번 실습에서는

* DB 생성
* 다시 로드
* 검색

이 흐름만 확인한 것이고,

**“기존 DB에 청크를 누적해서 추가 저장하는 상황”은 아직 실습하지 않은 상태**라고 보면 됩니다.

<h2> 5. 이 질문에 어떻게 답하면 되나 </h2>

아래처럼 답하면 됩니다.

<h3> 쉬운 버전 </h3>

> 같은 DB를 다시 불러오는 것은 이미 저장된 벡터 데이터를 다시 읽어 사용하는 것이고, 기존 DB에 청크를 추가로 저장하는 것은 저장된 데이터에 새로운 청크를 더하는 것이다.  
> 따라서 두 경우는 동작 방식과 청크 수 변화가 다를 수 있다.

<h3> 더 쉬운 버전 </h3>

> DB를 다시 불러오는 것은 기존 데이터를 그대로 읽는 것이고, 청크를 추가 저장하는 것은 기존 데이터에 새 데이터를 더하는 것이다. 그래서 재로드와 추가 저장은 서로 다른 작업이다.

<h2> 6. 비유로 보면 더 쉬움 </h2>

벡터 DB를 노트라고 생각하면:

* **다시 불러오기**: 이미 써 둔 노트를 다시 펼쳐 보는 것
* **추가 저장**: 그 노트 뒤에 새 내용을 계속 덧붙여 쓰는 것

둘 다 “같은 노트”를 쓰는 건 맞지만,
하나는 **읽기**, 다른 하나는 **내용 추가**예요.

<h2> 7. 이 질문이 학습자에게 확인하고 싶은 것 </h2>

결국 이 질문은 아래를 점검하려는 것입니다.

* DB는 한 번 저장해 두면 다시 열 수 있다는 점
* 하지만 다시 연다고 해서 항상 데이터 개수가 그대로인 것은 아니며
* 코드에 따라 기존 DB를 재사용할 수도 있고, 새로 만들 수도 있고, 추가 저장할 수도 있다는 점

즉, **DB 상태가 코드 동작에 따라 달라질 수 있다는 감각**을 갖고 있는지를 묻는 질문이에요.

원하시면 제가 이 질문에 대한 답도 사용자님의 학습 정리 스타일에 맞춰 한두 문장짜리로 바로 써드릴게요.

</details> <br/>

## 추천 자료
- [ChromaDB 공식 문서](https://docs.trychroma.com/)
- [Zilliz 벡터 DB 입문 가이드](https://zilliz.com/learn/beginner-guide-to-implementing-vector-databases)
- [Pinecone 벡터 DB 개요](https://www.pinecone.io/learn/vector-database/)
  - Pinecone은 임베딩 벡터를 저장하고, 질문과 의미적으로 비슷한 데이터를 빠르게 찾게 해주는 클라우드형 벡터 데이터베이스 서비스입니다.
    - Pinecone이 벡터 DB 서비스라는 점
    - Chroma처럼 벡터를 저장하고 검색한다는 점
    - 차이는 로컬 실습용 도구 vs 클라우드 운영용 서비스라는 점

## 완료 기준
- [x] `python vector_db_experiment.py` 실행 후 청크가 DB에 저장되는 것을 확인했다
- [x] 프로그램 재실행 또는 재로드 후 같은 DB를 다시 읽을 수 있음을 확인했다
- [x] 한국어 질문으로 관련 청크 3개를 검색해 봤다
- [x] 검색 결과 메타데이터에서 출처 추적이 가능함을 이해했다
- [x] 질문도 임베딩된 뒤 문서 청크와 비교된다는 흐름을 설명할 수 있다
