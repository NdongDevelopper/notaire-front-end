import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../../features/auth/store/auth.store';

const AUTH_ENDPOINTS = ['/auth/login/', '/auth/refresh/', '/auth/logout/'];

function isAuthEndpoint(url?: string): boolean {
  if (!url) return false;
  return AUTH_ENDPOINTS.some((endpoint) => url.includes(endpoint));
}

export function setupRequestInterceptor(instance: AxiosInstance): void {
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      try {
        const token = useAuthStore.getState().accessToken;
        const isAuthRequest = isAuthEndpoint(config.url);

        if (!isAuthRequest && token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        if (config.data instanceof FormData) {
          delete config.headers['Content-Type'];
        } else if (!isAuthRequest) {
          config.headers['Content-Type'] = 'application/json';
        }

        return config;
      } catch (error) {
        // If store access fails, proceed without token
        console.error('Request interceptor error:', error);
        return config;
      }
    },
    (error) => Promise.reject(error)
  );
}
