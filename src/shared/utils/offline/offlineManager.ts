import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import type { ReplayingRequestConfig } from '@/shared/services/offline.interceptor';
import { networkStatusManager } from './networkStatus';
import { offlineQueueDB, type QueuedRequest } from './offlineQueue';
import { api } from '@/shared/services/api';

const OFFLINE_FORMDATA_KEY = '__offlineFormData';
const MAX_RETRIES = 3;

/**
 * Sérialise un corps de requête pour IndexedDB (structured clone).
 *
 * FormData n'est PAS structurellement clonable (DataCloneError) : le
 * conteneur est réduit à ses paires [nom, valeur] — les File/Blob qu'il
 * contient, eux, sont clonables. Sans cette conversion, toute mise en file
 * d'un upload (transmettre une pièce) échouait silencieusement et le
 * fichier était perdu.
 *
 * `undefined` (GET) devient `null`, valeur sans ambiguïté pour IndexedDB.
 */
function serializeRequestData(data: unknown): unknown {
  if (data === undefined || data === null) {
    return null;
  }

  if (typeof FormData !== 'undefined' && data instanceof FormData) {
    const entries: Array<[string, unknown]> = [];
    data.forEach((value, key) => {
      entries.push([key, value]);
    });
    return { [OFFLINE_FORMDATA_KEY]: entries };
  }

  return data;
}

/** Reconstruit un corps sérialisé par `serializeRequestData` avant rejeu. */
function rebuildData(data: unknown): unknown {
  if (
    data &&
    typeof data === 'object' &&
    OFFLINE_FORMDATA_KEY in (data as Record<string, unknown>)
  ) {
    const pairs = (data as Record<string, Array<[string, unknown]>>)[OFFLINE_FORMDATA_KEY];
    const formData = new FormData();
    pairs.forEach(([key, value]) => {
      if (typeof File !== 'undefined' && value instanceof File) {
        formData.append(key, value, value.name);
      } else if (value === null || value === undefined) {
        formData.append(key, '');
      } else {
        formData.append(key, String(value));
      }
    });
    return formData;
  }

  return data;
}

/**
 * Headers AxiosHeaders → objet simple clonable, sans Authorization ni
 * Content-Type :
 * - le token stocké serait périmé à la relecture (l'intercepteur requête
 *   en pose un neuf à chaque appel) ;
 * - un Content-Type `multipart/form-data` sans boundary (ou un JSON
 *   devenu du FormData) casserait le rejeu.
 */
function serializeHeaders(headers: unknown): Record<string, string> | undefined {
  if (!headers) return undefined;

  // AxiosHeaders expose toJSON() → { nom: valeur } ; sinon on lit les clés.
  const maybe = headers as { toJSON?: () => Record<string, unknown> };
  const plain: Record<string, unknown> =
    typeof maybe.toJSON === 'function' ? maybe.toJSON() : (headers as Record<string, unknown>);

  const out: Record<string, string> = {};
  for (const key of Object.keys(plain)) {
    const lower = key.toLowerCase();
    if (lower === 'authorization' || lower === 'content-type') continue;
    const value = plain[key];
    if (typeof value === 'string') out[key] = value;
    else if (typeof value === 'number') out[key] = String(value);
  }

  return Object.keys(out).length > 0 ? out : undefined;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * File d'attente hors-ligne : met en attente les mutations API échouées
 * sans réseau et les rejoue automatiquement au retour de la connexion,
 * via l'instance Axios partagée (token rafraîchi + intercepteurs).
 */
class OfflineManager {
  private isProcessing = false;

  /** Persiste la requête dans IndexedDB et la signale comme « en attente ». */
  async queueRequest(config: InternalAxiosRequestConfig): Promise<void> {
    const queuedRequest: QueuedRequest = {
      id: generateId(),
      url: config.url || '',
      method: config.method?.toUpperCase() || 'GET',
      headers: serializeHeaders(config.headers),
      body: serializeRequestData(config.data),
      timestamp: Date.now(),
      retryCount: 0,
    };

    await offlineQueueDB.addRequest(queuedRequest);
  }

  /** Rejoue la file, requête par requête. No-op si déjà en cours ou hors ligne. */
  async processQueue(): Promise<void> {
    if (this.isProcessing || !networkStatusManager.getStatus()) {
      return;
    }

    this.isProcessing = true;
    try {
      const requests = await offlineQueueDB.getRequests();

      for (const request of requests) {
        if (!networkStatusManager.getStatus()) {
          break;
        }
        if (request.retryCount >= MAX_RETRIES) {
          // Trop de tentatives : on abandonne l'item plutôt que de boucler.
          await offlineQueueDB.deleteRequest(request.id);
          continue;
        }

        try {
          await this.replayRequest(request);
          await offlineQueueDB.deleteRequest(request.id);
        } catch (error) {
          const status = (error as { response?: { status?: number } }).response?.status;
          const definitiveRefusal =
            status !== undefined && status >= 400 && status < 500 && status !== 401 && status !== 408;

          if (definitiveRefusal) {
            // 4xx hors 401/408 : la requête rejouée est refusée
            // définitivement, la garder en boucle ne sert à rien.
            await offlineQueueDB.deleteRequest(request.id);
          } else {
            // Erreur réseau / serveur indisponible : on réessaiera
            // lors du prochain rejeu.
            request.retryCount += 1;
            await offlineQueueDB.deleteRequest(request.id);
            await offlineQueueDB.addRequest(request);
          }
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Rejoue une requête via l'instance `api` partagée (et non un axios nu) :
   * l'URL relative est résolue contre le baseURL `/api`, l'intercepteur
   * requête pose le token courant, et un 401 déclenche le refresh en
   * single-flight avant rejeu.
   */
  private async replayRequest(request: QueuedRequest): Promise<AxiosResponse> {
    const config: ReplayingRequestConfig = {
      method: request.method,
      url: request.url,
      // Headers simples (sans Authorization/Content-Type) reconstruits en
      // AxiosRequestHeaders : l'intercepteur requête pose de toute façon un
      // token neuf, et `{}` est normalisé sans effet au dispatch.
      headers: (request.headers ?? {}) as unknown as InternalAxiosRequestConfig['headers'],
      withCredentials: true,
      _queued: true,
    };

    if (request.body !== null && request.body !== undefined) {
      config.data = rebuildData(request.body);
    }

    return api.request(config);
  }

  async getQueueCount(): Promise<number> {
    const requests = await offlineQueueDB.getRequests();
    return requests.length;
  }

  async clearQueue(): Promise<void> {
    await offlineQueueDB.clearQueue();
  }
}

export const offlineManager = new OfflineManager();
