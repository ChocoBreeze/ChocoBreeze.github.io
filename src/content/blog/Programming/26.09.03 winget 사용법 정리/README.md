---
title: "Windows에서 프로그램 설치·업데이트를 한 번에: winget 사용법 정리"
slug: "winget-package-manager-guide"
description: "Windows 패키지 관리자 winget의 search, install, list, upgrade, uninstall 명령어와 source 개념, 사내망 msstore 오류 대처법까지 정리합니다."
pubDate: "2026-09-03T00:00:00+09:00"
categories: "Programming"
tags: ["winget", "Windows", "PowerShell", "CLI", "Developer Tools"]
---

Windows를 오래 사용하면서도 프로그램 설치와 업데이트는 늘 비슷한 방식으로 해왔다.

1. 프로그램 홈페이지에 접속한다.
2. 다운로드 페이지를 찾는다.
3. `.exe` 또는 `.msi` 설치 파일을 받는다.
4. 설치한다.
5. 나중에 업데이트가 필요하면 다시 홈페이지에 들어간다.

그런데 Windows에도 Linux의 `apt`, macOS의 `brew`처럼 프로그램을 터미널에서 관리할 수 있는 패키지 관리자가 있다.

바로 **`winget`**이다.

직접 사용해보니 생각보다 훨씬 편했다.

---

## winget이란?

`winget`은 Microsoft가 제공하는 **Windows Package Manager**다.

터미널에서 프로그램을 검색하고, 설치하고, 업데이트하고, 제거할 수 있다.

예를 들어 7-Zip을 설치하기 위해 홈페이지에 들어갈 필요 없이 다음 한 줄이면 된다.

```powershell
winget install 7zip.7zip
```

업데이트도 마찬가지다.

```powershell
winget upgrade 7zip.7zip
```

즉 Windows에서도 다음과 같은 방식으로 프로그램을 관리할 수 있다.

```text
Linux   → apt
macOS   → brew
Windows → winget
```

---

## 기본 명령어

winget을 사용할 때 가장 자주 사용하는 명령은 다음 5개다.

```text
winget search
winget install
winget list
winget upgrade
winget uninstall
```

이 정도만 알아도 일반적인 프로그램 관리는 거의 가능하다.

---

## 1. `winget search`

설치 가능한 프로그램을 검색한다.

예를 들어 DBeaver를 찾고 싶다면:

```powershell
winget search dbeaver
```

검색 결과는 대략 다음처럼 나온다.

```text
Name                Id                 Version
------------------------------------------------
DBeaver Community   dbeaver.dbeaver    ...
```

여기서 중요한 것은 **Id**다.

이후 프로그램을 설치하거나 업데이트할 때 이 ID를 사용하는 것이 가장 정확하다.

예를 들어:

```powershell
winget search vscode
winget search git
winget search powertoys
```

처럼 사용할 수 있다.

---

## 2. `winget install`

프로그램을 설치한다.

```powershell
winget install dbeaver.dbeaver
```

ID를 명확하게 지정하려면:

```powershell
winget install --id dbeaver.dbeaver
```

정확히 일치하는 ID만 사용하고 싶다면 `-e` 옵션도 사용할 수 있다.

```powershell
winget install --id dbeaver.dbeaver -e
```

`-e`는 `--exact`의 축약형이다.

즉 정확하게 해당 패키지만 찾으라는 의미다.

---

## 3. `winget list`

현재 Windows에 설치된 프로그램을 확인한다.

```powershell
winget list
```

특정 프로그램만 확인할 수도 있다.

```powershell
winget list PowerToys
```

또는:

```powershell
winget list --id Microsoft.PowerToys
```

여기서 재미있는 점은 `winget list`가 **winget으로 설치한 프로그램만 보여주는 것은 아니라는 것**이다.

Windows에 기존에 설치되어 있던 프로그램도 감지해서 보여준다.

즉 예전에 직접 `.exe`로 설치한 프로그램도 winget이 인식할 수 있다.

---

## 4. `winget upgrade`

개인적으로 winget에서 가장 마음에 들었던 기능이다.

```powershell
winget upgrade
```

를 실행하면 현재 설치된 프로그램 중 **업데이트 가능한 프로그램 목록**을 보여준다.

예를 들어:

```text
Name                 Id                      Version       Available
----------------------------------------------------------------------
7-Zip                7zip.7zip               19.00         26.02
PowerToys            Microsoft.PowerToys     0.83.0        0.101...
Claude               Anthropic.Claude        1.17377.2.0   1.44121.2
```

이 명령은 목록만 확인한다.

실제 업데이트를 하려면 원하는 프로그램을 지정한다.

```powershell
winget upgrade 7zip.7zip
```

PowerToys라면:

```powershell
winget upgrade Microsoft.PowerToys
```

Claude라면:

```powershell
winget upgrade Anthropic.Claude
```

---

### `winget upgrade --all`은 주의

다음 명령도 있다.

```powershell
winget upgrade --all
```

처음에는 그냥 전체 업데이트 목록을 더 자세히 보여주는 명령인 줄 알았는데, 아니었다.

**업데이트 가능한 프로그램을 전부 실제로 업데이트한다.**

