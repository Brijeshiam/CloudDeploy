'use strict';

/**
 * src/config/redis.js
 * Creates and exports an IORedis client and connection config for BullMQ.
 * BullMQ requires a plain connection object (not an IORedis instance) or
 * an IORedis instance. We export both.
 */

const IORedis = require('ioredis');
const { REDIS_URL } = require('./env');

// ─── IORedis client ───────────────────────────────────────────────────────────
const redisClient = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null, // required by BullMQ
  enableReadyCheck: false,    // required by BullMQ
  lazyConnect: true,          // connect on first command
});

// ─── Event logging ────────────────────────────────────────────────────────────
redisClient.on('connect', () => {
  console.log('✅  Redis connected.');
});

redisClient.on('ready', () => {
  console.log('✅  Redis client ready.');
});

redisClient.on('error', (err) => {
  console.error('❌  Redis error:', err.message);
});

redisClient.on('reconnecting', () => {
  console.warn('🔄  Redis reconnecting…');
});

redisClient.on('close', () => {
  console.warn('⚠️   Redis connection closed.');
});

let connectionPromise = null;

async function connectRedis() {
  const status = redisClient.status;
  if (
    status === 'connecting' ||
    status === 'connect' ||
    status === 'ready' ||
    status === 'reconnecting'
  ) {
    return;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = (async () => {
    try {
      await redisClient.connect();
    } catch (err) {
      if (
        err.message.includes('already connecting') ||
        err.message.includes('already connected')
      ) {
        return;
      }
      console.error('❌  Redis initial connection failed:', err.message);
      // IORedis will auto-retry; do not exit process
    } finally {
      connectionPromise = null;
    }
  })();

  return connectionPromise;
}

/**
 * redisConnection — plain connection options object required by BullMQ
 * when NOT passing an IORedis instance. We pass the client instance directly
 * to BullMQ which accepts IORedis instances.
 */
const redisConnection = redisClient;

module.exports = { redisClient, redisConnection, connectRedis };
