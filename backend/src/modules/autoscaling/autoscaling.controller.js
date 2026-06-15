'use strict';

/**
 * src/modules/autoscaling/autoscaling.controller.js
 */

const autoscalingService = require('./autoscaling.service');
const Project = require('../../models/Project');
const asyncHandler = require('../../middleware/asyncHandler');
const { success, error } = require('../../utils/apiResponse');

async function getProject(projectId, userId, isAdmin) {
  const query = { _id: projectId, status: { $ne: 'deleted' } };
  if (!isAdmin) query.userId = userId;
  return Project.findOne(query);
}

const getAutoscaling = asyncHandler(async (req, res) => {
  const project = await getProject(req.params.id, req.user._id, req.user.role === 'admin');
  if (!project) return error(res, 'Project not found.', 404);

  const hpa = await autoscalingService.getHPA(project.slug);
  if (!hpa) return success(res, null, 'No autoscaling configured for this project.');
  return success(res, hpa, 'Autoscaling config retrieved.');
});

const updateAutoscaling = asyncHandler(async (req, res) => {
  const project = await getProject(req.params.id, req.user._id, req.user.role === 'admin');
  if (!project) return error(res, 'Project not found.', 404);

  const { minReplicas, maxReplicas, cpuThreshold } = req.body;

  if (maxReplicas !== undefined && minReplicas !== undefined && maxReplicas < minReplicas) {
    return error(res, 'maxReplicas must be >= minReplicas.', 400);
  }

  const config = await autoscalingService.upsertHPA(project.slug, { minReplicas, maxReplicas, cpuThreshold });
  return success(res, config, 'Autoscaling updated.');
});

const deleteAutoscaling = asyncHandler(async (req, res) => {
  const project = await getProject(req.params.id, req.user._id, req.user.role === 'admin');
  if (!project) return error(res, 'Project not found.', 404);

  await autoscalingService.removeHPA(project.slug);
  return success(res, null, 'Autoscaling disabled.');
});

module.exports = { getAutoscaling, updateAutoscaling, deleteAutoscaling };
