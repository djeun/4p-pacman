# PLAN.md — 전체 작업 계획

> 작업 완료 시 `[ ]` → `[x]` 로 변경. 새 작업 발견 시 적절한 단계에 추가.

---

## Phase 1~6. 초기 구현 (완료)

<details>
<summary>완료된 항목 보기</summary>

**Phase 1. 프로젝트 초기 설정**
- [x] `package.json`, `.gitignore`, `render.yaml`, 폴더 구조

**Phase 2. 서버 기초**
- [x] `server/constants.js`, `index.js`, `GameRoom.js`, `GameState.js`, `GameLoop.js`

**Phase 3. 클라이언트 기초**
- [x] `client/index.html`, `style.css`, `js/constants.js`, `main.js`, `InputHandler.js`, `GameClient.js`, `Renderer.js`

**Phase 4. 핵심 게임 로직**
- [x] 미로 맵, 그리드 이동, 동전 생성, 빨간/흰색 전환, 충돌 감지, 사망 처리, 점수 계산

**Phase 5. 추가 메카닉**
- [x] Shrinking zone, 빨간 타이머 게이지, 점수 누적 및 라운드 흐름

**Phase 6. 마무리 및 배포**
- [x] 로비 UI, 게임 종료 화면, 이벤트 포맷 버그 수정, README, Fly.io 배포 (sea 리전)

</details>

---

## Phase 7. 버그 수정 — 우선순위 순

> 에이전트 4인 시뮬레이션 + 코드 리뷰(2026-02-25)로 발견된 문제들

### 7-A. 즉시 수정 (게임 깨짐 수준) 🔴

- [x] **`game_end` 미발송** — `TOTAL_ROUNDS:5` 상수 추가, `GameLoop.endRound()`에서 GAME_END emit
- [x] **shrinkBorder 클라이언트 시각화 누락** — `Renderer.drawMap()`에 dark-red 오버레이 추가
- [x] **`_killPlayer` rank 이중 계산** — `rankCounter++` 후 단일 계산으로 정리
- [x] **`ROUND_END` 이중 발송 race condition** — `_roundEnded` 플래그 + `GameLoop.endRound()` 통합
- [x] **동일 틱 동전+충돌 순서 버그** — 플레이어 충돌 먼저, 동전 획득 나중에 처리
- [x] **`attackCoins` 렌더링 버그 (보너스)** — `state.coins` → `state.attackCoins` 수정

### 7-B. 중요 UX 수정 🟡

- [x] **소켓 disconnect 클라이언트 처리** — `socket.on('disconnect')` 핸들러 추가, RAF 루프 중단
- [x] **`player_died` 이벤트 처리** — 토스트 알림 표시
- [x] **팩맨 입 각도 수정** — `mouthAngle = 0.25` → `Math.PI / 4` (45°)
- [x] **`round_end` 카운트다운** — 3초 카운트다운 텍스트 표시
- [x] **게임 중 `ROOM_JOINED` 이벤트 오동작** — `gameStarted` 조건으로 건너뜀

### 7-C. 게임 디자인 개선 🟠

- [ ] **2인 플레이 스폰 위치** — 인원 수에 따라 대각선 배치: 2인이면 `(1,1)` + `(19,19)` (`GameState.initPlayers`)
- [x] **초반 공백 해소** — `COIN_SPAWN_INTERVAL_MIN` 50→10틱
- [x] **방 코드 클립보드 복사 버튼** — 룸 코드 옆에 복사 버튼 추가

### 7-D. 낮은 우선순위 (있으면 좋음) ⚪

- [x] **Enter 키로 방 만들기/참가** — 닉네임/코드 입력창 Enter 키 지원
- [x] **닉네임 유효성 검사** — 빈 문자열 방지 (토스트), 12자 제한, 서버측 sanitize
- [x] **`getRoomBySocket()` 성능** — `socketRoomMap` 역방향 Map으로 O(1) 조회
- [x] **브라우저 뒤로가기 경고** — `beforeunload` 이벤트로 게임 중 이탈 확인
- [ ] **Canvas 반응형** — 화면 크기에 따라 Canvas 스케일 조정 (`Renderer.js`, `style.css`)

---

## Phase 8. 추후 고려 사항

- [ ] 관전 모드 개선 (탈락자가 볼 수 있는 정보 추가)
- [ ] 재접속 허용 창 (5초 내 재접속 시 복귀)
- [ ] 모바일 터치 입력 지원
- [ ] 총 라운드 수 설정 UI (방장이 라운드 수 선택)
