'use strict';

/**
 * src/modules/projects/projects.controller.js
 */

const projectsService = require('./projects.service');
const asyncHandler = require('../../middleware/asyncHandler');
const { success, error, paginated } = require('../../utils/apiResponse');

const listProjects = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 10);
  const search = req.query.search?.trim() || '';
  const status = req.query.status;

  const { projects, total } = await projectsService.listProjects({
    userId: req.user._id,
    page, limit, search, status,
  });

  return paginated(res, projects, total, page, limit, 'Projects retrieved.');
});

const createProject = asyncHandler(async (req, res) => {
  const project = await projectsService.createProject(req.user._id, req.body);
  return success(res, project, 'Project created successfully.', 201);
});

const getProject = asyncHandler(async (req, res) => {
  const result = await projectsService.getProjectById(
    req.params.id,
    req.user._id,
    req.user.role === 'admin'
  );
  if (!result) return error(res, 'Project not found.', 404);
  return success(res, result, 'Project retrieved.');
});

const updateProject = asyncHandler(async (req, res) => {
  const project = await projectsService.updateProject(req.params.id, req.user._id, req.body);
  if (!project) return error(res, 'Project not found.', 404);
  return success(res, project, 'Project updated.');
});

const deleteProject = asyncHandler(async (req, res) => {
  const project = await projectsService.deleteProject(req.params.id, req.user._id);
  if (!project) return error(res, 'Project not found.', 404);
  return success(res, null, 'Project deleted and Kubernetes resources are being cleaned up.');
});

const archiveProject = asyncHandler(async (req, res) => {
  const project = await projectsService.archiveProject(req.params.id, req.user._id);
  if (!project) return error(res, 'Project not found or already archived.', 404);
  return success(res, project, 'Project archived.');
});

const restoreProject = asyncHandler(async (req, res) => {
  const project = await projectsService.restoreProject(req.params.id, req.user._id);
  if (!project) return error(res, 'Project not found or not archived.', 404);
  return success(res, project, 'Project restored.');
});

module.exports = { listProjects, createProject, getProject, updateProject, deleteProject, archiveProject, restoreProject };
