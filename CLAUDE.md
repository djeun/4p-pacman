# 4P Pacman Battle

4인용 온라인 경쟁 팩맨 게임. 브라우저에서 실행되며 Render.com에 배포된다.

---

## 에이전트 작업 규칙

### 세션 시작 시 필수 절차
새 세션을 시작하면 **반드시 아래 두 파일을 먼저 읽어라**:

1. **`PLAN.md`** — 전체 구현 계획 및 미완료 작업 목록
2. **`PROGRESS.md`** — 현재까지 완료된 작업 및 진행 상황

두 파일을 읽은 후, 사용자에게 현재 상태를 요약하고 다음에 할 작업을 제안한다.

### 작업 중 규칙
- 작업을 시작하기 전: `PROGRESS.md`에 "진행 중" 상태로 기록
- 작업을 완료하면: `PROGRESS.md`에 완료 표시, `PLAN.md`에서 해당 항목 체크
- 새로운 작업이 발견되면: `PLAN.md`에 추가

### 파일 역할
| 파일 | 역할 |
|------|------|
| `PLAN.md` | 전체 작업 계획, 할 일 목록, 우선순위 |
| `PROGRESS.md` | 완료된 작업, 현재 진행 중인 작업, 주요 결정 사항 |

---

## 게임 규칙

### 기본 구조
- 팩맨 스타일 미로 맵 (사각형)
- 플레이어 1~4명 (최대 4명)
- 각 플레이어는 **흰색 팩맨**으로 각 코너에서 시작
- 마지막 1명이 남을 때까지 진행 (한 라운드)

### 공격 동전 메카닉
- 맵 내 랜덤 위치에 랜덤 시점에 생성 (동시 최대 2개)
- 먹으면 **10초간 빨간색**으로 변환 → 공격 가능 상태
- 빨간 타이머는 플레이어 주위에 원형 게이지로 시각화

### 충돌 규칙
| 충돌 | 결과 |
|------|------|
| 빨간 팩맨 vs 흰색 팩맨 | 흰색 팩맨 사망 |
| 빨간 팩맨 vs 빨간 팩맨 | 두 플레이어 바운스 백 |
| 흰색 팩맨 vs 흰색 팩맨 | 두 플레이어 바운스 백 |

### 점수 시스템
- 1위 (최후 생존): 300점
- 2위: 200점
- 3위: 100점
- 4위 (첫 번째 사망): 0점
- 여러 라운드 점수 누적, 합산 순위로 최종 승자 결정

### 추가 메카닉
- 맵이 일정 시간 후 서서히 줄어들어 교착 상태 방지 (shrinking zone)
- 조기 탈락 플레이어는 관전 모드로 전환

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프론트엔드 | HTML5 Canvas + Vanilla JS (프레임워크 없음) |
| 백엔드 | Node.js + Socket.io |
| 배포 | Render.com (Static Site + Web Service) |
| 패키지 매니저 | npm |

**이동 방식**: 그리드 기반 (네트워크 레이턴시 보정 용이)

---

## 프로젝트 구조

```
4p-pacman/
├── CLAUDE.md
├── package.json
├── render.yaml              # Render.com 배포 설정
├── .gitignore
├── server/
│   ├── index.js             # 진입점, HTTP + Socket.io 서버
│   ├── GameRoom.js          # 방 관리 (생성/참가/퇴장)
│   ├── GameState.js         # 게임 상태 관리 (서버 권위형)
│   ├── GameLoop.js          # 서버사이드 게임 루프 (틱 기반)
│   └── constants.js         # 공유 상수 (그리드 크기, 속도 등)
└── client/
    ├── index.html           # 메인 페이지 (로비 + 게임 UI)
    ├── style.css
    └── js/
        ├── main.js          # 진입점, Socket.io 연결
        ├── Renderer.js      # Canvas 렌더링
        ├── InputHandler.js  # 키보드 입력 처리
        ├── GameClient.js    # 클라이언트 게임 상태
        └── constants.js     # 공유 상수 (서버와 동일)
```

---

## 개발 환경

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (nodemon 자동 재시작)
npm run dev

# 프로덕션 실행
npm start
```

### package.json 핵심 스크립트

```json
{
  "scripts": {
    "start": "node server/index.js",
    "dev": "nodemon server/index.js"
  }
}
```

### 주요 의존성

```json
{
  "dependencies": {
    "express": "^4.x",
    "socket.io": "^4.x"
  },
  "devDependencies": {
    "nodemon": "^3.x"
  }
}
```

---

## Render.com 배포

### render.yaml 구성

```yaml
services:
  - type: web
    name: 4p-pacman-server
    env: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        generateValue: false
        value: 10000
```

> 프론트엔드는 별도 Static Site 없이 Express가 `client/` 폴더를 정적 파일로 서빙한다.
> Socket.io와 정적 파일을 같은 서버에서 제공해 CORS 문제를 회피한다.

### 배포 절차

1. GitHub 레포지토리 생성 후 push
2. Render Dashboard → "New Web Service" → GitHub 레포 연결
3. `render.yaml` 자동 감지 또는 수동 설정
4. 배포 완료 후 제공되는 URL로 접속

### 무료 플랜 슬립 방지 (선택)

무료 플랜은 15분 비활성 시 슬립. 실서비스라면:
- Render Starter 플랜 ($7/월) 업그레이드, 또는
- UptimeRobot으로 14분 간격 핑(ping) 설정

---

## 아키텍처 결정 사항

### 서버 권위형 (Server-Authoritative)
- 모든 게임 상태는 서버가 관리
- 클라이언트는 입력만 전송, 렌더링만 담당
- 치팅 방지 및 동기화 일관성 보장

### Socket.io 이벤트 구조

```
클라이언트 → 서버:
  create_room       방 생성 요청
  join_room         방 참가 (룸 코드)
  player_input      이동 방향 입력 {direction: 'up'|'down'|'left'|'right'}
  ready             라운드 준비 완료

서버 → 클라이언트:
  room_created      방 코드 전달
  room_joined       참가 완료, 플레이어 목록
  game_state        매 틱 전체 게임 상태 브로드캐스트
  player_died       특정 플레이어 사망 이벤트
  round_end         라운드 종료 + 점수
  game_end          최종 결과
```

### 그리드 시스템
- 맵: 21x21 셀 (홀수 = 미로 생성 알고리즘 적합)
- 각 셀 크기: 32px
- 서버 틱: 100ms (10fps) — 입력 처리 및 상태 전송
- 클라이언트 렌더링: 60fps (보간으로 부드럽게 표시)

### 룸 시스템
- 4자리 영숫자 코드로 방 생성/참가
- 방장(호스트)이 라운드 시작 제어
- 플레이어 연결 끊김 시: 해당 플레이어 즉시 사망 처리

---

## 구현 시 주의사항

- 충돌 감지는 서버에서만 수행 (클라이언트 예측 없음)
- 공격 동전 생성: 벽이 아닌 빈 셀에만, 현재 플레이어 위치와 최소 5셀 이상 거리
- 빨간 상태 타이머는 서버 틱 기준으로 관리 (클라이언트 타이머 신뢰 X)
- 미로 맵은 고정 레이아웃 사용 (게임 초반에는 절차적 생성 불필요)
- 모바일 지원은 우선순위 낮음 — 키보드 우선 구현
