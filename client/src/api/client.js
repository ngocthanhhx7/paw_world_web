import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  timeout: 15000,
});

// Đính kèm token admin nếu có
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('paw_admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status === 401 && window.location.pathname.startsWith('/admin')) {
      localStorage.removeItem('paw_admin_token');
      if (window.location.pathname !== '/admin/login') {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(err);
  },
);

export default api;
