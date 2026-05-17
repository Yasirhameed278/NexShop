import { create } from 'zustand';
import api from '../api';

const useCartStore = create((set, get) => ({
  items: [],
  loading: false,

  fetchCart: async () => {
    try {
      const { data } = await api.get('/cart');
      set({ items: data });
    } catch {}
  },

  addItem: async (productId, quantity = 1, variant = '') => {
    set({ loading: true });
    try {
      const { data } = await api.post('/cart/add', { productId, quantity, variant });
      set({ items: data, loading: false });
      return data;
    } catch (err) {
      set({ loading: false });
      throw err;
    }
  },

  updateItem: async (itemId, quantity) => {
    try {
      const { data } = await api.put(`/cart/${itemId}`, { quantity });
      set({ items: data });
    } catch (err) { throw err; }
  },

  removeItem: async (itemId) => {
    try {
      const { data } = await api.delete(`/cart/${itemId}`);
      set({ items: data });
    } catch (err) { throw err; }
  },

  clearCart: async () => {
    try {
      await api.delete('/cart');
      set({ items: [] });
    } catch {}
  },

  // Local cart for guests
  localAdd: (product, quantity = 1, variant = '') => {
    const items = get().items;
    const existing = items.find((i) => i.product?._id === product._id && i.variant === variant);
    if (existing) {
      set({ items: items.map((i) => i.product?._id === product._id ? { ...i, quantity: i.quantity + quantity } : i) });
    } else {
      set({ items: [...items, { _id: Date.now().toString(), product, quantity, variant }] });
    }
  },

  getTotal: () => get().items.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0),
  getCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
}));

export default useCartStore;
