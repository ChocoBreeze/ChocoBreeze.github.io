---
title: "PowerShell 개인 명령어 설정 가이드"
description: "PowerShell profile을 이용해 프로젝트 이동과 개발 편의 명령어를 설정하는 방법"
pubDate: "2026-05-25T18:50:00+09:00"
categories: "Programming"
tags: ["PowerShell", "Windows", "Developer Tools", "Profile"]
---

이 글은 PowerShell에서 자주 사용하는 프로젝트 이동 명령어와 편의 명령어를 설정하는 방법을 정리한 문서입니다.

구성은 다음과 같습니다.

1. 설정 방법
2. 전체 `my_profile.ps1` 파일
3. 각 명령어 설명
4. 자주 생기는 문제
5. 추천 사용 흐름

---

## 1. 설정 방법

### 1.1 로컬 profile 폴더 만들기

PowerShell을 열고 아래 명령어를 실행합니다.

```powershell
New-Item -ItemType Directory -Path "$HOME\PowerShellProfile" -Force
New-Item -ItemType File -Path "$HOME\PowerShellProfile\my_profile.ps1" -Force
notepad "$HOME\PowerShellProfile\my_profile.ps1"
```

그러면 아래 위치에 로컬 설정 파일이 생성됩니다.

```text
$HOME\PowerShellProfile\my_profile.ps1
```

이 파일에 아래의 전체 `my_profile.ps1` 내용을 붙여넣으면 됩니다.

---

### 1.2 PowerShell 기본 profile에 연결하기

PowerShell은 시작할 때 `$PROFILE` 경로에 있는 profile 파일을 자동으로 읽습니다.

기본 profile 파일을 엽니다.

```powershell
notepad $PROFILE
```

파일이나 폴더가 없다고 나오면 먼저 아래 명령어로 생성합니다.

```powershell
New-Item -ItemType Directory -Path (Split-Path $PROFILE) -Force
New-Item -ItemType File -Path $PROFILE -Force
notepad $PROFILE
```

열린 기본 profile 파일에 아래 한 줄을 추가합니다.

```powershell
. "$HOME\PowerShellProfile\my_profile.ps1"
```

이 한 줄은 로컬에 있는 실제 설정 파일을 PowerShell 시작 시 자동으로 불러오게 해줍니다.

---

### 1.3 설정 적용하기

PowerShell을 새로 열면 자동 적용됩니다.

바로 적용하고 싶다면 아래 명령어를 실행합니다.

```powershell
. "$HOME\PowerShellProfile\my_profile.ps1"
```

적용 여부는 아래 명령어로 확인할 수 있습니다.

```powershell
mycmds
```

---

### 1.4 프로젝트 경로 수정하기

`my_profile.ps1` 파일에서 아래 부분만 본인 PC의 프로젝트 경로에 맞게 수정하면 됩니다.

```powershell
$Projects = @{
    my_simul     = "<프로젝트경로>\my-simul"
    backend_api  = "<프로젝트경로>\backend-api"
    rag_study    = "<프로젝트경로>\rag-study"
}
```

예를 들어 프로젝트가 바탕화면에 있다면 다음처럼 바꿀 수 있습니다.

```powershell
$Projects = @{
    my_simul     = "$HOME\Desktop\my-simul"
    backend_api  = "$HOME\Desktop\backend-api"
    rag_study    = "<스터디경로>\rag-study"
}
```

프로젝트 별칭에는 `_`를 사용하는 것을 추천합니다.

```powershell
my_simul = "<프로젝트경로>\my-simul"
```

만약 `-`를 쓰고 싶다면 key를 따옴표로 감싸야 합니다.

```powershell
"my-simul" = "<프로젝트경로>\my-simul"
```

---

## 2. 전체 `my_profile.ps1` 파일

아래 내용을 `$HOME\PowerShellProfile\my_profile.ps1`에 넣으면 됩니다.