Visual Studio Installer 같은 프로그램까지 갑자기 업데이트되기 시작해서 꽤 당황할 수 있다.

따라서 보통은:

```powershell
winget upgrade
```

로 먼저 목록을 확인한 뒤,

```powershell
winget upgrade 패키지ID
```

형태로 원하는 프로그램만 업데이트하는 것이 안전하다.

---

## 5. `winget uninstall`

프로그램 제거도 가능하다.

예를 들어 7-Zip을 제거한다면:

```powershell
winget uninstall 7zip.7zip
```

또는:

```powershell
winget uninstall --id 7zip.7zip
```

Windows 설정의 "설치된 앱"에 들어가지 않고도 터미널에서 프로그램 제거가 가능하다.

---

## `--id`는 무엇인가?

다음 두 명령은 비슷해 보인다.

```powershell
winget upgrade Anthropic.Claude
```

```powershell
winget upgrade --id Anthropic.Claude
```

`--id`를 붙이면 해당 문자열을 프로그램 이름이 아니라 **패키지 ID로 검색하라**는 의미다.

더 정확하게 사용하고 싶다면:

```powershell
winget upgrade --id Anthropic.Claude -e
```

처럼 쓸 수 있다.

- `--id` : 패키지 ID 기준 검색
- `-e` : exact, 정확하게 일치
- `--source winget` : winget 원본만 사용

따라서 꽤 명시적으로 쓰고 싶다면:

```powershell
winget upgrade --id Anthropic.Claude -e --source winget
```

처럼 사용할 수 있다.

다만 평소에는 다음 정도로도 충분하다.

```powershell
winget upgrade Anthropic.Claude
```

---

## winget의 Source

winget에는 프로그램 정보를 가져오는 여러 **source(원본)** 가 있다.

현재 원본은 다음 명령으로 확인할 수 있다.

```powershell
winget source list
```

대표적으로 다음 두 가지를 자주 볼 수 있다.

```text
winget
msstore
```

### winget

일반적인 Win32 프로그램들이 등록되어 있는 저장소다.

예를 들어:

```text
7zip.7zip
Git.Git
Microsoft.VisualStudioCode
Microsoft.PowerToys
NAVER.Whale
dbeaver.dbeaver
Anthropic.Claude
```

같은 프로그램을 찾을 수 있다.

### msstore

Microsoft Store의 앱을 의미한다.

예를 들어 ChatGPT의 Microsoft Store 앱이 다음처럼 표시될 수 있다.

```text
ChatGPT
9PLM9XGG6VKS
msstore
```

---

## 사내망에서 msstore 오류가 발생할 수도 있다

회사 PC에서 다음과 같은 오류가 발생했다.

```text
원본을 검색하는 동안 실패함: msstore

0x8a15005e :
The server certificate did not match any of the expected values.
```

사내 프록시, SSL Inspection, 보안 장비 등의 영향으로 Microsoft Store 원본의 인증서 검증에 실패할 수 있다.

이런 환경에서는 `winget` 원본만 명시해서 사용할 수 있다.

```powershell
winget upgrade --source winget
```

특정 프로그램 업데이트도:

```powershell
winget upgrade 7zip.7zip --source winget
```

처럼 하면 된다.

프로그램 설치 역시:

```powershell
winget install dbeaver.dbeaver --source winget
```

처럼 사용할 수 있다.

---

## 생각보다 정말 많은 프로그램이 있다

winget을 사용해보면서 가장 놀랐던 부분이다.

단순한 Microsoft 프로그램만 있는 것이 아니다.

예를 들어 다음 프로그램들도 winget으로 관리할 수 있다.

```text
7-Zip
Git
Visual Studio Code
PowerToys
DBeaver
Docker Desktop
Postman
NAVER Whale
Claude
Python
Node.js
JDK
GitHub Desktop
Oh My Posh
```

예를 들어 DBeaver도 설치할 수 있다.

```powershell
winget install dbeaver.dbeaver
```

Git도:

```powershell
winget install Git.Git
```

VS Code도:

```powershell
winget install Microsoft.VisualStudioCode
```

PowerToys도:

```powershell
winget install Microsoft.PowerToys
```

이 정도면 새 PC를 세팅할 때 설치 파일을 따로 하나씩 들고 다닐 필요가 상당히 줄어든다.

---

## 설치 파일을 따로 보관할 필요가 줄어든다

예전에는 새 PC를 세팅할 때 USB나 NAS에 이런 파일들을 모아두곤 했다.

```text
7zxxxx-x64.exe
VSCodeUserSetup-x64.exe
Git-x.x.x-64-bit.exe
PowerToysSetup.exe
DBeaverInstaller.exe
...
```

하지만 인터넷 연결이 되고 winget을 사용할 수 있다면:

```powershell
winget install 7zip.7zip
winget install Git.Git
winget install Microsoft.VisualStudioCode
winget install Microsoft.PowerToys
winget install dbeaver.dbeaver
```

처럼 바로 설치할 수 있다.

특히 개발 PC 초기 세팅에는 정말 편하다.

