// server/GameState.js
// 게임 상태 관리: 미로 맵, 플레이어, 동전, 충돌, 맵 축소

const {
  GRID_COLS,
  GRID_ROWS,
  CELL_WALL,
  CELL_EMPTY,
  SPAWN_POSITIONS,
  ATTACK_DURATION,
  MAX_ATTACK_COINS,
  COIN_MIN_DISTANCE,
  COIN_SPAWN_INTERVAL_MIN,
  COIN_SPAWN_INTERVAL_MAX,
  ROUND_SCORES,
  PLAYER_MOVE_INTERVAL,
  PLAYER_MOVE_INTERVAL_RED,
} = require('./constants');

class GameState {
  /**
   * @param {Array<{id: string, name: string}>} players
   */
  constructor(players) {
    this.map             = [];   // 21×21 2차원 배열 (0=빈공간, 1=벽)
    this.players         = new Map(); // id → 플레이어 객체
    this.attackCoins     = [];   // [{x, y, id}]
    this.tick            = 0;
    this.nextCoinSpawnTick = 0;
    this.shrinkBorder    = 0;    // 현재 축소된 테두리 크기 (0부터 시작)
    this.deadCount       = 0;
    this.rankCounter     = 0;    // 탈락 순서 카운터 (낮을수록 먼저 탈락)

    this._inputBuffer    = new Map(); // playerId → direction (처리 전 입력)
    this._coinIdSeq      = 0;

    this.initMap();
    this.initPlayers(players);
    this._scheduleNextCoin();
  }

  // ─────────────────────────────────────────────
  //  초기화
  // ─────────────────────────────────────────────

  /**
   * 21×21 미로를 초기화한다.
   * - 외곽 전체: 벽
   * - 내부: x와 y가 모두 짝수인 셀은 벽 (팩맨 스타일 격자 벽)
   * - 나머지: 빈 공간
   */
  initMap() {
    this.map = [];
    for (let y = 0; y < GRID_ROWS; y++) {
      const row = [];
      for (let x = 0; x < GRID_COLS; x++) {
        if (
          x === 0 || x === GRID_COLS - 1 ||
          y === 0 || y === GRID_ROWS - 1
        ) {
          // 외곽 테두리: 벽
          row.push(CELL_WALL);
        } else if (x % 2 === 0 && y % 2 === 0) {
          // 내부 격자 기둥: 벽
          row.push(CELL_WALL);
        } else {
          row.push(CELL_EMPTY);
        }
      }
      this.map.push(row);
    }
  }

  /**
   * 플레이어를 스폰 위치에 배치한다.
   * @param {Array<{id: string, name: string}>} players
   */
  initPlayers(players) {
    this.players.clear();
    players.forEach((p, index) => {
      const spawn = SPAWN_POSITIONS[index] || SPAWN_POSITIONS[0];
      this.players.set(p.id, {
        id:        p.id,
        name:      p.name,
        x:         spawn.x,
        y:         spawn.y,
        prevX:     spawn.x,
        prevY:     spawn.y,
        direction: null,   // 'up' | 'down' | 'left' | 'right' | null
        isRed:     false,
        redTimer:  0,      // 남은 빨간 상태 틱
        alive:     true,
        score:     p.score || 0,  // 이전 라운드 누적 점수 이어받기
        rank:         null, // 탈락 순위 (사망 시 설정)
        moveCooldown: 0,   // ticks until next move (0 = ready)
      });
    });
  }

  // ─────────────────────────────────────────────
  //  퍼블릭 인터페이스
  // ─────────────────────────────────────────────

  /**
   * 플레이어의 이동 방향 입력을 버퍼에 저장한다.
   * @param {string} playerId
   * @param {string} direction  'up' | 'down' | 'left' | 'right'
   */
  processInput(playerId, direction) {
    if (this.players.has(playerId)) {
      this._inputBuffer.set(playerId, direction);
    }
  }

  /**
   * 매 틱 호출: 입력 반영 → 이동 → 동전 생성 → 충돌 처리 → 맵 축소
   */
  update() {
    this.tick++;

    // 1. 입력 버퍼를 플레이어 방향에 반영
    for (const [id, direction] of this._inputBuffer) {
      const player = this.players.get(id);
      if (player && player.alive) {
        player.direction = direction;
      }
    }
    this._inputBuffer.clear();

    // 2. 각 플레이어 이동
    for (const player of this.players.values()) {
      if (player.alive) {
        this.movePlayer(player);
      }
    }

    // 3. 동전 생성
    if (this.tick >= this.nextCoinSpawnTick) {
      this.spawnCoin();
    }

    // 4. 충돌 처리 (동전 획득 + 플레이어 간 충돌)
    this.checkCollisions();

    // 5. 맵 축소
    this.applyShrink();

    // 6. 빨간 상태 타이머 감소
    for (const player of this.players.values()) {
      if (player.alive && player.isRed) {
        player.redTimer--;
        if (player.redTimer <= 0) {
          player.isRed    = false;
          player.redTimer = 0;
        }
      }
    }
  }

