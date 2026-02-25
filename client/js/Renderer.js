// client/js/Renderer.js
// Canvas 렌더링. window.Renderer 전역 노출.

window.Renderer = class Renderer {
  /**
   * @param {HTMLCanvasElement} canvas
   */
  constructor(canvas) {
    const { GRID_COLS, GRID_ROWS, CELL_SIZE } = window.CONSTANTS;

    this._canvas = canvas;
    this._ctx    = canvas.getContext('2d');

    // 캔버스 크기 설정
    this._canvas.width  = GRID_COLS * CELL_SIZE; // 21 * 32 = 672
    this._canvas.height = GRID_ROWS * CELL_SIZE; // 21 * 32 = 672
  }

  /**
   * 전체 렌더링 진입점. 60fps 루프에서 매 프레임 호출된다.
   * @param {object|null} state - GameClient.getInterpolatedState() 결과
   * @param {string|null} myId  - 내 플레이어 ID
   */
  render(state, myId) {
    const ctx = this._ctx;

    // 화면 초기화
    ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);

    if (!state) {
      // 상태 없음: 검정 화면
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);
      return;
    }

    this.drawMap(state.map, state.shrinkBorder || 0);
    this.drawCoins(state.attackCoins);
    this.drawPlayers(state.players, myId);
    this.drawUI(state, myId);
  }

  // ---------------------------------------------------------------------------
  // drawMap
  // ---------------------------------------------------------------------------

  /**
   * 맵 그리드를 렌더링한다.
   * @param {number[][]} map - 2D 배열, CELL_WALL(1) 또는 CELL_EMPTY(0)
   * @param {number} shrinkBorder - 현재 축소된 테두리 크기
   */
  drawMap(map, shrinkBorder = 0) {
    if (!map) return;
    const { CELL_SIZE, CELL_WALL, GRID_COLS, GRID_ROWS } = window.CONSTANTS;
    const ctx = this._ctx;

    for (let row = 0; row < map.length; row++) {
      for (let col = 0; col < map[row].length; col++) {
        ctx.fillStyle = map[row][col] === CELL_WALL ? '#1a1aff' : '#000000';
        ctx.fillRect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }

    // 축소된 영역을 어두운 빨간 오버레이로 표시
    if (shrinkBorder > 0) {
      ctx.fillStyle = 'rgba(120, 0, 0, 0.72)';
      for (let row = 0; row < GRID_ROWS; row++) {
        for (let col = 0; col < GRID_COLS; col++) {
          if (
            col <= shrinkBorder ||
            col >= GRID_COLS - 1 - shrinkBorder ||
            row <= shrinkBorder ||
            row >= GRID_ROWS - 1 - shrinkBorder
          ) {
            ctx.fillRect(col * CELL_SIZE, row * CELL_SIZE, CELL_SIZE, CELL_SIZE);
          }
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // drawCoins
  // ---------------------------------------------------------------------------

  /**
   * 공격 동전을 렌더링한다.
   * @param {Array<{x: number, y: number}>} coins
   */
  drawCoins(coins) {
    if (!coins || coins.length === 0) return;
    const { CELL_SIZE } = window.CONSTANTS;
    const ctx = this._ctx;

    coins.forEach((coin) => {
      const cx = coin.x * CELL_SIZE + CELL_SIZE / 2;
      const cy = coin.y * CELL_SIZE + CELL_SIZE / 2;

      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#FFD700'; // 노란색
      ctx.fill();

      // 테두리 강조
      ctx.strokeStyle = '#FFA500';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }

  // ---------------------------------------------------------------------------
  // drawPlayers
  // ---------------------------------------------------------------------------

  /**
   * 플레이어(팩맨)를 렌더링한다.
   * @param {Array<object>} players
   * @param {string|null} myId
   */
  drawPlayers(players, myId) {
    if (!players) return;
    players.forEach((player) => {
      if (!player.alive) return; // 사망한 플레이어는 렌더링 안 함
      this._drawPacman(player, myId);
    });
  }

  /**
   * 단일 팩맨을 렌더링한다.
   * @param {object} player
   * @param {string|null} myId
   */
  _drawPacman(player, myId) {
    const { CELL_SIZE } = window.CONSTANTS;
    const ctx = this._ctx;

    const cx = player.x * CELL_SIZE + CELL_SIZE / 2;
    const cy = player.y * CELL_SIZE + CELL_SIZE / 2;
    const radius = 14;

    // 입 모양 각도 (45도)
    const mouthAngle = Math.PI / 4;

    // 방향에 따라 회전 각도 결정
    const rotationMap = {
      right: 0,
      down:  Math.PI / 2,
      left:  Math.PI,
      up:    (3 * Math.PI) / 2,
    };
    const rotation = rotationMap[player.direction] ?? 0;

    // 색상 결정
    const fillColor = player.isRed ? '#FF3333' : '#FFFFFF';

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);

    // 팩맨 몸통
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, mouthAngle, Math.PI * 2 - mouthAngle);
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();

    // 내 플레이어: 흰색 테두리 강조
    if (player.id === myId) {
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.restore();

    // 빨간 상태 타이머 원형 게이지 (redTimer가 있을 때만)
    if (player.isRed && typeof player.redTimer === 'number') {
      const { ATTACK_DURATION } = window.CONSTANTS;
      const ratio = player.redTimer / ATTACK_DURATION;
      const startAngle = -Math.PI / 2;               // 12시 방향에서 시작
      const endAngle   = startAngle + Math.PI * 2 * ratio;

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 4, startAngle, endAngle);
      ctx.strokeStyle = '#FF6666';
      ctx.lineWidth   = 3;
      ctx.stroke();
      ctx.restore();
    }

    // 플레이어 이름 라벨
    const isMe = player.id === myId;
    const labelY = cy - radius - (isMe ? 22 : 6);

    ctx.save();
    ctx.font         = 'bold 10px monospace';
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'bottom';

    if (isMe) {
      // "▼ YOU" 표시 (노란색 삼각 화살표)
      ctx.fillStyle = '#FFD700';
      ctx.font      = '11px monospace';
      ctx.fillText('▼', cx, cy - radius - 6);
    }

    // 이름 텍스트 (반투명 배경 + 이름)
    const nameText = isMe ? `[${player.name}]` : player.name;
    ctx.font = isMe ? 'bold 10px monospace' : '9px monospace';
    const tw = ctx.measureText(nameText).width;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(cx - tw / 2 - 2, labelY - 11, tw + 4, 13);
    ctx.fillStyle = isMe ? '#FFD700' : '#cccccc';
    ctx.fillText(nameText, cx, labelY);
    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // drawUI
  // ---------------------------------------------------------------------------

  /**
   * UI 오버레이를 렌더링한다 (생존자 수, 점수, 관전 텍스트 등).
   * @param {object} state
   * @param {string|null} myId
   */
  drawUI(state, myId) {
    if (!state) return;
    const ctx  = this._ctx;
    const W    = this._canvas.width;
    const H    = this._canvas.height;

    // 생존 플레이어 수 계산
    const alivePlayers = state.players
      ? state.players.filter((p) => p.alive)
      : [];

    // 내 플레이어 점수
    const me = state.players
      ? state.players.find((p) => p.id === myId)
      : null;

    // 상단 정보 바 배경
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, W, 28);

    ctx.fillStyle   = '#FFFFFF';
    ctx.font        = '14px monospace';
    ctx.textBaseline = 'top';

    // 생존자 수
    ctx.fillText(`Alive: ${alivePlayers.length}`, 8, 7);

    // 내 점수
    if (me) {
      const scoreText = `Score: ${me.score ?? 0}`;
      const tw = ctx.measureText(scoreText).width;
      ctx.fillText(scoreText, W - tw - 8, 7);
    }

    // 라운드 번호 (state.round가 있는 경우)
    if (state.round != null) {
      const { TOTAL_ROUNDS } = window.CONSTANTS;
      const total = state.totalRounds || TOTAL_ROUNDS;
      const roundText = `Round ${state.round} / ${total}`;
      const tw = ctx.measureText(roundText).width;
      ctx.fillText(roundText, (W - tw) / 2, 7);
    }

    // 내가 사망한 경우: 반투명 오버레이 + '관전 중' 텍스트
    if (myId && state.players) {
      const myPlayer = state.players.find((p) => p.id === myId);
      if (myPlayer && !myPlayer.alive) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.fillRect(0, 0, W, H);

        ctx.fillStyle    = '#FFFFFF';
        ctx.font         = 'bold 32px monospace';
        ctx.textAlign    = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('SPECTATING', W / 2, H / 2);

        // 기본값 복원
        ctx.textAlign    = 'left';
        ctx.textBaseline = 'alphabetic';
      }
    }
  }
};
