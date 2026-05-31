from __future__ import annotations

import os # 환경 변수 읽기
from textwrap import dedent # 여러 줄 문자열 출력 예쁘게

from dotenv import load_dotenv # .env에 적어둔 키 읽기
from openai import OpenAI


DEFAULT_MODEL = os.getenv("OPENAI_CHAT_MODEL", "gpt-4o-mini")
# 사용할 기본 모델 이름
# OPENAI_CHAT_MODEL 환경변수가 있으면 그 값을 쓰고,
# 없으면 "gpt-4o-mini"를 기본값으로 사용

# OpenAI(...)로 클라이언트를 만드는 것 자체는 과금 포인트가 아닙니다.
# 실제 사용량은 client.chat.completions.create(...) 호출 시 발생합니다.

def build_messages(question: str) -> list[dict[str, str]]:
    # question(질문 문자열)을 받아서 OpenAI 채팅 API가 요구하는 messages 형식으로 만들어주는 함수
    return [
        # 모델의 행동 방식 설정 (모델에게 주는 지시문)
        {
            "role": "system",
            "content": ( # 파이썬에서는 괄호 안에 문자열을 이렇게 나란히 쓰면 자동으로 이어집니다. (실제로는 하나의 긴 문자열임)
                "당신은 투자 분석 학습을 돕는 도우미입니다. "
                "확실하지 않은 내용은 추정이라고 분명히 말하세요."
            ),
        },

        # 실제 사용자 질문을 넣는 부분
        {"role": "user", "content": question},
    ]


def ask_llm(question: str, model: str = DEFAULT_MODEL) -> str:
    # 질문(question)을 받아서 지정한 모델(model)로 LLM에게 물어보고 답변 텍스트를 반환하는 함수
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY")) # 하나하나마다 클라이언트 만드는 건 비효율적
    # main에서 하나 만들고 넘기는 것이 좋음

    # OPENAI 새 프로젝트에서는 Responses API 권장.
    response = client.chat.completions.create(
        model=model,
        messages=build_messages(question),
        temperature=0, # 답변의 랜덤성을 줄이는 설정 - 0에 가까울수록 더 보수적이고 일관된 답이 나옴

    )
    return response.choices[0].message.content or ""
    # 응답(response) 안에서 첫 번째 답변 텍스트를 꺼내서 반환 혹시 None이면 빈 문자열("") 반환


def main() -> None:
    load_dotenv() # .env에 모델이 지정되어 있어도 위에서 default model을 먼저 정하면 .env 내용이 반영이 안 될 수 있음

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise SystemExit(
            "OPENAI_API_KEY가 없습니다. Week1 폴더 또는 상위 폴더의 .env 파일에 설정하세요."
        )

    questions = [
        "삼성전자의 사업 구조를 3문장으로 설명해 주세요.",
        "삼성전자 2024년 실적을 알려주세요. 모르면 모른다고 말해 주세요.",
    ]

    print(f"사용 모델: {DEFAULT_MODEL}")
    print("=" * 60)

    for index, question in enumerate(questions, start=1):
        answer = ask_llm(question)
        print(dedent(f"""
        [질문 {index}]
        {question}

        [응답]
        {answer}
        """).strip())
        # dedent(...)는 들여쓰기를 정리해줌, strip()은 앞뒤 공백/줄바꿈을 제거

        print("=" * 60)

    print("관찰 포인트:")
    print("1. 첫 질문은 일반 지식이라 비교적 안정적으로 답합니다.")
    print("2. 둘째 질문은 최신 수치가 필요하므로 모호하거나 추정성 답변이 나올 수 있습니다.")
    print("3. 이 한계를 보완하기 위해 RAG가 외부 문서를 붙여 줍니다.")


if __name__ == "__main__":
    main()
