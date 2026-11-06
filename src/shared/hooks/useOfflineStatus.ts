import { useState, useEffect } from 'react';
import { networkStatusManager } from '../utils/offline/networkStatus';
import { offlineManager } from '../utils/offline/offlineManager';

export function useOfflineStatus() {
  const [isOnline, setIsOnline] = useState(networkStatusManager.getStatus());
  const [queueCount, setQueueCount] = useState(0);

  useEffect(() => {
    const updateStatus = () => {
      setIsOnline(networkStatusManager.getStatus());
    };

    networkStatusManager.registerCallbacks({
      onOnline: updateStatus,
      onOffline: updateStatus
    });

    // Update queue count periodically
    const interval = setInterval(async () => {
      const count = await offlineManager.getQueueCount();
      setQueueCount(count);
    }, 1000);

    return () => {
      networkStatusManager.unregisterCallbacks();
      clearInterval(interval);
    };
  }, []);

  const processQueue = async () => {
    if (!isOnline) return false;
    
    try {
      await offlineManager.processQueue();
      const count = await offlineManager.getQueueCount();
      setQueueCount(count);
      return true;
    } catch (error) {
      console.error('Error processing queue:', error);
      return false;
    }
  };

  return {
    isOnline,
    queueCount,
    processQueue
  };
}
