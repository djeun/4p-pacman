# Claude Code Skills — 포맷 레퍼런스

> 출처: Claude Code 공식 문서 (조사일: 2026-02-24)

---

## 파일 위치 (우선순위 순)

```
1. Enterprise  : 관리자 지정 위치 (조직 전체)
2. Personal    : ~/.claude/skills/<skill-name>/SKILL.md  (모든 프로젝트)
3. Project     : .claude/skills/<skill-name>/SKILL.md    (이 프로젝트만)
4. Plugin      : 플러그인 내 skills/ 디렉토리
```

---

## 디렉토리 구조

```
.claude/skills/
└── <skill-name>/
    ├── SKILL.md          # 필수: frontmatter + 지시사항
    ├── reference.md      # 선택: 상세 문서
    ├── examples.md       # 선택: 사용 예시
    ├── template.md       # 선택: Claude가 채울 템플릿
    └── scripts/
        └── helper.sh     # 선택: 실행 가능한 스크립트
```

---

## SKILL.md Frontmatter 필드

```yaml
---
name: skill-name                  # 소문자, 하이픈만, 최대 64자
description: 언제 사용하는지 설명  # Claude 자동 호출 결정에 사용 (권장)
argument-hint: [issue-number]     # 자동완성 중 표시될 힌트
disable-model-invocation: false   # true면 Claude 자동 호출 불가 (수동 전용)
user-invocable: true              # false면 /메뉴에서 숨김 (Claude 내부용)
allowed-tools: Read, Grep, Glob   # 권한 없이 사용 가능한 도구
model: sonnet                     # sonnet | opus | haiku | inherit
context: fork                     # fork면 격리된 서브에이전트 컨텍스트 실행
agent: Explore                    # context:fork 시 에이전트 타입 지정
---
```

### 주요 필드 설명

| 필드 | 기본값 | 설명 |
|------|--------|------|
| `name` | 파일명 | 슬래시 커맨드명 `/name` |
| `description` | - | 자동 호출 여부 결정. 명확하게 작성 권장 |
| `allowed-tools` | 상속 | 명시하면 해당 도구는 권한 확인 없이 실행 |
| `model` | inherit | 스킬 실행 모델. inherit = 부모 모델 사용 |
| `context: fork` | - | 격리된 컨텍스트에서 실행. `agent` 필드와 함께 사용 |
| `disable-model-invocation` | false | true면 `/` 메뉴에서만 수동 호출 가능 |

---

## 변수 치환

| 변수 | 설명 |
|------|------|
| `$ARGUMENTS` | 스킬 호출 시 전달된 모든 인자 |
| `$0`, `$1`, `$2` | N번째 인자 (0-based index) |
| `${CLAUDE_SESSION_ID}` | 현재 세션 ID |
| `` !`command` `` | 셸 명령 실행 결과를 프롬프트에 삽입 (전처리) |

### 인자 예시

```markdown
---
name: migrate-component
description: 컴포넌트를 다른 프레임워크로 마이그레이션
---

$0 컴포넌트를 $1 에서 $2 로 마이그레이션하라.
```

호출: `/migrate-component SearchBar React Vue`
결과: "SearchBar 컴포넌트를 React 에서 Vue 로 마이그레이션하라."

### 셸 명령 삽입 예시

```markdown
---
name: project-status
allowed-tools: Read
---

현재 git 상태:
!`git status`

PLAN.md 내용:
!`cat PLAN.md`
```

---

## 호출 방식

```bash
# 사용자 수동 호출
/skill-name

# 인자와 함께 호출
/skill-name arg1 arg2

# Claude 자동 호출 (description 기반)
# → "현재 상태 알려줘" 라고 하면 description 매칭으로 자동 호출
```

---

## 완전한 예시

```markdown
---
name: fix-issue
description: GitHub 이슈를 코딩 컨벤션에 맞게 수정
argument-hint: [issue-number]
allowed-tools: Read, Bash
model: sonnet
context: fork
agent: Explore
---

GitHub 이슈 $ARGUMENTS 를 수정하라.

1. 이슈 내용 파악
2. 관련 코드 탐색
3. 수정 구현
4. 테스트 확인
5. 커밋 생성
```
