from __future__ import annotations
# 앞으로 작성할 타입 힌트를 조금 더 편하게 쓰기 위한 설정

import argparse
# 터미널에서 프로그램 실행 시 옵션(--file, --category 같은 것)을 받을 수 있게 해주는 모듈입니다.

from datetime import datetime
# 현재 날짜와 시간을 다루기 위한 모듈입니다.
# 여기서는 청크 메타데이터에 "추가된 날짜"를 넣을 때 사용합니다.

from pathlib import Path
# 파일 경로를 다루기 쉽게 도와주는 모듈입니다.
# 문자열로 경로를 다루는 것보다 더 안전하고 편리합니다.

from langchain_text_splitters import RecursiveCharacterTextSplitter
# 긴 문서를 작은 청크로 나누는 도구입니다.
# RecursiveCharacterTextSplitter는 문단, 줄바꿈, 문장 경계 등을 최대한 고려해서
# 자연스럽게 잘라주려고 시도하는 대표적인 청킹 도구입니다.

from langchain_community.document_loaders import PyPDFLoader, TextLoader
# 문서를 읽어오는 로더(loader)입니다.
# PyPDFLoader는 PDF 파일을 읽을 때 사용하고, TextLoader는 일반 텍스트(.txt) 파일을 읽을 때 사용합니다.
# 실습 시에는 간단히 사용 가능하지만 추후 다른 Loader 사용 가능..! 


DEFAULT_FILE = Path(__file__).with_name("sample_investment_note.txt")
# 이 파이썬 파일과 같은 폴더에 있는 "sample_investment_note.txt" 파일을
# 기본 입력 파일로 사용하겠다는 뜻입니다.
#
# __file__ : 현재 실행 중인 파이썬 파일의 경로
# with_name("sample_investment_note.txt")
#           : 현재 파일과 같은 위치에 있는 다른 파일 이름으로 바꿔 줌
#
# 즉, 사용자가 --file 옵션을 따로 주지 않으면
# sample_investment_note.txt를 자동으로 읽게 됩니다.


def load_documents(file_path: Path):
    # 전달받은 파일 경로의 확장자를 소문자로 가져옵니다.
    # 예: ".PDF"여도 ".pdf"로 통일해서 비교하려고 lower()를 사용합니다.
    suffix = file_path.suffix.lower()

    # 파일 확장자가 PDF라면 PDF 전용 로더를 사용합니다.
    if suffix == ".pdf":
        loader = PyPDFLoader(str(file_path))
        # PyPDFLoader는 문자열 경로를 받기 때문에 Path 객체를 str로 바꿔 줍니다.

    # PDF가 아니면 일반 텍스트 파일이라고 보고 TextLoader를 사용합니다.
    else:
        loader = TextLoader(str(file_path), encoding="utf-8")
        # encoding="utf-8"은 한글이 들어간 텍스트 파일을 제대로 읽기 위해 지정한 것입니다.

    # loader.load()를 실행하면 문서 내용을 LangChain의 Document 형태로 읽어옵니다.
    # - 텍스트 내용(page_content)과 그에 대한 부가 정보(metadata)를 함께 담는 객체
    # PDF의 경우 보통 페이지 단위로 여러 Document가 생길 수 있고,
    # TXT의 경우 보통 하나의 Document로 읽히는 경우가 많습니다.
    return loader.load()


def enrich_metadata(chunks, category: str) -> None:
    # 오늘 날짜를 "2026-04-08" 같은 문자열 형태로 만듭니다.
    added_date = datetime.now().strftime("%Y-%m-%d")

    # enumerate(chunks)는 청크를 하나씩 꺼내면서
    # 동시에 0, 1, 2, 3 ... 같은 번호(index)도 함께 줍니다.
    for index, chunk in enumerate(chunks):
        # 각 청크의 metadata 딕셔너리에 추가 정보를 넣습니다.
        chunk.metadata.update(
            {
                "chunk_id": index,
                # 각 청크에 번호를 붙입니다.
                # 나중에 "몇 번째 청크인지" 구분할 때 사용합니다.

                "source_type": Path(chunk.metadata.get("source", "")).suffix.lower() or ".txt",
                # 원본 문서의 source 경로에서 확장자를 뽑아옵니다.
                # 예: report.pdf -> ".pdf"
                #
                # chunk.metadata.get("source", "")
                #   : metadata 안에 source 값이 있으면 가져오고,
                #     없으면 빈 문자열("")을 사용합니다.
                #
                # Path(...).suffix.lower()
                #   : source에서 확장자만 뽑아서 소문자로 바꿉니다.
                #
                # or ".txt"
                #   : 만약 확장자를 못 찾으면 기본값으로 ".txt"를 넣습니다.

                "added_date": added_date,
                # 이 청크를 메타데이터에 기록한 날짜를 저장합니다.

                "category": category,
                # 사용자가 지정한 카테고리(기본값: 투자보고서)를 저장합니다.
                # 나중에 검색 시 특정 카테고리만 필터링할 때 쓸 수 있습니다.
            }
        )


def print_chunk_preview(title: str, chunks) -> None:
    print(title)
    print(f"청크 수: {len(chunks)}")
    if not chunks:
        return

    first_chunk = chunks[0]

    print("-" * 60)
    print("첫 번째 청크 내용:")
    print(first_chunk.page_content)
    print("-" * 60)
    print("첫 번째 청크 메타데이터:")
    print(first_chunk.metadata)

    print("=" * 60)


