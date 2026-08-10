---
title: "Git의 Blob Object는 무엇인가"
description: "Git의 blob 객체가 파일 내용을 어떻게 저장하는지, 이름·경로와 분리되는 이유, 재사용과 불변성 원리를 살펴봅니다."
pubDate: "2026-08-13T00:00:00+09:00"
categories: "Programming"
tags: ["Git", "Version Control", "Developer Tools"]
slug: "git-internals-blob-object"
---

앞의 글에서는 Git의 `commit`과 `tree` 객체를 살펴봤다.

Git 내부 구조를 다시 정리하면 다음과 같다.

```text
Commit
   │
   ▼
Root Tree
├── README.md ──→ Blob
├── LICENSE ────→ Blob
└── src ────────→ Tree
                    ├── main.cpp ──→ Blob
                    └── util.cpp ──→ Blob
```

Commit은 특정 시점의 프로젝트 상태를 나타내는 Root Tree를 가리키고, Tree는 파일 이름과 디렉터리 구조를 표현한다.

그렇다면 마지막으로 남는 질문은 이것이다.

> 실제 파일의 내용은 어디에 저장될까?

그 역할을 담당하는 Git 객체가 바로 **Blob Object**다.

Blob은 `Binary Large Object`의 약자다.

이름 때문에 이미지나 동영상처럼 큰 바이너리 파일만 저장하는 객체처럼 느껴질 수 있지만, Git에서는 그렇지 않다.

Git의 Blob은 한마디로:

> **파일의 내용을 저장하는 객체**

이다.

---

## Blob은 파일의 내용을 저장한다

다음 파일이 있다고 해보자.

```text
hello.txt
```

파일 내용은 다음과 같다.

```text
Hello Git
```

Git 내부에서는 이 내용이 Blob 객체로 저장될 수 있다.

```text
Blob A
└── "Hello Git"
```

그리고 Tree가 이 Blob에 파일 이름을 연결한다.

```text
Tree
└── hello.txt ──→ Blob A
```

여기서 중요한 점이 있다.

`hello.txt`라는 이름은 Blob에 들어 있지 않다.

Blob이 가지고 있는 것은:

```text
Hello Git
```

이라는 **파일 내용**뿐이다.

파일 이름은 Tree가 관리한다.

따라서 역할을 나누면 다음과 같다.

```text
Tree
→ 파일 이름과 디렉터리 구조

Blob
→ 파일 내용
```

---

## Blob에는 파일 이름이 없다

이 부분은 Git 내부 구조에서 상당히 중요하다.

다음 파일이 있다고 하자.

```text
hello.txt
```

내용:

```text
Hello Git
```

Git 내부에서는 다음과 같이 연결될 수 있다.

```text
Tree
└── hello.txt → Blob A

Blob A
└── "Hello Git"
```

이제 파일 이름만 바꿔보자.

```text
message.txt
```

내용은 그대로다.

```text
Hello Git
```

그러면 새로운 상태는 개념적으로 다음과 같을 수 있다.

```text
Tree
└── message.txt → Blob A
```

Blob은 그대로다.

왜냐하면 파일 내용:

```text
Hello Git
```

이 바뀌지 않았기 때문이다.

바뀐 것은 Tree에 저장된 이름뿐이다.

```text
Before

hello.txt → Blob A
```

```text
After

message.txt → Blob A
```

이 구조 때문에 Git에서는 파일의 이름과 파일의 내용이 분리되어 있다고 생각할 수 있다.

---

## Blob에는 파일 경로도 없다

Blob은 파일 이름뿐 아니라 파일 경로도 알지 못한다.

예를 들어:

```text
src/main.cpp
```

라는 파일이 있다고 해보자.

Git 내부에서는:

```text
Root Tree
└── src → Tree A
           └── main.cpp → Blob B
```

처럼 표현된다.

Blob B 입장에서는:

```text
int main() {
    return 0;
}
```

라는 내용만 알고 있다.

이 Blob이:

