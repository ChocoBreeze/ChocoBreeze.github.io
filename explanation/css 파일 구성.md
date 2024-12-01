## _sass 폴더 구성

지금 구조는 [**ITCSS (Inverted Triangle CSS)**](https://itcss.io/)라는 CSS 구조화 방법론을 따르고 있는 것으로 보입니다. 이 구조는 CSS 코드를 모듈화하고 유지보수를 쉽게 하기 위한 접근 방식으로, 각각의 폴더는 역할과 우선순위를 가지고 있습니다. 난이도와 관련된 스타일을 어디에 넣을지 결정하려면 역할에 맞는 폴더를 선택하는 것이 중요합니다.

---

### ITCSS 폴더의 의미
1. **`0-settings`**
   - 전역 변수, 색상, 글꼴 크기 등 프로젝트 전반에 영향을 미치는 설정 파일.
   - 난이도와 직접 관련이 없으니 이 폴더는 적합하지 않습니다.

2. **`1-tools`**
   - 믹스인, 함수 등 재사용 가능한 도구.
   - 난이도 스타일은 도구라기보다는 특정 요소에 대한 스타일이므로 여기도 적합하지 않습니다.

3. **`2-generic`**
   - 리셋(Reset) 스타일, Normalize.css 같은 초기화 스타일.
   - 전역 리셋과 관련 있으므로 난이도 스타일과는 무관합니다.

4. **`3-elements`**
   - HTML 기본 요소(`h1`, `p`, `a` 등)에 대한 스타일 정의.
   - 난이도 태그는 HTML 기본 요소가 아니라 특정 **컴포넌트** 스타일에 가깝습니다.

5. **`4-objects`**
   - 재사용 가능한 레이아웃 스타일과 객체 스타일. 그리드 시스템이나 카드 레이아웃 등.
   - 난이도 스타일은 특정 포스트에만 적용되는 내용이라 여기에는 적합하지 않습니다.

6. **`5-components`**
   - 사이트의 개별 구성 요소(Button, Card, Navbar 등)에 대한 스타일.
   - **난이도 태그는 특정 UI 구성 요소(`post-meta`)에 속하므로 적합한 위치입니다.**

7. **`6-trumps`**
   - 유틸리티 클래스, 오버라이드 스타일, 특정 상황에서만 사용하는 예외적인 스타일.
   - 난이도 태그는 일반적인 UI의 일부이므로 여기보다는 `5-components`에 넣는 것이 적합합니다.

---
> 난이도 태그 스타일은 어디에 넣는 게 좋을까요?

### 적합한 폴더: **`5-components`**
- 난이도 태그는 특정 요소(포스트 메타정보)의 일부분으로, UI 구성 요소에 해당합니다. 따라서 **`5-components` 폴더**에 난이도 태그 관련 스타일을 추가하는 것이 가장 적합합니다.

---

### 적용 방법

#### 1. 새로운 파일 생성
`5-components` 폴더 안에 **`_post-meta.scss`**라는 파일을 생성하세요.

#### 2. 스타일 정의 추가
위에서 작성한 난이도 태그 관련 스타일을 해당 파일에 넣습니다.

**`_post-meta.scss` 내용:**
```scss
.post-meta strong {
  padding: 2px 5px;
  border-radius: 3px;
  font-weight: bold;

  &.easy {
    color: #4caf50;  // 초록색
  }

  &.medium {
    color: #ff9800;  // 주황색
  }

  &.hard {
    color: #f44336;  // 빨간색
  }
}
```

#### 3. `main.scss`에 파일 추가
메인 SCSS 파일(예: `assets/css/main.scss` 또는 `main.scss`)에 새로 만든 파일을 import합니다.

**`main.scss` 내용:**
```scss
@import "0-settings/settings";
@import "1-tools/tools";
@import "2-generic/generic";
@import "3-elements/elements";
@import "4-objects/objects";
@import "5-components/post-meta";
@import "6-trumps/trumps";
```

---

### 최종 결과
1. **난이도 태그 스타일**은 `5-components`의 일부로 관리됩니다.
2. **다른 구성 요소와 충돌 방지**: 난이도 태그 스타일이 독립적으로 관리됩니다.
3. **유지보수 용이성**: `post-meta`와 관련된 모든 스타일이 한 곳에 모입니다.

---

이 방법을 따르면 ITCSS 구조를 유지하면서 난이도 스타일을 깔끔하게 관리할 수 있습니다! 😊