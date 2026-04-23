---
title: "RAG Week2 임베딩과 벡터"
description: "관련 문서 판단"
pubDate: "2026-04-06T00:00:00+09:00"
categories: "Programming"
tags: ["RAG", "embedding", "vector"]
---

이번 주는 문장을 숫자 벡터로 바꾸고, 질문과 문장이 얼마나 가까운지 계산해 보는 단계입니다. RAG에서 "관련 문서를 찾는 검색"이 어떻게 가능한지 직접 확인하는 주차입니다.

**이번 주 목표**
- 임베딩이 무엇인지 실습으로 이해한다.
- 코사인 유사도로 의미적 유사성을 계산한다.
- OpenAI 임베딩과 로컬 임베딩의 차이를 체험한다.

**핵심 개념**
- **임베딩**: 문장의 의미를 숫자 벡터로 표현한 것
- **벡터 공간**: 의미가 비슷한 문장끼리 가까이 놓이는 공간
- **코사인 유사도**: 두 벡터가 얼마나 비슷한 방향을 가지는지 계산하는 방법
- **검색 단계의 핵심**: 질문 벡터와 문서 벡터를 비교해 가장 가까운 청크를 찾음
- 질문과 문서를 같은 방식으로 벡터화하면 같은 공간에서 비교할 수 있음

**실습 순서**

### 1. 패키지 설치
```bash
.\.venv\Scripts\activate
py -m pip install openai python-dotenv sentence-transformers
```

### 2. `.env` 확인
```env
OPENAI_API_KEY=<YOUR_OPENAI_API_KEY>
```
로컬 임베딩 실습은 API 키가 없어도 되지만, OpenAI 임베딩 실습에는 필요합니다.

### 3. OpenAI 임베딩 실습 (OpenAI 임베딩 실습은 API 호출이므로 소액 비용이 발생할 수 있습니다.)
```bash
py openai_embedding_similarity.py
```

<details>
<summary> <b> 상세 코드 </b> </summary> <br/>

```py
from __future__ import annotations

import os
from math import sqrt

from dotenv import load_dotenv
from openai import OpenAI


EMBEDDING_MODEL = os.getenv("OPENAI_EMBEDDING_MODEL", "text-embedding-3-small")


def dot_product(a: list[float], b: list[float]) -> float:
    return sum(x * y for x, y in zip(a, b))


def l2_norm(vector: list[float]) -> float:
    return sqrt(sum(x * x for x in vector))


def cosine_similarity(a: list[float], b: list[float]) -> float:
    return dot_product(a, b) / (l2_norm(a) * l2_norm(b))

"""
# 1 꼭 직접 구현할 필요 X
import numpy as np

def cosine_similarity(a, b):
    a = np.array(a)
    b = np.array(b)
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))
"""
"""
# 2 꼭 직접 구현할 필요 X
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

a = np.array([query_embedding])
b = np.array([sentence_embedding])

score = cosine_similarity(a, b)[0][0]
"""

# 이렇게 함수로 만들면 나중에 구조를 바꾸기 편함!
def get_embedding(client: OpenAI, text: str) -> list[float]:
    response = client.embeddings.create(
        input=text,
        model=EMBEDDING_MODEL,
    )
    return response.data[0].embedding


def main() -> None:
    load_dotenv()

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise SystemExit(
            "OPENAI_API_KEY가 없습니다. Week2 폴더 또는 상위 폴더의 .env 파일에 설정하세요."
        )

    client = OpenAI(api_key=api_key)

    sentences = [
        "삼성전자의 2024년 영업이익이 크게 증가했다.",
        "반도체 부문 수익성이 개선되었다.",
        "오늘 날씨가 매우 맑고 화창하다.",
        "HBM 메모리 수요가 AI 붐으로 급증하고 있다.",
        "스마트폰 판매량은 전년 대비 소폭 감소했다.",
    ]
    query = "삼성전자 실적이 좋아졌나요?"

    print(f"사용 임베딩 모델: {EMBEDDING_MODEL}")
    print(f"질문: {query}")
    print("=" * 60)

    query_embedding = get_embedding(client, query) # 질문 문장인 query를 임베딩 vector로 바꾸기
    scored_results: list[tuple[float, str]] = [] # 결과를 담아 둘 빈 리스트 - [유사도 점수, 원래 문장]

    for sentence in sentences:
        sentence_embedding = get_embedding(client, sentence) # 문장 하나를 임베딩으로 바꾸기
        score = cosine_similarity(query_embedding, sentence_embedding) # 질문 벡터와 문장 벡터를 비교해서 코사인 유사도 계산
        scored_results.append((score, sentence))

    for rank, (score, sentence) in enumerate(
        sorted(scored_results, key=lambda item: item[0], reverse=True), # 점수 기준 내림차순 정렬 (질문과 가장 비슷한 질문이 제일 앞에 오도록)
        start=1, # 번호 붙이기. (첫 번째: rank = 1, 두 번째: rank = 2, 세 번째: rank = 3, ...)
    ):
        print(f"{rank}. 유사도 {score:.4f} | {sentence}")

    print("=" * 60)
    print("관찰 포인트:")
    print("1. 실적과 관련된 문장이 날씨 문장보다 높은 점수를 받는지 확인합니다.")
    print("2. 완전히 같은 단어가 없어도 의미가 비슷하면 유사도가 올라갈 수 있습니다.")
    print("3. RAG에서는 이 점수를 이용해 질문과 가장 가까운 문서 조각을 찾습니다.")


if __name__ == "__main__":
    main()


"""
이 코드는 작은 규모의 문서 검색기 역할.

실제 RAG에서는
- PDF를 여러 청크로 자르고
- 각 청크를 임베딩으로 바꾸고
- 사용자 질문도 임베딩으로 바꾼 뒤
- 가장 가까운 청크 몇 개를 찾아서
- 그걸 LLM에 넣어 답변하게 합니다
"""
```

