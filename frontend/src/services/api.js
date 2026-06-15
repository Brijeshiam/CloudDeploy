import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== '/auth/login'
    ) {
      originalRequest._retry = true;
      try {
        const newToken = await useAuthStore.getState().refreshToken();
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        } else {
          useAuthStore.getState().logout();
        }
      } catch {
        useAuthStore.getState().logout();
      }
    }
    return Promise.reject(error);
  }
);

// ─── AUTH ───────────────────────────────────────────────────────────────
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  refresh: () => api.post('/auth/refresh'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/password', data),
};

// ─── PROJECTS ───────────────────────────────────────────────────────────────
export const projectsAPI = {
  list: (params) => api.get('/projects', { params }),
  get: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.patch(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  archive: (id) => api.post(`/projects/${id}/archive`),
  unarchive: (id) => api.post(`/projects/${id}/restore`),
  restart: (id) => api.post(`/projects/${id}/k8s/restart`),
  stop: (id) => api.post(`/projects/${id}/k8s/scale`, { replicas: 0 }),
  getUrl: (id) => api.get(`/projects/${id}/url`),
};

// ─── DEPLOYMENTS ────────────────────────────────────────────────────────────
export const deploymentsAPI = {
  list: (projectId, params) => api.get(`/projects/${projectId}/deployments`, { params }),
  get: (projectId, deploymentId) => api.get(`/deployments/${deploymentId}`),
  trigger: (projectId) => api.post(`/projects/${projectId}/deployments`),
  stop: (projectId, deploymentId) => api.post(`/deployments/${deploymentId}/stop`),
  rollback: (projectId, deploymentId) => api.post(`/projects/${projectId}/k8s/rollback`, { deploymentId }),
  // Admin: list all
  listAll: (params) => api.get('/admin/deployments', { params }),
};

// ─── LOGS ────────────────────────────────────────────────────────────────────
export const logsAPI = {
  getBuildLogs: (projectId, deploymentId) =>
    api.get(`/deployments/${deploymentId}/logs`),
  getRuntimeLogs: (projectId, params) =>
    api.get(`/projects/${projectId}/runtime-logs`, { params }),
  downloadBuildLogs: (projectId, deploymentId) =>
    api.get(`/deployments/${deploymentId}/logs/download`, {
      responseType: 'blob',
    }),
  downloadRuntimeLogs: (projectId) =>
    api.get(`/projects/${projectId}/runtime-logs/download`, { responseType: 'blob' }),
};

// ─── ENV VARS ────────────────────────────────────────────────────────────────
export const envVarsAPI = {
  list: (projectId) => api.get(`/projects/${projectId}/env`),
  upsert: (projectId, data) => api.put(`/projects/${projectId}/env`, data),
  delete: (projectId, key) => api.delete(`/projects/${projectId}/env/${key}`),
  syncToK8s: (projectId) => api.post(`/projects/${projectId}/env/sync`),
};

// ─── KUBERNETES / PODS ───────────────────────────────────────────────────────
export const kubernetesAPI = {
  getPods: (projectId) => api.get(`/projects/${projectId}/k8s/pods`),
  getPodLogs: (projectId, podName) => api.get(`/projects/${projectId}/k8s/logs/${podName}`),
  restartPod: (projectId) => api.post(`/projects/${projectId}/k8s/restart`),
  getClusterHealth: () => api.get('/admin/cluster/health'),
};

// ─── MONITORING ──────────────────────────────────────────────────────────────
export const monitoringAPI = {
  getMetrics: (projectId, params) => api.get(`/projects/${projectId}/metrics`, { params }),
  getDashboardStats: () => api.get('/monitoring/stats'),
};

// ─── ADMIN ───────────────────────────────────────────────────────────────────
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  listUsers: (params) => api.get('/admin/users', { params }),
  updateUserRole: (userId, role) => api.put(`/admin/users/${userId}/role`, { role }),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  listAllDeployments: (params) => api.get('/admin/deployments', { params }),
  getClusterHealth: () => api.get('/admin/cluster/health'),
};

export default api;
