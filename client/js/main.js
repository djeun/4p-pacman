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
  const gameClient     = new window.GameClient();
  let   renderer       = null;
  let   inputHandler   = null;
  let   rafId          = null;
  let   isHost         = false;
  let   gameStarted    = false;
  let   currentRoomCode = null;

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
  const copyCodeBtn      = document.getElementById('copy-code-btn');
  const roundCountWrap   = document.getElementById('round-count-wrap');
  const roundCountInput  = document.getElementById('round-count-input');
  const startBtn         = document.getElementById('start-btn');
  const gameCanvas     = document.getElementById('game-canvas');
  const scoreOverlay   = document.getElementById('score-overlay');
  const scoreContent   = document.getElementById('score-content');
  const gameEndOverlay = document.getElementById('game-end-overlay');
  const gameEndContent = document.getElementById('game-end-content');
  const toastContainer = document.getElementById('toast-container');

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
  // 토스트 알림
  // ---------------------------------------------------------------------------
  function showToast(message, type = '') {
    if (!toastContainer) return;
    const el = document.createElement('div');
    el.className = `toast${type ? ' toast-' + type : ''}`;
    el.textContent = message;
    toastContainer.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }

  // ---------------------------------------------------------------------------
  // 닉네임 가져오기 (유효성 검사)
  // ---------------------------------------------------------------------------
  function getValidName() {
    const name = nameInput ? nameInput.value.trim().slice(0, 12) : '';
    if (!name) {
      showToast('Please enter a nickname.', 'info');
      if (nameInput) nameInput.focus();
      return null;
    }
    return name;
  }

  // ---------------------------------------------------------------------------
  // 플레이어 목록 갱신
  // ---------------------------------------------------------------------------
  function updatePlayerList(players, hostId) {
    if (!playerListEl) return;
    playerListEl.innerHTML = '';
    players.forEach((p) => {
      const li = document.createElement('li');
      li.textContent = p.id === hostId ? `${p.name} (Host)` : p.name;
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
      const name = getValidName();
      if (!name) return;
      socket.emit(EVENTS.CREATE_ROOM, { name });
    });
  }

  // 참가하기
  if (joinBtn) {
    joinBtn.addEventListener('click', () => {
      const name = getValidName();
      if (!name) return;
      const code = roomCodeInput ? roomCodeInput.value.trim().toUpperCase() : '';
      if (!code) {
        showToast('Please enter a room code.', 'info');
        if (roomCodeInput) roomCodeInput.focus();
        return;
      }
      socket.emit(EVENTS.JOIN_ROOM, { name, code });
    });
  }

  // 게임 시작 (방장만 가능)
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      const totalRounds = roundCountInput ? (parseInt(roundCountInput.value) || 5) : 5;
      socket.emit(EVENTS.READY, { totalRounds });
    });
  }

  // Enter 키: 닉네임 입력창 → 방 만들기
  if (nameInput) {
    nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') createBtn && createBtn.click();
    });
  }

  // Enter 키: 룸 코드 입력창 → 참가하기
  if (roomCodeInput) {
    roomCodeInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') joinBtn && joinBtn.click();
    });
  }

  // 룸 코드 복사 버튼
  if (copyCodeBtn) {
    copyCodeBtn.addEventListener('click', () => {
      if (!currentRoomCode) return;
      navigator.clipboard.writeText(currentRoomCode).then(() => {
        showToast('Room code copied!', 'info');
      }).catch(() => {
        showToast(currentRoomCode, 'info');
      });
    });
  }

  // 게임 중 탭/창 닫기 경고
  window.addEventListener('beforeunload', (e) => {
    if (gameStarted) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  // ---------------------------------------------------------------------------
  // 소켓 이벤트 핸들러
  // ---------------------------------------------------------------------------

  // 방 생성 완료
  socket.on(EVENTS.ROOM_CREATED, (data) => {
    // data: { code, hostId, players }
    isHost = true;
    currentRoomCode = data.code;
    gameClient.setMyId(socket.id);

    if (roomCodeEl) roomCodeEl.textContent = `Room Code: ${data.code}`;
    if (copyCodeBtn) copyCodeBtn.style.display = 'inline-block';
    if (roundCountWrap) roundCountWrap.style.display = 'block';
    if (startBtn)   startBtn.style.display = 'inline-block';
    updatePlayerList(data.players, data.hostId);
  });

  // 방 참가 완료
  socket.on(EVENTS.ROOM_JOINED, (data) => {
    // 게임 중 수신된 ROOM_JOINED는 로비 UI 갱신 건너뜀
    if (gameStarted) return;

    // data: { code, hostId, players, totalRounds }
    isHost = data.hostId === socket.id;
    currentRoomCode = data.code;
    gameClient.setMyId(socket.id);

    if (roomCodeEl) roomCodeEl.textContent = `Room Code: ${data.code}`;
    if (copyCodeBtn) copyCodeBtn.style.display = 'inline-block';
    // 라운드 설정은 방장만 표시
    if (roundCountWrap) roundCountWrap.style.display = isHost ? 'block' : 'none';
    if (roundCountInput && data.totalRounds) roundCountInput.value = data.totalRounds;
    if (startBtn)   startBtn.style.display = isHost ? 'inline-block' : 'none';
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

  // 사망 알림
  socket.on(EVENTS.PLAYER_DIED, (data) => {
    const isMe = data.playerId === socket.id;
    const msg  = isMe ? 'You died!' : `${data.name} died`;
    showToast(msg, 'death');
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

      const { TOTAL_ROUNDS } = window.CONSTANTS;
      const title = document.createElement('h2');
      title.textContent = `Round ${data.round} / ${TOTAL_ROUNDS} Over`;
      scoreContent.appendChild(title);

      if (data.scores) {
        const sorted = [...data.scores].sort((a, b) => b.score - a.score);
        const ul = document.createElement('ul');
        sorted.forEach((entry, i) => {
          const li = document.createElement('li');
          li.textContent = `#${i + 1} ${entry.name}: ${entry.score} pts`;
          ul.appendChild(li);
        });
        scoreContent.appendChild(ul);
      }

      // 카운트다운 표시
      const countdown = document.createElement('p');
      countdown.style.cssText = 'color:#aaa;font-size:0.85rem;';
      scoreContent.appendChild(countdown);

      scoreOverlay.style.display = 'flex';

      let remaining = 3;
      countdown.textContent = `Continuing in ${remaining}s...`;
      const timer = setInterval(() => {
        remaining--;
        if (remaining > 0) {
          countdown.textContent = `Continuing in ${remaining}s...`;
        } else {
          clearInterval(timer);
          scoreOverlay.style.display = 'none';
          gameStarted = false;
          stopGameLoop();
          showLobby();

          if (startBtn) startBtn.style.display = isHost ? 'inline-block' : 'none';
        }
      }, 1000);
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
      title.textContent = 'Game Over';
      gameEndContent.appendChild(title);

      if (data.scores) {
        const ul = document.createElement('ul');
        data.scores.forEach((entry, i) => {
          const li = document.createElement('li');
          li.textContent = `#${i + 1} ${entry.name}: ${entry.score} pts`;
          if (i === 0) li.classList.add('winner');
          ul.appendChild(li);
        });
        gameEndContent.appendChild(ul);
      }

      const backBtn = document.createElement('button');
      backBtn.textContent = 'Back to Lobby';
      backBtn.addEventListener('click', () => {
        gameEndOverlay.style.display = 'none';
        showLobby();
      });
      gameEndContent.appendChild(backBtn);

      gameEndOverlay.style.display = 'flex';
    }
  });

  // 서버 연결 끊김
  socket.on('disconnect', () => {
    stopGameLoop();
    if (inputHandler) {
      inputHandler.destroy();
      inputHandler = null;
    }
    gameStarted = false;
    showToast('Disconnected from server.', 'info');
    showLobby();
  });

  // 에러
  socket.on(EVENTS.ERROR, (data) => {
    showToast(data.message || 'An error occurred.', 'info');
  });

  // ---------------------------------------------------------------------------
  // 초기 화면
  // ---------------------------------------------------------------------------
  showLobby();
});
