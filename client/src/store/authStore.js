import { create } from 'zustand';
import { apiRequest } from '../services/api';

export const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  previewDept: null,

  setPreviewDept: (dept) => {
    set({ previewDept: dept });
    // Dispatch custom event for query cache invalidation across all components
    window.dispatchEvent(new CustomEvent('rbac-simulation-changed', { detail: { department: dept } }));
  },

  checkAuth: async () => {
    try {
      set({ isLoading: true });
      const data = await apiRequest('/api/auth/me');
      set({ user: data.user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (email, password) => {
    const data = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    set({ user: data.user, isAuthenticated: true });
    return data.user;
  },

  logout: async () => {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } catch (e) {}
    set({ user: null, isAuthenticated: false, previewDept: null });
  },

  clearUser: () => set({ user: null, isAuthenticated: false, previewDept: null })
}));