</details> <br/>

확인할 것:
- 질문과 가장 가까운 문장이 무엇인지
- 날씨처럼 관계없는 문장이 낮은 점수를 받는지
- "실적", "수익성", "영업이익" 같은 표현이 왜 가깝게 나오는지

```
사용 임베딩 모델: text-embedding-3-small
질문: 삼성전자 실적이 좋아졌나요?
============================================================
1. 유사도 0.5511 | 삼성전자의 2024년 영업이익이 크게 증가했다.
2. 유사도 0.3244 | 스마트폰 판매량은 전년 대비 소폭 감소했다.
3. 유사도 0.2320 | 반도체 부문 수익성이 개선되었다.
4. 유사도 0.2056 | HBM 메모리 수요가 AI 붐으로 급증하고 있다.
5. 유사도 0.0813 | 오늘 날씨가 매우 맑고 화창하다.
============================================================
관찰 포인트:
1. 실적과 관련된 문장이 날씨 문장보다 높은 점수를 받는지 확인합니다.
2. 완전히 같은 단어가 없어도 의미가 비슷하면 유사도가 올라갈 수 있습니다.
3. RAG에서는 이 점수를 이용해 질문과 가장 가까운 문서 조각을 찾습니다.
```

<details>
<summary> <b> GPT 추가설명 </b> </summary> <br/>

네, **결과 꽤 잘 나온 편이에요.**  
Week 2에서 보려던 포인트가 전반적으로 확인됐습니다.

핵심만 보면:

<h3> 1. 질문과 가장 가까운 문장 </h3>

가장 높은 건

* **0.5511 | 삼성전자의 2024년 영업이익이 크게 증가했다.**

이거죠.
질문이 **“삼성전자 실적이 좋아졌나요?”** 이니까,
`삼성전자`, `실적`, `좋아짐`과 가장 직접적으로 연결되는 문장이 1위로 나온 건 자연스럽습니다.

즉 이건 잘 됐어요.

<h3> 2. 관계없는 문장이 낮은 점수를 받는가 </h3>

네, 이것도 잘 보입니다.

* **0.0813 | 오늘 날씨가 매우 맑고 화창하다.**

이건 투자/실적과 거의 관계가 없으니까 낮게 나오는 게 맞아요.
즉 임베딩이 단순 키워드 매칭이 아니라, **문장 의미가 얼마나 관련 있는지** 어느 정도 반영하고 있다고 볼 수 있어요.

