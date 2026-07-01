---
title: '58. SerDes(Serializer / Deserializer)'
description: '많은 데이터를 한 줄로 빠르게 보내고 다시 여러 줄 데이터로 풀어주는 장치'
pubDate: '2026-02-28T00:00:00Z'
categories: "Semiconductor"
---

## 1) 한 문장 정의

> <strong>SerDes는 많은 데이터를 한 줄로 빠르게 보내고, 받은 쪽에서 다시 여러 줄 데이터로 풀어주는 장치야.</strong>

---

## 2) 비유

큰 상자 여러 개를 한 번에 옮기기 어렵다면, 그 안의 물건을 <strong>한 줄로 길게 정리해서</strong> 좁은 문으로 통과시키고, 반대편에서 다시 <strong>원래대로 펼치는 것</strong>을 떠올리면 돼.

즉,

* 보내기 전: 여러 줄 데이터를 <strong>한 줄로 압축해서 보냄</strong>
* 받은 후: 다시 <strong>여러 줄로 펼쳐서 사용</strong>

좁은 문(적은 배선)으로도 많은 데이터를 보낼 수 있게 해주는 기술이야.

---

## 3) 실제 예시

SerDes는 아주 많이 쓰여.

* <strong>PCIe</strong>
* <strong>이더넷</strong>
* <strong>고속 네트워크 칩</strong>
* <strong>CPU ↔ GPU</strong>
* <strong>데이터센터 스위치 칩</strong>
* <strong>칩렛 간 고속 연결</strong>

예를 들어:

* NVIDIA, AMD, 인텔의 고속 I/O
* Broadcom, Marvell 같은 네트워크 칩

이런 곳에서 SerDes는 거의 필수야.

---

## 4) 시각적 이미지 설명

머릿속에 이렇게 그리면 돼:

```text
[데이터 여러 줄]
||||||||||
   ↓
[SerDes]
   ↓
========   ← 한 줄로 빠르게 전송
   ↓
[SerDes]
   ↓
|||||||||| ← 다시 여러 줄로 복원
```

즉, <strong>많은 차선을 하나의 초고속 터널로 보내고, 반대편에서 다시 차선을 나누는 느낌</strong>이야.

---

## 5) 마켓 관점

SerDes가 중요한 이유:

✔ 데이터센터와 AI 서버는 칩끼리 데이터를 엄청 많이 주고받음  
✔ 그런데 배선을 무한정 늘릴 수는 없음  
✔ 그래서 <strong>적은 선으로 더 빠르게 보내는 기술</strong>이 중요함

즉,

* AI 서버
* 네트워크 장비
* 칩렛 시대

에서는 SerDes 성능이 경쟁력이야.

그래서 고속 SerDes IP를 잘 만드는 회사는 산업에서 매우 중요하게 평가돼.

---

## 6) 초보자 체크 질문

SerDes는 쉽게 말해 무엇을 할까?

1. 많은 데이터를 한 줄로 빠르게 보내고 다시 펼친다
2. 칩을 더 차갑게 만든다
3. 웨이퍼를 자른다

정답 번호만 말해줘!
