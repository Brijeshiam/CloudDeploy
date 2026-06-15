'use strict';

/**
 * src/modules/monitoring/monitoring.routes.js
 */

const router = require('express').Router();
const { authenticate } = require('../../middleware/auth');
const asyncHandler = require('../../middleware/asyncHandler');
const { success, error } = require('../../utils/apiResponse');
const { getProjectMetrics, getBackendMetrics, getContentType } = require('./monitoring.service');
const Project = require('../../models/Project');
const k8sService = require('../kubernetes/k8s.service');

/**
 * GET /api/projects/:id/metrics
 * Returns CPU, memory, and pod count from Prometheus for a project.
 */
router.get(
  '/projects/:id/metrics',
  authenticate,
  asyncHandler(async (req, res) => {
    const project = await Project.findOne({ _id: req.params.id, userId: req.user._id });
    if (!project) return error(res, 'Project not found.', 404);

    const namespace = k8sService.namespaceName(project.slug);
    const metrics = await getProjectMetrics(project.slug, namespace);

    return success(res, metrics, 'Metrics retrieved.');
  })
);

/**
 * GET /metrics
 * Exposes prom-client metrics for scraping by Prometheus.
 * This endpoint is public (or secured via network policy in production).
 */
router.get(
  '/metrics',
  asyncHandler(async (req, res) => {
    res.set('Content-Type', getContentType());
    res.end(await getBackendMetrics());
  })
);

module.exports = router;
