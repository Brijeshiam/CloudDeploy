'use strict';

/**
 * src/modules/deployments/deployments.routes.js
 */

const router = require('express').Router({ mergeParams: true });
const { authenticate } = require('../../middleware/auth');
const { deployLimiter } = require('../../middleware/rateLimiter');
const { listDeployments, getDeployment, triggerDeploy, stopDeployment } = require('./deployments.controller');

router.use(authenticate);

// Nested under /api/projects/:projectId/deployments
router.get('/',    listDeployments);
router.post('/',   deployLimiter, triggerDeploy);

module.exports = router;
