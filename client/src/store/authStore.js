import { create } from 'zustand';
import { authApi } from '@/api/endpoints';

export const useAuthStore = create((set) => ({
  admin: null,
  ready: false,

  init: async () => {
    const token = localStorage.getItem('paw_admin_token');
    if (!token) {
      set({ admin: null, ready: true });
      return;
    }
    try {
      const data = await authApi.me();
      set({ admin: data.admin, ready: true });
    } catch {
      localStorage.removeItem('paw_admin_token');
      set({ admin: null, ready: true });
    }
  },

  login: async (email, password) => {
    const data = await authApi.login({ email, password });
    localStorage.setItem('paw_admin_token', data.token);
    set({ admin: data.admin });
    return data.admin;
  },

  logout: async () => {
    try {
      await authApi.logout();
    } catch {
      /* ignore */
    }
    localStorage.removeItem('paw_admin_token');
    set({ admin: null });
  },
}));
