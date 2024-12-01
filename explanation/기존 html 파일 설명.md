## ToC
- [기존 html 설명](#기존-html-설명)
  - [index.html](#indexhtml)
    - [1. **기본 레이아웃 설정**](#1-기본-레이아웃-설정)
    - [2. **페이지네이션 관련 변수 설정**](#2-페이지네이션-관련-변수-설정)
    - [3. **헤더 포함**](#3-헤더-포함)
    - [4. **게시물 출력**](#4-게시물-출력)
      - [주요 요소:](#주요-요소)
    - [5. **"Load more posts" 버튼**](#5-load-more-posts-버튼)
    - [6. **카테고리 포함**](#6-카테고리-포함)
    - [7. **게시물 요약 (footer에서 요약 콘텐츠 출력)**](#7-게시물-요약-footer에서-요약-콘텐츠-출력)
    - [8. **기타 Jekyll/HTML 클래스**](#8-기타-jekyllhtml-클래스)
    - [요약](#요약)

# 기존 html 설명

## index.html
이 `index.html` 파일은 Jekyll 사이트의 기본 홈 페이지 레이아웃으로 설계된 코드입니다. 이 코드는 블로그 게시물을 표시하고, 페이지네이션(pagination) 및 카테고리 필터를 지원하며, 기본적으로 Jekyll의 Liquid 템플릿 언어를 활용합니다.

아래에서 주요 코드 블록과 그 역할을 설명드리겠습니다.

---

### 1. **기본 레이아웃 설정**

```liquid
---
layout: home
---
```

- **layout:** `home`으로 설정되어 있습니다.
  - `_layouts/home.html` 파일이 존재해야 하며, 이 파일을 기반으로 렌더링됩니다.
  - Jekyll은 `layout` 설정을 통해 템플릿 파일을 정의합니다.

---

### 2. **페이지네이션 관련 변수 설정**

```liquid
{% if paginator.page %}
  {% assign offset = paginator.page | minus:1 | times:paginator.per_page %}
  {% assign currentPage = paginator.page %}
{% else %}
  {% assign offset = 0 %}
  {% assign currentPage = 1 %}
{% endif %}
```

- **`paginator` 변수**:
  - Jekyll에서 페이지네이션을 활성화했을 때 자동으로 제공됩니다.
  - `paginator.page`: 현재 페이지 번호.
  - `paginator.per_page`: 한 페이지에 표시할 게시물 수.

- **`offset` 변수**:
  - 현재 페이지에서 표시해야 할 게시물의 시작 인덱스를 계산합니다.
  - 예: `2페이지`라면, `(2-1) * per_page`로 계산해 이전 페이지의 게시물을 제외한 게시물을 가져옵니다.

- **`currentPage` 변수**:
  - 현재 페이지 번호를 저장합니다.

---

### 3. **헤더 포함**

```liquid
{% include header.html %}
```

- `header.html` 파일을 포함합니다.
- `_includes/header.html` 경로에 파일이 있어야 하며, 헤더 콘텐츠(로고, 메뉴 등)가 렌더링됩니다.

---

### 4. **게시물 출력**

```liquid
<div class="c-posts o-opacity" data-page="{{ currentPage }}" data-totalPages="{{ paginator.total_pages }}">
  {% for post in site.posts limit:site.paginate offset:offset %}
  <article class="c-post">
    {% if post.image %}
    <a class="c-post-thumbnail o-opacity" style="background-image: url({{"/images/" | prepend: site.baseurl | append : post.image}})"
        href="{{post.url | prepend: site.baseurl}}"></a>
    {% else %} {% endif %}
    <div class="c-post-content">
      <h2 class="c-post-title">
        <a href="{{post.url | prepend: site.baseurl}}">{{post.title}}</a>
      </h2>
      <span class="c-post-date">{{post.date | date: '%Y, %b %d'}}&nbsp;&nbsp;&nbsp;—&nbsp;</span>
      <span class="c-post-words">
        {% capture words %}{{ post.content | number_of_words }}{% endcapture %}
        {% unless words contains "-" %}
          {{ words | plus: 250 | divided_by: 250 | append: " minute read" }}
        {% endunless %}
      </span>
    </div>
  </article>
  {% endfor %}
</div>
```

#### 주요 요소:
1. **게시물 반복 출력**:
   - `for post in site.posts`로 모든 블로그 게시물을 순회.
   - `limit:site.paginate offset:offset`으로 페이지당 표시할 게시물 수와 시작 위치를 제한.

2. **이미지 출력**:
   - 게시물에 `image` 변수가 있는 경우, 해당 이미지를 배경으로 사용하는 썸네일을 출력.

3. **게시물 콘텐츠**:
   - 제목: `post.title`로 렌더링.
   - 날짜: `post.date`를 원하는 형식(`%Y, %b %d`)으로 변환해 표시.
   - 읽는 시간: 게시물 단어 수(`number_of_words`)를 기반으로 대략적인 읽기 시간을 계산.

4. **게시물 요약 (주석 처리됨)**:
   ```liquid
   <!-- <p>{{ post.content | strip_html | truncatewords: 15 }}</p> -->
   ```
   - 게시물 내용을 HTML 태그를 제거한 후, 15단어까지만 표시하려 했으나 현재 주석 처리됨.

---

### 5. **"Load more posts" 버튼**

```liquid
{% assign postCount = site.posts | size %}
{% assign postsCovered = site.paginate | plus:offset %}
{% if postsCovered < postCount %}
  <button class="c-load-more c-btn c-btn--middle">Load more posts</button>
{% endif %}
```

- `postCount`: 전체 게시물 수를 계산.
- `postsCovered`: 현재 페이지에서 표시된 게시물 수.
- 게시물 수가 더 남아 있다면 "Load more posts" 버튼을 추가.

---

### 6. **카테고리 포함**

```liquid
{% include categories.html %}
```

- `_includes/categories.html` 파일을 포함.
- 카테고리 필터, 태그 클라우드 등의 콘텐츠를 표시할 가능성이 높음.

---

### 7. **게시물 요약 (footer에서 요약 콘텐츠 출력)**

```liquid
<p>{{ post.content | strip_html | truncatewords: 15 }}</p>
```

- 게시물 내용을 최대 15단어까지만 잘라 출력.
- `strip_html`: HTML 태그를 제거.
- `truncatewords: 15`: 단어 기준으로 자름.

---

### 8. **기타 Jekyll/HTML 클래스**
- `c-posts`, `c-post`, `o-opacity`, `c-load-more` 등의 클래스는 Jekyll과 관련이 없는 CSS 클래스입니다. 사이트의 스타일링을 담당합니다.

---

### 요약
이 `index.html`은 Jekyll 사이트의 홈 페이지로서, 블로그 게시물을 페이지네이션과 함께 표시합니다. 로컬에서 잘 동작한다면 Jekyll의 `_config.yml`의 `baseurl` 설정과 GitHub Pages 배포 설정을 점검하세요. 문제가 지속되면 더 구체적인 디버깅 정보를 제공해주시면 추가로 도움을 드릴 수 있습니다! 😊

