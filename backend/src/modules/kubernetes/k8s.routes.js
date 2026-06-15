'use strict';

/**
 * src/modules/kubernetes/k8s.routes.js
 * K8s management routes — /api/projects/:id/k8s
 */

const router = require('express').Router({ mergeParams: true });
const { authenticate } = require('../../middleware/auth');
const {
  getPods, streamPodLogs, restartDeployment, scaleDeployment, rollbackDeployment,
} = require('./k8s.controller');

router.use(authenticate);

router.get('/pods',             getPods);
router.get('/logs/:podName',    streamPodLogs);
router.post('/restart',         restartDeployment);
router.post('/scale',           scaleDeployment);
router.post('/rollback',        rollbackDeployment);

module.exports = router;