```powershell
# ============================================================
# My PowerShell Profile
# ------------------------------------------------------------
# 사용 방법
# 1. 이 파일을 원하는 로컬 경로에 저장합니다.
#    예: $HOME\PowerShellProfile\my_profile.ps1
#
# 2. PowerShell 기본 profile 파일($PROFILE)에 아래 한 줄을 추가합니다.
#    . "$HOME\PowerShellProfile\my_profile.ps1"
#
# 3. PowerShell을 새로 열거나 아래 명령어로 다시 불러옵니다.
#    . "$HOME\PowerShellProfile\my_profile.ps1"
#
# 4. 프로젝트 경로는 아래 $Projects 부분만 본인 PC에 맞게 수정하세요.
# ============================================================


# ------------------------------------------------------------
# Profile path
# ------------------------------------------------------------
# 이 파일의 기본 위치입니다.
# 다른 위치에 저장할 경우 이 경로만 수정하면 edit-profile / reload-profile이 같이 바뀝니다.
$MyProfilePath = "$HOME\PowerShellProfile\my_profile.ps1"


# ------------------------------------------------------------
# Project shortcuts
# ------------------------------------------------------------
# 사용 예:
#   cdp
#   cdp my_simul
#   cdp my_simul -Open
#   codep my_simul
#   codep my_simul backend_api
#
# 주의:
# - key에 '-'를 쓰고 싶으면 따옴표로 감싸세요.
#   예: "my-simul" = "<프로젝트경로>\my-simul"
# - 개인적으로는 my_simul처럼 '_' 사용을 추천합니다.
$Projects = @{
    my_simul     = "<프로젝트경로>\my-simul"
    backend_api  = "<프로젝트경로>\backend-api"
    rag_study    = "<프로젝트경로>\rag-study"
}


# ------------------------------------------------------------
# cdp: 프로젝트 폴더로 이동
# ------------------------------------------------------------
function cdp {
    param(
        [string]$name,
        [switch]$Open
    )

    if ([string]::IsNullOrWhiteSpace($name)) {
        Write-Host "등록된 프로젝트 목록:"
        $Projects.GetEnumerator() | Sort-Object Name | ForEach-Object {
            Write-Host ("- {0}  ->  {1}" -f $_.Name, $_.Value)
        }

        Write-Host ""
        Write-Host "사용 예:"
        Write-Host "cdp 프로젝트명"
        Write-Host "cdp 프로젝트명 -Open"
        return
    }

    if ($Projects.ContainsKey($name)) {
        Set-Location $Projects[$name]

        if ($Open) {
            explorer .
        }
    } else {
        Write-Host "등록된 프로젝트가 없습니다: $name"
        Write-Host ""
        Write-Host "등록된 프로젝트 목록:"
        $Projects.GetEnumerator() | Sort-Object Name | ForEach-Object {
            Write-Host ("- {0}  ->  {1}" -f $_.Name, $_.Value)
        }
    }
}


# ------------------------------------------------------------
# codep: 프로젝트를 VS Code로 열기
# ------------------------------------------------------------
# 여러 프로젝트를 한 번에 열 수 있습니다.
# 예:
#   codep my_simul
#   codep my_simul backend_api rag_study
function codep {
    param(
        [string[]]$names
    )

    if ($null -eq $names -or $names.Count -eq 0) {
        Write-Host "사용 예: codep 프로젝트명"
        Write-Host "사용 예: codep 프로젝트명1 프로젝트명2"
        return
    }

    $paths = @()

    foreach ($name in $names) {
        if ($Projects.ContainsKey($name)) {
            $paths += $Projects[$name]
        } else {
            Write-Host "등록된 프로젝트가 없습니다: $name"
        }
    }

    if ($paths.Count -gt 0) {
        code $paths
    }
}


# ------------------------------------------------------------
# open: 현재 폴더를 파일 탐색기로 열기
# ------------------------------------------------------------
function open {
    explorer .
}


# ------------------------------------------------------------
# pwdcopy: 현재 폴더 경로를 클립보드에 복사
# ------------------------------------------------------------
function pwdcopy {
    (Get-Location).Path | Set-Clipboard
    Write-Host "현재 경로를 클립보드에 복사했습니다."
}


# ------------------------------------------------------------
# edit-profile: 이 profile 파일 열기
# ------------------------------------------------------------
# VS Code로 열고 싶으면 notepad를 code로 바꾸면 됩니다.
# 예: code $MyProfilePath
function edit-profile {
    notepad $MyProfilePath
}


# ------------------------------------------------------------
# reload-profile: 이 profile 파일 다시 불러오기
# ------------------------------------------------------------
function reload-profile {
    if (Test-Path $MyProfilePath) {
        . $MyProfilePath
        Write-Host "로컬 PowerShell profile을 다시 불러왔습니다."
    } else {
        Write-Host "profile 파일을 찾을 수 없습니다: $MyProfilePath"
    }
}


# ------------------------------------------------------------
# mycmds: 개인 명령어 목록 보기
# ------------------------------------------------------------
function mycmds {
    $names = @(
        "cdp",
        "codep",
        "open",
        "pwdcopy",
        "edit-profile",
        "reload-profile",
        "mycmds"
    )

    Write-Host "개인 명령어 등록 상태:"
    Write-Host ""

    foreach ($name in $names) {
        $cmd = Get-Command $name -ErrorAction SilentlyContinue

        if ($cmd) {
            Write-Host ("[OK] {0}" -f $name)
        } else {
            Write-Host ("[X]  {0}" -f $name)
        }
    }

    Write-Host ""
    Write-Host "설명:"
    Write-Host "cdp                   : 등록된 프로젝트 목록 보기"
    Write-Host "cdp 프로젝트명        : 프로젝트 폴더로 이동"
    Write-Host "cdp 프로젝트명 -Open  : 프로젝트 폴더로 이동 후 파일 탐색기 열기"
    Write-Host "codep 프로젝트명      : 프로젝트 폴더를 VS Code로 열기"
    Write-Host "codep A B C           : 여러 프로젝트를 VS Code로 열기"
    Write-Host "open                  : 현재 폴더를 파일 탐색기로 열기"
    Write-Host "pwdcopy               : 현재 폴더 경로를 클립보드에 복사"
    Write-Host "edit-profile          : 로컬 profile 파일 열기"
    Write-Host "reload-profile        : 로컬 profile 파일 다시 불러오기"
    Write-Host "mycmds                : 개인 명령어 목록 보기"
}
```

