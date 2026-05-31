from pathlib import Path

import streamlit as st

from kb_core import (
    UPLOAD_DIR,
    add_document,
    ask_question,
    detect_doc_type,
    get_categories,
    get_document_summary,
    has_api_key,
)


# Streamlit 페이지 기본 설정입니다.
st.set_page_config(
    page_title="개인 투자 지식 베이스",
    page_icon="📚",
    layout="wide",
)


# 앱 제목입니다.
st.title("📚 개인 투자 지식 베이스")
st.caption("PDF, TXT, URL 자료를 추가하고 질문할 수 있는 간단한 RAG UI입니다.")


# API Key가 없으면 앱을 멈춥니다.
if not has_api_key():
    st.error(".env 파일에 OPENAI_API_KEY를 설정해주세요.")
    st.stop()


# 업로드 폴더가 없으면 생성합니다.
UPLOAD_DIR.mkdir(exist_ok=True)


# -----------------------------
# 사이드바: 문서 추가 영역
# -----------------------------
with st.sidebar:
    st.header("문서 추가")

    st.subheader("1. 파일 추가")

    uploaded_file = st.file_uploader(
        "PDF 또는 TXT 파일을 선택하세요.",
        type=["pdf", "txt"],
    )

    file_category = st.text_input(
        "파일 카테고리",
        value="일반",
        key="file_category",
    )

    if st.button("파일 추가", key="add_file_button"):
        if uploaded_file is None:
            st.warning("먼저 파일을 선택해주세요.")

        else:
            try:
                # 업로드된 파일을 uploaded_files 폴더에 저장합니다.
                save_path = UPLOAD_DIR / uploaded_file.name

                save_path.write_bytes(uploaded_file.getbuffer())

                # 확장자를 보고 pdf 또는 txt인지 판단합니다.
                doc_type = detect_doc_type(save_path)

                with st.spinner("문서를 벡터 DB에 추가하는 중입니다..."):
                    result = add_document(
                        source=str(save_path),
                        category=file_category,
                        doc_type=doc_type,
                    )

                if result["status"] == "duplicate":
                    st.warning(result["message"])
                else:
                    st.success(result["message"])

            except Exception as e:
                st.error(f"파일 추가 중 오류가 발생했습니다: {e}")

    st.divider()

    st.subheader("2. URL 추가")

    url = st.text_input(
        "기사 또는 웹 글 URL",
        placeholder="https://example.com/article",
    )

    url_category = st.text_input(
        "URL 카테고리",
        value="경제뉴스",
        key="url_category",
    )

    if st.button("URL 추가", key="add_url_button"):
        if not url.strip():
            st.warning("URL을 입력해주세요.")

        else:
            try:
                with st.spinner("URL 내용을 가져와 벡터 DB에 추가하는 중입니다..."):
                    result = add_document(
                        source=url.strip(),
                        category=url_category,
                        doc_type="url",
                    )

                if result["status"] == "duplicate":
                    st.warning(result["message"])
                else:
                    st.success(result["message"])

            except Exception as e:
                st.error(f"URL 추가 중 오류가 발생했습니다: {e}")


# -----------------------------
# 메인 화면: 질문 영역
# -----------------------------
st.subheader("질문하기")

categories = get_categories()
category_options = ["전체"] + categories

selected_category = st.selectbox(
    "검색 카테고리",
    options=category_options,
)

question = st.text_area(
    "질문을 입력하세요.",
    placeholder="예: 버크셔 해서웨이의 2024년 주주서한에서 GEICO의 실적 개선은 어떻게 설명되나요?",
    height=100,
)

if st.button("질문하기", type="primary"):
    if not question.strip():
        st.warning("질문을 입력해주세요.")

    else:
        try:
            category_filter = None if selected_category == "전체" else selected_category

            with st.spinner("관련 자료를 검색하고 답변을 생성하는 중입니다..."):
                result = ask_question(
                    question=question.strip(),
                    category_filter=category_filter,
                )

            st.markdown("### 답변")
            st.write(result["answer"])

            st.markdown("### 참고 자료")

            if result["sources"]:
                st.dataframe(
                    result["sources"],
                    use_container_width=True,
                    hide_index=True,
                )
            else:
                st.info("참고 자료가 없습니다.")

        except Exception as e:
            st.error(f"질문 처리 중 오류가 발생했습니다: {e}")


# -----------------------------
# 문서 목록 영역
# -----------------------------
st.divider()

st.subheader("저장된 문서 목록")

summary = get_document_summary()

col1, col2 = st.columns(2)

with col1:
    st.metric("총 문서 수", summary["total_documents"])

with col2:
    st.metric("총 청크 수", summary["total_chunks"])

documents = summary["documents"]

if documents:
    st.dataframe(
        documents,
        use_container_width=True,
        hide_index=True,
    )
else:
    st.info("아직 추가된 문서가 없습니다.")