```text
src/main.cpp
```

인지,

```text
app/main.cpp
```

인지,

```text
test/example.cpp
```

인지는 알 수 없다.

경로는 여러 Tree 객체를 따라가면서 만들어진다.

```text
Root Tree
   │
   └── src
        │
        └── main.cpp
             │
             ▼
           Blob B
```

그래서 파일 경로는 Blob의 속성이 아니라 **Tree 구조를 따라가면서 결정되는 정보**다.

---

## 같은 내용을 가진 파일은 같은 Blob을 사용할 수 있다

이 특징은 Git의 저장 방식을 이해하는 데 매우 중요하다.

다음 두 파일이 있다고 해보자.

```text
a.txt
b.txt
```

두 파일의 내용이 모두:

```text
Hello Git
```

이라면 Git은 개념적으로 다음처럼 표현할 수 있다.

```text
Tree
├── a.txt ──┐
│           │
│           ▼
│         Blob X
│       "Hello Git"
│           ▲
│           │
└── b.txt ──┘
```

즉 서로 다른 파일 이름이 **동일한 Blob 객체를 가리킬 수 있다.**

Git은 파일 이름이 아니라 파일 내용을 기준으로 Blob 객체를 식별하기 때문이다.

---

## 파일을 수정하면 새로운 Blob이 만들어진다

다음 파일이 있다고 하자.

```cpp
int value = 10;
```

이 내용이 Blob A로 저장되어 있다고 가정해보자.

```text
main.cpp → Blob A

Blob A
└── int value = 10;
```

이제 파일을 수정한다.

```cpp
int value = 20;
```

내용이 달라졌기 때문에 기존 Blob A와는 다른 Blob이 필요하다.

```text
main.cpp → Blob B

Blob B
└── int value = 20;
```

즉:

```text
Before

main.cpp → Blob A
           "int value = 10;"
```

```text
After

main.cpp → Blob B
           "int value = 20;"
```

가 된다.

기존 Blob A가 수정되는 것이 아니라 **새로운 Blob B가 만들어진다.**

Git 객체는 기본적으로 한 번 만들어진 후 내용이 바뀌지 않는 불변 객체처럼 생각하면 이해하기 쉽다.

---

## Git은 파일의 변경 부분만 Blob에 저장할까?

GitHub에서 commit을 보면 다음처럼 변경된 줄만 보여주는 경우가 많다.

```diff
- int value = 10;
+ int value = 20;
```

그래서 Git 내부에서도:

```text
10을 20으로 변경
```

이라는 차이만 저장할 것 같지만, Git의 기본 객체 모델은 그렇지 않다.

Blob은 **파일의 전체 내용**을 나타낸다.

즉 이전 상태:

```cpp
int value = 10;
```

는 Blob A,

새로운 상태:

```cpp
int value = 20;
```

는 Blob B가 된다.

개념적으로는:

```text
Blob A
└── 전체 파일 내용 A

Blob B
└── 전체 파일 내용 B
```

이다.

Git이 `diff`를 보여줄 때는 두 Blob을 비교해서 차이를 계산한다.

```text
Blob A
   │
   │ compare
   ▼
Blob B
   │
   ▼
diff
```

따라서:

> Git의 기본 저장 모델은 diff가 아니라 snapshot이다.

라는 설명과 Blob 구조가 연결된다.

단, 실제 `.git/objects` 저장 공간에서는 Git이 나중에 `packfile`을 만들면서 delta compression 등의 최적화를 사용할 수 있다.

즉 **논리적인 객체 모델에서는 전체 Blob을 다루지만, 물리적인 저장 방식에서는 공간을 절약하기 위한 압축 최적화가 적용될 수 있다.**

둘은 구분해서 이해하는 것이 좋다.

---

## Blob Object ID는 어떻게 결정될까?

Git 객체는 Object ID를 가진다.

Blob 역시 Object ID를 가지고 있다.

파일의 Blob ID는 다음 명령으로 확인할 수 있다.