def main() -> None:
    # argparse.ArgumentParser는 터미널 인자를 받을 준비를 해주는 객체입니다.
    parser = argparse.ArgumentParser(description="Week3 청킹 실험")

    # --file 옵션 정의 (args.file)
    parser.add_argument(
        "--file",
        default=str(DEFAULT_FILE),
        # 사용자가 --file을 입력하지 않으면 DEFAULT_FILE을 사용합니다.
        help="실험할 TXT 또는 PDF 파일 경로",
        # help는 사용자가 --help를 입력했을 때 보이는 설명입니다.
    )

    # --category 옵션 정의 (args.category)
    parser.add_argument(
        "--category",
        default="투자보고서",
        # 사용자가 --category를 입력하지 않으면 기본값은 "투자보고서"입니다.
        help="청크 메타데이터에 넣을 카테고리",
    )

    # 실제로 터미널에서 입력한 값들을 읽어옵니다.
    args = parser.parse_args()

    # 입력받은 파일 경로를 Path 객체로 변환합니다.
    file_path = Path(args.file)

    # 해당 경로에 파일이 실제로 존재하는지 확인합니다.
    if not file_path.exists():
        # 파일이 없으면 프로그램을 종료하면서 에러 메시지를 보여줍니다.
        raise SystemExit(f"파일을 찾을 수 없습니다: {file_path}")

    # 파일을 읽어서 Document 목록으로 가져옵니다. (여러 페이지가 있다면 페이지 별로 저장)
    # 페이지를 넘는 문장이나 문맥은 끊길 수 있다. (이를 해결하기 위한 여러 전략 존재.)
    documents = load_documents(file_path)

    # 어떤 파일을 대상으로 실험하는지 출력
    print(f"대상 파일: {file_path.name}")

    # 로드된 문서 수 출력
    # PDF는 페이지별로 여러 개가 될 수 있고,
    # TXT는 보통 1개일 가능성이 큽니다.
    print(f"로드된 문서 수: {len(documents)}")

    # 첫 번째 문서의 글자 수 출력
    # 문서가 얼마나 긴지 대략 확인할 수 있습니다.
    print(f"첫 문서 글자 수: {len(documents[0].page_content)}")

    # 원본 문서에 원래 들어 있던 메타데이터 출력
    # 예: source 경로, page 번호 등
    print(f"원본 메타데이터: {documents[0].metadata}")

    # 보기 좋게 구분선 출력
    print("=" * 60)

    # 작은 청크 전략 생성
    splitter_small = RecursiveCharacterTextSplitter(
        chunk_size=120,
        # 청크 하나의 최대 길이를 120자로 설정
        # 여기서는 초보자 실습용으로 아주 작게 잡아 차이를 쉽게 보이게 했습니다.

        chunk_overlap=20,
        # 앞 청크와 뒤 청크가 20자 정도 겹치게 만듭니다.
        # 문장이 청크 경계에서 끊길 때 문맥 손실을 줄이는 역할을 합니다.

        length_function=len,
        # 길이를 셀 때 Python의 len()을 사용하겠다는 뜻입니다.
        # 즉, 여기서는 "토큰 수"가 아니라 "문자 수" 기준에 더 가깝게 동작합니다.
    )

    # 큰 청크 전략 생성
    splitter_large = RecursiveCharacterTextSplitter(
        chunk_size=220,
        # 청크 하나의 최대 길이를 220자로 설정
        # 작은 청크보다 더 큰 덩어리로 자르게 됩니다.

        chunk_overlap=40,
        # 더 큰 청크이므로 겹치는 부분도 40자로 조금 늘렸습니다.

        length_function=len,
        # 여기서도 문자 수 기준으로 길이를 셉니다.
    )

    # 작은 청크 전략으로 문서를 분할합니다.
    chunks_small = splitter_small.split_documents(documents)

    # 큰 청크 전략으로 문서를 분할합니다.
    chunks_large = splitter_large.split_documents(documents)

    # 작은 청크들에 메타데이터를 추가합니다.
    enrich_metadata(chunks_small, args.category)

    # 큰 청크들에도 메타데이터를 추가합니다.
    enrich_metadata(chunks_large, args.category)

    # 작은 청크 전략 결과를 화면에 미리 보여줍니다.
    print_chunk_preview("전략 1: 작은 청크", chunks_small)

    # 큰 청크 전략 결과를 화면에 미리 보여줍니다.
    print_chunk_preview("전략 2: 큰 청크", chunks_large)

    # 마지막으로 사용자가 관찰해야 할 핵심 포인트를 출력합니다.
    print("관찰 포인트:")
    print("1. 청크 크기가 작아지면 개수는 늘고, 내용은 더 잘게 분리됩니다.")
    print("2. 오버랩이 있으면 앞뒤 문맥이 일부 겹쳐 정보 손실을 줄일 수 있습니다.")
    print("3. 메타데이터를 붙여 두면 나중에 출처와 카테고리를 함께 추적할 수 있습니다.")


if __name__ == "__main__":
    # 이 파일을 직접 실행했을 때만 main() 함수를 실행합니다.
    # 다른 파일에서 import해서 사용할 때는 main()이 자동 실행되지 않게 해줍니다.
    main()
