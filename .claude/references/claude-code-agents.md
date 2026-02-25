# Claude Code Agents — 포맷 레퍼런스

> 출처: Claude Code 공식 문서 (조사일: 2026-02-24)

---

## 파일 위치 (우선순위 순)

```
1. CLI flag    : --agents 플래그 (현재 세션만)
2. Project     : .claude/agents/<agent-name>.md  (이 프로젝트)
3. Personal    : ~/.claude/agents/<agent-name>.md (모든 프로젝트)
4. Plugin      : 플러그인 내 agents/ 디렉토리
```

---

## agent.md Frontmatter 필드

```yaml
---
name: agent-name             # 필수. 소문자, 하이픈. 고유 식별자
description: 설명            # 필수. Claude가 위임 여부 결정에 사용
tools: Read, Write, Edit     # 허용 도구 목록 (생략 시 모든 도구 상속)
disallowedTools: Bash        # 거부할 도구
model: sonnet                # sonnet | opus | haiku | inherit
permissionMode: default      # default | acceptEdits | dontAsk | bypassPermissions | plan
maxTurns: 20                 # 최대 에이전트 턴 수
skills:                      # 에이전트 시작 시 preload할 스킬 목록
  - skill-name
memory: user                 # user | project | local — 영속적 메모리
background: false            # true면 백그라운드 태스크로 실행
isolation: worktree          # worktree면 임시 git worktree에서 격리 실행
---

에이전트 시스템 프롬프트를 여기에 작성.
```

### 주요 필드 설명

| 필드 | 기본값 | 설명 |
|------|--------|------|
| `name` | - | **필수**. Task tool에서 `subagent_type`으로 참조 |
| `description` | - | **필수**. Claude가 자동 위임 여부 결정에 사용. 명확하게 작성 |
| `tools` | 전체 상속 | 명시하면 해당 도구만 허용 |
| `disallowedTools` | 없음 | 명시한 도구 사용 차단 |
| `model` | inherit | inherit = 부모(호출자) 모델 사용 |
| `permissionMode` | default | `bypassPermissions`: 모든 권한 자동 승인 |
| `maxTurns` | 무제한 | 무한 루프 방지용 |
| `isolation: worktree` | 없음 | 격리된 git worktree에서 실행. 병렬 작업 시 충돌 방지 |

---

## 기본 제공 에이전트 (Built-in)

| 에이전트 | 모델 | 도구 | 주 용도 |
|---------|------|------|---------|
| `general-purpose` | inherit | 전체 | 복잡한 다단계 작업 |
| `Bash` | inherit | Bash | 터미널 명령 실행 |
| `Explore` | haiku | 읽기 전용 | 빠른 코드베이스 탐색 |
| `Plan` | inherit | 읽기 전용 | Plan mode 컨텍스트 수집 |

---

## 도구 제한 패턴

```yaml
# 읽기 전용 에이전트 (안전한 탐색용)
tools: Read, Grep, Glob
disallowedTools: Write, Edit, Bash

# 파일 작업만 허용 (서버 명령 차단)
tools: Read, Write, Edit, Grep, Glob
disallowedTools: Bash

# 전체 허용 (기본값)
# tools 필드 생략
```

---

## Task tool에서 커스텀 에이전트 호출

```javascript
// subagent_type에 에이전트 name 사용
Task({
  subagent_type: "server-dev",   // .claude/agents/server-dev.md
  description: "서버 게임 루프 구현",
  prompt: "GameLoop.js를 구현해줘"
})

// 병렬 실행 (담당 파일 겹치지 않는 경우)
Task({ subagent_type: "server-dev", ... })
Task({ subagent_type: "client-dev", ... })
```

---

## 격리 실행 (worktree)

```yaml
---
name: feature-dev
isolation: worktree   # 임시 git worktree 생성
---
```

- 변경사항 없으면 worktree 자동 삭제
- 변경사항 있으면 worktree 경로와 브랜치명 반환
- 병렬 에이전트가 같은 파일 수정 시 충돌 방지에 유용

---

## 완전한 예시

```markdown
---
name: code-reviewer
description: 코드 품질, 보안, 유지보수성을 검토하는 시니어 코드 리뷰어
tools: Read, Grep, Glob
disallowedTools: Write, Edit, Bash
model: sonnet
maxTurns: 15
---

당신은 시니어 코드 리뷰어다.

리뷰 시작 시:
1. git diff로 변경사항 파악
2. 수정된 파일 중심으로 검토
3. 즉시 리뷰 시작

리뷰 체크리스트:
- 코드 가독성
- 변수/함수명 명확성
- 보안 취약점
- 에러 처리
- 테스트 커버리지
```
