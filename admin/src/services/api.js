import axios from 'axios';
import { resolveApiBaseUrl } from './baseUrl';

const API_BASE_URL = resolveApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');

      if (typeof window !== 'undefined' && window.location.hash !== '#/login') {
        window.location.hash = '#/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
