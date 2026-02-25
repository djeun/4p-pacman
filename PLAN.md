# PLAN.md — 전체 작업 계획

> 작업 완료 시 `[ ]` → `[x]` 로 변경. 새 작업 발견 시 적절한 단계에 추가.

---

## Phase 1. 프로젝트 초기 설정
- [x] `package.json` 생성 (의존성: express, socket.io / devDependencies: nodemon)
- [x] `.gitignore` 생성
- [x] `render.yaml` 생성
- [x] 폴더 구조 생성 (`server/`, `client/js/`)

## Phase 2. 서버 기초
- [x] `server/constants.js` — 그리드 크기, 속도, 타이머 등 상수 정의
- [x] `server/index.js` — Express + Socket.io 서버 진입점, 정적 파일 서빙
- [x] `server/GameRoom.js` — 룸 생성/참가/퇴장, 룸 코드 관리
- [x] `server/GameState.js` — 플레이어 상태, 공격 동전, 충돌 감지
- [x] `server/GameLoop.js` — 서버 틱 루프 (100ms), 상태 브로드캐스트

## Phase 3. 클라이언트 기초
- [x] `client/index.html` — 로비 UI (방 생성/참가), 게임 화면 레이아웃
- [x] `client/style.css` — 기본 스타일
- [x] `client/js/constants.js` — 서버와 동일한 상수
- [x] `client/js/main.js` — Socket.io 연결, 이벤트 핸들링
- [x] `client/js/InputHandler.js` — 키보드 입력 캡처 및 서버 전송
- [x] `client/js/GameClient.js` — 클라이언트 게임 상태 수신 및 관리
- [x] `client/js/Renderer.js` — Canvas 렌더링 (미로, 팩맨, 동전, UI)

## Phase 4. 핵심 게임 로직
- [x] 미로 맵 고정 레이아웃 정의 (GameState.initMap)
- [x] 그리드 기반 이동 구현 (GameState.movePlayer)
- [x] 공격 동전 생성 로직 (GameState.spawnCoin, 최대 2개, 최소 5셀 거리)
- [x] 빨간/흰색 상태 전환 및 10초 타이머 (GameState.checkCollisions + redTimer)
- [x] 충돌 감지 (GameState.checkCollisions — 사망 / 바운스 백)
- [x] 사망 처리 및 관전 모드 전환 (GameState.killPlayer + client Renderer)
- [x] 라운드 종료 조건 (1명 생존) 및 점수 계산 (GameLoop.tick + ROUND_SCORES)

## Phase 5. 추가 메카닉
- [x] Shrinking zone (맵 축소) 구현 (GameState.applyShrink, 300틱 후 시작)
- [x] 빨간 타이머 원형 게이지 렌더링 (Renderer.drawPlayers)
- [x] 점수 누적 및 다음 라운드 시작 흐름 (player.score 누적, round_end 후 로비 복귀)

## Phase 6. 마무리 및 배포
- [x] 로비 UI 다듬기 (룸 코드 표시, 플레이어 대기 목록)
- [x] 게임 종료 화면 (최종 점수판 + 로비 복귀 버튼)
- [x] 서버-클라이언트 이벤트 포맷 버그 수정 (ROOM_CREATED, ROOM_JOINED, ROUND_END)
- [x] README.md 작성 (플레이 방법, 배포 가이드)
- [ ] 로컬 멀티 테스트 (브라우저 탭 여러 개)
- [ ] Render.com 배포 및 동작 확인
