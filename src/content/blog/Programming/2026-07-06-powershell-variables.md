---
title: "PowerShell 변수 3종 정리: $, $env:, [Environment]::SetEnvironmentVariable"
description: "값을 저장하는 방법이 왜 세 가지나 있고, 언제 뭘 써야 하는지 개념부터 정리한다."
pubDate: "2026-07-06T20:00:00+09:00"
categories: "Programming"
tags: ["PowerShell", "Windows", "Developer Tools", "Environment Variables"]
slug: "programming/powershell-variables"
---

값을 저장하는 방법이 왜 세 가지나 있고, 언제 뭘 써야 하는지 개념부터 정리한다.

---

## 1. `$변수명` — PowerShell 세션 변수 (Session Variable)

### 정체

PowerShell 자체의 **메모리 공간**에 저장되는 변수. `.NET` 객체를 그대로 담을 수 있는 PowerShell만의 그릇이다.

```powershell
$uvVersion = "0.11.21"
$numbers = 1, 2, 3
$obj = Get-Process
```

### 특징

- **어떤 타입이든 저장 가능**: 문자열, 숫자, 배열, 객체, 해시테이블 등
- **오직 현재 PowerShell 프로세스 안에서만** 존재
- **자식 프로세스에 전달 안 됨** — python.exe, uv.exe 등 다른 프로그램은 이 값을 모른다

```powershell
$uvVersion = "0.11.21"
$uvVersion.GetType()   # System.String 같은 실제 .NET 타입 확인 가능
```

### 언제 좋은가

- PowerShell **스크립트 내부 로직**용 (반복문, 조건문, 함수 인자 등)
- 복잡한 데이터 구조(배열, 객체, 해시테이블) 다룰 때
- 외부 프로그램과 공유할 필요가 전혀 없을 때

```powershell
$files = Get-ChildItem *.log
foreach ($file in $files) {
    Write-Output $file.Name
}
```

### 확인 방법

```powershell
$uvVersion                        # 값 출력
Test-Path variable:uvVersion      # 존재 여부 (True/False)
```

### 지속 범위

현재 PowerShell 창(프로세스)이 살아있는 동안만. 창을 닫으면 완전히 사라진다.

---

## 2. `$env:변수명` — 환경 변수 (Environment Variable)

### 정체

운영체제 레벨의 **프로세스 환경 블록(environment block)**에 저장되는 값. PowerShell이 `$env:` 문법으로 읽고 쓸 인터페이스를 제공할 뿐, 실제로는 OS 프로세스 구조체의 일부다.

```powershell
$env:uvVersion = "0.11.21"
$env:PATH
$env:UV_PYTHON = "3.12"
```

### 특징

- **문자열만 저장 가능** (다른 타입은 자동으로 문자열 변환됨)
- **자식 프로세스에 상속됨** — `$변수명`과의 핵심 차이
- Windows/macOS/Linux 어디서든 존재하는 **범용 OS 개념** (bash의 `export`와 대응)

```powershell
$env:MY_TOKEN = "secret123"
python -c "import os; print(os.environ['MY_TOKEN'])"   # 자식 프로세스에서 읽힘
```

### 언제 좋은가

- **외부 프로그램**(uv, git, python, node 등)이 자체적으로 참조하도록 설계된 설정값
- API 키, 토큰처럼 실행 시점에 주입해야 하는 민감 정보

```powershell
$env:UV_PYTHON = "3.12"
$env:UV_CACHE_DIR = "$HOME\uv-cache"
uv run python main.py     # uv.exe가 이 값들을 읽어서 동작 결정
```

### 확인 방법

```powershell
$env:uvVersion
Test-Path env:uvVersion
Get-ChildItem env: | Where-Object { $_.Name -like "*uv*" }
```

### 지속 범위

`$변수명`과 마찬가지로 **현재 프로세스(세션)가 끝나면 사라진다.** 차이는 "영구 저장 여부"가 아니라 "자식 프로세스에게 전달되는지 여부"라는 점이 핵심 — 흔히 오해하기 쉬운 부분이다.

---

## 3. `[System.Environment]::SetEnvironmentVariable(...)` — 레지스트리에 영구 저장

### 정체

.NET Framework가 제공하는 **정적 메서드(static method)**. PowerShell은 .NET 위에서 동작하기 때문에 이런 .NET 클래스의 메서드를 직접 호출할 수 있다.

