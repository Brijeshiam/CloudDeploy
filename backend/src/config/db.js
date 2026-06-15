'use strict';

/**
 * src/config/db.js
 * Establishes and manages the MongoDB connection via Mongoose.
 * Includes reconnection logic and event-based logging.
 */

const mongoose = require('mongoose');
const { MONGODB_URI, IS_PRODUCTION } = require('./env');

// ─── Connection options ───────────────────────────────────────────────────────
const MONGO_OPTIONS = {
  maxPoolSize: 10,         // max concurrent connections
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
};

// Track reconnection attempts
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_INTERVAL_MS = 5000;

/**
 * connectDB
 * Connects to MongoDB. Called once at server startup.
 * @returns {Promise<void>}
 */
async function connectDB() {
  // Suppress verbose Mongoose query logs in production
  mongoose.set('debug', !IS_PRODUCTION);

  try {
    await mongoose.connect(MONGODB_URI, MONGO_OPTIONS);
    reconnectAttempts = 0;
    console.log(`✅  MongoDB connected: ${mongoose.connection.host}`);
  } catch (err) {
    console.error('❌  MongoDB initial connection error:', err.message);
    await handleReconnect();
  }
}

/**
 * handleReconnect
 * Attempts to reconnect with exponential back-off up to MAX_RECONNECT_ATTEMPTS.
 */
async function handleReconnect() {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
    console.error('❌  MongoDB max reconnection attempts reached. Exiting process.');
    process.exit(1);
  }

  reconnectAttempts += 1;
  const delay = RECONNECT_INTERVAL_MS * reconnectAttempts;
  console.log(`🔄  MongoDB reconnecting (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}) in ${delay / 1000}s…`);

  await new Promise((resolve) => setTimeout(resolve, delay));

  try {
    await mongoose.connect(MONGODB_URI, MONGO_OPTIONS);
    reconnectAttempts = 0;
    console.log(`✅  MongoDB reconnected successfully.`);
  } catch (err) {
    console.error(`❌  MongoDB reconnection attempt ${reconnectAttempts} failed:`, err.message);
    await handleReconnect();
  }
}

// ─── Mongoose event listeners ─────────────────────────────────────────────────
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️   MongoDB disconnected. Attempting to reconnect…');
  handleReconnect().catch(console.error);
});

mongoose.connection.on('error', (err) => {
  console.error('❌  MongoDB connection error:', err.message);
});

mongoose.connection.on('reconnected', () => {
  console.log('✅  MongoDB successfully reconnected.');
  reconnectAttempts = 0;
});

// ─── Graceful shutdown ────────────────────────────────────────────────────────
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('🛑  MongoDB connection closed on app termination.');
  process.exit(0);
});

module.exports = { connectDB };
