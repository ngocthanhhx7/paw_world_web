import { create } from 'zustand';
import { customerAuthApi } from '@/api/endpoints';

export const useCustomerAuthStore = create((set) => ({
  customer: null,
  ready: false,
  loading: false,

  init: async () => {
    set({ loading: true });
    try {
      const data = await customerAuthApi.me();
      set({ customer: data.customer || null, ready: true });
    } catch {
      set({ customer: null, ready: true });
    } finally {
      set({ loading: false });
    }
  },

  login: async (email, password) => {
    const data = await customerAuthApi.login({ email, password });
    set({ customer: data.customer || null });
    return data.customer;
  },

  googleLogin: async (credential) => {
    const data = await customerAuthApi.googleLogin({ credential });
    set({ customer: data.customer || null });
    return data.customer;
  },

  facebookLogin: async (accessToken) => {
    const data = await customerAuthApi.facebookLogin({ accessToken });
    set({ customer: data.customer || null });
    return data.customer;
  },

  register: async (payload) => {
    const data = await customerAuthApi.register(payload);
    set({ customer: data.customer || null });
    return data.customer;
  },

  forgotPassword: async (payload) => customerAuthApi.forgotPassword(payload),
  resetPassword: async (payload) => customerAuthApi.resetPassword(payload),

  logout: async () => {
    try {
      await customerAuthApi.logout();
    } catch {
      /* ignore */
    }
    set({ customer: null });
  },
}));
