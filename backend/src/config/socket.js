'use strict';

/**
 * src/config/socket.js
 * Initializes Socket.io server on the HTTP server.
 *
 * Features:
 *  - JWT auth middleware on connection
 *  - Room management: deployment:<id> and project:<id>
 *  - Helper emitters exported for use across modules
 */

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { JWT_SECRET, FRONTEND_URL } = require('./env');

/** @type {Server} */
let io;

/**
 * initSocket
 * Attach Socket.io to the HTTP server.
 * @param {import('http').Server} httpServer
 * @returns {Server}
 */
function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: FRONTEND_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // ─── Authentication middleware ─────────────────────────────────────────────
  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication error: no token provided.'));
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Authentication error: invalid or expired token.'));
    }
  });

  // ─── Connection handler ────────────────────────────────────────────────────
  io.on('connection', (socket) => {
    console.log(`🔌  Socket connected: ${socket.id} (user: ${socket.user?.id})`);

    // Client joins a deployment room
    socket.on('join:deployment', (deploymentId) => {
      const room = `deployment:${deploymentId}`;
      socket.join(room);
      console.log(`   → ${socket.id} joined room ${room}`);
    });

    // Client joins a project room
    socket.on('join:project', (projectId) => {
      const room = `project:${projectId}`;
      socket.join(room);
      console.log(`   → ${socket.id} joined room ${room}`);
    });

    // Client leaves rooms
    socket.on('leave:deployment', (deploymentId) => {
      socket.leave(`deployment:${deploymentId}`);
    });

    socket.on('leave:project', (projectId) => {
      socket.leave(`project:${projectId}`);
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔌  Socket disconnected: ${socket.id} (reason: ${reason})`);
    });
  });

  console.log('✅  Socket.io initialized.');
  return io;
}

// ─── Emitter helpers ──────────────────────────────────────────────────────────

/**
 * emitToDeployment
 * Emit an event to all clients in a deployment room.
 * @param {string} deploymentId
 * @param {string} event
 * @param {*} data
 */
function emitToDeployment(deploymentId, event, data) {
  if (!io) return;
  io.to(`deployment:${deploymentId}`).emit(event, data);
}

/**
 * emitToProject
 * Emit an event to all clients in a project room.
 * @param {string} projectId
 * @param {string} event
 * @param {*} data
 */
function emitToProject(projectId, event, data) {
  if (!io) return;
  io.to(`project:${projectId}`).emit(event, data);
}

/**
 * getIO
 * Returns the Socket.io server instance.
 * @returns {Server}
 */
function getIO() {
  if (!io) throw new Error('Socket.io not initialized. Call initSocket() first.');
  return io;
}

module.exports = { initSocket, emitToDeployment, emitToProject, getIO };
