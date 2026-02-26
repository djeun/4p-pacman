// server/constants.js
// 서버와 클라이언트가 공유하는 상수

module.exports = {
  // 그리드
  GRID_COLS: 13,
  GRID_ROWS: 13,
  CELL_SIZE: 32,

  // 플레이어
  PLAYER_SPEED:     1.0,    // 일반 속도 (틱당 누산)
  PLAYER_SPEED_RED: 1.2,    // 빨간 상태 속도 (+20%)
  MAX_PLAYERS: 4,
  ATTACK_DURATION: 49,      // 틱 (~10초 at 204ms tick)

  // 동전
  MAX_ATTACK_COINS: 2,
  COIN_MIN_DISTANCE: 2,         // 플레이어와 최소 거리(셀) — 작은 맵
  COIN_SPAWN_INTERVAL_MIN: 5,   // 최소 5틱 후
  COIN_SPAWN_INTERVAL_MAX: 30,  // 최대 30틱 후

  // 게임
  TICK_RATE: 204,               // ms (143ms / 0.7 ≈ 204ms, 70% 속도)
  SHRINK_START_TICK: 999999,    // 사실상 맵 축소 없음 (무제한)
  TOTAL_ROUNDS: 5,              // 총 라운드 수
  ROUND_SCORES: [300, 200, 100, 0],

  // 플레이어 시작 위치 (그리드 좌표, 각 코너) — 7×7 기준
  SPAWN_POSITIONS: [
    { x: 1,  y: 1  },
    { x: 11, y: 1  },
    { x: 1,  y: 11 },
    { x: 11, y: 11 },
  ],

  // 셀 타입
  CELL_WALL: 1,
  CELL_EMPTY: 0,

  // Socket 이벤트명 (오타 방지용 상수)
  EVENTS: {
    // 클라이언트 → 서버
    CREATE_ROOM:  'create_room',
    JOIN_ROOM:    'join_room',
    PLAYER_INPUT: 'player_input',
    READY:        'ready',

    // 서버 → 클라이언트
    ROOM_CREATED: 'room_created',
    ROOM_JOINED:  'room_joined',
    GAME_STATE:   'game_state',
    PLAYER_DIED:  'player_died',
    ROUND_END:    'round_end',
    GAME_END:     'game_end',
    ERROR:        'error',
  },
};
