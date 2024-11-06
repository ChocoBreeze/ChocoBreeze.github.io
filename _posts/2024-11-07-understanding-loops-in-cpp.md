---
layout: post
title: "Understanding Loops in C++"
date: 2024-11-07
categories: [C++]
tags: [Loops, Beginner, Tutorial]
---

# Understanding Loops in C++

C++에서 __반복문(loops)__ 은 코드의 특정 블록을 여러 번 실행할 수 있도록 해 주는 중요한 제어 구조입니다. 이 포스트에서는 C++의 주요 반복문을 소개하고 사용 예제를 제공합니다.

## 1. For Loop

`for` 반복문은 일정한 횟수만큼 반복 실행할 때 사용됩니다. 예를 들어, 1부터 10까지 숫자를 출력하려면 다음과 같이 작성할 수 있습니다:

```cpp
#include <iostream>
using namespace std;

int main() {
    for (int i = 1; i <= 10; i++) {
        cout << i << " ";
    }
    return 0;
}
```

위 코드에서는 `i`의 초기값을 1로 설정하고, 10 이하일 때까지 반복하며 `i`를 1씩 증가시킵니다.

## 2. While Loop

`while` 반복문은 조건이 참인 동안 반복됩니다. 반복 횟수가 미리 정해지지 않았을 때 유용하게 사용됩니다.

```cpp
#include <iostream>
using namespace std;

int main() {
    int count = 1;
    while (count <= 5) {
        cout << "Count is: " << count << endl;
        count++;
    }
    return 0;
}
```

위 코드에서는 `count`가 5 이하일 동안 "Count is: "와 `count` 값을 출력하고, `count`를 1씩 증가시킵니다.

## 3. Do-While Loop

`do-while` 반복문은 조건을 나중에 검사하므로, 코드 블록이 최소한 한 번은 실행됩니다.

```cpp
#include <iostream>
using namespace std;

int main() {
    int num = 1;
    do {
        cout << "Number is: " << num << endl;
        num++;
    } while (num <= 3);
    return 0;
}
```

이 예제에서는 `num`이 3 이하일 동안 "Number is: "와 `num` 값을 출력합니다. `do-while`은 적어도 한 번은 실행된다는 점에서 `while` 반복문과 차이가 있습니다.

## 결론

C++에서는 `for`, `while`, `do-while` 등 다양한 반복문을 통해 반복 작업을 효율적으로 수행할 수 있습니다. 각 반복문은 상황에 따라 유용하게 사용할 수 있으니, 각각의 사용 방법과 차이를 잘 이해해 두세요.

---
### 설명
1. **YAML Front Matter**:
   - `layout: post`: 이 포스트는 `post` 레이아웃을 사용하도록 설정합니다.
   - `title`: 포스트 제목으로 "Understanding Loops in C++"을 설정합니다.
   - `date`: 포스트 날짜를 지정합니다.
   - `categories`: 이 포스트는 `C++` 카테고리에 포함됩니다.
   - `tags`: `Loops`, `Beginner`, `Tutorial` 등의 태그를 사용하여 검색 및 분류에 도움이 되도록 합니다.

2. **포스트 본문**:
   - C++에서 사용되는 각 반복문(For, While, Do-While)을 설명하고, 코드 예제를 포함하여 쉽게 이해할 수 있도록 구성했습니다.
   - 제목과 소제목을 사용하여 섹션을 나누고, 코드 블록을 통해 가독성을 높였습니다.

3. **코드 블록**:
   - ` ```cpp `와 ` ``` `를 사용해 C++ 코드 블록을 추가하여, 예제 코드가 시각적으로 명확하게 표시되도록 작성했습니다.

이렇게 작성한 파일을 `_posts` 폴더에 저장하면, Jekyll이 자동으로 블로그에 추가하여 카테고리와 태그가 적용된 C++ 관련 포스트로 보여줄 것입니다.