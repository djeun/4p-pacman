// server/GameLoop.js
// 서버사이드 게임 루프 (100ms 틱 기반)

const { TICK_RATE, EVENTS } = require('./constants');

class GameLoop {
  /**
   * @param {import('./GameRoom').GameRoom} room
   * @param {import('./GameState').GameState} gameState
   * @param {import('socket.io').Server} io
   */
  constructor(room, gameState, io) {
    this.room      = room;
    this.gameState = gameState;
    this.io        = io;
    this._interval = null;
  }

  /**
   * 게임 루프를 시작한다. setInterval(100ms)로 tick()을 반복 호출.
   */
  start() {
    if (this._interval) return;
    this._interval = setInterval(() => this.tick(), TICK_RATE);
  }

  /**
   * 게임 루프를 중지한다.
   */
  stop() {
    if (this._interval) {
      clearInterval(this._interval);
      this._interval = null;
    }
  }

  /**
   * 매 100ms 실행되는 틱 처리:
   * 1. gameState.update()
   * 2. 전체 상태 브로드캐스트
   * 3. 라운드 종료 조건 확인
   */
  tick() {
    this.gameState.update();

    // 현재 상태 브로드캐스트
    this.io.to(this.room.code).emit(
      EVENTS.GAME_STATE,
      this.gameState.toJSON()
    );

    // 라운드 종료 확인
    const winner = this.gameState.getWinner();
    if (winner !== null) {
      this.stop();

      // 최종 점수 계산
      this.gameState.finalizeScores();

      const scores = Array.from(this.gameState.players.values()).map(p => ({
        id:    p.id,
        name:  p.name,
        score: p.score,
        rank:  p.rank,
      }));

      this.io.to(this.room.code).emit(EVENTS.ROUND_END, {
        winnerId: winner.id,
        round:    this.room.round,
        scores,
      });

      // 방 상태를 다시 대기로 전환
      this.room.state = 'waiting';
    }
  }
}

module.exports = { GameLoop };
