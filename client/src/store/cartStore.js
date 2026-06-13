import { create } from 'zustand';
import { cartApi } from '@/api/endpoints';

const LS_KEY = 'paw_cart_local';

function readLocal() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : { items: [] };
  } catch {
    return { items: [] };
  }
}
function writeLocal(cart) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ items: cart?.items || [] }));
  } catch {
    /* ignore */
  }
}

export const useCartStore = create((set, get) => ({
  cart: { items: [] },
  loading: false,

  /**
   * Lazy fetch: ưu tiên local trước cho UX mượt, sau đó đồng bộ với server.
   */
  fetch: async () => {
    set({ cart: readLocal(), loading: true });
    try {
      const data = await cartApi.get();
      set({ cart: data });
      writeLocal(data);
    } catch {
      // server lỗi -> fallback local
    } finally {
      set({ loading: false });
    }
  },

  addToCart: async (productId, quantity = 1) => {
    set({ loading: true });
    try {
      const data = await cartApi.add(productId, quantity);
      set({ cart: data });
      writeLocal(data);
      return data;
    } finally {
      set({ loading: false });
    }
  },

  addCombo: async (payload) => {
    set({ loading: true });
    try {
      const data = await cartApi.addCombo(payload);
      set({ cart: data });
      writeLocal(data);
      return data;
    } finally {
      set({ loading: false });
    }
  },

  updateQuantity: async (productId, quantity) => {
    const data = await cartApi.update(productId, quantity);
    set({ cart: data });
    writeLocal(data);
  },

  removeItem: async (productId) => {
    const data = await cartApi.remove(productId);
    set({ cart: data });
    writeLocal(data);
  },

  clear: async () => {
    const data = await cartApi.clear();
    set({ cart: data });
    writeLocal(data);
  },

  totals: () => {
    const items = get().cart?.items || [];
    const subtotal = items.reduce((s, it) => s + it.price * it.quantity, 0);
    const totalQty = items.reduce((s, it) => s + it.quantity, 0);
    return { subtotal, totalQty };
  },
}));
