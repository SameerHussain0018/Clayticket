import axios, { type AxiosError } from 'axios';
import { authStorage } from '../auth/authStorage';
import { appLogger } from '../logger';

const raw = import.meta.env.VITE_API_URL;
const baseURL =
  typeof raw === 'string' && raw.replace(/\/$/, '').length > 0
    ? raw.replace(/\/$/, '')
    : undefined;

export const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = authStorage.getBearerTokenIfAny();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const method = error.config?.method?.toUpperCase() ?? 'UNKNOWN';
      const url = `${error.config?.baseURL ?? ''}${error.config?.url ?? ''}`;
      appLogger.apiFailure(method, url || '(unknown)', status, error.response?.data);

      if (status === 401) {
        appLogger.warn('401 Unauthorized — clearing session and redirecting to login', {
          url,
        });
        authStorage.clearSession();
        if (!window.location.pathname.includes('/login')) {
          window.location.assign('/login');
        }
      }
    } else {
      appLogger.error('Non-Axios error in API layer', error);
    }
    return Promise.reject(error);
  },
);