```powershell
[System.Environment]::SetEnvironmentVariable("변수명", "값", "범위")
```

- `[System.Environment]` — .NET의 `Environment` 클래스 (대괄호는 .NET 타입을 가리킬 때 사용)
- `::` — **정적 멤버 접근 연산자** (인스턴스를 만들지 않고 클래스 자체의 메서드를 바로 호출)
- 세 번째 인자 **범위(Scope)**가 핵심 차이를 만든다

### 범위별 동작

```powershell
[Environment]::SetEnvironmentVariable("UV_CACHE_DIR", "$HOME\uv-cache", "Process")
```
→ `$env:`로 설정하는 것과 사실상 동일. 이 프로세스 안에서만, 세션 끝나면 사라짐.

```powershell
[Environment]::SetEnvironmentVariable("UV_CACHE_DIR", "$HOME\uv-cache", "User")
```
→ 현재 로그인한 **사용자 계정**에 영구 저장. 레지스트리(`HKEY_CURRENT_USER\Environment`)에 기록. 새 PowerShell 창을 열면 (재부팅 없이도) 자동으로 존재.

```powershell
[Environment]::SetEnvironmentVariable("UV_CACHE_DIR", "$HOME\uv-cache", "Machine")
```
→ 이 컴퓨터의 **모든 사용자**에게 영구 저장. 레지스트리(`HKEY_LOCAL_MACHINE\...\Environment`)에 기록. **관리자 권한 필요**.

### 읽기 / 삭제

```powershell
[Environment]::GetEnvironmentVariable("UV_CACHE_DIR", "User")           # 읽기
[Environment]::SetEnvironmentVariable("UV_CACHE_DIR", $null, "User")    # 삭제 ($null 대입)
```

### 언제 좋은가

- 재부팅해도, 새 창을 열어도 값이 남아있어야 할 때
- 제어판(시스템 속성 → 환경 변수) GUI로 등록하는 것과 완전히 동일한 효과를 스크립트로 자동화하고 싶을 때

---

## 종합 비교표

| 구분 | `$변수명` | `$env:변수명` | `[Environment]::SetEnvironmentVariable` |
|---|---|---|---|
| 저장 위치 | PowerShell 메모리 (.NET 객체) | OS 프로세스 환경 블록 | 레지스트리 (범위에 따라) 또는 프로세스 |
| 저장 가능 타입 | 모든 타입 | 문자열만 | 문자열만 |
| 자식 프로세스 전달 | ❌ | ✅ | ✅ (Process 범위 이상) |
| 세션 종료 후 유지 | ❌ | ❌ | ✅ (`User`/`Machine` 범위일 때) |
| 범위 지정 | 불가 | 불가 (항상 현재 프로세스) | 가능 (`Process`/`User`/`Machine`) |
| PowerShell 전용 여부 | PowerShell만의 개념 | OS 범용 개념 | .NET 메서드 (PowerShell·C# 등에서 공통 사용) |

---

## 관계 정리

세 개념은 독립된 게 아니라 **계층 관계**다.

```
$변수명
  └─ PowerShell만의 임시 저장소, 가장 가볍고 유연함

$env:변수명
  └─ OS 환경 변수를 "현재 프로세스 범위"로 읽고 쓰는 것
      = [Environment]::SetEnvironmentVariable(name, value, "Process")와 동일 효과

[Environment]::SetEnvironmentVariable(name, value, "User"/"Machine")
  └─ $env: 로는 할 수 없는 "영구 저장(레지스트리 기록)"까지 가능하게 확장한 것
```

---

## 선택 기준

> **1) 이 값을 PowerShell 스크립트 안에서만 쓸 건가?** → `$변수명`
>
> **2) 다른 프로그램(uv.exe 등)도 읽어야 하는데, 지금 세션에서만 유효해도 되나?** → `$env:변수명`
>
> **3) 새 창을 열거나 재부팅해도 값이 남아있어야 하나?** → `[Environment]::SetEnvironmentVariable(..., "User")`

`uvVersion` 값을 uv.exe가 직접 읽어서 동작을 바꾸는 게 아니라 스크립트 안에서 참조만 하는 용도라면 (1)로 충분하다. uv 관련 도구가 실행 시점에 환경변수로 읽어야 하는 값(`UV_PYTHON` 등)이라면 최소 (2), 매번 새 창에서도 유지돼야 한다면 (3)까지 가는 흐름으로 판단하면 된다.
