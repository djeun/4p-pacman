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

- [ ] **`game_end` 미발송** — 서버에 총 라운드 수(예: 5라운드) 상수 추가, `ROUND_END` 후 라운드 카운트 확인해서 `GAME_END` emit (`GameLoop.js`, `constants.js`)
- [ ] **shrinkBorder 클라이언트 시각화 누락** — `Renderer.drawMap()`에서 `shrinkBorder` 영역을 어두운 색으로 덮어 표시 (`Renderer.js`)
- [ ] **`_killPlayer` rank 이중 계산** — 첫 번째 `player.rank` 할당 제거, 두 번째 계산만 남김 (`GameState.js:415`)
- [ ] **`ROUND_END` 이중 발송 race condition** — `gameLoop.stop()` 후 `_interval = null` 확인 또는 `roundEnded` 플래그로 중복 emit 방지 (`GameLoop.js`, `index.js`)
- [ ] **동일 틱 동전+충돌 순서 버그** — 동전 획득 루프에서 두 플레이어가 같은 셀에 있으면 동전 획득 처리 전에 충돌 여부를 먼저 체크하거나, 동전 획득과 충돌을 분리 처리 (`GameState.js:296`)

### 7-B. 중요 UX 수정 🟡

- [ ] **소켓 disconnect 클라이언트 처리** — `socket.on('disconnect')` 핸들러 추가, RAF 루프 중단 및 "연결이 끊어졌습니다" 메시지 표시 (`main.js`)
- [ ] **`player_died` 이벤트 처리** — 사망 알림 토스트 메시지 표시 (`main.js`)
- [ ] **팩맨 입 각도 수정** — `mouthAngle = 0.25` → `Math.PI / 4` (45°) (`Renderer.js`)
- [ ] **`round_end` 카운트다운** — 3초 카운트다운 텍스트 표시 (`main.js`)
- [ ] **게임 중 `ROOM_JOINED` 이벤트 오동작** — 게임 중 수신된 `ROOM_JOINED`는 로비 UI 갱신 건너뜀 (`main.js`)

### 7-C. 게임 디자인 개선 🟠

- [ ] **2인 플레이 스폰 위치** — 인원 수에 따라 대각선 배치: 2인이면 `(1,1)` + `(19,19)` (`constants.js` 또는 `GameState.initPlayers`)
- [ ] **초반 공백 해소** — 첫 동전 생성 시점 앞당기기: `COIN_SPAWN_INTERVAL_MIN` 50→10틱 (`constants.js`)
- [ ] **방 코드 클립보드 복사 버튼** — 룸 코드 옆에 복사 버튼 추가 (`index.html`, `main.js`)

### 7-D. 낮은 우선순위 (있으면 좋음) ⚪

- [ ] **Enter 키로 방 만들기/참가** (`main.js`)
- [ ] **닉네임 유효성 검사** — 빈 문자열 방지, 최대 12자 (`main.js`, `index.js`)
- [ ] **`getRoomBySocket()` 성능** — `socketId → roomCode` 역방향 Map 추가 (`index.js`)
- [ ] **브라우저 뒤로가기 경고** — `beforeunload` 이벤트로 게임 중 이탈 시 확인 (`main.js`)
- [ ] **Canvas 반응형** — 화면 크기에 따라 Canvas 스케일 조정 (`Renderer.js`, `style.css`)

---

## Phase 8. 추후 고려 사항

- [ ] 관전 모드 개선 (탈락자가 볼 수 있는 정보 추가)
- [ ] 재접속 허용 창 (5초 내 재접속 시 복귀)
- [ ] 모바일 터치 입력 지원
- [ ] 총 라운드 수 설정 UI (방장이 라운드 수 선택)
