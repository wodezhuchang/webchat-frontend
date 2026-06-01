import axios, { type AxiosInstance, type InternalAxiosRequestConfig, type AxiosResponse } from 'axios';
import router from '@/router';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const http: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

http.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('chat_access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

http.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      localStorage.removeItem('chat_access_token');
      localStorage.removeItem('chat_refresh_token');
      localStorage.removeItem('chat_token_expires_at');
      localStorage.removeItem('chat_user_info');
      if (router.currentRoute.value.name !== 'Login' && router.currentRoute.value.name !== 'Register') {
        router.push('/login');
      }
    }

    return Promise.reject(error);
  }
);

export default http;
