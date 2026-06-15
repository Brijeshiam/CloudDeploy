'use strict';

/**
 * src/modules/kubernetes/k8s.controller.js
 */

const k8sService = require('./k8s.service');
const Project = require('../../models/Project');
const Deployment = require('../../models/Deployment');
const asyncHandler = require('../../middleware/asyncHandler');
const { success, error } = require('../../utils/apiResponse');

/**
 * GET /api/projects/:id/k8s/pods
 */
const getPods = asyncHandler(async (req, res) => {
  const project = await Project.findOne({ _id: req.params.id, userId: req.user._id });
  if (!project) return error(res, 'Project not found.', 404);

  const pods = await k8sService.getPods(project.slug);
  return success(res, pods, 'Pods retrieved.');
});

/**
 * GET /api/projects/:id/k8s/logs/:podName
 * Streams pod logs via SSE (text/event-stream)
 */
const streamPodLogs = asyncHandler(async (req, res) => {
  const project = await Project.findOne({ _id: req.params.id, userId: req.user._id });
  if (!project) return error(res, 'Project not found.', 404);

  const { podName } = req.params;

  // Set up SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  res.write('event: connected\ndata: {}\n\n');

  await k8sService.streamPodLogs(
    project.slug,
    podName,
    (line) => {
      res.write(`data: ${JSON.stringify({ line })}\n\n`);
    },
    () => {
      res.write('event: end\ndata: {}\n\n');
      res.end();
    }
  );

  req.on('close', () => res.end());
});

/**
 * POST /api/projects/:id/k8s/restart
 */
const restartDeployment = asyncHandler(async (req, res) => {
  const project = await Project.findOne({ _id: req.params.id, userId: req.user._id });
  if (!project) return error(res, 'Project not found.', 404);

  await k8sService.restartDeployment(project.slug);
  return success(res, null, 'Rolling restart triggered.');
});

/**
 * POST /api/projects/:id/k8s/scale
 */
const scaleDeployment = asyncHandler(async (req, res) => {
  const { replicas } = req.body;
  if (typeof replicas !== 'number' || replicas < 0 || replicas > 50) {
    return error(res, 'replicas must be a number between 0 and 50.', 400);
  }

  const project = await Project.findOne({ _id: req.params.id, userId: req.user._id });
  if (!project) return error(res, 'Project not found.', 404);

  await k8sService.scaleDeployment(project.slug, replicas);
  project.replicas = replicas;
  await project.save();

  // If scaled to 0, mark the latest running/active deployment as stopped
  if (replicas === 0) {
    const latestDeployment = await Deployment.findOne({ projectId: project._id, status: { $nin: ['stopped', 'failed'] } })
      .sort({ version: -1 });
    if (latestDeployment) {
      latestDeployment.status = 'stopped';
      latestDeployment.completedAt = new Date();
      await latestDeployment.save();
    }
  }

  return success(res, { replicas }, `Scaled to ${replicas} replicas.`);
});

/**
 * POST /api/projects/:id/k8s/rollback
 * Body: { deploymentId } — rolls back to that deployment's image
 */
const rollbackDeployment = asyncHandler(async (req, res) => {
  const { deploymentId } = req.body;
  if (!deploymentId) return error(res, 'deploymentId is required.', 400);

  const project = await Project.findOne({ _id: req.params.id, userId: req.user._id });
  if (!project) return error(res, 'Project not found.', 404);

  const deployment = await Deployment.findOne({ _id: deploymentId, projectId: project._id });
  if (!deployment || !deployment.imageTag) {
    return error(res, 'Deployment not found or has no image tag.', 404);
  }

  await k8sService.rollbackDeployment(project.slug, deployment.imageTag);
  return success(res, { imageTag: deployment.imageTag }, `Rolled back to version ${deployment.version}.`);
});

module.exports = { getPods, streamPodLogs, restartDeployment, scaleDeployment, rollbackDeployment };