<h3> 3. “실적”, “수익성”, “영업이익”이 왜 가깝게 나오는가 </h3>

이 부분도 방향은 맞아요.

예를 들면:

* `삼성전자의 2024년 영업이익이 크게 증가했다.` → **0.5511**
* `반도체 부문 수익성이 개선되었다.` → **0.2320**

둘 다 **회사의 성과, 이익, 실적 개선**과 연결된 표현이라서
임베딩 공간에서 어느 정도 비슷한 방향으로 놓였다고 볼 수 있어요.

즉 모델은 단어가 완전히 같지 않아도,

* 실적
* 영업이익
* 수익성 개선

같은 표현들을 **비슷한 의미 영역**으로 잡는다는 뜻입니다.

<h2> 다만 한 가지 흥미로운 점 </h2>

조금 눈에 띄는 건 이거예요.

* `스마트폰 판매량은 전년 대비 소폭 감소했다.` → **0.3244**
* `반도체 부문 수익성이 개선되었다.` → **0.2320**

직관적으로는 `수익성 개선`이 더 높을 것 같기도 한데,  
이번 결과에서는 `스마트폰 판매량 감소`가 더 높게 나왔네요.

이건 이상한 건 아니고, 이런 이유가 있을 수 있어요.

* 질문이 **삼성전자 실적**이라는 넓은 표현이라서
  모델이 “회사 실적과 관련된 사업 지표”로 판매량도 꽤 관련 있다고 본 경우
* `삼성전자`라는 기업 맥락과 모바일 사업이 연결된 의미가 반영됐을 수 있음
* 임베딩은 사람이 생각하는 완벽한 순위를 항상 그대로 재현하는 건 아님

즉, **상위 1개는 아주 잘 맞고, 2~4위는 의미적으로 관련 있지만 순서는 조금 달라질 수 있다**  
이 정도로 보면 됩니다.

이게 오히려 중요한 포인트예요.  
RAG 검색은 강력하지만, **항상 사람이 기대한 완벽한 순서로만 나오지는 않는다**는 걸 보여주거든요.

<h2> 이 결과로 말할 수 있는 것 </h2>

지금 결과를 바탕으로 이렇게 정리하면 좋아요.

> 질문과 가장 가까운 문장은 “삼성전자의 2024년 영업이익이 크게 증가했다.”였다.
> 반면 “오늘 날씨가 매우 맑고 화창하다.”처럼 관계없는 문장은 매우 낮은 유사도를 받았다.
> 또한 “실적”, “영업이익”, “수익성”처럼 완전히 같은 단어가 아니어도 기업 성과와 관련된 의미를 공유하면 유사도가 높아질 수 있음을 확인했다.

이 정도면 Week 2 실습 해석으로 충분히 좋아요.

<h2> 한 줄 총평 </h2>

**성공적인 결과입니다.**
특히

* 관련 문장이 위로 오고
* 무관한 문장이 아래로 가고
* 완전 동일 키워드가 아니어도 의미 유사성이 반영된다는 점
  이 잘 드러났어요.

이제 다음으로는 자연스럽게 **로컬 임베딩 결과와 비교**해보면 됩니다.

</details> <br/>

### 4. 로컬 임베딩 실습
```bash
py local_embedding_similarity.py
```

<details>
<summary> <b> 상세 코드 </b> </summary> <br/>

