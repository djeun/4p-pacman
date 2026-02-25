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
    this.room         = room;
    this.gameState    = gameState;
    this.io           = io;
    this._interval    = null;
    this._roundEnded  = false;
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
    if (this._roundEnded) return;

    this.gameState.update();

    // 현재 상태 브로드캐스트 (round, totalRounds 포함)
    this.io.to(this.room.code).emit(
      EVENTS.GAME_STATE,
      { ...this.gameState.toJSON(), round: this.room.round, totalRounds: this.room.totalRounds }
    );

    // 라운드 종료 확인
    const winner = this.gameState.getWinner();
    if (winner !== null) {
      this.endRound(winner);
    }
  }

  /**
   * 라운드를 종료한다. 중복 호출 방지를 위해 _roundEnded 플래그 사용.
   * @param {object|null} winner - getWinner() 결과 (null이면 disconnect로 전달)
   */
  endRound(winner) {
    if (this._roundEnded) return;
    this._roundEnded = true;
    this.stop();

    // 최종 점수 계산
    this.gameState.finalizeScores();

    const scores = Array.from(this.gameState.players.values()).map(p => ({
      id:    p.id,
      name:  p.name,
      score: p.score,
      rank:  p.rank,
    }));

    const winnerId = winner ? winner.id : null;

    this.io.to(this.room.code).emit(EVENTS.ROUND_END, {
      winnerId,
      round: this.room.round,
      scores,
    });

    // 방 상태를 다시 대기로 전환
    this.room.state = 'waiting';

    // 총 라운드 소진 시 GAME_END 발송
    if (this.room.round >= this.room.totalRounds) {
      const sortedScores = [...scores].sort((a, b) => b.score - a.score);
      this.io.to(this.room.code).emit(EVENTS.GAME_END, {
        scores: sortedScores,
      });
    }
  }
}

module.exports = { GameLoop };
