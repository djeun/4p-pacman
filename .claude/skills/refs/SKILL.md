---
name: refs
description: .claude/references/ 디렉토리의 레퍼런스 문서를 읽어 표시한다. 에이전트나 스킬 포맷이 궁금할 때, 또는 새 에이전트/스킬을 작성할 때 사용.
argument-hint: [skills|agents|all]
user-invocable: true
allowed-tools: Read, Glob
---

.claude/references/ 의 레퍼런스 문서를 읽어 표시하라. 인자: $ARGUMENTS

## 인자별 동작

- `skills` 또는 인자 없음 → `.claude/references/claude-code-skills.md` 읽기
- `agents` → `.claude/references/claude-code-agents.md` 읽기
- `all` → 두 파일 모두 읽기

## 파일 목록 확인

인자가 없거나 무엇이 있는지 모를 때는 먼저 `.claude/references/` 의 파일 목록을 출력한 뒤 내용을 표시한다.

## 표시 방법

읽은 내용을 그대로 출력한다. 요약하거나 생략하지 않는다.
새로운 에이전트나 스킬을 만들 때는 해당 레퍼런스의 frontmatter 필드 표를 반드시 참고하라.
