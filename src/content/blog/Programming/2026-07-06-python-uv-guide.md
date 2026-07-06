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

## 캐시 관련 주의사항

캐시 디렉토리와 프로젝트 디렉토리가 서로 다른 드라이브/파일시스템에 있으면, 하드링크가 안 돼서 일반 복사로 자동 전환(fallback)된다. 이때 아래 경고가 뜬다.

```
warning: Failed to hardlink files; falling back to full copy. This may lead to degraded performance.
```

설치 자체는 정상이라 무시해도 되지만, 속도를 온전히 챙기고 싶으면 캐시와 프로젝트를 같은 드라이브에 두거나 `UV_LINK_MODE=copy`로 명시해주면 경고가 없어진다.

---

## 정리 – 언제 뭘 쓸지

| 상황 | 선택 |
|---|---|
| 기존 `requirements.txt` 있는 프로젝트 | `uv pip install -r requirements.txt` |
| 새 프로젝트, 처음부터 제대로 | `uv init` + `uv add` |
| 팀 lockfile 그대로 재현 | `uv sync` |
| Python 버전 자체가 없음 | `uv python install` |
| CLI 툴 1회성 실행 | `uvx` |

---

## 한 줄 결론

**"pip 자리 하나만 uv로 바꾸는 것"부터 시작해서, 익숙해지면 `uv init`/`uv add` 기반 프로젝트 구조로 넘어가는 게 자연스러운 도입 경로인 것 같다.** 특히 여러 프로젝트를 오가며 환경을 자주 새로 만드는 워크플로우에서는 캐시 재사용 효과가 꽤 크게 체감된다.