---

## 3. 각 명령어 설명

### 3.1 `cdp`

등록된 프로젝트 목록을 보거나, 특정 프로젝트 폴더로 이동합니다.

```powershell
cdp
```

등록된 프로젝트 목록을 보여줍니다.

```powershell
cdp my_simul
```

`my_simul` 프로젝트 폴더로 이동합니다.

```powershell
cdp my_simul -Open
```

`my_simul` 프로젝트 폴더로 이동한 뒤, 파일 탐색기도 함께 엽니다.

---

### 3.2 `codep`

등록된 프로젝트를 VS Code로 엽니다.

```powershell
codep my_simul
```

`my_simul` 프로젝트를 VS Code로 엽니다.

```powershell
codep my_simul backend_api rag_study
```

여러 프로젝트를 한 번에 VS Code로 엽니다.

현재 설정에서는 `code` 명령을 한 번만 실행하도록 되어 있어서, 여러 프로젝트를 열 때 비교적 안정적입니다.

---

### 3.3 `open`

현재 PowerShell 위치를 파일 탐색기로 엽니다.

```powershell
open
```

예를 들어 현재 위치가 `<프로젝트경로>\my-simul`이면 해당 폴더가 파일 탐색기로 열립니다.

---

### 3.4 `pwdcopy`

현재 PowerShell 위치의 전체 경로를 클립보드에 복사합니다.

```powershell
pwdcopy
```

예를 들어 현재 위치가 아래와 같다면:

```text
<프로젝트경로>\my-simul
```

이 경로가 클립보드에 복사됩니다.

---

### 3.5 `edit-profile`

로컬 profile 파일을 메모장으로 엽니다.

```powershell
edit-profile
```

현재 설정에서는 아래 파일을 엽니다.

```text
$HOME\PowerShellProfile\my_profile.ps1
```

VS Code로 열고 싶다면 `my_profile.ps1` 안의 아래 부분을 수정하면 됩니다.

```powershell
function edit-profile {
    notepad $MyProfilePath
}
```

아래처럼 변경합니다.

```powershell
function edit-profile {
    code $MyProfilePath
}
```

---

### 3.6 `reload-profile`

로컬 profile 파일을 다시 불러옵니다.

```powershell
reload-profile
```

