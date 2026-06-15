'use strict';

/**
 * src/jobs/deploymentWorker.js
 * BullMQ Worker — executes the full CI/CD pipeline for each deployment job.
 *
 * Pipeline steps:
 *  1. Set status → building
 *  2. Clone / pull GitHub repository
 *  3. Build Docker image (stream logs)
 *  4. Set status → pushing
 *  5. Push image to Docker Hub (stream logs)
 *  6. Set status → deploying
 *  7. Create K8s namespace (if not exists)
 *  8. Sync env vars → ConfigMap + Secret
 *  9. Create/update Deployment, Service, Ingress, HPA
 * 10. Poll until deployment is ready
 * 11. Set status → running, set publicUrl
 * 12. Send success notification
 * 13. On error → set status → failed, send failure notification
 */

const { Worker } = require('bullmq');
const { redisConnection } = require('../config/redis');
const Deployment = require('../models/Deployment');
const Project = require('../models/Project');
const EnvVariable = require('../models/EnvVariable');

const githubService = require('../modules/github/github.service');
const dockerService = require('../modules/docker/docker.service');
const k8sService = require('../modules/kubernetes/k8s.service');
const { updateDeploymentStatus } = require('../modules/deployments/deployments.service');
const { addLog } = require('../modules/logs/logs.service');
const notificationsService = require('../modules/notifications/notifications.service');
const { generatePublicUrl } = require('../utils/generatePublicUrl');

const DEPLOY_POLL_INTERVAL_MS = 5000;   // 5 seconds between status checks
const DEPLOY_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes max

/**
 * sleep
 * @param {number} ms
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * waitForDeploymentReady
 * Polls Kubernetes until the deployment is available or times out.
 *
 * @param {string} projectSlug
 * @param {string} deploymentId
 * @param {string} projectId
 * @returns {Promise<boolean>} true if ready, false if timed out
 */
async function waitForDeploymentReady(projectSlug, deploymentId, projectId) {
  const deadline = Date.now() + DEPLOY_TIMEOUT_MS;

  while (Date.now() < deadline) {
    await sleep(DEPLOY_POLL_INTERVAL_MS);

    try {
      const status = await k8sService.getDeploymentStatus(projectSlug);
      await addLog(
        deploymentId,
        projectId,
        'info',
        `⏳ Waiting for pods… ready: ${status.ready}/${status.desired}`,
        'deploy'
      );

      if (status.isReady && status.desired > 0) {
        return true;
      }
    } catch (pollErr) {
      await addLog(deploymentId, projectId, 'warn', `Poll error: ${pollErr.message}`, 'deploy');
    }
  }

  return false; // timed out
}

/**
 * processDeployment
 * Main deployment pipeline executed for each BullMQ job.
 */
