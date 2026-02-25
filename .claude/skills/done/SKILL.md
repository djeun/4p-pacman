---
name: done
description: 방금 완료한 작업을 PROGRESS.md에 기록하고 PLAN.md의 해당 항목을 체크 처리한다. 작업 완료 후 반드시 호출.
argument-hint: [완료한 작업 설명]
user-invocable: true
allowed-tools: Read, Edit
---

완료된 작업을 두 파일에 반영하라. 인자: $ARGUMENTS

1. **PLAN.md** 를 읽어 $ARGUMENTS 와 가장 일치하는 항목을 찾아 `[ ]` → `[x]` 로 변경한다.
2. **PROGRESS.md** 를 읽어 아래를 업데이트한다:
   - "진행 중인 작업" 항목이 있으면 제거한다.
   - "완료된 작업" 테이블에 오늘 날짜와 함께 $ARGUMENTS 를 추가한다.
   - 작업 중 발생한 주요 결정 사항이 있으면 "주요 결정 사항" 섹션에 추가한다.
3. 완료 처리 후 다음으로 해야 할 작업을 PLAN.md 기준으로 1~3개 제안한다.

인자가 없으면 사용자에게 어떤 작업을 완료했는지 물어본다.
