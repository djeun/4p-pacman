// client/js/InputHandler.js
// 키보드 입력 처리. window.InputHandler 전역 노출.

window.InputHandler = class InputHandler {
  /**
   * @param {object} socket - socket.io 소켓 인스턴스
   */
  constructor(socket) {
    this._socket = socket;
    this._lastDirection = null;

    this._onKeyDown  = this._handleKeyDown.bind(this);
    this._onDpad     = this._handleDpad.bind(this);

    window.addEventListener('keydown', this._onKeyDown);

    // D-패드 버튼: touchstart(모바일) + mousedown(데스크탑 테스트)
    document.querySelectorAll('.dpad-btn').forEach(btn => {
      btn.addEventListener('touchstart', this._onDpad, { passive: false });
      btn.addEventListener('mousedown',  this._onDpad);
    });
  }

  /**
   * keydown 이벤트 핸들러
   * @param {KeyboardEvent} e
   */
  _handleKeyDown(e) {
    const { EVENTS } = window.CONSTANTS;
    let direction = null;

    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        direction = 'up';
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        direction = 'down';
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        direction = 'left';
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        direction = 'right';
        break;
      default:
        return; // 관련 없는 키는 무시
    }

    // 방향키 기본 동작(스크롤 등) 방지
    e.preventDefault();

    // 같은 방향 연속 입력 무시
    if (direction === this._lastDirection) return;

    this._lastDirection = direction;
    this._socket.emit(EVENTS.PLAYER_INPUT, { direction });
  }

  /**
   * D-패드 버튼 핸들러
   */
  _handleDpad(e) {
    e.preventDefault(); // 터치 스크롤 방지
    const direction = e.currentTarget.dataset.dir;
    if (!direction) return;
    const { EVENTS } = window.CONSTANTS;
    this._lastDirection = direction;
    this._socket.emit(EVENTS.PLAYER_INPUT, { direction });
  }

  /**
   * 이벤트 리스너 제거 (게임 종료/라운드 종료 시 호출)
   */
  destroy() {
    window.removeEventListener('keydown', this._onKeyDown);
    document.querySelectorAll('.dpad-btn').forEach(btn => {
      btn.removeEventListener('touchstart', this._onDpad);
      btn.removeEventListener('mousedown',  this._onDpad);
    });
    this._lastDirection = null;
  }
};
