import { useEffect } from 'react';
import { Loader } from '../../../shared/components/ui/Loader/Loader';
import { useAuthStore } from '../store/auth.store';

/**
 * À monter une seule fois, tout en haut de l'arbre (dans App.tsx, autour du
 * router). Tant que le statut est 'idle' ou 'authenticating', on affiche un
 * loader plein écran plutôt que de flash la page de login ou une page
 * protégée avant de savoir si la session cookie est encore valide.
 */
export function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const status = useAuthStore((state) => state.status);
  const restoreSession = useAuthStore((state) => state.restoreSession);

  useEffect(() => {
    if (window.location.pathname === '/login') {
      useAuthStore.getState().handleSessionExpired();
      return;
    }

    restoreSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === 'idle' || status === 'authenticating') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader />
      </div>
    );
  }

  return <>{children}</>;
}
