import { useState } from 'react';
import { Bell, WifiOff } from 'lucide-react';
import { NotificationPanel } from './NotificationPanel';
import { useOfflineStore } from '../../../shared/store/offline.store';

interface PortalPageHeaderProps {
  title: string;
  subtitle: string;
  unreadNotificationsCount?: number;
}

/**
 * Page header used at the top of every client-portal page (dashboard,
 * dossiers, pieces, etc.) — "Espace Sécurisé" eyebrow, title, subtitle,
 * notification bell, and connection status pill.
 */
export function PortalPageHeader({
  title,
  subtitle,
  unreadNotificationsCount = 0,
}: PortalPageHeaderProps) {
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const isOnline = useOfflineStore((s) => s.isOnline);
  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <span className="text-amber-600 font-bold text-xs uppercase tracking-widest bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
          Espace Sécurisé
        </span>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">{title}</h2>
        <p className="text-slate-500 text-sm mt-0.5">{subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        <div
          className="relative bg-white p-2.5 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors"
          onClick={() => setIsNotificationPanelOpen(true)}
        >
          <Bell size={18} className="text-slate-600" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-rose-500 text-white font-bold text-xs w-5 h-5 rounded-full flex items-center justify-center animate-bounce">
              {unreadNotificationsCount}
            </span>
          )}
        </div>
        {isOnline ? (
          <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl px-4 py-1.5 text-xs font-semibold flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Étude Connectée</span>
          </div>
        ) : (
          <div className="bg-amber-50 text-amber-800 border border-amber-200 rounded-xl px-4 py-1.5 text-xs font-semibold flex items-center gap-2">
            <WifiOff size={14} />
            <span>Hors ligne</span>
          </div>
        )}
      </div>

      <NotificationPanel
        isOpen={isNotificationPanelOpen}
        onClose={() => setIsNotificationPanelOpen(false)}
      />
    </header>
  );
}

export default PortalPageHeader;
