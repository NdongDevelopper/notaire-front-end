import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { offlineManager } from '../utils/offline/offlineManager';
import { getCachedApiResponse, OfflineCacheHitError } from '../utils/offline/apiCache';
import { OfflineQueuedError } from '../utils/offline/offlineQueue';
import { networkStatusManager } from '../utils/offline/networkStatus';

/**
 * Config Axios marquée comme rejeu depuis la file hors-ligne :
 * `_queued` empêche une re-mise en file en boucle, `_retry` est géré
 * par l'intercepteur réponse (refresh token).
 */
export type ReplayingRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
  _queued?: boolean;
};

const SAFE_TO_QUEUE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];
const SAFE_TO_QUEUE_ENDPOINTS = [
  '/clients/',
  '/dossiers/',
  '/documents/',
  '/taches/',
  '/lignes-financieres/',
  '/paiements/',
  '/parties/',
  '/commentaires-taches/',
  '/formalites/',
  '/missions/',
  '/rendez-vous/',
  '/messagerie/',
  // Client portal endpoints
  '/portail/documents/',
  '/portail/documents-partages/',
  '/portail/dossiers/',
  '/portail/messagerie/',
  '/portail/notifications/',
  '/portail/profil/',
  '/notifications/',
  // Additional admin endpoints
  '/finances/',
  '/settings/',
  '/tasks/',
  '/audit/',
  // Settings / administration
  '/users/',
  '/types-actes/',
  '/permissions/',
  '/etapes-workflow/',
  '/etude/',
  '/checklist-pieces/',
  '/modeles-actes/',
];

function shouldQueueRequest(config: InternalAxiosRequestConfig): boolean {
  const method = config.method?.toUpperCase();
  const url = config.url || '';

  // Only queue write operations
  if (!method || !SAFE_TO_QUEUE_METHODS.includes(method)) {
    return false;
  }

  // Don't queue auth endpoints
  if (url.includes('/auth/')) {
    return false;
  }

  // Queue safe endpoints
  return SAFE_TO_QUEUE_ENDPOINTS.some((endpoint) => url.includes(endpoint));
}

export function setupOfflineInterceptor(instance: AxiosInstance): void {
  // Request interceptor - queue when offline
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const replaying = config as ReplayingRequestConfig;
      // Une requête rejouée depuis la file n'est jamais re-mise en file.
      if (replaying._queued) {
        return config;
      }

      if (!networkStatusManager.getStatus()) {
        const method = config.method?.toUpperCase();

        // IMPORTANT : les GET du personnel doivent être servis immédiatement
        // depuis IndexedDB lorsqu'on sait déjà que le navigateur est hors ligne.
        // Avant cette optimisation, Axios attendait le timeout réseau (60 s)
        // avant d'atteindre le fallback du response interceptor.
        if (method === 'GET') {
          return getCachedApiResponse(config).then((cached) => {
            if (cached) {
              return Promise.reject(new OfflineCacheHitError(cached));
            }
            return config;
          });
        }

        if (shouldQueueRequest(config)) {
          // On attend la persistance (IndexedDB) avant de rejeter : l'appelant
          // n'affiche « en attente d'envoi » que si l'action est réellement
          // enregistrée et sera rejouée au retour du réseau.
          return offlineManager.queueRequest(config).then(
            () => Promise.reject(new OfflineQueuedError()),
            (queueError) => {
              console.error('Échec de mise en file hors-ligne:', queueError);
              return Promise.reject(queueError);
            },
          );
        }
      }

      return config;
    },
    (error) => Promise.reject(error),
  );

  // Response interceptor - handle network errors
  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as ReplayingRequestConfig | undefined;

      // Coupure réseau en plein vol : la mutation est mise en file au lieu
      // d'être perdue. Les GET ne sont pas mis en file — l'UI se replie sur
      // son cache local à leur place.
      if (
        !error.response &&
        originalRequest &&
        !originalRequest._queued &&
        shouldQueueRequest(originalRequest)
      ) {
        try {
          await offlineManager.queueRequest(originalRequest);
        } catch (queueError) {
          console.error('Échec de mise en file hors-ligne:', queueError);
          return Promise.reject(error);
        }
        return Promise.reject(new OfflineQueuedError());
      }

      return Promise.reject(error);
    },
  );

  // Register callback to process queue when back online. Le store offline
  // (initOfflineMonitoring) enregistre lui aussi onOnline et fait joujou avec
  // le même merge — les deux appellent offlineManager.processQueue(), donc
  // quel que soit l'ordre d'enregistrement, la file est rejouée.
  networkStatusManager.registerCallbacks({
    onOnline: async () => {
      try {
        await offlineManager.processQueue();
      } catch (error) {
        console.error('Error processing offline queue:', error);
      }
    },
  });
}
