import { create } from 'zustand';
import api from '../lib/api.js';
import { disconnectSocket } from '../lib/socket.js';

const useAuthStore = create((set) => ({
  user: null,
  loading: true,

  fetchMe: async () => {
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data.user, loading: false });
    } catch {
      set({ user: null, loading: false });
    }
  },

  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    set({ user: data.user });
    return data.user;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      disconnectSocket();
      set({ user: null });
    }
  },

  setUser: (user) => set({ user }),
}));

export default useAuthStore;
