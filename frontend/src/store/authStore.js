import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';
import toast from 'react-hot-toast';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/login', { email, password });
          const { user, accessToken: token } = response.data.data;
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          toast.success(`Welcome back, ${user.name}!`);
          return { success: true };
        } catch (err) {
          const message = err.response?.data?.message || 'Login failed';
          set({ isLoading: false, error: message });
          toast.error(message);
          return { success: false, error: message };
        }
      },

      register: async (name, email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post('/auth/register', { name, email, password });
          const { user, accessToken: token } = response.data.data;
          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          toast.success('Account created successfully!');
          return { success: true };
        } catch (err) {
          const message = err.response?.data?.message || 'Registration failed';
          set({ isLoading: false, error: message });
          toast.error(message);
          return { success: false, error: message };
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
        toast.success('Logged out successfully');
      },

      fetchMe: async () => {
        const { token } = get();
        if (!token) return;
        set({ isLoading: true });
        try {
          const response = await api.get('/auth/me');
          set({ user: response.data.data, isLoading: false });
        } catch (err) {
          if (err.response?.status === 401) {
            set({ user: null, token: null, isAuthenticated: false, isLoading: false });
          } else {
            set({ isLoading: false });
          }
        }
      },

      refreshToken: async () => {
        try {
          const response = await api.post('/auth/refresh');
          const { accessToken: token } = response.data.data;
          set({ token });
          return token;
        } catch {
          set({ user: null, token: null, isAuthenticated: false });
          return null;
        }
      },

      updateUser: (updates) => {
        set((state) => ({ user: { ...state.user, ...updates } }));
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'clouddeploy-auth',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
