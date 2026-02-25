// client/js/main.js
// 진입점. Socket.io 연결 및 UI 이벤트 처리.

document.addEventListener('DOMContentLoaded', () => {
  const { EVENTS } = window.CONSTANTS;

  // ---------------------------------------------------------------------------
  // Socket.io 연결 (서버와 같은 origin — URL 불필요)
  // ---------------------------------------------------------------------------
  const socket = io();

  // ---------------------------------------------------------------------------
  // 클라이언트 상태
  // ---------------------------------------------------------------------------
  const gameClient   = new window.GameClient();
  let   renderer     = null;
  let   inputHandler = null;
  let   rafId        = null;
  let   isHost       = false;
  let   gameStarted  = false;

  // ---------------------------------------------------------------------------
  // DOM 참조
  // ---------------------------------------------------------------------------
  const lobbyEl        = document.getElementById('lobby');
  const gameEl         = document.getElementById('game');
  const nameInput      = document.getElementById('name-input');
  const createBtn      = document.getElementById('create-btn');
  const roomCodeInput  = document.getElementById('room-code-input');
  const joinBtn        = document.getElementById('join-btn');
  const playerListEl   = document.getElementById('player-list');
  const roomCodeEl     = document.getElementById('room-code');
  const startBtn       = document.getElementById('start-btn');
  const gameCanvas     = document.getElementById('game-canvas');
  const scoreOverlay   = document.getElementById('score-overlay');
  const scoreContent   = document.getElementById('score-content');
  const gameEndOverlay = document.getElementById('game-end-overlay');
  const gameEndContent = document.getElementById('game-end-content');

  // ---------------------------------------------------------------------------
  // 화면 전환 헬퍼
  // ---------------------------------------------------------------------------
  function showLobby() {
    lobbyEl.style.display = 'flex';
    gameEl.style.display  = 'none';
  }

  function showGame() {
    lobbyEl.style.display = 'none';
    gameEl.style.display  = 'block';
  }

  // ---------------------------------------------------------------------------
  // 플레이어 목록 갱신
  // ---------------------------------------------------------------------------
  function updatePlayerList(players, hostId) {
    if (!playerListEl) return;
    playerListEl.innerHTML = '';
    players.forEach((p) => {
      const li = document.createElement('li');
      li.textContent = p.id === hostId ? `${p.name} (방장)` : p.name;
      playerListEl.appendChild(li);
    });
  }

  // ---------------------------------------------------------------------------
  // 게임 루프 (requestAnimationFrame, ~60fps)
  // ---------------------------------------------------------------------------
  function gameLoop() {
    if (renderer) {
      const state = gameClient.getInterpolatedState(performance.now());
      renderer.render(state, gameClient.myId);
    }
    rafId = requestAnimationFrame(gameLoop);
  }

  function startGameLoop() {
    if (rafId) return;
    if (!renderer) {
      renderer = new window.Renderer(gameCanvas);
    }
    gameLoop();
  }

  function stopGameLoop() {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  // ---------------------------------------------------------------------------
  // 로비 버튼 이벤트
  // ---------------------------------------------------------------------------

  // 방 만들기
  if (createBtn) {
    createBtn.addEventListener('click', () => {
      const name = nameInput ? nameInput.value.trim() : '';
      socket.emit(EVENTS.CREATE_ROOM, { name });
    });
  }

  // 참가하기
  if (joinBtn) {
    joinBtn.addEventListener('click', () => {
      const name = nameInput ? nameInput.value.trim() : '';
      const code = roomCodeInput ? roomCodeInput.value.trim().toUpperCase() : '';
      if (!code) {
        alert('룸 코드를 입력해주세요.');
        return;
      }
      socket.emit(EVENTS.JOIN_ROOM, { name, code });
    });
  }

  // 게임 시작 (방장만 가능)
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      socket.emit(EVENTS.READY);
    });
  }

  // ---------------------------------------------------------------------------
  // 소켓 이벤트 핸들러
  // ---------------------------------------------------------------------------

  // 방 생성 완료
  socket.on(EVENTS.ROOM_CREATED, (data) => {
    // data: { code, hostId, players }
    isHost = true;
    gameClient.setMyId(socket.id);

    if (roomCodeEl) {
      roomCodeEl.textContent = `룸 코드: ${data.code}`;
    }
    if (startBtn) {
      startBtn.style.display = 'inline-block';
    }
    updatePlayerList(data.players, data.hostId);
  });

  // 방 참가 완료
  socket.on(EVENTS.ROOM_JOINED, (data) => {
    // data: { code, hostId, players }
    isHost = data.hostId === socket.id;
    gameClient.setMyId(socket.id);

    if (roomCodeEl) {
      roomCodeEl.textContent = `룸 코드: ${data.code}`;
    }
    if (startBtn) {
      startBtn.style.display = isHost ? 'inline-block' : 'none';
    }
    updatePlayerList(data.players, data.hostId);
  });

  // 게임 상태 수신 (매 틱 100ms마다)
  socket.on(EVENTS.GAME_STATE, (state) => {
    gameClient.updateState(state);

    // 첫 수신 시 게임 화면으로 전환 + 루프 시작
    if (!gameStarted) {
      gameStarted = true;
      showGame();
      startGameLoop();

      // InputHandler 생성
      if (!inputHandler) {
        inputHandler = new window.InputHandler(socket);
      }
    }
  });

  // 라운드 종료
  socket.on(EVENTS.ROUND_END, (data) => {
    // data: { scores: [{id, name, score}, ...], round }

    // InputHandler 비활성화
    if (inputHandler) {
      inputHandler.destroy();
      inputHandler = null;
    }

    // 점수 화면 표시
    if (scoreOverlay && scoreContent) {
      scoreContent.innerHTML = '';

      const title = document.createElement('h2');
      title.textContent = `Round ${data.round} 종료`;
      scoreContent.appendChild(title);

      if (data.scores) {
        const ul = document.createElement('ul');
        data.scores.forEach((entry, i) => {
          const li = document.createElement('li');
          li.textContent = `${i + 1}위 ${entry.name}: ${entry.score}점`;
          ul.appendChild(li);
        });
        scoreContent.appendChild(ul);
      }

      scoreOverlay.style.display = 'flex';

      // 3초 후 로비로 복귀
      setTimeout(() => {
        scoreOverlay.style.display = 'none';
        gameStarted = false;
        stopGameLoop();
        showLobby();

        // 방 정보 초기화 (재참가를 위해 유지하거나 초기화 가능)
        if (startBtn) {
          startBtn.style.display = isHost ? 'inline-block' : 'none';
        }
      }, 3000);
    }
  });

  // 게임 종료 (최종 결과)
  socket.on(EVENTS.GAME_END, (data) => {
    // data: { scores: [{id, name, score, rank}, ...] }

    if (inputHandler) {
      inputHandler.destroy();
      inputHandler = null;
    }

    stopGameLoop();
    gameStarted = false;

    if (gameEndOverlay && gameEndContent) {
      gameEndContent.innerHTML = '';

      const title = document.createElement('h2');
      title.textContent = '게임 종료';
      gameEndContent.appendChild(title);

      if (data.scores) {
        const ul = document.createElement('ul');
        data.scores.forEach((entry, i) => {
          const li = document.createElement('li');
          li.textContent = `${i + 1}위 ${entry.name}: ${entry.score}점`;
          if (i === 0) li.classList.add('winner');
          ul.appendChild(li);
        });
        gameEndContent.appendChild(ul);
      }

      const backBtn = document.createElement('button');
      backBtn.textContent = '로비로 돌아가기';
      backBtn.addEventListener('click', () => {
        gameEndOverlay.style.display = 'none';
        showLobby();
      });
      gameEndContent.appendChild(backBtn);

      gameEndOverlay.style.display = 'flex';
    }
  });

  // 에러
  socket.on(EVENTS.ERROR, (data) => {
    alert(data.message || '오류가 발생했습니다.');
  });

  // ---------------------------------------------------------------------------
  // 초기 화면
  // ---------------------------------------------------------------------------
  showLobby();
});
