'use strict';

/**
 * src/modules/logs/logs.routes.js
 */

const router = require('express').Router();
const { authenticate } = require('../../middleware/auth');
const { getLogsForDeployment, streamLogs } = require('./logs.controller');

router.use(authenticate);

// GET /api/deployments/:id/logs
router.get('/deployments/:id/logs', getLogsForDeployment);

// GET /api/projects/:id/runtime-logs  (SSE)
router.get('/projects/:id/runtime-logs', streamLogs);

module.exports = router;
