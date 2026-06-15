'use strict';

/**
 * src/server.js
 * Entry point for the CloudDeploy backend.
 *
 * Startup sequence:
 *  1. Load & validate environment variables (config/env.js)
 *  2. Connect to MongoDB
 *  3. Connect to Redis
 *  4. Create HTTP server
 *  5. Attach Socket.io to HTTP server
 *  6. Start BullMQ deployment worker
 *  7. Listen on PORT
 */

// ─── Step 1: Load env first (before any other imports) ───────────────────────
const env = require('./config/env');

const http = require('http');
const app = require('./app');
const { connectDB } = require('./config/db');
const { connectRedis } = require('./config/redis');
const { initSocket } = require('./config/socket');

const { PORT } = env;

// ─── Graceful shutdown handler ────────────────────────────────────────────────
let server;

async function gracefulShutdown(signal) {
  console.log(`\n🛑  ${signal} received. Shutting down gracefully…`);

  // Stop accepting new connections
  server.close(async () => {
    console.log('   HTTP server closed.');

    try {
      // Close worker (stop processing new jobs)
      const { deploymentWorker } = require('./jobs/deploymentWorker');
      await deploymentWorker.close();
      console.log('   Deployment worker closed.');
    } catch (err) {
      console.warn('   Worker close error:', err.message);
    }

    try {
      const mongoose = require('mongoose');
      await mongoose.connection.close();
      console.log('   MongoDB connection closed.');
    } catch (err) {
      console.warn('   MongoDB close error:', err.message);
    }

    console.log('✅  Graceful shutdown complete.');
    process.exit(0);
  });

  // Force exit if graceful shutdown takes too long
  setTimeout(() => {
    console.error('❌  Forced shutdown after timeout.');
    process.exit(1);
  }, 30000);
}

// ─── Main startup ─────────────────────────────────────────────────────────────
async function start() {
  try {
    console.log('🚀  Starting CloudDeploy backend…');

    // Step 2: Connect MongoDB
    await connectDB();

    // Step 3: Connect Redis (non-blocking if Redis is slow to connect)
    await connectRedis();

    // Step 4: Create HTTP server from Express app
    server = http.createServer(app);

    // Step 5: Attach Socket.io
    initSocket(server);

    // Step 6: Start BullMQ deployment worker
    // Lazy-require so Redis is connected first
    require('./jobs/deploymentWorker');

    // Step 7: Listen
    server.listen(PORT, () => {
      console.log(`✅  CloudDeploy API listening on port ${PORT}`);
      console.log(`   Mode:        ${env.NODE_ENV}`);
      console.log(`   Frontend:    ${env.FRONTEND_URL}`);
      console.log(`   Base domain: ${env.BASE_DOMAIN}`);
      console.log(`   Health:      http://localhost:${PORT}/health`);
    });

    // Handle server errors
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌  Port ${PORT} is already in use.`);
        process.exit(1);
      }
      throw err;
    });

    // ─── Process signal handlers ───────────────────────────────────────────
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // ─── Unhandled rejection / exception handlers ──────────────────────────
    process.on('unhandledRejection', (reason, promise) => {
      // Suppress known non-fatal BullMQ Redis version warnings
      if (reason && reason.message && reason.message.includes('Redis version needs to be greater')) {
        console.warn('\u26a0\ufe0f  BullMQ version warning suppressed (non-fatal):', reason.message);
        return;
      }
      console.error('\u274c  Unhandled Promise Rejection:', reason);
      // In production, exit and let the process manager restart
      if (env.IS_PRODUCTION) {
        gracefulShutdown('unhandledRejection');
      }
    });

    process.on('uncaughtException', (err) => {
      // Suppress known non-fatal BullMQ Redis version warnings
      if (err.message && err.message.includes('Redis version needs to be greater')) {
        console.warn('\u26a0\ufe0f  BullMQ version warning suppressed (non-fatal):', err.message);
        return;
      }
      console.error('\u274c  Uncaught Exception:', err);
      gracefulShutdown('uncaughtException');
    });

  } catch (err) {
    console.error('❌  Failed to start server:', err.message);
    process.exit(1);
  }
}

start();
