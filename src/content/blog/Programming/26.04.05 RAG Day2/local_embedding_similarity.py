from __future__ import annotations
# 타입 힌트를 바로 해석하지 않고 미뤄서, 타입 힌트를 더 편하게 쓰게 해주는 설정

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
    # 입력이 list라 tolist 필요

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
