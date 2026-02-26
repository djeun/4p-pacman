// client/js/GameClient.js
// Client game state and smooth per-player movement interpolation.

window.GameClient = class GameClient {
  constructor() {
    /** @type {object|null} Latest state from server */
    this.gameState    = null;
    this.lastTickTime = 0;
    this.myId         = null;

    // Per-player animation: playerId → { fromX, fromY, toX, toY, startTime, duration }
    this._anims = new Map();
  }

  setMyId(id) {
    this.myId = id;
  }

  /**
   * Called on every game_state event from the server.
   * Detects which players moved and starts a smooth animation for each one.
   */
  updateState(newState) {
    const now = performance.now();
    const { TICK_RATE, PLAYER_MOVE_INTERVAL, PLAYER_MOVE_INTERVAL_RED } = window.CONSTANTS;

    if (this.gameState) {
      newState.players.forEach((np) => {
        const op = this.gameState.players.find((p) => p.id === np.id);
        if (!op) return;

        const dx = np.x - op.x;
        const dy = np.y - op.y;
        if (dx === 0 && dy === 0) return; // no movement this tick

        // Large jump (e.g. round restart teleport) — skip animation
        if (Math.abs(dx) + Math.abs(dy) > 2) {
          this._anims.delete(np.id);
          return;
        }

        const interval = np.isRed ? PLAYER_MOVE_INTERVAL_RED : PLAYER_MOVE_INTERVAL;
        const duration = interval * TICK_RATE; // 170ms or 204ms

        this._anims.set(np.id, {
          fromX:     op.x,
          fromY:     op.y,
          toX:       np.x,
          toY:       np.y,
          startTime: now,
          duration,
        });
      });
    }

    this.gameState    = newState;
    this.lastTickTime = now;
  }

  /**
   * Returns the render-ready state with smoothly interpolated player positions.
   * @param {number} now - performance.now()
   */
  getInterpolatedState(now) {
    if (!this.gameState) return null;

    const interpolatedPlayers = this.gameState.players.map((player) => {
      const anim = this._anims.get(player.id);
      if (!anim) return player;

      const elapsed = now - anim.startTime;
      if (elapsed >= anim.duration) {
        this._anims.delete(player.id);
        return player;
      }

      const alpha = elapsed / anim.duration;
      return {
        ...player,
        x: anim.fromX + (anim.toX - anim.fromX) * alpha,
        y: anim.fromY + (anim.toY - anim.fromY) * alpha,
      };
    });

    return { ...this.gameState, players: interpolatedPlayers };
  }
};
