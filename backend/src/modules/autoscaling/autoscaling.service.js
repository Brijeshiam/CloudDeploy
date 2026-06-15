'use strict';

/**
 * src/modules/autoscaling/autoscaling.service.js
 * HPA management — create, update, delete, and retrieve autoscaling config.
 */

const k8sService = require('../kubernetes/k8s.service');
const Project = require('../../models/Project');
const { autoscalingV2Api } = require('../../config/k8s');

/**
 * getHPA
 * Fetches the current HPA configuration for a project.
 * @param {string} projectSlug
 * @returns {Promise<object|null>}
 */
async function getHPA(projectSlug) {
  const ns = k8sService.namespaceName(projectSlug);
  const name = `${projectSlug}-hpa`;

  try {
    const resp = await autoscalingV2Api.readNamespacedHorizontalPodAutoscaler(name, ns);
    const hpa = resp.body;

    return {
      name: hpa.metadata.name,
      namespace: ns,
      minReplicas: hpa.spec.minReplicas,
      maxReplicas: hpa.spec.maxReplicas,
      currentReplicas: hpa.status?.currentReplicas || 0,
      desiredReplicas: hpa.status?.desiredReplicas || 0,
      metrics: hpa.spec.metrics,
      conditions: hpa.status?.conditions || [],
      lastScaleTime: hpa.status?.lastScaleTime || null,
    };
  } catch (err) {
    if (err?.response?.statusCode === 404) return null;
    throw err;
  }
}

/**
 * upsertHPA
 * Creates or updates the HPA for a project.
 * @param {string} projectSlug
 * @param {{ minReplicas: number, maxReplicas: number, cpuThreshold: number }} config
 */
async function upsertHPA(projectSlug, config) {
  const { minReplicas = 1, maxReplicas = 10, cpuThreshold = 70 } = config;
  await k8sService.createHPA(projectSlug, minReplicas, maxReplicas, cpuThreshold);
  return { projectSlug, minReplicas, maxReplicas, cpuThreshold };
}

/**
 * removeHPA
 * Deletes the HPA for a project (disables autoscaling).
 * @param {string} projectSlug
 */
async function removeHPA(projectSlug) {
  await k8sService.deleteHPA(projectSlug);
}

module.exports = { getHPA, upsertHPA, removeHPA };