async function processDeployment(job) {
  const { deploymentId, projectId, userId } = job.data;

  let project;
  let deployment;

  try {
    // ── Load records ────────────────────────────────────────────────────────
    deployment = await Deployment.findById(deploymentId);
    project = await Project.findById(projectId);

    if (!deployment || !project) {
      throw new Error('Deployment or Project record not found.');
    }

    const { imageTag } = deployment;
    const { slug, githubUrl, branch, containerPort, replicas, resourceLimits } = project;

    // ── Step 1: Building ────────────────────────────────────────────────────
    await updateDeploymentStatus(deploymentId, 'building', { startedAt: new Date() });
    await addLog(deploymentId, projectId, 'info', '🚀 Starting deployment pipeline…', 'build');
    await addLog(deploymentId, projectId, 'info', `📦 Project: ${project.name} (${slug})`, 'build');
    await addLog(deploymentId, projectId, 'info', `🏷️  Image tag: ${imageTag}`, 'build');

    // ── Step 2: Clone / pull repository ─────────────────────────────────────
    await addLog(deploymentId, projectId, 'info', `📥 Cloning/updating repository: ${githubUrl}`, 'build');
    const commitInfo = await githubService.cloneRepository(githubUrl, branch, slug);
    await addLog(deploymentId, projectId, 'info', `✅ Repo ready — commit: ${commitInfo.sha.substring(0, 8)} "${commitInfo.message}"`, 'build');

    // Update deployment with commit info
    await Deployment.findByIdAndUpdate(deploymentId, {
      commitSha: commitInfo.sha,
      commitMessage: commitInfo.message,
    });

    const repoPath = githubService.getRepoPath(slug);

    // ── Step 3: Build Docker image ───────────────────────────────────────────
    await dockerService.buildImage(repoPath, imageTag, deploymentId, projectId);

    // ── Step 4: Push image ───────────────────────────────────────────────────
    await updateDeploymentStatus(deploymentId, 'pushing');
    await dockerService.pushImage(imageTag, deploymentId, projectId);

    // Clean up local image after push
    dockerService.removeImage(imageTag).catch(() => {});

    // ── Step 5: Deploying to Kubernetes ──────────────────────────────────────
    await updateDeploymentStatus(deploymentId, 'deploying');
    await addLog(deploymentId, projectId, 'info', '☸️  Deploying to Kubernetes…', 'deploy');

    // Step 6: Ensure namespace exists
    await k8sService.createNamespace(slug);
    await addLog(deploymentId, projectId, 'info', `✅ Namespace ready: clouddeploy-${slug}`, 'deploy');

    // Step 7: Load and sync environment variables
    const envVarsRaw = await EnvVariable.find({ projectId });
    const configVars = {};
    const secretVars = {};

    for (const ev of envVarsRaw) {
      if (ev.isSecret) {
        secretVars[ev.key] = ev.getPlainValue();
      } else {
        configVars[ev.key] = ev.value;
      }
    }

    if (Object.keys(configVars).length > 0) {
      await k8sService.createConfigMap(slug, configVars);
      await addLog(deploymentId, projectId, 'info', `✅ ConfigMap synced (${Object.keys(configVars).length} vars)`, 'deploy');
    }

    if (Object.keys(secretVars).length > 0) {
      await k8sService.createSecret(slug, secretVars);
      await addLog(deploymentId, projectId, 'info', `✅ Secrets synced (${Object.keys(secretVars).length} secrets)`, 'deploy');
    }

    // Step 8: Create/update Deployment
    await k8sService.createDeployment(
      slug,
      imageTag,
      replicas,
      [], // env injected via envFrom (ConfigMap + Secret)
      resourceLimits,
      containerPort
    );
    await addLog(deploymentId, projectId, 'info', `✅ K8s Deployment created/updated`, 'deploy');

    // Step 9: Create Service
    await k8sService.createService(slug, containerPort);
    await addLog(deploymentId, projectId, 'info', `✅ K8s Service created`, 'deploy');

    // Step 10: Create Ingress
    const publicUrl = generatePublicUrl(slug);
    await k8sService.createIngress(slug, `${slug}.${require('../config/env').BASE_DOMAIN}`);
    await addLog(deploymentId, projectId, 'info', `✅ Ingress created → ${publicUrl}`, 'deploy');

    // Step 11: Create HPA (default scaling policy)
    await k8sService.createHPA(slug, 1, 10, 70);
    await addLog(deploymentId, projectId, 'info', `✅ HPA created (1-10 replicas, 70% CPU target)`, 'deploy');

    // Step 12: Wait for deployment to be ready
    await addLog(deploymentId, projectId, 'info', '⏳ Waiting for pods to be ready…', 'deploy');
    const isReady = await waitForDeploymentReady(slug, deploymentId, projectId);

    if (!isReady) {
      throw new Error('Deployment timed out waiting for pods to become ready.');
    }

    // ── Step 13: Mark as running ─────────────────────────────────────────────
    const completedAt = new Date();
    await updateDeploymentStatus(deploymentId, 'running', { completedAt, publicUrl });
    await Project.findByIdAndUpdate(projectId, { publicUrl });

    await addLog(deploymentId, projectId, 'info', `🎉 Deployment successful! Live at: ${publicUrl}`, 'deploy');

    // ── Step 14: Send success notification ───────────────────────────────────
    notificationsService.sendDeploymentSuccess(userId, project.name, publicUrl).catch((err) => {
      console.error('[Worker] Notification error:', err.message);
    });

  } catch (err) {
    console.error(`[Worker] Deployment ${deploymentId} failed:`, err.message);

    // Mark as failed
    await updateDeploymentStatus(deploymentId, 'failed', {
      completedAt: new Date(),
      error: err.message,
    }).catch(() => {});

    if (deployment && project) {
      await addLog(deploymentId, projectId, 'error', `❌ Deployment failed: ${err.message}`, 'deploy').catch(() => {});

      // Send failure notification
      notificationsService.sendDeploymentFailure(userId, project.name, err.message).catch((notifErr) => {
        console.error('[Worker] Failure notification error:', notifErr.message);
      });
    }

    // Re-throw so BullMQ records the job as failed
    throw err;
  }
}

// ─── Create Worker ────────────────────────────────────────────────────────────
const deploymentWorker = new Worker('deployments', processDeployment, {
  connection: redisConnection,
  concurrency: 3,             // process up to 3 deployments in parallel
  limiter: {
    max: 10,
    duration: 60000,          // max 10 jobs per minute
  },
});

// ─── Worker event listeners ───────────────────────────────────────────────────
deploymentWorker.on('active', (job) => {
  console.log(`[Worker] Job ${job.id} started (deployment: ${job.data.deploymentId})`);
});

deploymentWorker.on('completed', (job) => {
  console.log(`[Worker] Job ${job.id} completed successfully.`);
});

deploymentWorker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed: ${err.message}`);
});

deploymentWorker.on('error', (err) => {
  // BullMQ emits a non-fatal version warning — suppress it so it doesn't crash the process
  if (err.message && err.message.includes('Redis version needs to be greater')) {
    console.warn('[Worker] ⚠️  BullMQ warning (non-fatal):', err.message);
    return;
  }
  console.error('[Worker] Worker error:', err.message);
});

console.log('✅  Deployment worker started.');

module.exports = { deploymentWorker };
