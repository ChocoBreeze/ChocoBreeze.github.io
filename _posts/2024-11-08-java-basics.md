---
layout: post
title: "Java Basics"
date: 2024-11-08
categories: [Java]
tags: [Introduction, Java, Basics]
---

# Java Basics

Java는 객체 지향 프로그래밍 언어로, 다양한 플랫폼에서 실행할 수 있는 응용 프로그램을 작성하는 데 널리 사용됩니다. 이 포스트에서는 Java의 기본 개념을 소개합니다.

## Java의 특징

- **플랫폼 독립성**: Java로 작성한 프로그램은 JVM(Java Virtual Machine) 위에서 실행되기 때문에, 다양한 운영 체제에서 호환됩니다.
- **객체 지향**: Java는 객체 지향 패러다임을 따르며, 코드 재사용과 유지 보수성을 높여줍니다.
- **메모리 관리**: Java는 가비지 컬렉터를 통해 자동으로 메모리를 관리해 줍니다.

## 기본 문법

### 1. Hello World 예제

아래는 Java의 "Hello, World!" 프로그램입니다:

```java
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
```

### 2. 변수 선언

Java에서 변수 선언은 자료형과 함께 이루어집니다. 예를 들어:

```java
int number = 5;
String name = "Alice";
```

## 결론

이 포스트에서는 Java의 기본 개념과 간단한 예제들을 소개했습니다. 앞으로 Java의 더 깊은 개념을 다루며 다양한 예제를 통해 학습을 이어나가겠습니다.

---
### 페이지 설명
1. **YAML Front Matter** (`---`로 구분된 부분):
   - `layout: post`: 이 포스트가 `post` 레이아웃을 사용하도록 지정합니다.
   - `title`: 블로그 포스트의 제목입니다.
   - `date`: 포스트의 날짜를 지정하여 Jekyll이 날짜별로 정렬할 수 있게 합니다.
   - `categories`: 포스트의 주제 범주를 나타냅니다. 여기서는 `Java`라는 카테고리를 사용했습니다.
   - `tags`: 포스트와 관련된 구체적인 키워드입니다. 여기서는 `Introduction`, `Java`, `Basics` 등의 태그를 사용했습니다.

2. **포스트 본문**:
   - 포스트 제목과 내용, 그리고 코드 예제를 포함하고 있습니다.
   - `##`와 `###`를 사용하여 섹션과 소제목을 구분하고, Markdown 문법을 사용하여 내용이 깔끔하게 구조화되도록 작성했습니다.

3. **코드 블록**:
   - ` ```java `와 ` ``` `을 사용하여 코드 블록을 추가하면 Java 코드가 시각적으로 깔끔하게 표시됩니다.

이렇게 작성한 포스트 파일을 `_posts` 폴더에 저장하면, GitHub Pages가 빌드할 때 자동으로 블로그에 해당 포스트가 추가됩니다. 이를 통해 카테고리와 태그가 적용된 Jekyll 블로그 포스트를 만들 수 있습니다.