// server/constants.js
// 서버와 클라이언트가 공유하는 상수

module.exports = {
  // 그리드
  GRID_COLS: 13,
  GRID_ROWS: 13,
  CELL_SIZE: 32,

  // 플레이어
  PLAYER_MOVE_INTERVAL:     6,  // normal: move every 6 ticks (6×34ms = 204ms/cell)
  PLAYER_MOVE_INTERVAL_RED: 5,  // red:    move every 5 ticks (5×34ms = 170ms/cell, +20%)
  MAX_PLAYERS: 4,
  ATTACK_DURATION: 294,         // ticks (~10s at 34ms/tick)

  // 동전
  MAX_ATTACK_COINS: 2,
  COIN_MIN_DISTANCE: 2,
  COIN_SPAWN_INTERVAL_MIN: 30,  // ~1s
  COIN_SPAWN_INTERVAL_MAX: 180, // ~6s

  // 게임
  TICK_RATE: 34,                // ms — small tick for constant per-player move intervals
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