`my_profile.ps1`을 수정한 뒤 PowerShell을 껐다 켜지 않고 바로 반영할 때 사용합니다.

만약 `reload-profile`이 이상하게 동작하지 않는다면 아래 명령어를 직접 실행하면 됩니다.

```powershell
. "$HOME\PowerShellProfile\my_profile.ps1"
```

---

### 3.7 `mycmds`

등록된 개인 명령어 상태와 설명을 보여줍니다.

```powershell
mycmds
```

예상 출력 형태는 다음과 같습니다.

```text
개인 명령어 등록 상태:

[OK] cdp
[OK] codep
[OK] open
[OK] pwdcopy
[OK] edit-profile
[OK] reload-profile
[OK] mycmds
```

---

## 4. 자주 생기는 문제

### 4.1 `notepad $PROFILE`이 OneDrive 경로로 열리는 경우

Windows에서 문서 폴더가 OneDrive와 연결되어 있으면 `$PROFILE` 경로가 다음처럼 잡힐 수 있습니다.

```text
$HOME\OneDrive\문서\PowerShell\Microsoft.PowerShell_profile.ps1
```

이 경우 OneDrive 쪽 profile 파일에는 아래 한 줄만 넣고:

```powershell
. "$HOME\PowerShellProfile\my_profile.ps1"
```

실제 함수와 설정은 로컬 파일에서 관리하면 됩니다.

```text
$HOME\PowerShellProfile\my_profile.ps1
```

이 구조가 가장 깔끔합니다.

```text
OneDrive 쪽 기본 profile
└─ . "$HOME\PowerShellProfile\my_profile.ps1"

로컬 실제 설정 파일
└─ $HOME\PowerShellProfile\my_profile.ps1
```

---

### 4.2 `codep`를 썼는데 VS Code가 안 열리는 경우

`code` 명령이 PowerShell에서 인식되어야 합니다.

확인:

```powershell
Get-Command code
```

인식되지 않으면 VS Code에서 다음을 확인합니다.

1. VS Code 실행
2. `Ctrl + Shift + P`
3. `Shell Command: Install 'code' command in PATH` 실행

Windows에서는 설치 방식에 따라 이 명령이 보이지 않을 수 있습니다.
그 경우 VS Code 설치 시 `Add to PATH` 옵션을 켜거나, VS Code를 재설치하면서 PATH 등록을 선택하면 됩니다.

---

### 4.3 `cdp my-simul` 같은 이름을 쓰고 싶은 경우

`$Projects`에서 key에 `-`를 쓰려면 반드시 따옴표로 감싸야 합니다.

```powershell
$Projects = @{
    "my-simul" = "<프로젝트경로>\my-simul"
}
```

사용은 이렇게 합니다.

```powershell
cdp my-simul
```

따옴표를 안 쓰면 PowerShell이 `-`를 연산자처럼 해석할 수 있어서 에러가 날 수 있습니다.

---

### 4.4 PowerShell 실행 정책 오류가 나는 경우

profile을 불러올 때 실행 정책 관련 오류가 날 수 있습니다.

현재 정책 확인:

```powershell
Get-ExecutionPolicy
```

현재 사용자 범위에서 로컬 스크립트를 허용하려면 다음을 사용할 수 있습니다.

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

회사나 학교 PC에서는 보안 정책 때문에 변경이 막혀 있을 수 있습니다.
그 경우 관리자나 보안 정책 담당자의 기준을 따라야 합니다.

---

## 5. 추천 사용 흐름

평소에는 아래 정도만 자주 쓰면 됩니다.

```powershell
cdp
cdp my_simul
cdp my_simul -Open
codep my_simul
pwdcopy
edit-profile
reload-profile
mycmds
```

새 프로젝트를 추가할 때는:

1. `edit-profile`
2. `$Projects`에 프로젝트 한 줄 추가
3. 저장
4. `reload-profile`
5. `cdp`로 목록 확인

예시:

```powershell
$Projects = @{
    my_simul     = "<프로젝트경로>\my-simul"
    backend_api  = "<프로젝트경로>\backend-api"
    rag_study    = "<프로젝트경로>\rag-study"
    new_project  = "<프로젝트경로>\new-project"
}
```

이제 아래처럼 사용할 수 있습니다.

```powershell
cdp new_project
codep new_project
```
