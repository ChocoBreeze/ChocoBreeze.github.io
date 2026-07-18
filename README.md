# ChocoBreeze Blog

Astro 기반 개인 블로그 저장소입니다.  
투자, 반도체, 컴퓨터공학, 프로그래밍, 문제 해결, 리포트형 글을 Markdown 중심으로 관리합니다.

## Tech Stack

- Astro 6
- Markdown / MDX
- Astro Content Collections
- `remark-math` + `rehype-katex`
- Sitemap / RSS
- GitHub Pages via GitHub Actions

## Run

```sh
npm install
npm run dev
```

기본 개발 서버는 `http://localhost:4321`에서 실행됩니다.

## Scripts

- `npm run dev`: 개발 서버 실행
- `npm run build`: 프로덕션 빌드
- `npm run preview`: 빌드 결과 미리보기
- `npm run check`: TypeScript/Astro 타입 검사
- `npm run check:content`: 블로그 포스트 frontmatter 및 콘텐츠 품질 검사
- `npm run new:post`: 새 블로그 포스트 스캐폴드 생성
- `npm run astro`: Astro CLI 실행

## Project Structure

```text
.
├─ .claude/
│  └─ commands/         # 슬래시 커맨드 스킬 정의
├─ docs/                # 운영 가이드 문서
├─ public/
├─ scripts/             # check:content 등 유틸리티 스크립트
├─ src/
│  ├─ components/
│  ├─ content/
│  │  └─ blog/          # 카테고리별 하위 폴더로 관리
│  ├─ data/
│  ├─ layouts/
│  ├─ lib/
│  ├─ pages/
│  └─ styles/
├─ astro.config.mjs
├─ AGENTS.md
├─ CLAUDE.md
├─ package.json
└─ README.md
```

## Main Routes

- `/`: 홈
- `/blog/[...slug]`: 개별 글
- `/search`: 글 검색
- 카테고리별 라우트: 각 카테고리의 `href`(`/etf`, `/economics`, `/semiconductor`, `/cs`, `/programming`, `/problem-solving`, `/reports`, `/market-brief`)는 `src/data/blogCategories.ts`의 `BLOG_CATEGORIES`에 정의되어 있습니다.

## Content Rules

모든 글은 `src/content/blog/**/*.{md,mdx}` 에서 로드됩니다.

대표 frontmatter 필드:

- `title`: 필수
- `slug`: 선택, URL 안정성을 위해 권장
- `description`: 선택
- `pubDate`: 권장 발행일 필드
- `updatedDate`: 선택
- `categories`: 선택
- `tags`: 선택
- `pinned`: 선택
- `order`: 선택

콘텐츠 스키마는 `src/content.config.ts`에서 관리합니다.

## Categories

전체 카테고리 정의(키, 라벨, 라우트, 정렬 순서)는 `src/data/blogCategories.ts`의 `BLOG_CATEGORIES`가 유일한 출처입니다. 문서에 목록을 중복해서 나열하지 않으니 해당 파일을 참고하세요.

카테고리 페이지에 노출되어야 하는 글은 `categories` 값이 `BLOG_CATEGORIES`의 키(또는 `normalizeCategory()`가 처리하는 alias)로 정규화되어야 합니다.

## Writing Notes

- 새 글은 주제에 맞는 하위 폴더에 추가합니다.
- 파일명이 한글, 공백, 특수문자를 포함하면 `slug`를 명시하는 편이 안전합니다.
- 기존 폴더 구조는 이미 콘텐츠 정리 방식과 연결되어 있으므로 임의 재구성은 피하는 것이 좋습니다.
- 수식이 필요한 글은 Markdown 안에서 KaTeX 문법을 사용할 수 있습니다.

## Deployment

GitHub Pages 배포는 `.github/workflows/deploy.yml`에서 관리합니다.

- `withastro/action@v5`
- `node-version: 22.12.0`

Astro 6 기준으로 배포 환경도 Node `22.12.0+`를 유지하는 것이 좋습니다.

## Verification

의미 있는 레이아웃 변경이나 글 추가 후에는 아래 순서로 확인하는 것을 권장합니다.

```sh
npm run check:content
npm run check
npm run build
```

## Agent Guide

자동화 에이전트나 협업용 작업 규칙은 `AGENTS.md`에 정리되어 있습니다.  
Claude Code 전용 가이드는 `CLAUDE.md`를 참고하세요.