물론 다음과 같은 경우에는 오프라인 설치 파일이 여전히 필요하다.

- 인터넷이 차단된 환경
- 사내 보안 정책으로 winget 사용이 제한된 환경
- 특정 구버전이 반드시 필요한 경우
- 설치 파일 자체를 보관해야 하는 경우

하지만 일반적인 개인 PC에서는 설치 파일을 일일이 보관할 이유가 상당히 줄어든다.

---

## winget이 항상 완벽한 것은 아니다

사용하다 보면 재미있는 문제도 발견할 수 있다.

내 PC에는 Pake로 직접 만든 ChatGPT 앱이 설치되어 있었다.

Windows 등록 정보는 다음과 같았다.

```text
DisplayName     : ChatGPT
DisplayVersion  : 1.0.0
Publisher       : pake
InstallLocation : Pake 설치 폴더
```

그런데 `winget upgrade`에서는 이 프로그램을:

```text
ChatGPT
lencx.ChatGPT
1.0.0 → 1.1.0
```

으로 인식했다.

즉 Pake로 만든 앱을 `lencx.ChatGPT`라는 다른 서드파티 ChatGPT 앱으로 잘못 매칭한 것이다.

이런 일이 가능한 이유는 winget이 기존에 설치된 프로그램의 이름, 버전, 설치 정보 등을 기반으로 저장소의 패키지와 연결하기 때문이다.

따라서 `winget upgrade` 목록에서 처음 보는 프로그램이 있다면 **무조건 업데이트하기보다는 ID를 한 번 확인하는 것이 좋다.**

특히 다음처럼 이름이 일반적인 프로그램은 주의하는 것이 좋다.

```text
ChatGPT
Python
Java
Updater
Runtime
Launcher
```

---

## 업데이트 직후 버전이 바로 바뀌지 않을 수도 있다

NAVER Whale과 VS Code를 업데이트하면서 또 하나 알게 된 점이 있다.

winget으로 업데이트가 완료되었는데:

```powershell
winget list
```

에서는 잠시 이전 버전으로 표시되기도 했다.

winget은 Windows에 등록된 설치 정보를 이용해서 버전을 판단하기 때문에 프로그램이나 설치 프로그램에 따라 등록 정보가 바로 갱신되지 않을 수 있다.

따라서 업데이트 직후에는 실제 프로그램에서 버전을 확인하는 것이 더 정확할 수 있다.

예를 들어 VS Code는:

```powershell
code --version
```

Whale은 주소창에서:

```text
whale://version
```

으로 실제 실행 버전을 확인할 수 있다.

---

## 개발자라면 일단 이것부터 설치해도 좋다

새 Windows 개발 PC를 세팅한다면 개인적으로 다음 정도는 기본으로 설치할 만하다.

```powershell
winget install 7zip.7zip
winget install Git.Git
winget install Microsoft.VisualStudioCode
winget install Microsoft.PowerToys
winget install dbeaver.dbeaver
```

필요하다면:

```powershell
winget install Docker.DockerDesktop
winget install Postman.Postman
```

도 추가할 수 있다.

Java 개발이라면 JDK를, Python 개발이라면 Python을 추가하면 된다.

다만 Python, Node.js, Java 등은 프로젝트마다 여러 버전을 사용하는 경우가 많기 때문에 별도의 버전 관리 도구를 사용하는 것도 고려할 만하다.

---

## 자주 사용할 명령 정리

결국 평소에는 이것만 기억해도 된다.

### 검색

```powershell
winget search 프로그램명
```

### 설치

```powershell
winget install 패키지ID
```

### 설치된 프로그램 확인

```powershell
winget list
```

### 업데이트 가능한 프로그램 확인

```powershell
winget upgrade
```

### 특정 프로그램 업데이트

```powershell
winget upgrade 패키지ID
```

### 전체 업데이트

```powershell
winget upgrade --all
```

정말 전부 업데이트되므로 주의해야 한다.

### 프로그램 삭제

```powershell
winget uninstall 패키지ID
```

### winget 원본만 사용

```powershell
winget upgrade --source winget
```

---

## 마무리

winget을 알고 나니 Windows에서 프로그램을 관리하는 방식이 꽤 달라졌다.

예전에는 프로그램을 설치하거나 업데이트하려면 브라우저를 열고 공식 홈페이지를 찾아다녔다.

이제는:

```powershell
winget upgrade
```

한 번으로 업데이트 가능한 프로그램을 확인하고,

```powershell
winget upgrade 7zip.7zip
```

한 줄로 업데이트할 수 있다.

새 PC에서도:

```powershell
winget install Git.Git
winget install Microsoft.VisualStudioCode
winget install 7zip.7zip
```

처럼 바로 환경을 만들 수 있다.

특히 개발자라면 꽤 유용하다.

다만 `winget upgrade --all`은 정말로 전부 업데이트한다는 점과, 기존 설치 프로그램을 가끔 다른 패키지로 잘못 매칭할 수 있다는 점 정도는 기억해두는 것이 좋다.

개인적으로 앞으로 Windows에서 프로그램을 설치하거나 업데이트할 일이 생기면 **일단 `winget search`부터 해볼 것 같다.**
