import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useOfflineStore } from '../../store/offline.store';

const OfflineIndicator = () => {
  const { isOnline, queueCount, isProcessing, processQueue } = useOfflineStore();

  // Always show when offline, or when online with pending requests
  if (isOnline && queueCount === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999]">
      <div className={`px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 ${
        isOnline ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
      }`}>
        {isOnline ? (
          <Wifi className="w-5 h-5" />
        ) : (
          <WifiOff className="w-5 h-5" />
        )}
        
        <div className="flex flex-col">
          <span className="font-medium text-sm">
            {isOnline ? 'Connecté' : 'Hors ligne'}
          </span>
          {queueCount > 0 && (
            <span className="text-xs opacity-90">
              {queueCount} requête{queueCount > 1 ? 's' : ''} en attente
            </span>
          )}
        </div>

        {queueCount > 0 && isOnline && (
          <button
            onClick={processQueue}
            disabled={isProcessing}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            title="Synchroniser maintenant"
          >
            <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>
    </div>
  );
};

export default OfflineIndicator;