```bash
git hash-object README.md
```

예를 들어:

```text
557db03de997c86a4a028e1ebd3a1ceb225be238
```

와 같은 값이 출력될 수 있다.

이 값은 단순히 파일 이름에 부여한 일련번호가 아니다.

Git은 Blob 객체를 만들 때 개념적으로 다음 데이터를 사용한다.

```text
blob <파일 크기>\0<파일 내용>
```

예를 들어 파일 내용이:

```text
Hello
```

라면 개념적으로:

```text
blob 6\0Hello\n
```

와 같은 데이터를 기반으로 Object ID가 계산된다.

따라서 내용이 같으면 동일한 Object ID가 나올 수 있다.

---

## 직접 Blob Object를 만들어보기

Git에서는 commit을 만들지 않고도 Blob 객체만 직접 만들 수 있다.

예를 들어:

```bash
echo "Hello Git" > hello.txt
```

파일을 만든다.

그리고:

```bash
git hash-object hello.txt
```

를 실행하면 Blob이 저장될 경우 사용될 Object ID를 계산한다.

하지만 이 명령은 기본적으로 객체를 실제 Git object database에 저장하지 않는다.

저장까지 하고 싶다면:

```bash
git hash-object -w hello.txt
```

를 사용한다.

`-w`는 객체를 Git object database에 write하라는 의미다.

예를 들어:

```text
3b18e512dba79e4c8300dd08aeb37f8e728b8dad
```

가 출력되었다고 하자.

이제:

```bash
git cat-file -t 3b18e512
```

를 실행하면:

```text
blob
```

이라고 출력된다.

즉 해당 Object ID의 타입이 Blob이라는 뜻이다.

---

## Blob 내용을 직접 확인하기

Blob의 실제 내용도 확인할 수 있다.

```bash
git cat-file -p <blob-id>
```

예를 들어:

```bash
git cat-file -p 3b18e512
```

를 실행하면:

```text
Hello Git
```

가 출력될 수 있다.

여기서 재미있는 점은 출력 결과에:

```text
hello.txt
```

라는 파일 이름이 없다는 것이다.

Git은 Blob에서 **내용만 가져왔기 때문**이다.

이 실험만 해봐도:

> Blob에는 파일 이름이 없다.

는 개념을 직접 확인할 수 있다.

---

## 현재 Commit에 있는 Blob 찾아보기

이번에는 이미 commit된 파일의 Blob을 확인해보자.

먼저:

```bash
git ls-tree HEAD
```

를 실행한다.

예를 들어:

```text
100644 blob a934bc... README.md
040000 tree c120ab... src
```

가 나왔다고 하자.

여기에서:

```text
a934bc...
```

가 `README.md`의 Blob Object ID다.

따라서:

```bash
git cat-file -p a934bc
```

를 실행하면 해당 commit 시점의 `README.md` 내용을 볼 수 있다.

중요한 것은 **현재 디스크의 README.md가 아니라 해당 Blob에 저장되어 있는 내용**을 읽는다는 점이다.

현재 파일을 수정했더라도 아직 commit에 반영되지 않았다면:

```text
Working Tree의 README.md
```

와:

```text
HEAD가 가리키는 Blob
```

의 내용은 서로 다를 수 있다.

이 차이는 이후 `Working Tree`와 `Index`를 이해할 때 중요해진다.

---

## 파일을 수정해도 기존 Blob은 사라지지 않는다

예를 들어 Commit A의 상태가:

```text
Commit A
   ↓
Tree A
   ↓
main.cpp → Blob X
```

라고 해보자.

그리고 `main.cpp`를 수정해서 Commit B를 만든다.

```text
Commit B
   ↓
Tree B
   ↓
main.cpp → Blob Y
```

이때 기존 Blob X를 덮어쓰는 것이 아니다.

둘 다 존재할 수 있다.

```text
Blob X
→ 과거 main.cpp 내용

Blob Y
→ 새로운 main.cpp 내용
```

