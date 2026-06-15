'use strict';

/**
 * src/routes/index.js
 * Central router — mounts all module routers.
 *
 * Route map:
 *   /api/auth                                  — authentication
 *   /api/projects                              — project CRUD
 *   /api/projects/:projectId/deployments       — deployment triggers per project
 *   /api/projects/:projectId/env               — environment variables
 *   /api/projects/:projectId/autoscaling       — HPA management
 *   /api/projects/:id/k8s                      — Kubernetes operations
 *   /api/deployments/:id                       — single deployment + stop
 *   /api/deployments/:id/logs                  — deployment logs
 *   /api/projects/:id/runtime-logs             — SSE runtime logs
 *   /api/projects/:id/metrics                  — Prometheus metrics proxy
 *   /metrics                                   — prom-client endpoint
 *   /api/admin                                 — admin panel
 *   /api/webhooks                              — GitHub webhooks
 */

const router = require('express').Router();

// ─── Module routers ───────────────────────────────────────────────────────────
const authRoutes           = require('../modules/auth/auth.routes');
const projectsRoutes       = require('../modules/projects/projects.routes');
const deploymentsRoutes    = require('../modules/deployments/deployments.routes');
const envvarsRoutes        = require('../modules/envvars/envvars.routes');
const autoscalingRoutes    = require('../modules/autoscaling/autoscaling.routes');
const k8sRoutes            = require('../modules/kubernetes/k8s.routes');
const logsRoutes           = require('../modules/logs/logs.routes');
const monitoringRoutes     = require('../modules/monitoring/monitoring.routes');
const adminRoutes          = require('../modules/admin/admin.routes');
const webhookRoutes        = require('../modules/github/github.routes');

// ── Standalone deployment get + stop routes (not nested under project) ────────
const { authenticate } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const deploymentsService = require('../modules/deployments/deployments.service');
const { success, error } = require('../utils/apiResponse');

router.get(
  '/deployments/:id',
  authenticate,
  asyncHandler(async (req, res) => {
    const deployment = await deploymentsService.getDeploymentById(
      req.params.id,
      req.user._id,
      req.user.role === 'admin'
    );
    if (!deployment) return error(res, 'Deployment not found.', 404);
    return success(res, deployment, 'Deployment retrieved.');
  })
);

router.post(
  '/deployments/:id/stop',
  authenticate,
  asyncHandler(async (req, res) => {
    const deployment = await deploymentsService.stopDeployment(req.params.id, req.user._id);
    if (!deployment) return error(res, 'Deployment not found or cannot be stopped.', 404);
    return success(res, deployment, 'Deployment stopped.');
  })
);

// ─── Mount routers ────────────────────────────────────────────────────────────

router.use('/auth',                                           authRoutes);
router.use('/projects',                                       projectsRoutes);
router.use('/projects/:projectId/deployments',                deploymentsRoutes);
router.use('/projects/:projectId/env',                        envvarsRoutes);
router.use('/projects/:id/autoscaling',                       autoscalingRoutes);
router.use('/projects/:id/k8s',                               k8sRoutes);
router.use('/',                                               logsRoutes);     // contains /api/deployments/:id/logs and /api/projects/:id/runtime-logs
router.use('/',                                               monitoringRoutes); // /api/projects/:id/metrics
router.use('/admin',                                          adminRoutes);
router.use('/webhooks',                                       webhookRoutes);

module.exports = router;
