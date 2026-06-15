import { create } from 'zustand';
import api from '../services/api';
import toast from 'react-hot-toast';

export const useProjectStore = create((set, get) => ({
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 12,
    total: 0,
    pages: 1,
  },
  filter: 'all', // all | active | archived

  setFilter: (filter) => set({ filter }),

  fetchProjects: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const { filter } = get();
      const response = await api.get('/projects', {
        params: {
          page: params.page || 1,
          limit: params.limit || 12,
          status: filter !== 'all' ? filter : undefined,
          search: params.search || undefined,
        },
      });
      const projects = response.data.data || [];
      const pagination = response.data.meta;
      set({
        projects,
        pagination: pagination || { page: 1, limit: 12, total: projects.length, pages: 1 },
        isLoading: false,
      });
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to fetch projects';
      set({ isLoading: false, error: message });
      toast.error(message);
    }
  },

  fetchProject: async (id) => {
    set({ isLoading: true, error: null, currentProject: null });
    try {
      const response = await api.get(`/projects/${id}`);
      const projectData = response.data.data;
      const project = projectData?.project;
      const latestDeployment = projectData?.latestDeployment;
      const mergedProject = project ? { ...project, latestDeployment } : null;
      set({ currentProject: mergedProject, isLoading: false });
      return mergedProject;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to fetch project';
      set({ isLoading: false, error: message });
      toast.error(message);
      return null;
    }
  },

  createProject: async (projectData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/projects', projectData);
      const newProject = response.data.data;
      set((state) => ({
        projects: [newProject, ...state.projects],
        isLoading: false,
      }));
      toast.success('Project created successfully!');
      return { success: true, project: newProject };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to create project';
      set({ isLoading: false, error: message });
      toast.error(message);
      return { success: false, error: message };
    }
  },

  updateProject: async (id, updates) => {
    set({ isLoading: true });
    try {
      const response = await api.put(`/projects/${id}`, updates);
      const updated = response.data.data;
      set((state) => ({
        projects: state.projects.map((p) => (p._id === id ? updated : p)),
        currentProject: state.currentProject?._id === id ? updated : state.currentProject,
        isLoading: false,
      }));
      toast.success('Project updated!');
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update project';
      set({ isLoading: false });
      toast.error(message);
      return { success: false, error: message };
    }
  },

  deleteProject: async (id) => {
    try {
      await api.delete(`/projects/${id}`);
      set((state) => ({
        projects: state.projects.filter((p) => p._id !== id),
        currentProject: state.currentProject?._id === id ? null : state.currentProject,
      }));
      toast.success('Project deleted');
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to delete project';
      toast.error(message);
      return { success: false, error: message };
    }
  },

  archiveProject: async (id) => {
    try {
      const response = await api.post(`/projects/${id}/archive`);
      const updated = response.data.data;
      set((state) => ({
        projects: state.projects.map((p) => (p._id === id ? updated : p)),
        currentProject: state.currentProject?._id === id ? updated : state.currentProject,
      }));
      toast.success('Project archived');
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to archive project';
      toast.error(message);
      return { success: false, error: message };
    }
  },

  clearCurrentProject: () => set({ currentProject: null }),
  clearError: () => set({ error: null }),
}));
