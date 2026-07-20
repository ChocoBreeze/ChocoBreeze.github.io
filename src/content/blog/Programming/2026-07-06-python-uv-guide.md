---
title: "Python 패키지 관리, 이제 uv로 – 써보고 정리하는 메모"
description: "pip, venv, pyenv, poetry를 대체하는 uv의 핵심 개념과 실사용 패턴을 정리한다."
pubDate: "2026-07-06T21:00:00+09:00"
categories: "Programming"
tags: ["Python", "uv", "Package Manager", "Developer Tools"]
slug: "programming/python-uv-guide"
---

## 왜 uv를 써보게 됐나

pip으로 프로젝트 세팅할 때마다 반복되는 게 있었다. `pip install`, `venv` 만들기, `requirements.txt` 관리, 어쩌다 버전 하나 잘못 박으면 의존성 충돌 디버깅... 특히 여러 프로젝트(RAG, CUDA 등)를 오가며 세팅을 반복하다 보니, 매번 새 가상환경 만들고 패키지 재설치하는 대기 시간이 은근히 쌓였다.

`uv`는 이 지점을 정확히 겨냥한 도구다. Astral(Ruff 만든 팀)에서 만들었고, Rust로 작성돼 있다.

---

## uv가 통합하려는 것

기존엔 목적별로 도구가 다 따로 있었다.

| 목적 | 기존 도구 |
|---|---|
| 패키지 설치 | pip |
| 의존성 lock | pip-tools |
| 가상환경 | virtualenv |
| Python 버전 관리 | pyenv |
| 프로젝트/lockfile 관리 | poetry |

uv는 이 다섯 가지 역할을 하나의 바이너리로 합쳤다. 도구 하나 배우면 다 되는 셈.

---

## 핵심 개념: 파일 3형제

명령어를 보기 전에, uv 프로젝트를 구성하는 세 가지 요소부터 이해하면 나머지가 쉽다.

| 파일/디렉토리 | 역할 |
|---|---|
| `pyproject.toml` | 프로젝트 메타데이터 + **의존성 선언** ("pandas가 필요하다, 버전은 2.x 이상") |
| `uv.lock` | 전체 의존성 트리의 **정확한 버전 고정** (전이 의존성까지 전부) |
| `.venv/` | 실제 패키지가 설치되는 프로젝트별 가상환경 |

핵심 원칙: **`pyproject.toml`과 `uv.lock`은 Git에 커밋하고, `.venv/`는 커밋하지 않는다.** 이 두 파일만 있으면 누구든 어느 머신에서든 `uv sync` 한 번으로 완전히 동일한 환경을 재현할 수 있다.

```gitignore
.venv/
__pycache__/
.env          # API 키 등 비밀 값 — 절대 커밋 금지
```

---

## 왜 빠른가 – 체감한 이유들

**1. Rust 구현**

의존성 해석 속도가 pip 대비 훨씬 빠르다. Python 인터프리터 오버헤드 자체가 없다.

**2. 전역 캐시 + 하드링크**

한 번 받은 패키지는 다른 프로젝트에서도 링크만 걸어서 재사용한다. 복사가 아니라 링크라 거의 즉시 끝난다.

**3. 진짜 병렬 처리**

Python은 GIL 때문에 멀티스레드를 써도 다운로드/해석 작업이 사실상 순차적인데, Rust는 이 제약이 없어서 여러 패키지를 동시에 받고 푼다.

**4. PubGrub 알고리즘**

pip의 단순 백트래킹(막히면 무작정 다시 시도) 대신, 충돌 원인을 기록해뒀다가 같은 실패 경로를 다시 안 밟는 방식(SAT solver의 CDCL 기법 응용)을 쓴다. 에러 메시지도 "왜 충돌났는지" 더 명확하게 나온다.

---

## 설치 (Windows / PowerShell)

```powershell
irm https://astral.sh/uv/install.ps1 | iex
uv --version
```

---

## 실제로 쓰는 두 가지 방식

### 방식 1 — 기존 pip 워크플로우 그대로, 속도만 얻기

```powershell
uv venv
.venv\Scripts\activate
uv pip install -r requirements.txt
```

`pip` 앞에 `uv`만 붙이는 감각. 기존 프로젝트에 적용하기 편하다. 다만 이 방식은 설치 기록이 어디에도 안 남는다 — pip과 동일하게 그냥 설치만 될 뿐.

### 방식 2 — uv 고유 방식, 재현 가능한 프로젝트로 시작하기

