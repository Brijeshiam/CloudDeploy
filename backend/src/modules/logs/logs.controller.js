'use strict';

/**
 * src/modules/logs/logs.controller.js
 */

const { getDeploymentLogs, streamRuntimeLogs } = require('./logs.service');
const Deployment = require('../../models/Deployment');
const Project = require('../../models/Project');
const asyncHandler = require('../../middleware/asyncHandler');
const { success, error, paginated } = require('../../utils/apiResponse');

/**
 * GET /api/deployments/:id/logs
 */
const getLogsForDeployment = asyncHandler(async (req, res) => {
  const deployment = await Deployment.findById(req.params.id);
  if (!deployment) return error(res, 'Deployment not found.', 404);

  // Verify ownership
  if (String(deployment.userId) !== String(req.user._id) && req.user.role !== 'admin') {
    return error(res, 'Access denied.', 403);
  }

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(500, parseInt(req.query.limit) || 100);
  const source = req.query.source;

  const { logs, total } = await getDeploymentLogs(req.params.id, page, limit, source);
  return paginated(res, logs, total, page, limit, 'Logs retrieved.');
});

/**
 * GET /api/projects/:id/runtime-logs
 * SSE endpoint for streaming live pod logs
 */
const streamLogs = asyncHandler(async (req, res) => {
  const project = await Project.findOne({ _id: req.params.id, userId: req.user._id });
  if (!project) return error(res, 'Project not found.', 404);

  await streamRuntimeLogs(project._id, project.slug, res);
});

module.exports = { getLogsForDeployment, streamLogs };
