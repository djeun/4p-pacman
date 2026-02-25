# PROGRESS.md — 진행 상황

> 작업 시작 시 "진행 중" 기록, 완료 시 "완료"로 업데이트.

---

## 현재 상태

**Phase**: 6 (마무리) 진행 중 — 로컬 테스트 및 배포 남음

**진행 중인 작업**: 없음

---

## 완료된 작업

| 날짜 | 작업 | 비고 |
|------|------|------|
| 2026-02-24 | `CLAUDE.md` 작성 | 게임 규칙, 기술 스택, 아키텍처 결정 사항 포함 |
| 2026-02-24 | `PLAN.md` 생성 | Phase 1~6 전체 작업 계획 수립 |
| 2026-02-24 | `PROGRESS.md` 생성 | 진행 상황 추적 파일 초기화 |
| 2026-02-24 | `server/constants.js` 구현 | 그리드, 플레이어, 동전, 게임, 이벤트 상수 정의 |
| 2026-02-24 | `server/GameRoom.js` 구현 | 방 생성/참가/퇴장, 4자리 룸 코드 생성 |
| 2026-02-24 | `server/GameState.js` 구현 | 미로 맵(21×21), 플레이어 이동, 동전 생성, 충돌 처리, 맵 축소 |
| 2026-02-24 | `server/GameLoop.js` 구현 | 100ms 틱 루프, 상태 브로드캐스트, 라운드 종료 처리 |
| 2026-02-24 | `server/index.js` 구현 | Express + Socket.io 서버, 룸 관리, 이벤트 핸들링 |
| 2026-02-24 | `client/js/constants.js` 구현 | 서버와 동일한 상수, window.CONSTANTS 전역 노출 |
| 2026-02-24 | `client/js/InputHandler.js` 구현 | WASD/방향키 입력 처리, 중복 입력 무시 |
| 2026-02-24 | `client/js/GameClient.js` 구현 | 서버 상태 수신, 선형 보간(60fps) |
| 2026-02-24 | `client/js/Renderer.js` 구현 | Canvas 렌더링: 맵, 동전, 팩맨, UI 오버레이 |
| 2026-02-24 | `client/js/main.js` 구현 | Socket.io 연결, 로비↔게임 화면 전환, RAF 게임 루프 |
| 2026-02-24 | `client/index.html` 구현 | 로비 UI + 게임 Canvas + 오버레이 단일 HTML |
| 2026-02-24 | `client/style.css` 구현 | 팩맨 다크 테마, 노란 강조색, 반응형 로비 카드 |
| 2026-02-24 | 서버-클라이언트 이벤트 포맷 버그 수정 | ROOM_CREATED/JOINED 데이터 구조, 중복 emit, round 필드 누락 |
| 2026-02-24 | `README.md` 작성 | 플레이 방법, 배포 가이드 포함 |

---

## 주요 결정 사항

- **이동 방식**: 그리드 기반 (레이턴시 보정 용이)
- **아키텍처**: 서버 권위형 (Server-Authoritative)
- **서버 틱**: 100ms / 클라이언트 렌더링: 60fps (보간)
- **맵 크기**: 21x21 셀, 셀 크기 32px
- **배포**: Render.com — Express가 정적 파일도 함께 서빙 (CORS 회피)
- **룸 시스템**: 4자리 영숫자 코드

---

## 메모 / 이슈

- 없음
