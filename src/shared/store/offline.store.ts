import { create } from 'zustand';
import { networkStatusManager } from '../utils/offline/networkStatus';
import { offlineManager } from '../utils/offline/offlineManager';

interface OfflineStore {
  isOnline: boolean;
  queueCount: number;
  isProcessing: boolean;
  initOfflineMonitoring: () => (() => void) | undefined;
  processQueue: () => Promise<void>;
  updateQueueCount: () => Promise<void>;
}

export const useOfflineStore = create<OfflineStore>((set, get) => ({
  isOnline: networkStatusManager.getStatus(),
  queueCount: 0,
  isProcessing: false,

  initOfflineMonitoring: () => {
    const updateStatus = () => {
      set({ isOnline: networkStatusManager.getStatus() });
    };

    networkStatusManager.registerCallbacks({
      onOnline: async () => {
        updateStatus();
        await get().processQueue();
      },
      onOffline: updateStatus
    });

    // Update queue count periodically
    const interval = setInterval(async () => {
      await get().updateQueueCount();
    }, 1000);

    // Initial queue count update
    get().updateQueueCount();

    // Cleanup function
    return () => {
      networkStatusManager.unregisterCallbacks();
      clearInterval(interval);
    };
  },

  processQueue: async () => {
    const { isOnline, isProcessing } = get();
    if (!isOnline || isProcessing) return;

    set({ isProcessing: true });
    try {
      await offlineManager.processQueue();
      await get().updateQueueCount();
    } catch (error) {
      console.error('Error processing queue:', error);
    } finally {
      set({ isProcessing: false });
    }
  },

  updateQueueCount: async () => {
    const count = await offlineManager.getQueueCount();
    set({ queueCount: count });
  }
}));
