'use strict';

/**
 * src/modules/monitoring/monitoring.service.js
 * Prometheus metrics querying and prom-client backend metrics collection.
 */

const axios = require('axios');
const promClient = require('prom-client');
const { PROMETHEUS_URL } = require('../../config/env');

// ─── prom-client: Backend metrics ────────────────────────────────────────────

// Create a default registry
const registry = new promClient.Registry();

// Collect default Node.js metrics (CPU, memory, event loop, GC)
promClient.collectDefaultMetrics({ register: registry, prefix: 'clouddeploy_' });

// Custom metrics
const httpRequestCounter = new promClient.Counter({
  name: 'clouddeploy_http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [registry],
});

const httpRequestDuration = new promClient.Histogram({
  name: 'clouddeploy_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.005, 0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
  registers: [registry],
});

const activeDeploymentsGauge = new promClient.Gauge({
  name: 'clouddeploy_active_deployments',
  help: 'Number of currently running deployments',
  registers: [registry],
});

/**
 * recordRequest
 * Called from app.js middleware to track HTTP request metrics.
 */
function recordRequest(method, route, status, durationSec) {
  httpRequestCounter.labels(method, route, String(status)).inc();
  httpRequestDuration.labels(method, route, String(status)).observe(durationSec);
}

/**
 * updateActiveDeployments
 * Updates the active deployments gauge.
 * @param {number} count
 */
function updateActiveDeployments(count) {
  activeDeploymentsGauge.set(count);
}

/**
 * getBackendMetrics
 * Returns the prom-client metrics in Prometheus text format.
 * @returns {Promise<string>}
 */
async function getBackendMetrics() {
  return registry.metrics();
}

/**
 * getContentType
 * Returns the content type for the metrics endpoint.
 * @returns {string}
 */
function getContentType() {
  return registry.contentType;
}

// ─── Prometheus proxy queries ─────────────────────────────────────────────────

/**
 * queryPrometheus
 * Executes an instant PromQL query against the Prometheus HTTP API.
 *
 * @param {string} query  PromQL expression
 * @returns {Promise<Array>} Prometheus result array
 */
async function queryPrometheus(query) {
  const url = `${PROMETHEUS_URL}/api/v1/query`;

  try {
    const response = await axios.get(url, {
      params: { query },
      timeout: 10000,
    });

    if (response.data?.status !== 'success') {
      throw new Error(`Prometheus query failed: ${response.data?.error}`);
    }

    return response.data?.data?.result || [];
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      return []; // Prometheus not available — return empty
    }
    throw err;
  }
}

/**
 * getProjectMetrics
 * Queries CPU, memory, and pod count for a project's K8s namespace.
 *
 * @param {string} projectSlug
 * @param {string} namespace   K8s namespace
 * @returns {Promise<{ cpu: Array, memory: Array, podCount: Array }>}
 */
async function getProjectMetrics(projectSlug, namespace) {
  const [cpu, memory, podCount] = await Promise.all([
    // Average CPU usage across all pods
    queryPrometheus(
      `avg(rate(container_cpu_usage_seconds_total{namespace="${namespace}",container="${projectSlug}"}[5m])) * 100`
    ),
    // Average memory usage in MB
    queryPrometheus(
      `avg(container_memory_working_set_bytes{namespace="${namespace}",container="${projectSlug}"}) / 1024 / 1024`
    ),
    // Running pod count
    queryPrometheus(
      `count(kube_pod_status_phase{namespace="${namespace}",phase="Running"})`
    ),
  ]);

  return {
    cpu: cpu.map((r) => ({ value: parseFloat(r.value?.[1] || 0).toFixed(2), unit: '%' })),
    memory: memory.map((r) => ({ value: parseFloat(r.value?.[1] || 0).toFixed(2), unit: 'MB' })),
    podCount: podCount.map((r) => ({ value: parseInt(r.value?.[1] || 0) })),
  };
}

module.exports = {
  recordRequest,
  updateActiveDeployments,
  getBackendMetrics,
  getContentType,
  getProjectMetrics,
  registry,
};
