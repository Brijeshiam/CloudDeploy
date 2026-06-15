'use strict';

/**
 * src/modules/envvars/envvars.controller.js
 */

const envvarsService = require('./envvars.service');
const asyncHandler = require('../../middleware/asyncHandler');
const { success, error } = require('../../utils/apiResponse');
const Project = require('../../models/Project');

// Verify project ownership helper
async function verifyProject(projectId, userId, isAdmin) {
  const query = { _id: projectId, status: { $ne: 'deleted' } };
  if (!isAdmin) query.userId = userId;
  return Project.findOne(query);
}

const listEnvVars = asyncHandler(async (req, res) => {
  const project = await verifyProject(req.params.projectId, req.user._id, req.user.role === 'admin');
  if (!project) return error(res, 'Project not found.', 404);

  const vars = await envvarsService.listEnvVars(req.params.projectId);
  return res.status(200).json({ success: true, envVars: vars });
});

const createEnvVar = asyncHandler(async (req, res) => {
  const project = await verifyProject(req.params.projectId, req.user._id, req.user.role === 'admin');
  if (!project) return error(res, 'Project not found.', 404);

  const { key, value, isSecret } = req.body;
  if (!key || value === undefined) {
    return error(res, 'key and value are required.', 400);
  }

  const envVar = await envvarsService.createEnvVar(req.params.projectId, { key, value, isSecret });
  return success(res, envVar, 'Environment variable created.', 201);
});

const updateEnvVar = asyncHandler(async (req, res) => {
  const project = await verifyProject(req.params.projectId, req.user._id, req.user.role === 'admin');
  if (!project) return error(res, 'Project not found.', 404);

  const envVar = await envvarsService.updateEnvVar(req.params.projectId, req.params.varId, req.body);
  if (!envVar) return error(res, 'Environment variable not found.', 404);
  return success(res, envVar, 'Environment variable updated.');
});

const deleteEnvVar = asyncHandler(async (req, res) => {
  const project = await verifyProject(req.params.projectId, req.user._id, req.user.role === 'admin');
  if (!project) return error(res, 'Project not found.', 404);

  const result = await envvarsService.deleteEnvVar(req.params.projectId, req.params.varId);
  if (!result) return error(res, 'Environment variable not found.', 404);
  return res.status(200).json({ success: true });
});

const upsertEnvVars = asyncHandler(async (req, res) => {
  const project = await verifyProject(req.params.projectId, req.user._id, req.user.role === 'admin');
  if (!project) return error(res, 'Project not found.', 404);

  const { envVars } = req.body;
  if (!Array.isArray(envVars)) {
    return error(res, 'envVars is required and must be an array.', 400);
  }

  const updatedVars = await envvarsService.upsertEnvVars(req.params.projectId, envVars);
  return res.status(200).json({ success: true, envVars: updatedVars });
});

const syncEnvVars = asyncHandler(async (req, res) => {
  const project = await verifyProject(req.params.projectId, req.user._id, req.user.role === 'admin');
  if (!project) return error(res, 'Project not found.', 404);

  await envvarsService.syncToK8s(req.params.projectId);
  return success(res, null, 'Environment variables synced to Kubernetes.');
});

module.exports = { listEnvVars, createEnvVar, updateEnvVar, deleteEnvVar, upsertEnvVars, syncEnvVars };