Commit A를 checkout하면 Git은 Blob X를 이용해 과거 파일을 복원할 수 있다.

Commit B를 checkout하면 Blob Y를 사용한다.

즉 Git의 과거 복원이 가능한 이유 중 하나는 **과거 객체를 수정하지 않고 계속 참조하기 때문**이다.

---

## Commit마다 모든 Blob이 새로 만들어지는 것은 아니다

다음 상태를 생각해보자.

Commit A:

```text
Commit A
   ↓
Tree A
├── README.md → Blob 1
├── main.cpp  → Blob 2
└── util.cpp  → Blob 3
```

여기서 `main.cpp`만 수정한 뒤 Commit B를 만든다.

```text
Commit B
   ↓
Tree B
├── README.md → Blob 1
├── main.cpp  → Blob 4
└── util.cpp  → Blob 3
```

새로 필요한 것은:

```text
Blob 4
```

뿐이다.

변경되지 않은:

```text
Blob 1
Blob 3
```

은 그대로 재사용할 수 있다.

따라서 Git이 snapshot 방식이라고 해서 매 commit마다 모든 파일을 복사하는 것은 아니다.

```text
변경 없음
→ 기존 Blob 재사용

내용 변경
→ 새로운 Blob 생성
```

이라고 생각하면 된다.

---

## 파일 이름 변경은 어떻게 처리될까?

Git에서 파일 이름을:

```text
old.txt
```

에서:

```text
new.txt
```

로 변경했다고 해보자.

파일 내용은 그대로라면 Blob Object ID는 동일할 수 있다.

Before:

```text
Tree A
└── old.txt → Blob X
```

After:

```text
Tree B
└── new.txt → Blob X
```

Git 객체 모델만 보면:

```text
old.txt 삭제
new.txt 추가
```

와 같은 snapshot 변화다.

Git은 별도의:

```text
Rename Object
```

를 저장하지 않는다.

대신 `git diff` 같은 명령이 이전과 이후의 파일 내용을 비교해서:

> 이 파일들은 내용이 매우 비슷하니 rename으로 보인다.

라고 판단한다.

그래서 Git의 rename detection은 저장된 rename 기록이라기보다는 **비교 시점의 추론**에 가깝다.

---

## Blob은 텍스트 파일만 저장할까?

아니다.

Blob은 파일 내용을 저장하기 때문에 다양한 파일을 저장할 수 있다.

```text
.cpp
.java
.py
.md
.png
.jpg
.pdf
.exe
```

등도 Git 관점에서는 모두 Blob이 될 수 있다.

Git의 Blob은 기본적으로:

> 이 데이터가 C++ 소스인지 PNG 이미지인지

를 해석하는 객체가 아니다.

단순히 파일의 바이트 내용을 저장한다.

따라서 Git에게는:

```text
README.md
```

도 Blob이고,

```text
image.png
```

도 Blob이다.

다만 대용량 바이너리 파일을 일반 Git 저장소에 계속 commit하면 저장소 크기가 크게 증가할 수 있기 때문에, 그런 경우 Git LFS 같은 별도의 방식을 사용하기도 한다.

---

## Blob과 파일은 완전히 같은 개념일까?

거의 비슷해 보이지만 정확히는 다르다.

파일은 파일 시스템에 존재한다.

```text
Working Directory
└── main.cpp
```

Blob은 Git object database에 존재하는 Git 객체다.

```text
.git/
└── objects/
      └── ...
          └── Blob
```

따라서:

```text
현재 파일
≠
Git Blob 자체
```

이다.

현재 파일의 내용이 Git에 저장되면서 Blob이 만들어질 수 있다.

그리고 Git은 Blob을 이용해 다시 실제 파일을 만들어낼 수도 있다.

```text
Working Tree File
      ↓
     Git
      ↓
Blob Object
```

반대로 checkout할 때는:

```text
Blob Object
      ↓
     Git
      ↓
Working Tree File
```

