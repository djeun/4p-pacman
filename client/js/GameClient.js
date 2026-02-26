// client/js/GameClient.js
// Client game state with display-position smoothing.

window.GameClient = class GameClient {
  constructor() {
    this.gameState      = null;
    this.lastTickTime   = 0;
    this.myId           = null;
    // Float display positions per player, updated every frame
    this._displayPos    = new Map(); // id → {x, y}
    this._lastFrameTime = null;
  }

  setMyId(id) {
    this.myId = id;
  }

  updateState(newState) {
    this.gameState    = newState;
    this.lastTickTime = performance.now();
  }

  /**
   * Returns render-ready state with smoothly interpolated player positions.
   *
   * Each player has a "display position" (float x/y) that chases the server
   * position at exactly the player's movement speed.  This keeps motion
   * perfectly smooth regardless of server tick timing, and automatically
   * handles wall blocks (server pos stays the same → display pos stops).
   *
   * @param {number} now - performance.now()
   */
  getInterpolatedState(now) {
    if (!this.gameState) return null;

    const { TICK_RATE, PLAYER_MOVE_INTERVAL, PLAYER_MOVE_INTERVAL_RED } = window.CONSTANTS;

    // Time since last rendered frame (capped to avoid large jumps after tab switch)
    const dt = this._lastFrameTime !== null
      ? Math.min(now - this._lastFrameTime, 100)
      : 0;
    this._lastFrameTime = now;

    const players = this.gameState.players.map((player) => {
      if (!player.alive) {
        this._displayPos.delete(player.id);
        return player;
      }

      // Initialise display position from server on first sight
      let disp = this._displayPos.get(player.id);
      if (!disp) {
        disp = { x: player.x, y: player.y };
        this._displayPos.set(player.id, disp);
        return { ...player, x: disp.x, y: disp.y };
      }

      const tdx  = player.x - disp.x;
      const tdy  = player.y - disp.y;
      const dist = Math.abs(tdx) + Math.abs(tdy);

      if (dist > 1.5) {
        // Large jump (respawn / teleport) → snap immediately
        disp.x = player.x;
        disp.y = player.y;
      } else if (dist > 0.001) {
        // Move toward server position at natural movement speed
        const interval     = Math.max(PLAYER_MOVE_INTERVAL - (player.speedLevel || 0), 2);
        const cellDuration = interval * TICK_RATE; // ms to cross one cell
        const step         = dt / cellDuration;    // cells to advance this frame

        if (step >= dist) {
          disp.x = player.x;
          disp.y = player.y;
        } else {
          disp.x += (tdx / dist) * step;
          disp.y += (tdy / dist) * step;
        }
      }

      return { ...player, x: disp.x, y: disp.y };
    });

    return { ...this.gameState, players };
  }
};
