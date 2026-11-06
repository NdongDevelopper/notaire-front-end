import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../../features/auth/store/auth.store';
import { cacheApiResponse, getCachedApiResponse, OfflineCacheHitError } from '../utils/offline/apiCache';
import { networkStatusManager } from '../utils/offline/networkStatus';

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

interface QueueItem {
  resolve: (token: string | null) => void;
  reject: (error: unknown) => void;
}

let isRefreshing = false;
let waitQueue: QueueItem[] = [];

function flushQueue(error: unknown, token: string | null) {
  waitQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  waitQueue = [];
}

function isAuthEndpoint(url?: string): boolean {
  if (!url) return false;
  return url.includes('/auth/refresh') || url.includes('/auth/login') || url.includes('/auth/logout');
}

export function setupResponseInterceptor(instance: AxiosInstance): void {
  instance.interceptors.response.use(
    async (response) => {
      // Chaque lecture REST réussie devient une copie locale. Les données
      // peuvent ainsi rester consultables après une coupure réseau.
      if ((response.config.method ?? 'get').toUpperCase() === 'GET') {
        void cacheApiResponse(response.config, response);
      }
      return response;
    },
    async (error: AxiosError) => {
      // Un GET peut être court-circuité par le request interceptor lorsqu'une
      // copie IndexedDB existe déjà. Il ne faut surtout pas poursuivre vers
      // le réseau ou le traitement 401 dans ce cas.
      if (error instanceof OfflineCacheHitError) {
        return error.cachedResponse;
      }

      const originalRequest = error.config as RetriableConfig | undefined;

      if (!originalRequest) {
        return Promise.reject(error);
      }

      // En cas de coupure réseau, une lecture GET peut être servie depuis
      // IndexedDB au lieu d'afficher une erreur. On ne fait jamais cela pour
      // les mutations : elles passent par la file d'attente offline.
      if (
        !error.response &&
        (originalRequest.method ?? 'get').toUpperCase() === 'GET' &&
        !networkStatusManager.getStatus()
      ) {
        const cached = await getCachedApiResponse(originalRequest);
        if (cached) return cached;
      }

      if (!error.response) {
        return Promise.reject(error);
      }

      const { status } = error.response;

      if (status !== 401) {
        return Promise.reject(error);
      }

      if (isAuthEndpoint(originalRequest.url)) {
        useAuthStore.getState().handleSessionExpired();
        return Promise.reject(error);
      }

      if (originalRequest._retry) {
        useAuthStore.getState().handleSessionExpired();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise<string | null>((resolve, reject) => {
          waitQueue.push({ resolve, reject });
        }).then((newToken) => {
          if (newToken) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          return instance(originalRequest);
        }).catch((err) => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newAccessToken = await useAuthStore.getState().refreshAccessToken();
        flushQueue(null, newAccessToken);

        if (newAccessToken) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        return instance(originalRequest);
      } catch (refreshError) {
        flushQueue(refreshError, null);
        useAuthStore.getState().handleSessionExpired();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
  );
}
