import { create } from 'zustand';
import { customerAuthApi } from '@/api/endpoints';

export const useCustomerAuthStore = create((set) => ({
  customer: null,
  ready: false,

  init: async () => {
    try {
      const data = await customerAuthApi.me();
      set({ customer: data.customer || null, ready: true });
    } catch {
      set({ customer: null, ready: true });
    }
  },

  login: async (email, password) => {
    const data = await customerAuthApi.login({ email, password });
    set({ customer: data.customer || null });
    return data.customer;
  },

  register: async (payload) => {
    const data = await customerAuthApi.register(payload);
    set({ customer: data.customer || null });
    return data.customer;
  },

  logout: async () => {
    try {
      await customerAuthApi.logout();
    } catch {
      /* ignore */
    }
    set({ customer: null });
  },
}));
