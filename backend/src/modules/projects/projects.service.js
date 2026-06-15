'use strict';

/**
 * src/modules/projects/projects.service.js
 * Business logic for project management.
 */

const Project = require('../../models/Project');
const Deployment = require('../../models/Deployment');
const EnvVariable = require('../../models/EnvVariable');
const k8sService = require('../kubernetes/k8s.service');

/**
 * listProjects
 * Paginated list of non-deleted projects for a user.
 * Supports search by name and filter by status.
 */
async function listProjects({ userId, page = 1, limit = 10, search = '', status }) {
  const query = {
    userId,
    status: { $ne: 'deleted' },
  };

  if (status && status !== 'deleted') {
    query.status = status;
  }

  if (search) {
    query.$text = { $search: search };
  }

  const skip = (page - 1) * limit;

  const [projects, total] = await Promise.all([
    Project.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Project.countDocuments(query),
  ]);

  // Attach the latest deployment to each project
  const projectIds = projects.map((p) => p._id);
  const latestDeployments = await Deployment.aggregate([
    { $match: { projectId: { $in: projectIds } } },
    { $sort: { version: -1 } },
    { $group: { _id: '$projectId', deployment: { $first: '$$ROOT' } } },
  ]);

  const deploymentMap = {};
  latestDeployments.forEach((d) => {
    deploymentMap[d._id.toString()] = d.deployment;
  });

  const enriched = projects.map((p) => ({
    ...p,
    latestDeployment: deploymentMap[p._id.toString()] || null,
  }));

  return { projects: enriched, total };
}

/**
 * createProject
 */
async function createProject(userId, data) {
  const project = await Project.create({ userId, ...data });
  return project;
}

/**
 * getProjectById
 * Returns the project if owned by userId (or admin).
 */
async function getProjectById(projectId, userId, isAdmin = false) {
  const query = { _id: projectId, status: { $ne: 'deleted' } };
  if (!isAdmin) query.userId = userId;

  const project = await Project.findOne(query);
  if (!project) return null;

  // Attach latest deployment
  const latestDeployment = await Deployment.findOne({ projectId })
    .sort({ version: -1 });

  return { project, latestDeployment };
}

/**
 * updateProject
 */
async function updateProject(projectId, userId, updates) {
  const project = await Project.findOneAndUpdate(
    { _id: projectId, userId, status: { $ne: 'deleted' } },
    { $set: updates },
    { new: true, runValidators: true }
  );
  return project;
}

/**
 * deleteProject
 * Soft-delete project and clean up K8s resources.
 */
async function deleteProject(projectId, userId) {
  const project = await Project.findOne({ _id: projectId, userId });
  if (!project) return null;

  // Mark as deleted
  project.status = 'deleted';
  await project.save();

  // Clean up Kubernetes resources in background (don't await to avoid timeout)
  k8sService.cleanupProject(project.slug).catch((err) => {
    console.error(`[K8s] Cleanup failed for project ${project.slug}:`, err.message);
  });

  return project;
}

/**
 * archiveProject
 */
async function archiveProject(projectId, userId) {
  return Project.findOneAndUpdate(
    { _id: projectId, userId, status: 'active' },
    { $set: { status: 'archived' } },
    { new: true }
  );
}

/**
 * restoreProject
 */
async function restoreProject(projectId, userId) {
  return Project.findOneAndUpdate(
    { _id: projectId, userId, status: 'archived' },
    { $set: { status: 'active' } },
    { new: true }
  );
}

module.exports = {
  listProjects,
  createProject,
  getProjectById,
  updateProject,
  deleteProject,
  archiveProject,
  restoreProject,
};