```py
from __future__ import annotations # 타입 힌트를 조금 더 편하게 쓰기 위한 설정

from math import sqrt

from sentence_transformers import SentenceTransformer # 문장을 임베딩 벡터로 바꿔주는 도구

"""
내 컴퓨터에서 모델을 불러와서 질문과 문장의 유사도를 계산하는 코드
"""

MODEL_NAME = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"


def dot_product(a: list[float], b: list[float]) -> float:
    return sum(x * y for x, y in zip(a, b))


def l2_norm(vector: list[float]) -> float:
    return sqrt(sum(x * x for x in vector))


def cosine_similarity(a: list[float], b: list[float]) -> float:
    return dot_product(a, b) / (l2_norm(a) * l2_norm(b))


def main() -> None:
    model = SentenceTransformer(MODEL_NAME) # 임베딩 모델 불러오기

    sentences = [
        "삼성전자 영업이익 증가",
        "반도체 수익 개선",
        "오늘 점심 메뉴",
        "AI 서버용 메모리 수요 확대",
        "스마트폰 출하량 감소",
    ]
    query = "삼성전자 실적이 좋아졌나요?"

    print(f"사용 로컬 모델: {MODEL_NAME}")
    print(f"질문: {query}")
    print("=" * 60)

    query_embedding = model.encode(query).tolist() # 질문 문장을 임베딩 벡터로 바꾸기
    sentence_embeddings = model.encode(sentences) # 여러 문장을 한 번에 임베딩하기
    print(f"임베딩 차원: {len(query_embedding)}")

    scored_results: list[tuple[float, str]] = [] # (유사도 점수, 문장)
    for sentence, embedding in zip(sentences, sentence_embeddings):
        score = cosine_similarity(query_embedding, embedding.tolist())
        scored_results.append((score, sentence))

    for rank, (score, sentence) in enumerate(
        sorted(scored_results, key=lambda item: item[0], reverse=True), # 큰 점수 기준으로 정렬
        start=1, # 정렬된 결과에 순번 붙이기
    ):
        print(f"{rank}. 유사도 {score:.4f} | {sentence}")

    print("=" * 60)
    print("관찰 포인트:")
    print("1. API 없이도 의미 기반 유사도 계산이 가능합니다.")
    print("2. 한국어 문장에서 실적 관련 표현이 서로 가깝게 묶이는지 확인합니다.")
    print("3. 다음 주부터는 이런 임베딩을 문서 청크 단위로 사용하게 됩니다.")


if __name__ == "__main__":
    main()
```

</details> <br/>

```
Warning: You are sending unauthenticated requests to the HF Hub. Please set a HF_TOKEN to enable higher rate limits and faster downloads.
Loading weights: 100%|██████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████| 199/199 [00:00<00:00, 8582.69it/s]
BertModel LOAD REPORT from: sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2
Key                     | Status     | Details
------------------------+------------+--------
embeddings.position_ids | UNEXPECTED |

Notes:
- UNEXPECTED:   can be ignored when loading from different task/architecture; not ok if you expect identical arch.
사용 로컬 모델: sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2
질문: 삼성전자 실적이 좋아졌나요?
============================================================
임베딩 차원: 384
1. 유사도 0.6597 | 삼성전자 영업이익 증가
2. 유사도 0.5892 | 반도체 수익 개선
3. 유사도 0.3549 | 스마트폰 출하량 감소
4. 유사도 0.2597 | AI 서버용 메모리 수요 확대
5. 유사도 0.1332 | 오늘 점심 메뉴
============================================================
관찰 포인트:
1. API 없이도 의미 기반 유사도 계산이 가능합니다.
2. 한국어 문장에서 실적 관련 표현이 서로 가깝게 묶이는지 확인합니다.
3. 다음 주부터는 이런 임베딩을 문서 청크 단위로 사용하게 됩니다.
```
확인할 것:
- API 없이도 유사도 계산이 가능한지
- 한국어 투자 문장에서 의미적으로 비슷한 문장이 위로 오는지
- 임베딩 차원이 몇 개인지

<details>
<summary> <b> GPT 추가설명 </b> </summary> <br/>

네, 이것도 **아주 잘 나온 편**이에요.
그리고 OpenAI 임베딩 결과와 비교했을 때도 꽤 자연스럽습니다.

<h2> 먼저 결론 </h2>

이번 결과로 **확인할 것 3개가 전부 충족**됐다고 봐도 됩니다.

<h3> 1. API 없이도 유사도 계산이 가능한가 </h3>

네, 가능합니다.
실제로 이번에는 OpenAI API 호출 없이 로컬 모델로 결과가 나왔죠.

맨 위 경고문:

> `You are sending unauthenticated requests to the HF Hub...`

이건 **모델 다운로드 시 Hugging Face 인증 없이 받았다**는 뜻에 가깝고,
실행 자체가 안 된다는 뜻은 아니에요.
즉 **로컬 임베딩 실습은 성공**한 겁니다.

