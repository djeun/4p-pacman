// server/index.js
// Express + Socket.io 서버 진입점

const path   = require('path');
const http   = require('http');
const express = require('express');
const { Server } = require('socket.io');

const { GameRoom, generateRoomCode } = require('./GameRoom');
const { GameState }                  = require('./GameState');
const { GameLoop }                   = require('./GameLoop');
const { EVENTS, MAX_PLAYERS }         = require('./constants');

// ─────────────────────────────────────────────
//  서버 설정
// ─────────────────────────────────────────────

const app    = express();
const server = http.createServer(app);
const io     = new Server(server); // 같은 서버, CORS 불필요

const PORT = process.env.PORT || 3000;

// client/ 폴더 정적 서빙
app.use(express.static(path.join(__dirname, '..', 'client')));

// ─────────────────────────────────────────────
//  룸 저장소
//  Map<roomCode, { room: GameRoom, gameState: GameState|null, gameLoop: GameLoop|null }>
// ─────────────────────────────────────────────

const rooms         = new Map();
const socketRoomMap = new Map(); // socketId → roomCode (O(1) 역방향 조회)

// ─────────────────────────────────────────────
//  유틸리티
// ─────────────────────────────────────────────

/** 중복되지 않는 룸 코드를 생성한다. */
function createUniqueRoomCode() {
  let code;
  do {
    code = generateRoomCode();
  } while (rooms.has(code));
  return code;
}

/** 닉네임을 정규화한다. 빈 문자열이면 'Player' 반환, 최대 12자 */
function sanitizeName(name) {
  const trimmed = (name || '').trim().slice(0, 12);
  return trimmed || 'Player';
}

/** 소켓이 속한 방 정보를 반환한다. (O(1)) */
function getRoomBySocket(socketId) {
  const code = socketRoomMap.get(socketId);
  if (!code) return null;
  return rooms.get(code) || null;
}

// ─────────────────────────────────────────────
//  Socket.io 이벤트 핸들링
// ─────────────────────────────────────────────

io.on('connection', (socket) => {
  console.log(`[connect] ${socket.id}`);

  // ── create_room ──────────────────────────────
  socket.on(EVENTS.CREATE_ROOM, ({ name } = {}) => {
    try {
      const code = createUniqueRoomCode();
      const room = new GameRoom(code);

      room.addPlayer(socket.id, sanitizeName(name));
      rooms.set(code, { room, gameState: null, gameLoop: null });
      socketRoomMap.set(socket.id, code);

      socket.join(code);

      socket.emit(EVENTS.ROOM_CREATED, room.toJSON());
      console.log(`[create_room] code=${code} host=${socket.id}`);
    } catch (err) {
      socket.emit(EVENTS.ERROR, { message: err.message });
    }
  });

  // ── join_room ─────────────────────────────────
  socket.on(EVENTS.JOIN_ROOM, ({ code, name } = {}) => {
    try {
      const entry = rooms.get(code);

      if (!entry) {
        return socket.emit(EVENTS.ERROR, { message: 'Room not found.' });
      }
      if (entry.room.state === 'playing') {
        return socket.emit(EVENTS.ERROR, { message: 'Game already in progress.' });
      }
      if (entry.room.isFull()) {
        return socket.emit(EVENTS.ERROR, { message: 'Room is full.' });
      }

      entry.room.addPlayer(socket.id, sanitizeName(name));
      socket.join(code);
      socketRoomMap.set(socket.id, code);

      // 방 전체(참가자 포함)에 갱신된 방 정보 브로드캐스트
      io.to(code).emit(EVENTS.ROOM_JOINED, entry.room.toJSON());
      console.log(`[join_room] code=${code} player=${socket.id}`);
    } catch (err) {
      socket.emit(EVENTS.ERROR, { message: err.message });
    }
  });

  // ── ready (방장이 게임 시작) ───────────────────
  socket.on(EVENTS.READY, () => {
    try {
      const entry = getRoomBySocket(socket.id);
      if (!entry) {
        return socket.emit(EVENTS.ERROR, { message: 'You are not in a room.' });
      }

      const { room } = entry;

      if (!room.isHost(socket.id)) {
        return socket.emit(EVENTS.ERROR, { message: 'Only the host can start the game.' });
      }
      if (!room.canStart()) {
        return socket.emit(EVENTS.ERROR, { message: 'At least 2 players required to start.' });
      }
      if (room.state === 'playing') {
        return socket.emit(EVENTS.ERROR, { message: 'Game is already in progress.' });
      }

      // 이전 루프가 남아 있으면 정리
      if (entry.gameLoop) {
        entry.gameLoop.stop();
      }

      // 플레이어 목록으로 GameState 초기화
      const playerList = Array.from(room.players.values()).map(p => ({
        id:   p.id,
        name: p.name,
      }));

      const gameState = new GameState(playerList);
      const gameLoop  = new GameLoop(room, gameState, io);

      entry.gameState = gameState;
      entry.gameLoop  = gameLoop;
      room.state      = 'playing';
      room.round      += 1;

      gameLoop.start();
      console.log(`[ready] code=${room.code} players=${playerList.length}`);
    } catch (err) {
      socket.emit(EVENTS.ERROR, { message: err.message });
    }
  });

  // ── player_input ──────────────────────────────
  socket.on(EVENTS.PLAYER_INPUT, ({ direction } = {}) => {
    const VALID_DIRECTIONS = ['up', 'down', 'left', 'right'];
    if (!VALID_DIRECTIONS.includes(direction)) return;

    const entry = getRoomBySocket(socket.id);
    if (!entry || !entry.gameState) return;

    entry.gameState.processInput(socket.id, direction);
  });

  // ── disconnect ────────────────────────────────
  socket.on('disconnect', () => {
    console.log(`[disconnect] ${socket.id}`);

    socketRoomMap.delete(socket.id);

    const entry = getRoomBySocket(socket.id);
    if (!entry) return;

    const { room, gameState, gameLoop } = entry;

    // 게임 진행 중이면 해당 플레이어 사망 처리
    if (room.state === 'playing' && gameState) {
      const player = gameState.players.get(socket.id);
      if (player && player.alive) {
        gameState._killPlayer(player);

        io.to(room.code).emit(EVENTS.PLAYER_DIED, {
          playerId: socket.id,
          name:     player.name,
        });

        // 승자가 결정됐으면 라운드 종료 (game_end 포함)
        const winner = gameState.getWinner();
        if (winner !== null && gameLoop) {
          gameLoop.endRound(winner);
        }
      }
    }

    room.removePlayer(socket.id);

    // 방이 비면 삭제
    if (room.players.size === 0) {
      if (gameLoop) gameLoop.stop();
      rooms.delete(room.code);
      console.log(`[room_deleted] code=${room.code}`);
    } else {
      // 방장 변경 등 갱신된 정보 브로드캐스트
      io.to(room.code).emit(EVENTS.ROOM_JOINED, room.toJSON());
    }
  });
});

// ─────────────────────────────────────────────
//  서버 시작
// ─────────────────────────────────────────────

server.listen(PORT, () => {
  console.log(`4p-pacman server listening on http://localhost:${PORT}`);
});
