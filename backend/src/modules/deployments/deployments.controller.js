'use strict';

/**
 * src/modules/deployments/deployments.controller.js
 */

const deploymentsService = require('./deployments.service');
const asyncHandler = require('../../middleware/asyncHandler');
const { success, error, paginated } = require('../../utils/apiResponse');

const listDeployments = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 10);

  const { deployments, total } = await deploymentsService.listDeployments(
    req.params.projectId,
    req.user._id,
    { page, limit, isAdmin: req.user.role === 'admin' }
  );

  return paginated(res, deployments, total, page, limit, 'Deployments retrieved.');
});

const getDeployment = asyncHandler(async (req, res) => {
  const deployment = await deploymentsService.getDeploymentById(
    req.params.id,
    req.user._id,
    req.user.role === 'admin'
  );

  if (!deployment) return error(res, 'Deployment not found.', 404);
  return success(res, deployment, 'Deployment retrieved.');
});

const triggerDeploy = asyncHandler(async (req, res) => {
  const deployment = await deploymentsService.triggerDeployment(
    req.params.projectId,
    req.user._id,
    { triggeredBy: 'manual', ...req.body }
  );

  return success(res, deployment, 'Deployment queued successfully.', 202);
});

const stopDeployment = asyncHandler(async (req, res) => {
  const deployment = await deploymentsService.stopDeployment(req.params.id, req.user._id);
  if (!deployment) return error(res, 'Deployment not found or cannot be stopped.', 404);
  return success(res, deployment, 'Deployment stopped.');
});

module.exports = { listDeployments, getDeployment, triggerDeploy, stopDeployment };