<h3> 2. 한국어 투자 문장에서 비슷한 문장이 위로 오는가 </h3>

네, 이 부분도 잘 보입니다.

순위를 보면:

1. **0.6597 | 삼성전자 영업이익 증가**
2. **0.5892 | 반도체 수익 개선**
3. **0.3549 | 스마트폰 출하량 감소**
4. **0.2597 | AI 서버용 메모리 수요 확대**
5. **0.1332 | 오늘 점심 메뉴**

질문이
**“삼성전자 실적이 좋아졌나요?”**
이니까,

* `삼성전자 영업이익 증가`
* `반도체 수익 개선`

이 위에 오는 건 아주 자연스럽습니다.

반대로

* `오늘 점심 메뉴`

같은 무관한 문장이 맨 아래로 간 것도 잘 됐어요.

<h3> 3. 임베딩 차원이 몇 개인가 </h3>

결과에 이미 나왔죠.

* **임베딩 차원: 384**

즉 이 로컬 모델은 문장을 **384차원 벡터**로 바꿔서 비교하고 있다는 뜻이에요.

이건 OpenAI 임베딩과 비교할 때도 좋은 포인트예요.
즉, 임베딩은 모델마다 차원이 다를 수 있다는 걸 직접 본 거예요.

<h2> OpenAI 결과와 비교하면 어떤가 </h2>

이번 local 결과는 오히려 **더 직관적으로 보이는 면**도 있어요.

OpenAI 결과:

* 삼성전자 영업이익 증가
* 스마트폰 판매량 감소
* 반도체 수익성 개선
* ...

Local 결과:

* 삼성전자 영업이익 증가
* 반도체 수익 개선
* 스마트폰 출하량 감소
* ...

질문이 “실적이 좋아졌나요?”니까,
사람 입장에서는 `영업이익 증가`와 `수익 개선`이 위에 오는 게 꽤 납득되죠.
이번 local 결과는 그런 면에서 **조금 더 기대에 맞는 순서**처럼 느껴질 수 있어요.

물론 이건 “로컬이 무조건 더 좋다”는 뜻은 아니고,
**모델마다 임베딩 공간이 조금씩 다르게 형성되기 때문에 순위 차이가 날 수 있다**는 걸 보여주는 거예요.

<h2> 경고문은 문제인가 </h2>

이 부분도 짚고 갈게요.

<h3> <code>HF_TOKEN</code> 경고 </h3>

이건:

* 인증 없이 Hugging Face Hub에서 다운로드했고
* 그래서 속도나 rate limit이 제한될 수 있다는 뜻

보통 **실습 단계에서는 크게 문제 아닙니다.**

<h3> <code>embeddings.position_ids | UNEXPECTED</code> </h3>

이것도 지금 결과가 정상적으로 나온 걸 보면,
실습 수준에서는 **크게 신경 안 써도 되는 경고**로 봐도 됩니다.
실제로 notes에도 `can be ignored`라고 적혀 있죠.

즉 현재는:

* 모델 로딩 성공
* 임베딩 생성 성공
* 유사도 계산 성공

상태입니다.

<h2> 이 결과로 어떻게 해석하면 좋냐 </h2>

이렇게 정리하면 좋아요:

> 로컬 임베딩 모델을 사용해 API 없이도 문장을 벡터로 변환하고 유사도를 계산할 수 있었다.
> 질문과 의미적으로 가까운 “삼성전자 영업이익 증가”, “반도체 수익 개선” 같은 문장이 높은 순위에 나타났고, “오늘 점심 메뉴”처럼 관련 없는 문장은 낮은 점수를 받았다.
> 이를 통해 임베딩은 정확히 같은 키워드가 없어도 의미가 비슷한 문장을 가까운 벡터로 표현할 수 있음을 확인했다.

이 정도면 Week 2 회고로 아주 좋습니다.

<h2> 한 줄 총평 </h2>

**성공적인 결과입니다.**
특히 이번 결과는

