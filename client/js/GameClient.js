// client/js/GameClient.js
// 클라이언트 게임 상태 수신 및 보간 관리. window.GameClient 전역 노출.

window.GameClient = class GameClient {
  constructor() {
    /** @type {object|null} 서버에서 받은 최신 상태 */
    this.gameState = null;

    /** @type {object|null} 보간용 이전 상태 */
    this.prevState = null;

    /** @type {number} 마지막 game_state 수신 시간 (ms) */
    this.lastTickTime = 0;

    /** @type {string|null} 내 소켓 ID */
    this.myId = null;
  }

  /**
   * 내 플레이어 ID를 설정한다.
   * @param {string} id
   */
  setMyId(id) {
    this.myId = id;
  }

  /**
   * 서버로부터 game_state 이벤트를 수신할 때 호출한다.
   * @param {object} newState
   */
  updateState(newState) {
    this.prevState    = this.gameState;
    this.gameState    = newState;
    this.lastTickTime = performance.now();
  }

  /**
   * 현재 시간 기준으로 보간된 상태를 반환한다.
   * 플레이어 x, y 좌표를 prevState와 gameState 사이에서 선형 보간.
   *
   * @param {number} now - performance.now() 값
   * @returns {object|null} 보간된 상태 객체
   */
  getInterpolatedState(now) {
    if (!this.gameState) return null;

    // 이전 상태가 없으면 현재 상태를 그대로 반환
    if (!this.prevState) return this.gameState;

    const { TICK_RATE } = window.CONSTANTS;
    const elapsed = now - this.lastTickTime;
    // alpha: 0(이전 틱) ~ 1(현재 틱) 사이의 비율
    const alpha = Math.min(elapsed / TICK_RATE, 1);

    // 플레이어 좌표 보간
    const interpolatedPlayers = this.gameState.players.map((player) => {
      const prev = this.prevState.players
        ? this.prevState.players.find((p) => p.id === player.id)
        : null;

      if (!prev) return player; // 이전 상태에 없으면 그대로

      return {
        ...player,
        x: prev.x + (player.x - prev.x) * alpha,
        y: prev.y + (player.y - prev.y) * alpha,
      };
    });

    return {
      ...this.gameState,
      players: interpolatedPlayers,
    };
  }
};
