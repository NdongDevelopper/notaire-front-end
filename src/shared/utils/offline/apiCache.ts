import axios from 'axios';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';

interface CachedApiResponse {
  key: string;
  url: string;
  status: number;
  statusText: string;
  data: unknown;
  headers?: Record<string, string>;
  timestamp: number;
  userId: string;
}

const DB_NAME = 'EasyNotaireOffline';
const DB_VERSION = 1;
const STORE_NAME = 'api-cache';
const MAX_ENTRIES = 250;
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30; // 30 jours
const MAX_CACHEABLE_BYTES = 2 * 1024 * 1024; // 2 Mo par réponse

function currentUserId(): string {
  try {
    const raw = localStorage.getItem('auth:offline-user:v1');
    if (!raw) return 'anonymous';
    const user = JSON.parse(raw) as { id?: string | number };
    return user?.id != null ? String(user.id) : 'anonymous';
  } catch {
    return 'anonymous';
  }
}

function getAbsoluteUrl(config: AxiosRequestConfig): string {
  const base = config.baseURL ?? '';
  const url = config.url ?? '';
  try {
    // axios.getUri applique aussi config.params / paramsSerializer.
    // Sans cela, /clients/?page=2 et /clients/?page=3 partageaient le même cache.
    const requestUri = axios.getUri(config);
    return new URL(requestUri, base || window.location.origin).toString();
  } catch {
    return `${base}${url}`;
  }
}

function cacheKey(config: AxiosRequestConfig): string {
  return `${currentUserId()}::${getAbsoluteUrl(config)}`;
}

function canCache(config: AxiosRequestConfig, data: unknown): boolean {
  const method = (config.method ?? 'get').toUpperCase();
  if (method !== 'GET') return false;

  const url = getAbsoluteUrl(config);
  if (
    url.includes('/auth/') ||
    /\/(download|telecharger|visualiser|preview)(\/|$)/i.test(url)
  ) {
    return false;
  }

  if (typeof Blob !== 'undefined' && data instanceof Blob) return false;
  if (data instanceof ArrayBuffer) return false;

  try {
    const serialized = JSON.stringify(data);
    if (serialized && new Blob([serialized]).size > MAX_CACHEABLE_BYTES) return false;
  } catch {
    return false;
  }

  return true;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('userId', 'userId', { unique: false });
      }
    };
  });
}

async function put(entry: CachedApiResponse): Promise<void> {
  const db = await openDB();

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(entry);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  // Nettoyage léger : on ne laisse pas grossir le cache indéfiniment.
  const all = await getAll();
  if (all.length <= MAX_ENTRIES) return;

  const oldest = all
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(0, all.length - MAX_ENTRIES);

  await Promise.all(oldest.map((item) => remove(item.key)));
}

async function get(key: string): Promise<CachedApiResponse | null> {
  const db = await openDB();

  const entry = await new Promise<CachedApiResponse | null>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(key);
    request.onsuccess = () => resolve((request.result as CachedApiResponse | undefined) ?? null);
    request.onerror = () => reject(request.error);
  });

  if (!entry) return null;

  if (Date.now() - entry.timestamp > MAX_AGE_MS) {
    await remove(key);
    return null;
  }

  return entry;
}

async function getAll(): Promise<CachedApiResponse[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result as CachedApiResponse[]);
    request.onerror = () => reject(request.error);
  });
}

async function remove(key: string): Promise<void> {
  const db = await openDB();

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function clearForUser(userId?: string): Promise<void> {
  const target = userId ?? currentUserId();
  const all = await getAll();

  await Promise.all(
    all
      .filter((entry) => entry.userId === target || target === '*')
      .map((entry) => remove(entry.key)),
  );
}

export class OfflineCacheHitError extends Error {
  readonly isOfflineCacheHit = true;
  readonly cachedResponse: AxiosResponse;

  constructor(cachedResponse: AxiosResponse) {
    super('Réponse servie depuis le cache hors ligne.');
    this.name = 'OfflineCacheHitError';
    this.cachedResponse = cachedResponse;
  }
}

export async function cacheApiResponse(
  config: AxiosRequestConfig,
  response: AxiosResponse,
): Promise<void> {
  if (!canCache(config, response.data)) return;

  try {
    await put({
      key: cacheKey(config),
      url: getAbsoluteUrl(config),
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      headers: (() => {
        const responseHeaders = response.headers as unknown as {
          toJSON?: () => Record<string, string>;
        } | undefined;
        return typeof responseHeaders?.toJSON === 'function'
          ? responseHeaders.toJSON()
          : undefined;
      })(),
      timestamp: Date.now(),
      userId: currentUserId(),
    });
  } catch (error) {
    // Le cache est un filet de sécurité : une erreur de stockage ne doit
    // jamais faire échouer une requête qui a réussi côté serveur.
    console.warn('Impossible de mettre en cache la réponse API hors ligne.', error);
  }
}

export async function getCachedApiResponse(
  config: AxiosRequestConfig,
): Promise<AxiosResponse | null> {
  if ((config.method ?? 'get').toUpperCase() !== 'GET') return null;

  try {
    const entry = await get(cacheKey(config));
    if (!entry) return null;

    return {
      data: entry.data,
      status: entry.status,
      statusText: entry.statusText,
      headers: entry.headers ?? {},
      config,
      request: undefined,
    } as AxiosResponse;
  } catch (error) {
    console.warn('Impossible de lire le cache API hors ligne.', error);
    return null;
  }
}

export async function clearApiCache(userId?: string): Promise<void> {
  try {
    await clearForUser(userId);
  } catch (error) {
    console.warn('Impossible de vider le cache API hors ligne.', error);
  }
}

export async function clearAllApiCache(): Promise<void> {
  await clearApiCache('*');
}
