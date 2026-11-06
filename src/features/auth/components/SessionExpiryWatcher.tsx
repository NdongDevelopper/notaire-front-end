import { useCallback, useState } from 'react';
import { Modal } from '../../../shared/components/ui/Modal/Modal';
import { Button } from '../../../shared/components/ui/Button/Button';
import { useAuthStore } from '../store/auth.store';
import { useIdleTimer } from '../hooks/useIdleTimer';

/**
 * Inactivity watcher that automatically disconnects users after 30 minutes of no activity
 * Shows a modal informing the user they have been disconnected due to inactivity
 */
export function useInactivityWatcher() {
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const status = useAuthStore((state) => state.status);
  const handleSessionExpired = useAuthStore((state) => state.handleSessionExpired);
  const isAuthenticated = status === 'authenticated';

  const handleExpire = useCallback(() => {
    // First show the disconnect modal
    setShowDisconnectModal(true);
    // Then handle the actual session expiry
    handleSessionExpired();
  }, [handleSessionExpired]);

  useIdleTimer({
    enabled: isAuthenticated,
    onExpire: handleExpire,
  });

  const handleReconnect = useCallback(() => {
    setShowDisconnectModal(false);
    // User will need to log in again - redirect to login page
    // Store the current path for redirect after login
    const currentPath = window.location.pathname;
    window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
  }, []);

  return { showDisconnectModal, handleReconnect };
}

/**
 * @deprecated Use useInactivityWatcher and InactivityDisconnectModal instead
 * Kept for backward compatibility
 */
export function useSessionExpiryWatcher() {
  return useInactivityWatcher();
}

export function InactivityDisconnectModal({
  open,
  onReconnect,
}: {
  open: boolean;
  onReconnect: () => void;
}) {
  return (
    <Modal isOpen={open} onClose={onReconnect} title="Déconnexion pour inactivité">
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Vous avez été déconnecté automatiquement en raison d'une inactivité de 30 minutes.
        </p>
        <p className="text-sm text-slate-600">
          Pour des raisons de sécurité, votre session a été terminée. Veuillez vous reconnecter pour continuer.
        </p>
      </div>
      <div className="mt-6 flex justify-end">
        <Button onClick={onReconnect}>Se reconnecter</Button>
      </div>
    </Modal>
  );
}

/**
 * @deprecated Use InactivityDisconnectModal instead
 * Kept for backward compatibility
 */
export function SessionExpiryModal(props: any) {
  return <InactivityDisconnectModal {...props} />;
}