처럼 생각할 수 있다.

---

## Commit → Tree → Blob 전체 연결

이제 Git의 세 가지 핵심 객체를 모두 살펴봤다.

프로젝트가:

```text
project/
├── README.md
└── src/
    └── main.cpp
```

라고 하면 Git 내부에서는 대략 다음과 같이 표현된다.

```text
Commit C
│
│ tree
▼
Root Tree
├── README.md
│      │
│      ▼
│    Blob A
│    "# My Project..."
│
└── src
       │
       ▼
     Tree B
       │
       └── main.cpp
                │
                ▼
              Blob C
              "int main()..."
```

각 객체의 역할을 한 문장씩 정리하면 다음과 같다.

```text
Commit
→ 어떤 프로젝트 상태인지 가리키고,
  이전 Commit과 메타데이터를 저장한다.

Tree
→ 파일 이름과 디렉터리 구조를 저장한다.

Blob
→ 파일의 실제 내용을 저장한다.
```

그래서 Git의 기본 객체 구조는:

```text
Commit
   ↓
Tree
   ↓
Blob
```

이라고 표현할 수 있다.

실제로는 Tree가 다른 Tree를 가리킬 수 있기 때문에:

```text
Commit
   ↓
Root Tree
├── Blob
├── Blob
└── Tree
     ├── Blob
     └── Tree
          └── Blob
```

와 같은 재귀적인 구조가 된다.

---

## 직접 해볼 작은 실험

간단한 Git 저장소에서 다음 실험을 해보자.

파일 생성:

```bash
echo "Hello Git" > hello.txt
```

Blob Object ID 계산:

```bash
git hash-object hello.txt
```

객체를 실제로 저장:

```bash
git hash-object -w hello.txt
```

객체 타입 확인:

```bash
git cat-file -t <object-id>
```

결과:

```text
blob
```

내용 확인:

```bash
git cat-file -p <object-id>
```

결과:

```text
Hello Git
```

그리고 파일 이름을 바꾼다.

```bash
mv hello.txt message.txt
```

Windows PowerShell이라면:

```powershell
Rename-Item hello.txt message.txt
```

다시:

```bash
git hash-object message.txt
```

를 실행한다.

내용을 수정하지 않았다면 이전과 **같은 Object ID**가 나오는 것을 확인할 수 있다.

이 실험을 통해:

```text
파일 이름
≠
Blob 내용
```

이라는 것을 직접 확인할 수 있다.

---

## 정리

Git의 Blob Object는 **파일 내용을 저장하는 객체**다.

Blob은 다음 정보를 알지 못한다.

* 파일 이름
* 파일 경로
* 어느 디렉터리에 존재하는지

이런 정보는 Tree가 담당한다.

```text
Tree
└── main.cpp → Blob

Blob
└── "int main() { ... }"
```

파일 내용이 동일하면 여러 Tree 항목이 동일한 Blob을 가리킬 수도 있다.

```text
a.txt ──┐
        ├──→ Blob X
b.txt ──┘
```

파일 내용이 변경되면 기존 Blob을 수정하는 것이 아니라 새로운 Blob 객체가 만들어진다.

```text
Before
main.cpp → Blob A

After
main.cpp → Blob B
```

그리고 변경되지 않은 Blob은 새로운 Commit에서도 그대로 재사용할 수 있다.

이제 Git의 핵심 객체 구조:

```text
Commit → Tree → Blob
```

을 모두 살펴봤다.

하지만 아직 중요한 질문이 하나 남는다.

우리가 실제로 작업할 때는:

```bash
파일 수정
git add
git commit
```

이라는 과정을 거친다.

그렇다면 **현재 수정 중인 파일과 Commit 사이에는 무엇이 존재할까?**

바로 Git의 **Working Tree와 Index(Staging Area)**다.

다음 글에서는 Git이 현재 작업 상태를 관리하는:

```text
HEAD
Index
Working Tree
```

세 영역의 관계를 살펴본다.