  /**
   * 생존자가 1명이면 해당 플레이어를 반환한다. 아니면 null.
   * @returns {object|null}
   */
  getWinner() {
    const alive = Array.from(this.players.values()).filter(p => p.alive);
    if (alive.length === 1) {
      return alive[0];
    }
    // 전원 동시 사망한 경우도 종료 처리
    if (alive.length === 0) {
      return { id: null }; // 무승부
    }
    return null;
  }

  /**
   * 라운드 종료 점수를 계산하고 각 플레이어 score를 업데이트한다.
   * 생존자에게 1위 점수(300점) 부여.
   */
  finalizeScores() {
    const total = this.players.size;

    for (const player of this.players.values()) {
      if (player.alive) {
        // 생존자 = 1위
        player.rank  = total - this.deadCount; // 보통 1
        player.score += ROUND_SCORES[0];
      } else {
        // 탈락 순서에 따른 점수 (rankCounter는 1부터 시작, 먼저 탈락 = 높은 rankCounter = 낮은 순위)
        const roundRank = Math.min(player.rank, ROUND_SCORES.length - 1);
        player.score += ROUND_SCORES[roundRank];
      }
    }
  }

  /**
   * 클라이언트 전송용 직렬화.
   * @returns {object}
   */
  toJSON() {
    return {
      tick:         this.tick,
      map:          this.map,
      players:      Array.from(this.players.values()).map(p => ({
        id:        p.id,
        name:      p.name,
        x:         p.x,
        y:         p.y,
        direction: p.direction,
        isRed:     p.isRed,
        redTimer:  p.redTimer,
        alive:     p.alive,
        score:     p.score,
        rank:      p.rank,
      })),
      attackCoins:  this.attackCoins.map(c => ({ x: c.x, y: c.y, id: c.id })),
      shrinkBorder: this.shrinkBorder,
    };
  }

  // ─────────────────────────────────────────────
  //  내부 메서드
  // ─────────────────────────────────────────────

  /**
   * 플레이어를 현재 방향으로 1셀 이동시킨다.
   * 벽이면 현재 위치 유지.
   * @param {object} player
   */
  movePlayer(player) {
    player.prevX = player.x;
    player.prevY = player.y;

    // Count down cooldown; only move when it reaches 0
    if (player.moveCooldown > 0) {
      player.moveCooldown--;
      return;
    }

    if (!player.direction) return; // cooldown stays 0 — ready to move instantly on next input

    // Reset cooldown for next move
    const interval = player.isRed ? PLAYER_MOVE_INTERVAL_RED : PLAYER_MOVE_INTERVAL;
    player.moveCooldown = interval - 1;

    let nx = player.x;
    let ny = player.y;

    switch (player.direction) {
      case 'up':    ny -= 1; break;
      case 'down':  ny += 1; break;
      case 'left':  nx -= 1; break;
      case 'right': nx += 1; break;
    }

    if (!this.isWall(nx, ny)) {
      player.x = nx;
      player.y = ny;
    }
  }

  /**
   * 공격 동전을 랜덤 빈 위치에 생성한다.
   * 동시 최대 MAX_ATTACK_COINS개, 플레이어와 COIN_MIN_DISTANCE 이상 거리.
   */
  spawnCoin() {
    if (this.attackCoins.length >= MAX_ATTACK_COINS) {
      this._scheduleNextCoin();
      return;
    }

    // 후보 빈 셀 목록 생성
    const candidates = [];
    for (let y = 0; y < GRID_ROWS; y++) {
      for (let x = 0; x < GRID_COLS; x++) {
        if (!this.isWall(x, y) && !this._hasCoinAt(x, y)) {
          candidates.push({ x, y });
        }
      }
    }

    // 모든 살아있는 플레이어와 최소 거리 이상인 후보 필터
    const alivePlayers = Array.from(this.players.values()).filter(p => p.alive);
    const valid = candidates.filter(cell =>
      alivePlayers.every(p =>
        Math.abs(cell.x - p.x) + Math.abs(cell.y - p.y) >= COIN_MIN_DISTANCE
      )
    );

    if (valid.length > 0) {
      const chosen = valid[Math.floor(Math.random() * valid.length)];
      this.attackCoins.push({
        x:  chosen.x,
        y:  chosen.y,
        id: ++this._coinIdSeq,
      });
    }

    this._scheduleNextCoin();
  }

