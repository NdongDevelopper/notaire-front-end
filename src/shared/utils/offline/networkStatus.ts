interface NetworkStatusCallbacks {
  onOnline?: () => void;
  onOffline?: () => void;
}

class NetworkStatusManager {
  private isOnline: boolean = navigator.onLine;
  private callbacks: NetworkStatusCallbacks = {};

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
    }
  }

  private handleOnline = () => {
    this.isOnline = true;
    this.callbacks.onOnline?.();
  };

  private handleOffline = () => {
    this.isOnline = false;
    this.callbacks.onOffline?.();
  };

  getStatus(): boolean {
    return this.isOnline;
  }

  registerCallbacks(callbacks: NetworkStatusCallbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  unregisterCallbacks() {
    this.callbacks = {};
  }
}

export const networkStatusManager = new NetworkStatusManager();
