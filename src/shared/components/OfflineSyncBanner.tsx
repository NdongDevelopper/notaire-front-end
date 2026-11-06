import { RefreshCw, WifiOff } from 'lucide-react';
import { useOfflineStore } from '../store/offline.store';

interface OfflineSyncBannerProps {
  /** Date ISO de la dernière synchronisation réussie (venant du cache local). */
  lastSyncAt?: string | null;
}

/**
 * Bannière de synchronisation (feedback client #2).
 * - Hors ligne : bannière ambre « Vous êtes hors ligne — dernières données
 *   synchronisées le [date] ». Les pages déjà visitées restent consultables.
 * - En ligne avec des actions en file d'attente (ex: pièce transmise hors
 *   ligne) : bannière bleue « X action(s) en attente d'envoi — synchronisation… ».
 *
 * Le composant lit le store offline Zustand (isOnline / queueCount), jamais
 * `useOfflineStatus` dont le cleanup viderait tous les callbacks réseau.
 */
export function OfflineSyncBanner({ lastSyncAt }: OfflineSyncBannerProps) {
  const { isOnline, queueCount, isProcessing } = useOfflineStore();

  if (!isOnline) {
    const dateLabel = lastSyncAt
      ? new Date(lastSyncAt).toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : null;

    return (
      <div
        role="status"
        className="sticky top-0 z-30 flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-xs font-bold text-slate-950"
      >
        <WifiOff size={15} className="shrink-0" />
        <span>
          Vous êtes hors ligne —{' '}
          {dateLabel
            ? `dernières données synchronisées le ${dateLabel}`
            : 'vos dernières données restent consultables'}
        </span>
      </div>
    );
  }

  if (queueCount > 0) {
    return (
      <div
        role="status"
        className="sticky top-0 z-30 flex items-center justify-center gap-2 bg-sky-500 px-4 py-2 text-xs font-bold text-white"
      >
        <RefreshCw size={15} className={`shrink-0 ${isProcessing ? 'animate-spin' : ''}`} />
        <span>
          {queueCount > 1 ? `${queueCount} actions` : `${queueCount} action`} en attente
          d'envoi — {isProcessing ? 'synchronisation en cours…' : 'synchronisation automatique…'}
        </span>
      </div>
    );
  }

  return null;
}

export default OfflineSyncBanner;