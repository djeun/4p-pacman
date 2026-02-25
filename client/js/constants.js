// client/js/constants.js
// 서버와 동일한 상수값. 브라우저 전역(window.CONSTANTS)으로 노출.

window.CONSTANTS = {
  // 그리드
  GRID_COLS: 21,
  GRID_ROWS: 21,
  CELL_SIZE: 32,

  // 플레이어
  MAX_PLAYERS: 4,
  ATTACK_DURATION: 100, // 틱 (10초 × 10틱/초)

  // 게임
  TICK_RATE: 100, // ms
  TOTAL_ROUNDS: 5,
  ROUND_SCORES: [300, 200, 100, 0],

  // 플레이어 시작 위치 (그리드 좌표, 각 코너)
  SPAWN_POSITIONS: [
    { x: 1,  y: 1  },
    { x: 19, y: 1  },
    { x: 1,  y: 19 },
    { x: 19, y: 19 },
  ],

  // 셀 타입
  CELL_WALL:  1,
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