```powershell
uv init my-project
cd my-project
uv add requests
uv run python main.py
```

`uv add`를 쓰면 `pyproject.toml`과 `uv.lock`이 자동으로 관리된다. 나중에 팀원이나 다른 컴퓨터에서 완전히 동일한 환경을 재현하려면:

```powershell
uv sync
```

이 한 줄이면 끝. 새 프로젝트는 이 방식으로 시작하는 게 권장 흐름이다.

---

## 그 외 자주 쓰는 것들

**Python 버전 관리** (pyenv 대체)

```powershell
uv python install 3.12
uv python pin 3.12
```

**일회성 CLI 도구 실행** (설치 없이 바로 실행)

```powershell
uvx ruff check .
```

---

## 단일 스크립트에도 의존성을 붙일 수 있다 (PEP 723)

프로젝트 없이 스크립트 파일 하나만 있을 때도, 파일 상단에 의존성을 선언하면 uv가 알아서 임시 환경을 만들어 실행해준다.

```python
# /// script
# dependencies = ["requests", "rich"]
# ///
import requests
from rich import print

print(requests.get("https://api.github.com").json())
```

```powershell
uv run script.py   # 임시 환경 생성 → requests, rich 설치 → 실행. 끝나면 흔적 없음
```

일회성 유틸 스크립트, 데이터 확인용 코드 등에 유용하다.

---

## 캐시 관련 주의사항

캐시 디렉토리와 프로젝트 디렉토리가 서로 다른 드라이브/파일시스템에 있으면, 하드링크가 안 돼서 일반 복사로 자동 전환(fallback)된다. 이때 아래 경고가 뜬다.

```
warning: Failed to hardlink files; falling back to full copy. This may lead to degraded performance.
```

설치 자체는 정상이라 무시해도 되지만, 속도를 온전히 챙기고 싶으면 캐시와 프로젝트를 같은 드라이브에 두거나 `UV_LINK_MODE=copy`로 명시해주면 경고가 없어진다.

---

## CI에서의 활용

CI 파이프라인에서도 lock 기반 재현성 + 캐시 덕분에 uv를 쓰면 시간이 크게 줄어든다. 표준 패턴은 이렇다.

```bash
uv sync --frozen    # lock 파일과 어긋나면 실패 (조용히 새 버전 까는 것 방지)
uv run pytest
```

`--frozen`은 "lock 파일을 절대 바꾸지 말고 그대로 재현하라"는 의미다. 로컬에서 `uv add`로 갱신을 깜빡한 채 커밋했을 때 CI에서 바로 잡아낸다.

---

## 기존 `requirements.txt` 프로젝트에서 갈아타기

레거시 프로젝트를 uv 방식으로 이관하고 싶다면:

```powershell
uv init                       # pyproject.toml 생성
uv add -r requirements.txt    # 기존 의존성을 일괄 이관
```

이후로는 `requirements.txt` 대신 `pyproject.toml` + `uv.lock`이 단일 진실 공급원(source of truth)이 된다. 방식 1(`uv pip install -r requirements.txt`)로 속도만 먼저 취하고, 나중에 이 명령으로 정식 이관하는 점진적 흐름도 가능하다.

---

## 정리 – 언제 뭘 쓸지

| 상황 | 선택 |
|---|---|
| 기존 `requirements.txt` 있는 프로젝트, 속도만 우선 | `uv pip install -r requirements.txt` |
| 기존 `requirements.txt` 프로젝트를 정식 이관 | `uv init` + `uv add -r requirements.txt` |
| 새 프로젝트, 처음부터 제대로 | `uv init` + `uv add` |
| 팀 lockfile 그대로 재현 (클론 직후, 브랜치 이동 후) | `uv sync` |
| CI에서 lock 어긋남을 실패로 잡기 | `uv sync --frozen` |
| Python 버전 자체가 없음 | `uv python install` |
| CLI 툴 1회성 실행 | `uvx` |
| 의존성 없는 단일 스크립트 실행 | PEP 723 주석 + `uv run script.py` |

---

## 한 줄 결론

**"pip 자리 하나만 uv로 바꾸는 것"부터 시작해서, 익숙해지면 `uv init`/`uv add` 기반 프로젝트 구조로 넘어가는 게 자연스러운 도입 경로인 것 같다.** 특히 여러 프로젝트를 오가며 환경을 자주 새로 만드는 워크플로우에서는 캐시 재사용 효과가 꽤 크게 체감된다.
