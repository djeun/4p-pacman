// client/js/GameClient.js
// Client game state with continuous sub-cell movement for smooth visuals.

window.GameClient = class GameClient {
  constructor() {
    /** @type {object|null} Latest state from server */
    this.gameState    = null;
    this.prevState    = null;
    this.lastTickTime = 0;
    this.myId         = null;
  }

  setMyId(id) {
    this.myId = id;
  }

  /**
   * Called on every game_state event from the server.
   */
  updateState(newState) {
    this.prevState    = this.gameState;
    this.gameState    = newState;
    this.lastTickTime = performance.now();
  }

  /**
   * Returns the render-ready state with sub-cell player positions.
   *
   * Strategy:
   *  - Server sends moveCooldown: counts down interval-1 → 0, then player moves.
   *  - subTick = (interval - 1) - moveCooldown  (0 = just moved, interval-1 = about to move)
   *  - fraction = (subTick + tickElapsed) / interval  — always 0..1, progresses each frame
   *  - rendered pos = server pos + direction * fraction
   *
   *  Wall guard: if previous and current server position are identical AND
   *  moveCooldown is NOT counting down from a fresh move, the player is blocked —
   *  clamp fraction to 0 so we don't draw them inside the wall.
   *
   * @param {number} now - performance.now()
   */
  getInterpolatedState(now) {
    if (!this.gameState) return null;

    const { TICK_RATE, PLAYER_MOVE_INTERVAL, PLAYER_MOVE_INTERVAL_RED } = window.CONSTANTS;

    // Fractional progress within the current 34ms server tick (0..1)
    const tickElapsed = Math.min(now - this.lastTickTime, TICK_RATE) / TICK_RATE;

    const interpolatedPlayers = this.gameState.players.map((player) => {
      if (!player.alive || !player.direction) return player;

      const interval  = player.isRed ? PLAYER_MOVE_INTERVAL_RED : PLAYER_MOVE_INTERVAL;
      const cooldown  = player.moveCooldown ?? 0;

      // subTick: ticks elapsed since last move (0 = just moved, interval-1 = about to move)
      const subTick = (interval - 1) - cooldown;

      // Did the player actually move this tick? Compare with prev state.
      const prev = this.prevState
        ? this.prevState.players.find(p => p.id === player.id)
        : null;
      const movedThisTick = prev && (prev.x !== player.x || prev.y !== player.y);

      // If cooldown == interval-1, player JUST moved this tick (subTick=0).
      // If position hasn't changed and cooldown is NOT at max (not a fresh move tick),
      // the player is blocked by a wall — freeze at current cell.
      const freshMove = (cooldown === interval - 1);
      const blockedByWall = prev && !movedThisTick && !freshMove;

      if (blockedByWall) {
        // Player tried to move but was blocked; don't offset into wall
        return player;
      }

      // Fraction into the current step: 0 (just moved) → approaching 1 (next move)
      const fraction = Math.min((subTick + tickElapsed) / interval, 0.99);

      // Direction vector for the NEXT step (where the player will move next)
      let dx = 0, dy = 0;
      switch (player.direction) {
        case 'up':    dy = -1; break;
        case 'down':  dy =  1; break;
        case 'left':  dx = -1; break;
        case 'right': dx =  1; break;
      }

      return {
        ...player,
        x: player.x + dx * fraction,
        y: player.y + dy * fraction,
      };
    });

    return { ...this.gameState, players: interpolatedPlayers };
  }
};
