import { create } from 'zustand';
import api from '../services/api';
import toast from 'react-hot-toast';

export const useDeploymentStore = create((set, get) => ({
  deployments: [],
  currentDeployment: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  },

  fetchDeployments: async (projectId, params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/projects/${projectId}/deployments`, {
        params: {
          page: params.page || 1,
          limit: params.limit || 10,
        },
      });
      const deployments = response.data.data || [];
      const pagination = response.data.meta;
      set({
        deployments,
        pagination: pagination || { page: 1, limit: 10, total: deployments.length, pages: 1 },
        isLoading: false,
      });
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to fetch deployments';
      set({ isLoading: false, error: message });
      toast.error(message);
    }
  },

  fetchDeployment: async (projectId, deploymentId) => {
    // Only clear currentDeployment when navigating to a DIFFERENT deployment
    set((state) => ({
      isLoading: true,
      error: null,
      currentDeployment:
        state.currentDeployment?._id === deploymentId ? state.currentDeployment : null,
    }));
    try {
      const response = await api.get(`/deployments/${deploymentId}`);
      set({ currentDeployment: response.data.data, isLoading: false });
      return response.data.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to fetch deployment';
      set({ isLoading: false, error: message });
      toast.error(message);
      return null;
    }
  },

  triggerDeploy: async (projectId) => {
    set({ isLoading: true });
    try {
      const response = await api.post(`/projects/${projectId}/deployments`);
      const newDeployment = response.data.data;
      set((state) => ({
        deployments: [newDeployment, ...state.deployments],
        isLoading: false,
      }));
      toast.success('Deployment triggered!');
      return { success: true, deployment: newDeployment };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to trigger deployment';
      set({ isLoading: false });
      toast.error(message);
      return { success: false, error: message };
    }
  },

  stopDeployment: async (projectId, deploymentId) => {
    try {
      await api.post(`/deployments/${deploymentId}/stop`);
      set((state) => ({
        deployments: state.deployments.map((d) =>
          d._id === deploymentId ? { ...d, status: 'stopped' } : d
        ),
        currentDeployment:
          state.currentDeployment?._id === deploymentId
            ? { ...state.currentDeployment, status: 'stopped' }
            : state.currentDeployment,
      }));
      toast.success('Deployment stopped');
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to stop deployment';
      toast.error(message);
      return { success: false, error: message };
    }
  },

  rollbackDeployment: async (projectId, deploymentId) => {
    set({ isLoading: true });
    try {
      await api.post(`/projects/${projectId}/k8s/rollback`, { deploymentId });
      toast.success('Rollback initiated!');
      await get().fetchDeployments(projectId);
      set({ isLoading: false });
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to rollback';
      set({ isLoading: false });
      toast.error(message);
      return { success: false, error: message };
    }
  },

  updateDeploymentStatus: (deploymentId, status, extra = {}) => {
    set((state) => ({
      deployments: state.deployments.map((d) =>
        d._id === deploymentId ? { ...d, status, ...extra } : d
      ),
      currentDeployment:
        state.currentDeployment?._id === deploymentId
          ? { ...state.currentDeployment, status, ...extra }
          : state.currentDeployment,
    }));
  },

  clearDeployments: () => set({ deployments: [], currentDeployment: null }),
  clearError: () => set({ error: null }),
}));
