'use strict';

/**
 * src/modules/logs/logs.service.js
 * Log management: saving to DB, socket emission, SSE streaming.
 */

const Log = require('../../models/Log');
const { emitToDeployment, emitToProject } = require('../../config/socket');
const k8sService = require('../kubernetes/k8s.service');

/**
 * addLog
 * Saves a log entry to MongoDB and emits it via Socket.io.
 *
 * @param {string} deploymentId
 * @param {string} projectId
 * @param {'info'|'warn'|'error'|'debug'} level
 * @param {string} message
 * @param {'build'|'push'|'deploy'|'runtime'} source
 * @returns {Promise<Log>}
 */
async function addLog(deploymentId, projectId, level, message, source) {
  const log = await Log.create({
    deploymentId,
    projectId,
    level,
    message,
    source,
    timestamp: new Date(),
  });

  // Emit to Socket.io rooms
  const payload = {
    id: log._id,
    level,
    message,
    source,
    timestamp: log.timestamp,
  };

  try {
    emitToDeployment(String(deploymentId), 'log', payload);
    emitToProject(String(projectId), 'log', payload);
  } catch {
    // Socket.io may not be initialized in test environment
  }

  return log;
}

/**
 * getDeploymentLogs
 * Paginated log retrieval for a deployment.
 *
 * @param {string} deploymentId
 * @param {number} page    1-indexed
 * @param {number} limit   Records per page
 * @param {string} [source]  Optional source filter
 * @returns {Promise<{ logs: Log[], total: number }>}
 */
async function getDeploymentLogs(deploymentId, page = 1, limit = 100, source) {
  const query = { deploymentId };
  if (source) query.source = source;

  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    Log.find(query).sort({ timestamp: 1 }).skip(skip).limit(limit).lean(),
    Log.countDocuments(query),
  ]);

  return { logs, total };
}

/**
 * streamRuntimeLogs
 * Streams runtime pod logs to the HTTP response via Server-Sent Events (SSE).
 * Uses Kubernetes pod log streaming under the hood.
 *
 * @param {string} projectId
 * @param {string} projectSlug
 * @param {import('express').Response} res
 */
async function streamRuntimeLogs(projectId, projectSlug, res) {
  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  res.write('event: connected\ndata: {}\n\n');

  try {
    // Get running pods for this project
    const pods = await k8sService.getPods(projectSlug);
    const runningPod = pods.find((p) => p.status === 'Running' || p.ready);

    if (!runningPod) {
      res.write(`data: ${JSON.stringify({ line: 'No running pods found.', level: 'warn' })}\n\n`);
      res.write('event: end\ndata: {}\n\n');
      res.end();
      return;
    }

    await k8sService.streamPodLogs(
      projectSlug,
      runningPod.name,
      (line) => {
        res.write(`data: ${JSON.stringify({ line, source: 'runtime' })}\n\n`);
      },
      () => {
        res.write('event: end\ndata: {}\n\n');
        res.end();
      }
    );
  } catch (err) {
    res.write(`data: ${JSON.stringify({ line: `Error: ${err.message}`, level: 'error' })}\n\n`);
    res.end();
  }
}

module.exports = { addLog, getDeploymentLogs, streamRuntimeLogs };
