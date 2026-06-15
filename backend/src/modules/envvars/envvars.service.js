'use strict';

/**
 * src/modules/envvars/envvars.service.js
 * Environment variable management with automatic K8s ConfigMap/Secret sync.
 */

const EnvVariable = require('../../models/EnvVariable');
const k8sService = require('../kubernetes/k8s.service');
const Project = require('../../models/Project');

/**
 * listEnvVars
 * Returns all env vars for a project with secrets masked.
 */
async function listEnvVars(projectId) {
  const vars = await EnvVariable.find({ projectId }).lean();
  // The toJSON transform on the model masks secrets automatically
  return vars;
}

/**
 * createEnvVar
 */
async function createEnvVar(projectId, { key, value, isSecret = false }) {
  const envVar = await EnvVariable.create({ projectId, key, value, isSecret });
  await syncToK8s(projectId);
  return envVar;
}

/**
 * updateEnvVar
 */
async function updateEnvVar(projectId, varId, { value, isSecret }) {
  const envVar = await EnvVariable.findOne({ _id: varId, projectId });
  if (!envVar) return null;

  if (value !== undefined) envVar.value = value;
  if (isSecret !== undefined) envVar.isSecret = isSecret;

  await envVar.save();
  await syncToK8s(projectId);
  return envVar;
}

/**
 * deleteEnvVar
 * Deletes an env var either by its MongoDB ObjectId or by its string key.
 */
async function deleteEnvVar(projectId, varIdOrKey) {
  const mongoose = require('mongoose');
  let query = {};
  if (mongoose.Types.ObjectId.isValid(varIdOrKey)) {
    query = { _id: varIdOrKey, projectId };
  } else {
    query = { key: varIdOrKey, projectId };
  }

  const result = await EnvVariable.findOneAndDelete(query);
  if (result) await syncToK8s(projectId);
  return result;
}

/**
 * upsertEnvVars
 * Bulk upserts environment variables for a project.
 */
async function upsertEnvVars(projectId, envVars) {
  // envVars is an array of { key, value, isSecret }
  const existingVars = await EnvVariable.find({ projectId });
  const existingMap = new Map(existingVars.map(v => [v.key, v]));
  const newKeys = new Set(envVars.map(v => v.key.toUpperCase()));

  // Delete keys that are not in the new payload
  await EnvVariable.deleteMany({
    projectId,
    key: { $nin: Array.from(newKeys) }
  });

  for (const item of envVars) {
    const key = item.key.toUpperCase();
    const existing = existingMap.get(key);

    if (existing) {
      // If value is masked (****), keep the existing value unless secret status is changing
      if (item.value === '****' && existing.isSecret) {
        if (item.isSecret !== existing.isSecret) {
          existing.isSecret = item.isSecret;
          await existing.save();
        }
      } else {
        existing.value = item.value;
        existing.isSecret = !!item.isSecret;
        await existing.save();
      }
    } else {
      if (item.value !== '****') {
        await EnvVariable.create({
          projectId,
          key,
          value: item.value,
          isSecret: !!item.isSecret
        });
      }
    }
  }

  await syncToK8s(projectId);
  return EnvVariable.find({ projectId }).lean();
}

/**
 * syncToK8s
 * Syncs all env vars for a project to Kubernetes ConfigMap (plain) and Secret (secret).
 * Only syncs if project has been deployed (has a K8s namespace).
 */
async function syncToK8s(projectId) {
  const project = await Project.findById(projectId);
  if (!project || project.status !== 'active') return;

  const vars = await EnvVariable.find({ projectId });

  const configVars = {};
  const secretVars = {};

  for (const v of vars) {
    if (v.isSecret) {
      secretVars[v.key] = v.getPlainValue();
    } else {
      configVars[v.key] = v.value;
    }
  }

  // Sync ConfigMap
  await k8sService.createConfigMap(project.slug, configVars).catch((err) => {
    console.warn(`[EnvVars] ConfigMap sync warning: ${err.message}`);
  });

  // Sync Secrets
  await k8sService.createSecret(project.slug, secretVars).catch((err) => {
    console.warn(`[EnvVars] Secret sync warning: ${err.message}`);
  });
}

module.exports = { listEnvVars, createEnvVar, updateEnvVar, deleteEnvVar, upsertEnvVars, syncToK8s };
