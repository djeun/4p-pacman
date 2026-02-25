// client/js/InputHandler.js
// 키보드 입력 처리. window.InputHandler 전역 노출.

window.InputHandler = class InputHandler {
  /**
   * @param {object} socket - socket.io 소켓 인스턴스
   */
  constructor(socket) {
    this._socket = socket;
    this._lastDirection = null;

    // bind해서 removeEventListener에서도 동일 참조 사용 가능하게 저장
    this._onKeyDown = this._handleKeyDown.bind(this);
    window.addEventListener('keydown', this._onKeyDown);
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
   * 이벤트 리스너 제거 (게임 종료/라운드 종료 시 호출)
   */
  destroy() {
    window.removeEventListener('keydown', this._onKeyDown);
    this._lastDirection = null;
  }
};
