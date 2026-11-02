---
title: "Oracle Extent는 무엇인가"
description: "Oracle이 공간을 할당하는 단위인 extent를 블록·세그먼트·테이블스페이스와의 관계, AUTOALLOCATE 크기 규칙, DELETE·SHRINK·TRUNCATE 동작과 함께 정리합니다."
pubDate: "2026-10-24T00:00:00+09:00"
categories: "Programming"
tags: ["TIL", "Oracle", "Database"]
slug: "programming/oracle-extent"
draft: true
---

<!--
TIL 글감 메모 (2026-10-24)
글로 다듬을 때 할 일:
- user_extents 조회 결과를 INSERT 후 / TRUNCATE 후로 캡처해서 넣기
- AUTOALLOCATE 크기 단계, INITIAL 동작을 공식 문서(SQL Language Reference의 storage_clause, Administrator's Guide)로 다시 확인하고 참고 링크 채우기
- 들어가는 글(어떤 상황에서 extent를 알게 됐는지) 쓰기. 회사 고유 정보는 빼고 일반화
-->

## 핵심 요약

- Extent는 **Oracle이 공간을 할당하는 단위**다. 테이블이 공간이 필요할 때 블록을 한 개씩 받는 게 아니라, **연속된 블록 묶음(extent)** 단위로 받는다.
- `DELETE`는 행만 지우고 extent는 그대로 들고 있다. 그래서 `dba_free_space`의 여유 공간은 extent가 반환될 때(대표적으로 `SHRINK`, `TRUNCATE`)에 늘어난다.

## 저장 구조 전체 그림

```text
[논리 구조]                         [물리 구조]
테이블스페이스  ──────────────────  데이터파일 (1개 이상)
  └─ 세그먼트 (테이블/인덱스 1개)
       └─ extent (연속된 블록 묶음) ─ 한 데이터파일 안에 연속으로 존재
            └─ 블록 (보통 8KB) ────── 디스크 I/O 최소 단위
                 └─ 행
```

- **블록**: 가장 작은 단위. 행이 실제로 저장되는 곳 (기본 8KB)
- **Extent**: 블록 여러 개를 **연속으로** 묶은 것. 할당·반환의 단위
- **세그먼트**: 테이블 하나(또는 인덱스, LOB 하나)가 가진 extent들의 모음. 파티션 테이블은 파티션마다 세그먼트가 따로 있다

비유하면 블록이 **책장 한 칸**, extent가 **책장 한 개**, 세그먼트가 **그 사람에게 배정된 책장 전부**다. 책이 늘어나면 칸 단위가 아니라 **책장을 통째로 하나 더** 받는다.

## Extent 크기는 어떻게 정해지나

요즘 기본인 **AUTOALLOCATE** 테이블스페이스에서는 Oracle이 세그먼트 크기에 맞춰 점점 큰 extent를 준다(블록 8KB 기준).

| 테이블이 커지면서 | extent 크기 |
|---|---|
| 처음 16개 | 64KB |
| 그 다음 | 1MB |
| 더 커지면 | 8MB |
| 아주 크면 | 64MB |

단계가 바뀌는 정확한 기준은 버전과 세그먼트 종류(예: 파티션 테이블)에 따라 다를 수 있으니 대략적인 흐름으로 보면 된다.

작은 테이블은 공간 낭비 없이, 큰 테이블은 할당 횟수를 줄이는 방식이다.

그래서 이런 테이블스페이스에서는 테이블에 준 `STORAGE (NEXT ..., PCTINCREASE ...)`가 무시된다. 다음 extent 크기는 Oracle이 정한다. `INITIAL`은 완전히 무시되지는 않고, **처음에 확보할 전체 공간의 양**으로만 쓰인다. 예를 들어 `INITIAL 10M`이면 처음부터 10MB 분량의 extent를 받는데, 그 extent 하나하나의 크기는 여전히 Oracle이 정한다.

테이블스페이스를 `UNIFORM SIZE 1M`처럼 만들면 모든 extent가 같은 크기가 된다.

## 명령별로 extent에 일어나는 일

| 명령 | extent 관점에서 일어나는 일 |
|---|---|
| `INSERT` | 공간이 모자라면 새 extent 할당 → USED 증가 |
| `DELETE` | 블록 안의 행만 비움, **extent는 그대로 소유** → FREE 변화 없음 |
| `ALTER TABLE ... SHRINK SPACE` | 행을 앞쪽 extent로 모으고, **비게 된 뒤쪽 extent 반환** → FREE 증가 (`ENABLE ROW MOVEMENT` 필요, ASSM 테이블스페이스에서만 가능) |
| `TRUNCATE` | **첫 extent만 남기고**(정확히는 `MINEXTENTS`만큼) 전부 반환 |
| `TRUNCATE ... DROP ALL STORAGE` | 첫 extent까지 전부 반환 (세그먼트 자체가 사라짐) |
| 데이터파일 `RESIZE` | 파일 끝쪽에 extent가 걸려 있으면 그 아래로는 못 줄임 (ORA-03297) |

`dba_free_space`가 세는 것도 결국 "**어떤 세그먼트에도 속하지 않은 extent 공간**"이라, extent 단위로 반환돼야 FREE가 늘어난다.

## 직접 확인해 보기

내 스키마의 테이블이면 `user_extents`로 본다. 테이블 이름은 대문자로 쓴다.

```sql
SELECT segment_name, extent_id, blocks,
       ROUND(bytes/1024, 0) AS kb
FROM   user_extents
WHERE  segment_name = 'MY_TABLE'
ORDER BY extent_id;
```

extent가 어느 데이터파일의 어느 위치에 있는지(`file_id`, `block_id`)까지 보려면 `dba_extents`를 써야 한다. `user_extents`에는 이 두 컬럼이 없다.

```sql
SELECT segment_name, extent_id, file_id, block_id, blocks,
       ROUND(bytes/1024, 0) AS kb
FROM   dba_extents
WHERE  owner = 'MY_SCHEMA'
AND    segment_name = 'MY_TABLE'
ORDER BY extent_id;
```

INSERT를 많이 한 테이블이면 64KB짜리 16개 뒤로 1MB짜리가 이어지는 게 보이고, TRUNCATE 후 다시 보면 기본 설정에서는 **extent_id 0 하나만** 남아 있다. `INITIAL`이나 `MINEXTENTS`를 크게 줬다면 그만큼의 extent가 남는다.

참고로 11g R2부터는 deferred segment creation이 기본이라, 막 만든 빈 테이블은 첫 INSERT 전까지 세그먼트가 없어서 조회 결과가 비어 있을 수 있다.

## 참고

- Oracle Database SQL Language Reference — storage_clause
- Oracle Database Administrator's Guide — Managing Tablespaces
