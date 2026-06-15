'use strict';

/**
 * src/modules/deployments/deployments.service.js
 * Core deployment orchestration: creates Deployment records and queues jobs.
 */

const Deployment = require('../../models/Deployment');
const Project = require('../../models/Project');
const { deploymentQueue } = require('../../jobs/deploymentQueue');
const { emitToDeployment, emitToProject } = require('../../config/socket');
const { generatePublicUrl } = require('../../utils/generatePublicUrl');

/**
 * triggerDeployment
 * Creates a Deployment record and adds it to the BullMQ queue.
 *
 * @param {string} projectId
 * @param {string} userId
 * @param {{ triggeredBy?: string, commitSha?: string, commitMessage?: string }} options
 * @returns {Promise<Deployment>}
 */
async function triggerDeployment(projectId, userId, options = {}) {
  const project = await Project.findById(projectId);
  if (!project) throw new Error('Project not found.');
  if (project.status !== 'active') throw new Error('Project is not active.');

  // Get next version number
  const version = await Deployment.nextVersion(projectId);

  // Build image tag: registry/username/slug:v<version>
  const { DOCKER_REGISTRY, DOCKER_USERNAME } = require('../../config/env');
  const imageTag = `${DOCKER_REGISTRY === 'docker.io' ? '' : DOCKER_REGISTRY + '/'}${DOCKER_USERNAME}/${project.slug}:v${version}`;

  // Create deployment record
  const deployment = await Deployment.create({
    projectId,
    userId,
    version,
    imageTag,
    status: 'queued',
    triggeredBy: options.triggeredBy || 'manual',
    commitSha: options.commitSha,
    commitMessage: options.commitMessage,
  });

  // Increment project deployment count
  await Project.findByIdAndUpdate(projectId, { $inc: { deploymentCount: 1 } });

  // Add to BullMQ queue
  const job = await deploymentQueue.add(
    'deploy',
    {
      deploymentId: deployment._id.toString(),
      projectId: projectId.toString(),
      userId: userId.toString(),
    },
    {
      jobId: `deploy-${deployment._id}`,
      attempts: 1,          // no automatic retries — failures should be explicit
      removeOnComplete: 100,
      removeOnFail: 200,
    }
  );

  // Store job ID in deployment
  deployment.jobId = job.id;
  await deployment.save();

  // Notify clients of new queued deployment
  try {
    emitToProject(projectId.toString(), 'deployment:queued', {
      deploymentId: deployment._id,
      version,
      status: 'queued',
    });
  } catch {}

  return deployment;
}

/**
 * updateDeploymentStatus
 * Updates a deployment's status and emits a socket event.
 *
 * @param {string} deploymentId
 * @param {string} status
 * @param {object} extras  Additional fields to update (error, completedAt, etc.)
 * @returns {Promise<Deployment>}
 */
async function updateDeploymentStatus(deploymentId, status, extras = {}) {
  const update = { status, ...extras };

  // Set timestamps based on status transition
  if (status === 'building' && !extras.startedAt) {
    update.startedAt = new Date();
  }

  if (['running', 'failed', 'stopped'].includes(status) && !extras.completedAt) {
    update.completedAt = new Date();
  }

  const deployment = await Deployment.findByIdAndUpdate(
    deploymentId,
    { $set: update },
    { new: true }
  );

  if (!deployment) return null;

  // Emit to socket rooms
  const payload = {
    deploymentId,
    status,
    ...extras,
    updatedAt: new Date(),
  };

  try {
    emitToDeployment(deploymentId, 'deployment:status', payload);
    emitToProject(deployment.projectId.toString(), 'deployment:status', payload);
  } catch {}

  return deployment;
}

/**
 * listDeployments
 * Paginated list of deployments for a project.
 */
async function listDeployments(projectId, userId, { page = 1, limit = 10, isAdmin = false } = {}) {
  // Verify project ownership
  const projectQuery = { _id: projectId };
  if (!isAdmin) projectQuery.userId = userId;

  const project = await Project.findOne(projectQuery);
  if (!project) throw new Error('Project not found.');

  const skip = (page - 1) * limit;

  const [deployments, total] = await Promise.all([
    Deployment.find({ projectId }).sort({ version: -1 }).skip(skip).limit(limit).lean(),
    Deployment.countDocuments({ projectId }),
  ]);

  return { deployments, total };
}

/**
 * getDeploymentById
 */
async function getDeploymentById(deploymentId, userId, isAdmin = false) {
  const deployment = await Deployment.findById(deploymentId)
    .populate('projectId', 'name slug status')
    .lean();

  if (!deployment) return null;

  if (!isAdmin && String(deployment.userId) !== String(userId)) return null;

  return deployment;
}

/**
 * stopDeployment
 * Marks a deployment as stopped (does not remove K8s resources).
 */
async function stopDeployment(deploymentId, userId) {
  const deployment = await Deployment.findOne({
    _id: deploymentId,
    userId,
    status: { $in: ['queued', 'building', 'pushing', 'deploying', 'running'] },
  });

  if (!deployment) return null;

  return updateDeploymentStatus(deploymentId, 'stopped', {
    completedAt: new Date(),
    error: 'Manually stopped.',
  });
}

module.exports = {
  triggerDeployment,
  updateDeploymentStatus,
  listDeployments,
  getDeploymentById,
  stopDeployment,
};
