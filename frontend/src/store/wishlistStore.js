import { create } from 'zustand';
import api from '../api';

const useWishlistStore = create((set, get) => ({
  items: [],

  fetchWishlist: async () => {
    try {
      const { data } = await api.get('/cart/wishlist');
      set({ items: data });
    } catch {}
  },

  toggle: async (productId) => {
    try {
      const { data } = await api.post('/cart/wishlist', { productId });
      // Refetch
      const { data: wishlist } = await api.get('/cart/wishlist');
      set({ items: wishlist });
      return data.added;
    } catch (err) { throw err; }
  },

  isWishlisted: (productId) => get().items.some((item) => item._id === productId || item === productId),
}));

export default useWishlistStore;