* API 없이 로컬에서도 가능했고
* 실적 관련 문장이 잘 위로 왔고
* 무관한 문장이 잘 아래로 갔고
* 384차원 임베딩도 직접 확인했다는 점에서
  Week 2 목표를 아주 잘 충족했습니다.

이제 정말 자연스럽게 다음 주의
**“그럼 긴 문서를 어떻게 잘게 나눠서 임베딩하지?”** , 즉 **청킹**으로 넘어가면 됩니다.

</details> <br/>

### 파일 설명
- `openai_embedding_similarity.py`: OpenAI 임베딩으로 질문-문장 유사도 계산
  - `cosine_similarity`는 `numpy`를 사용하거나 `sklearn`도 가능함.
- `local_embedding_similarity.py`: Sentence Transformers로 로컬 유사도 계산

### 실습 후 직접 답해보기
#### 키워드가 정확히 같지 않아도 왜 비슷한 문장으로 판단될까?
> 임베딩 계산 시, 단어 간 유사도가 있을 수 있어서

임베딩은 문장을 단순한 문자 그대로가 아니라 **의미를 반영한 벡터**로 바꾸기 때문이다. 그래서 단어가 완전히 같지 않아도, `실적`, `영업이익`, `수익성`처럼 의미적으로 관련된 표현은 벡터 공간에서 가깝게 놓일 수 있다.

지금 쓰신
> 단어 간 유사도가 있을 수 있어서도 틀리진 않지만, **“임베딩이 의미를 반영한 벡터라서”** 를 넣어주는 게 더 좋아요.

#### RAG에서 질문과 문서를 같은 공간에 놓는다는 말은 무슨 뜻일까?
> 비교를 위해 둘 다 벡터로 표현하는 것.

질문과 문서를 **같은 방식으로 벡터화**해서, 하나의 벡터 공간 안에서 서로 얼마나 가까운지 비교할 수 있게 만든다는 뜻이다. 이렇게 해야 질문과 가장 의미적으로 비슷한 문서 조각을 찾을 수 있다.

지금 쓰신
> 비교를 위해 둘 다 벡터로 표현하는 것도 맞는데, **“같은 방식으로 벡터화”** 와 **“가까운 문서를 찾는다”** 까지 붙이면 더 정확해요.

#### 다음 주에 문서를 청크로 쪼개는 이유는 무엇일까?
> 문서의 경우 길이가 길어 쪼개야 함.

문서는 길이가 길어서 한 번에 전부 넣기 어렵고, 필요한 부분만 정확히 찾는 것도 힘들기 때문이다. 그래서 문서를 여러 조각으로 나누면, 질문과 가장 관련 있는 부분만 검색해서 LLM에 넣을 수 있다.

지금 쓰신
> 문서의 경우 길이가 길어 쪼개야 함도 핵심은 맞아요. 그런데 여기에 **“관련 있는 부분만 찾기 위해서”** 를 넣어주면 훨씬 좋아집니다.

### 추천 자료
- [Jay Alammar — The Illustrated Word2Vec](https://jalammar.github.io/illustrated-word2vec/)
- [Sentence Transformers 공식 문서](https://www.sbert.net/)
- [SingleStore Vector Embeddings Guide](https://www.singlestore.com/blog/beginner-guide-to-vector-embeddings/)

### 완료 기준
- [x] `python openai_embedding_similarity.py` 실행 후 유사도 순위를 확인했다
- [x] `python local_embedding_similarity.py` 실행 후 로컬 임베딩 결과를 확인했다
- [ ] "벡터가 가까우면 의미가 비슷하다"를 자기 말로 설명할 수 있다
  - 같은 차원의 벡터로 표현했을 때 가까운 벡터일수록 가까운 의미를 가진다.
    - “같은 차원”은 사실 너무 당연한 전제라 굳이 안 넣어도 되고, 핵심은 **임베딩 공간에서의 거리/방향 유사성**이에요.
    - 문장을 임베딩 벡터로 바꾸면, 의미가 비슷한 문장끼리는 벡터 공간에서도 서로 가깝게 위치한다. 그래서 벡터가 가까울수록 문장의 의미도 비슷하다고 해석할 수 있다.
- [x] 다음 주 문서 청킹 실습으로 넘어갈 준비가 되었다
