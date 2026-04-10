const { Server } = require('socket.io');

/**
 * WebRTC Signaling Server
 * Handles room management and WebRTC signal exchange
 * Signals: offer, answer, ice-candidate
 */
module.exports = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: true,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Track rooms: roomId → [socketId, ...]
  const rooms = {};

  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // ── Join Room ──────────────────────────────────────────────────────────
    socket.on('join-room', ({ roomId, userName }) => {
      if (!rooms[roomId]) rooms[roomId] = [];

      // Max 2 participants per room
      if (rooms[roomId].length >= 2) {
        socket.emit('room-full', { message: 'Room is full (max 2 participants)' });
        return;
      }

      rooms[roomId].push(socket.id);
      socket.join(roomId);
      socket.data.roomId = roomId;
      socket.data.userName = userName || 'Anonymous';

      console.log(`[Socket] ${userName} joined room ${roomId} (${rooms[roomId].length}/2)`);

      // Tell existing peer a new user joined
      socket.to(roomId).emit('user-joined', {
        socketId: socket.id,
        userName: socket.data.userName,
        participantCount: rooms[roomId].length,
      });

      // Tell the joiner how many are in the room
      socket.emit('room-joined', {
        roomId,
        participantCount: rooms[roomId].length,
        isInitiator: rooms[roomId].length === 1,
      });
    });

    // ── WebRTC Offer ───────────────────────────────────────────────────────
    socket.on('offer', ({ roomId, offer }) => {
      socket.to(roomId).emit('offer', {
        offer,
        from: socket.id,
        userName: socket.data.userName,
      });
    });

    // ── WebRTC Answer ──────────────────────────────────────────────────────
    socket.on('answer', ({ roomId, answer }) => {
      socket.to(roomId).emit('answer', {
        answer,
        from: socket.id,
      });
    });

    // ── ICE Candidate ──────────────────────────────────────────────────────
    socket.on('ice-candidate', ({ roomId, candidate }) => {
      socket.to(roomId).emit('ice-candidate', {
        candidate,
        from: socket.id,
      });
    });

    // ── Chat message during interview ──────────────────────────────────────
    socket.on('chat-message', ({ roomId, message }) => {
      io.to(roomId).emit('chat-message', {
        from: socket.data.userName,
        message,
        time: new Date().toLocaleTimeString(),
      });
    });

    // ── End call ───────────────────────────────────────────────────────────
    socket.on('end-call', ({ roomId }) => {
      socket.to(roomId).emit('call-ended', { from: socket.data.userName });
    });

    // ── Disconnect ─────────────────────────────────────────────────────────
    socket.on('disconnect', () => {
      const roomId = socket.data.roomId;
      if (roomId && rooms[roomId]) {
        rooms[roomId] = rooms[roomId].filter((id) => id !== socket.id);
        if (rooms[roomId].length === 0) delete rooms[roomId];
        socket.to(roomId).emit('user-left', {
          socketId: socket.id,
          userName: socket.data.userName,
        });
        console.log(`[Socket] ${socket.data.userName} left room ${roomId}`);
      }
    });
  });

  console.log('[Socket] WebRTC signaling server initialized');
  return io;
};
