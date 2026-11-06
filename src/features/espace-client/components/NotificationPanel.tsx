import { PortalNotification } from '../types/client.types';
import { useEspaceClientData } from '../context/EspaceClientDataContext';
import { X, Check, ExternalLink, Bell, Clock } from 'lucide-react';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const { myNotifications, markNotificationsRead } = useEspaceClientData();

  if (!isOpen) return null;

  const handleMarkAsRead = async (notificationId: string) => {
    await markNotificationsRead(notificationId);
  };

  const unreadNotifications = myNotifications.filter((n) => !n.isRead);
  const readNotifications = myNotifications.filter((n) => n.isRead);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end pt-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-80 max-w-[90vw] max-h-[80vh] bg-gradient-to-b from-slate-50 to-white shadow-2xl rounded-2xl overflow-hidden mr-4">
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-slate-200 p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-xl">
              <Bell size={18} className="text-amber-600" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900">Notifications</h3>
              <p className="text-xs text-slate-500">{unreadNotifications.length} non lue(s)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X size={18} className="text-slate-600" />
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(80vh-80px)]">
          {/* Non-lues */}
          {unreadNotifications.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                Non lues ({unreadNotifications.length})
              </h4>
              <div className="space-y-3">
                {unreadNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Lues */}
          {readNotifications.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
                Lues ({readNotifications.length})
              </h4>
              <div className="space-y-3">
                {readNotifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                  />
                ))}
              </div>
            </div>
          )}

          {myNotifications.length === 0 && (
            <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Bell size={24} className="text-slate-500" />
              </div>
              <p className="text-slate-500 font-semibold text-sm">Aucune notification</p>
              <p className="text-slate-500 text-xs mt-1">Vous êtes à jour !</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface NotificationItemProps {
  notification: PortalNotification;
  onMarkAsRead: (id: string) => void;
}

function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  return (
    <div
      className={`p-4 rounded-2xl border transition-all hover:shadow-md ${
        !notification.isRead
          ? 'bg-white border-amber-200 shadow-sm'
          : 'bg-slate-50/50 border-slate-200'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            {!notification.isRead && (
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            )}
            <p className="font-bold text-slate-900 text-sm">{notification.title}</p>
          </div>
          <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">{notification.content}</p>
          <div className="flex items-center gap-1 text-xs text-slate-500 mt-3">
            <Clock size={12} />
            <span>
              {new Date(notification.createdAt).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          {!notification.isRead && (
            <button
              onClick={() => onMarkAsRead(notification.id)}
              className="p-2 bg-amber-100 hover:bg-amber-200 rounded-xl transition-colors"
              title="Marquer comme lu"
            >
              <Check size={14} className="text-amber-700" />
            </button>
          )}
          {notification.dossierId && (
            <button
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              title="Voir le dossier"
            >
              <ExternalLink size={14} className="text-slate-600" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default NotificationPanel;
