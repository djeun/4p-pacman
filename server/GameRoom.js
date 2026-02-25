// server/GameRoom.js
// 방 생성/참가/퇴장 및 룸 코드 관리

const { MAX_PLAYERS } = require('./constants');

class GameRoom {
  constructor(code) {
    this.code        = code;
    this.players     = new Map(); // socketId → { id, name, score }
    this.hostId      = null;
    this.state       = 'waiting'; // 'waiting' | 'playing'
    this.round       = 0;
    this.totalRounds = 5;         // 방장이 설정 가능, 기본값 5
  }

  /**
   * 플레이어를 방에 추가한다.
   * @param {string} socketId
   * @param {string} name
   * @returns {{ id: string, name: string, score: number }}
   * @throws {Error} 방이 가득 찬 경우
   */
  addPlayer(socketId, name) {
    if (this.players.size >= MAX_PLAYERS) {
      throw new Error('방이 가득 찼습니다.');
    }

    const player = {
      id:    socketId,
      name:  name || `Player${this.players.size + 1}`,
      score: 0,
    };

    this.players.set(socketId, player);

    // 첫 번째로 입장한 플레이어가 방장
    if (this.hostId === null) {
      this.hostId = socketId;
    }

    return player;
  }

  /**
   * 플레이어를 방에서 제거한다.
   * 방장이 나간 경우 다음 플레이어에게 방장 권한을 이양한다.
   * @param {string} socketId
   */
  removePlayer(socketId) {
    this.players.delete(socketId);

    if (this.hostId === socketId) {
      // 남은 플레이어 중 첫 번째에게 방장 이양
      const next = this.players.keys().next().value;
      this.hostId = next !== undefined ? next : null;
    }
  }

  /**
   * 해당 소켓이 방장인지 확인한다.
   * @param {string} socketId
   * @returns {boolean}
   */
  isHost(socketId) {
    return this.hostId === socketId;
  }

  /**
   * 방이 가득 찼는지 확인한다.
   * @returns {boolean}
   */
  isFull() {
    return this.players.size >= MAX_PLAYERS;
  }

  /**
   * 게임을 시작할 수 있는 상태인지 확인한다 (2명 이상).
   * @returns {boolean}
   */
  canStart() {
    return this.players.size >= 2;
  }

  /**
   * 클라이언트 전송용 직렬화.
   * @returns {object}
   */
  toJSON() {
    return {
      code:        this.code,
      hostId:      this.hostId,
      state:       this.state,
      players:     Array.from(this.players.values()),
      totalRounds: this.totalRounds,
    };
  }
}

/**
 * 4자리 영숫자 대문자 룸 코드를 생성한다.
 * @returns {string}
 */
function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

module.exports = { GameRoom, generateRoomCode };