  /**
   * 동전 획득과 플레이어 간 충돌을 처리한다.
   */
  checkCollisions() {
    const alivePlayers = Array.from(this.players.values()).filter(p => p.alive);

    // ── 플레이어 간 충돌 (동전 획득보다 먼저: 같은 틱에 동전 위로 이동한 경우
    //    동전을 먹기 전 상태로 충돌 판정해야 함) ──
    for (let i = 0; i < alivePlayers.length; i++) {
      for (let j = i + 1; j < alivePlayers.length; j++) {
        const a = alivePlayers[i];
        const b = alivePlayers[j];

        if (!a.alive || !b.alive) continue;
        if (a.x !== b.x || a.y !== b.y) continue;

        // 같은 셀 진입
        if (a.isRed && !b.isRed) {
          // a(빨간) → b(흰색) 사망
          this._killPlayer(b);
        } else if (!a.isRed && b.isRed) {
          // b(빨간) → a(흰색) 사망
          this._killPlayer(a);
        } else {
          // 빨간+빨간 또는 흰색+흰색: 바운스 백
          this._bounceBack(a);
          this._bounceBack(b);
        }
      }
    }

    // ── 동전 획득 (충돌 처리 후) ──
    const stillAlive = Array.from(this.players.values()).filter(p => p.alive);
    for (const player of stillAlive) {
      const coinIndex = this.attackCoins.findIndex(
        c => c.x === player.x && c.y === player.y
      );
      if (coinIndex !== -1) {
        this.attackCoins.splice(coinIndex, 1);
        player.isRed    = true;
        player.redTimer = ATTACK_DURATION;
      }
    }
  }

  /**
   * 맵 축소를 처리한다.
   * SHRINK_START_TICK 이후 매 50틱마다 1셀씩 안쪽으로 축소.
   * 축소된 영역에 있는 플레이어는 즉시 사망.
   */
  applyShrink() {
    // Shrink disabled — rounds have no time limit
  }

  // ─────────────────────────────────────────────
  //  유틸리티
  // ─────────────────────────────────────────────

  /**
   * 해당 셀이 벽이거나 축소된 영역이면 true를 반환한다.
   * @param {number} x
   * @param {number} y
   * @returns {boolean}
   */
  isWall(x, y) {
    // 맵 범위 밖
    if (x < 0 || x >= GRID_COLS || y < 0 || y >= GRID_ROWS) return true;

    // 맵 축소: shrinkBorder 이내의 테두리를 벽으로 처리
    if (
      x <= this.shrinkBorder ||
      x >= GRID_COLS - 1 - this.shrinkBorder ||
      y <= this.shrinkBorder ||
      y >= GRID_ROWS - 1 - this.shrinkBorder
    ) {
      return true;
    }

    return this.map[y][x] === CELL_WALL;
  }

  /**
   * 해당 셀이 비어 있으면 true를 반환한다.
   * @param {number} x
   * @param {number} y
   * @returns {boolean}
   */
  isEmpty(x, y) {
    return !this.isWall(x, y);
  }

  /**
   * 플레이어를 이전 위치로 되돌린다 (바운스 백).
   * @param {object} player
   */
  _bounceBack(player) {
    player.x = player.prevX;
    player.y = player.prevY;
  }

  /**
   * 플레이어를 사망 처리한다.
   * @param {object} player
   */
  _killPlayer(player) {
    player.alive    = false;
    player.isRed    = false;
    player.redTimer = 0;
    this.deadCount++;
    // rank: 먼저 죽을수록 높은 인덱스 (낮은 순위)
    // 4명이면: 첫 사망=rank3(0pt), 두번째=rank2(100pt), 세번째=rank1(200pt)
    this.rankCounter++;
    player.rank = Math.min(this.players.size - this.rankCounter, ROUND_SCORES.length - 1);
  }

  /**
   * 해당 좌표에 동전이 있는지 확인한다.
   * @param {number} x
   * @param {number} y
   * @returns {boolean}
   */
  _hasCoinAt(x, y) {
    return this.attackCoins.some(c => c.x === x && c.y === y);
  }

  /**
   * 다음 동전 생성 틱을 예약한다.
   */
  _scheduleNextCoin() {
    const interval =
      COIN_SPAWN_INTERVAL_MIN +
      Math.floor(Math.random() * (COIN_SPAWN_INTERVAL_MAX - COIN_SPAWN_INTERVAL_MIN + 1));
    this.nextCoinSpawnTick = this.tick + interval;
  }
}

module.exports = { GameState };
