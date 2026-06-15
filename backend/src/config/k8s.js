'use strict';

/**
 * src/config/k8s.js
 * Initializes Kubernetes client using @kubernetes/client-node.
 * Tries in-cluster config first (running inside a pod),
 * falls back to kubeconfig file (local development).
 *
 * Exports: coreV1Api, appsV1Api, networkingV1Api, autoscalingV2Api
 */

const k8s = require('@kubernetes/client-node');

// ─── KubeConfig loader ────────────────────────────────────────────────────────
const kc = new k8s.KubeConfig();

try {
  // Attempt in-cluster configuration (when running as a pod)
  kc.loadFromCluster();
  console.log('✅  Kubernetes: loaded in-cluster config.');
} catch (inClusterErr) {
  try {
    // Fallback: load from default kubeconfig (~/.kube/config)
    kc.loadFromDefault();
    console.log('✅  Kubernetes: loaded kubeconfig from default path.');
  } catch (defaultErr) {
    console.warn(
      '⚠️   Kubernetes config not found. K8s operations will fail until a valid config is provided.',
      defaultErr.message
    );
  }
}

// ─── API clients ──────────────────────────────────────────────────────────────

/** Core API — namespaces, pods, services, configmaps, secrets */
const coreV1Api = kc.makeApiClient(k8s.CoreV1Api);

/** Apps API — deployments, replicasets, statefulsets */
const appsV1Api = kc.makeApiClient(k8s.AppsV1Api);

/** Networking API — ingresses */
const networkingV1Api = kc.makeApiClient(k8s.NetworkingV1Api);

/** Autoscaling API — HorizontalPodAutoscalers (v2) */
const autoscalingV2Api = kc.makeApiClient(k8s.AutoscalingV2Api);

/**
 * Watch client — used for streaming pod logs via watch
 */
const watch = new k8s.Watch(kc);

module.exports = {
  kc,
  coreV1Api,
  appsV1Api,
  networkingV1Api,
  autoscalingV2Api,
  watch,
};
