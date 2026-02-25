# 4P Pacman Battle

4인용 온라인 경쟁 팩맨 게임. 브라우저만 있으면 플레이 가능.

## 플레이 방법

1. 접속 후 닉네임 입력
2. **방 만들기** 또는 **룸 코드로 참가**
3. 방장이 **게임 시작** 버튼 클릭 (최소 2명)
4. 마지막까지 살아남아라!

### 조작 방법
- 이동: `W A S D` 또는 방향키 `↑ ↓ ← →`

### 게임 규칙

| 상황 | 결과 |
|------|------|
| 공격 동전 먹기 | 10초간 빨간색 → 공격 가능 |
| 빨간 팩맨 + 흰색 팩맨 접촉 | 흰색 팩맨 사망 |
| 빨간 + 빨간 / 흰색 + 흰색 접촉 | 바운스 백 (튕겨남) |

### 점수
- 1위 (최후 생존): **300점**
- 2위: **200점**
- 3위: **100점**
- 4위 (첫 번째 사망): **0점**

라운드마다 점수가 누적되며, 여러 라운드를 거쳐 최종 승자를 가린다.

---

## 로컬 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행 (nodemon 자동 재시작)
npm run dev

# 프로덕션 실행
npm start
```

브라우저에서 `http://localhost:3000` 접속.

멀티 테스트는 브라우저 탭 여러 개로 가능.

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프론트엔드 | HTML5 Canvas + Vanilla JS |
| 백엔드 | Node.js + Socket.io |
| 배포 | Render.com |

---

## Render.com 배포

1. GitHub 레포지토리 생성 후 push
2. [Render Dashboard](https://dashboard.render.com) → **New Web Service**
3. GitHub 레포 연결 → `render.yaml` 자동 감지
4. 배포 완료 후 제공 URL로 접속

> **무료 플랜 주의**: 15분 비활성 시 서버가 슬립 상태로 전환됩니다.
> 첫 접속 시 30~60초 대기가 발생할 수 있습니다.

---

## 프로젝트 구조

```
4p-pacman/
├── server/
│   ├── index.js        # Express + Socket.io 서버
│   ├── GameRoom.js     # 룸 관리
│   ├── GameState.js    # 게임 상태 (미로, 이동, 충돌)
│   ├── GameLoop.js     # 서버 틱 루프 (100ms)
│   └── constants.js    # 공유 상수
└── client/
    ├── index.html
    ├── style.css
    └── js/
        ├── constants.js
        ├── GameClient.js   # 상태 수신 + 보간
        ├── InputHandler.js # 키보드 입력
        ├── Renderer.js     # Canvas 렌더링
        └── main.js         # 진입점
```
