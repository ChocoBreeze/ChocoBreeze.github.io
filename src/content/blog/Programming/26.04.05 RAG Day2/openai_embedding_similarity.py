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