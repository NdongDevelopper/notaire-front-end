export interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: any;
  timestamp: number;
  retryCount: number;
}

const DB_NAME = 'OfflineRequestQueue';
const DB_VERSION = 1;
const STORE_NAME = 'requests';

class OfflineQueueDB {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  async addRequest(request: QueuedRequest): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const addRequest = store.add(request);

      addRequest.onsuccess = () => resolve();
      addRequest.onerror = () => reject(addRequest.error);
    });
  }

  async getRequests(): Promise<QueuedRequest[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.getAll();

      getRequest.onsuccess = () => resolve(getRequest.result);
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async deleteRequest(id: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const deleteRequest = store.delete(id);

      deleteRequest.onsuccess = () => resolve();
      deleteRequest.onerror = () => reject(deleteRequest.error);
    });
  }

  async clearQueue(): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const clearRequest = store.clear();

      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(clearRequest.error);
    });
  }
}

export const offlineQueueDB = new OfflineQueueDB();

/**
 * Rejeté par l'intercepteur offline quand une requête d'écriture a été
 * mise en file d'attente au lieu d'être exécutée (appareil hors ligne ou
 * coupure réseau). Les appelants la détectent avec `isOfflineQueuedError`
 * pour afficher un feedback « en attente d'envoi » plutôt qu'une erreur.
 */
export class OfflineQueuedError extends Error {
  constructor(message = 'Offline: Request queued') {
    super(message);
    this.name = 'OfflineQueuedError';
  }
}

export function isOfflineQueuedError(error: unknown): boolean {
  return (
    error instanceof OfflineQueuedError ||
    (error instanceof Error && error.message.startsWith('Offline: Request queued'))
  );
}
