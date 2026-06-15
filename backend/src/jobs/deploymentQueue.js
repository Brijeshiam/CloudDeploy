'use strict';

/**
 * src/jobs/deploymentQueue.js
 * BullMQ Queue for deployment jobs.
 * Workers pick up jobs from this queue to execute the full CI/CD pipeline.
 */

const { Queue } = require('bullmq');
const { redisConnection } = require('../config/redis');

/**
 * deploymentQueue
 * Queue named 'deployments'. Each job carries:
 *  { deploymentId, projectId, userId }
 */
const deploymentQueue = new Queue('deployments', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 1,            // explicit failures — no silent retries
    removeOnComplete: {
      count: 100,           // keep last 100 completed jobs
    },
    removeOnFail: {
      count: 200,           // keep last 200 failed jobs for inspection
    },
  },
});

deploymentQueue.on('error', (err) => {
  // BullMQ emits a non-fatal version warning — just log it, don't crash
  if (err.message && err.message.includes('Redis version needs to be greater')) {
    console.warn('[DeploymentQueue] ⚠️  BullMQ warning (non-fatal):', err.message);
    return;
  }
  console.error('[DeploymentQueue] Queue error:', err.message);
});

console.log('✅  Deployment queue initialized.');

module.exports = { deploymentQueue };
