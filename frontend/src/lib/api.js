import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

let isRefreshing = false;
let failedQueue = [];
let isRedirectingToLogin = false;

const processQueue = (error) => {
  failedQueue.forEach((prom) => (error ? prom.reject(error) : prom.resolve()));
  failedQueue = [];
};

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/register',
  '/verify-otp',
  '/forgot-password',
  '/hospitals',
  '/doctors',
  '/diseases',
  '/medicines',
  '/providers',
];

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (
      error.response?.status === 401 &&
      (error.response?.data?.code === 'TOKEN_EXPIRED' || error.response?.data?.message?.includes('token')) &&
      !original._retry &&
      !original.url?.includes('/auth/refresh') &&
      !original.url?.includes('/auth/login')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(original))
          .catch((err) => Promise.reject(err));
      }

      original._retry = true;
      isRefreshing = true;

      try {
        await api.post('/auth/refresh');
        processQueue(null);
        return api(original);
      } catch (refreshErr) {
        processQueue(refreshErr);
        const currentPath = window.location.pathname;
        const isPublic = PUBLIC_PATHS.some((p) => p === currentPath || (p !== '/' && currentPath.startsWith(p)));
        if (!isPublic && !original.url?.includes('/auth/me') && !isRedirectingToLogin && currentPath !== '/login') {
          isRedirectingToLogin = true;
          window.location.replace('/login');
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
