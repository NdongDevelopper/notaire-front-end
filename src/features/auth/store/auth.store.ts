import { create } from 'zustand';
import { authService, LoginError } from '../services/auth.service';
import {
  clearOfflineUser,
  loadOfflineUser,
  saveOfflineUser,
} from '../services/offlineUserCache';
import { networkStatusManager } from '../../../shared/utils/offline/networkStatus';
import { clearApiCache } from '../../../shared/utils/offline/apiCache';
import { clearDashboardOffline } from '../../Dashboard/api/dashboardOfflineCache';
import type { AuthState, LoginCredentials } from '../types/auth.types';

const MAX_FAILED_ATTEMPTS_WARNING = 3;

interface AuthStore extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  handleSessionExpired: () => void;
  restoreSession: () => Promise<void>;
  refreshAccessToken: () => Promise<string | null>;
  clearForceChangePassword: () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  status: 'idle',
  user: null,
  accessToken: null,
  failedLoginAttempts: 0,

  login: async (credentials) => {
    set({ status: 'authenticating' });
    try {
      const { user, accessToken } = await authService.login(credentials);
      saveOfflineUser(user);
      set({ status: 'authenticated', user, accessToken, failedLoginAttempts: 0 });
    } catch (error) {
      set((state) => ({
        status: 'unauthenticated',
        user: null,
        accessToken: null,
        failedLoginAttempts:
          error instanceof LoginError && error.kind === 'invalid_credentials'
            ? state.failedLoginAttempts + 1
            : state.failedLoginAttempts,
      }));
      throw error;
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } finally {
      const previousUserId = get().user?.id != null ? String(get().user?.id) : undefined;
      clearOfflineUser();
      if (previousUserId) void clearApiCache(previousUserId);
      clearDashboardOffline();
      set({ status: 'unauthenticated', user: null, accessToken: null, failedLoginAttempts: 0 });
    }
  },

  handleSessionExpired: () => {
    const previousUserId = get().user?.id != null ? String(get().user?.id) : undefined;
    clearOfflineUser();
    if (previousUserId) void clearApiCache(previousUserId);
    clearDashboardOffline();
    set({ status: 'unauthenticated', user: null, accessToken: null });
  },

  restoreSession: async () => {
    const currentStatus = get().status;
    if (currentStatus === 'authenticating') {
      return;
    }

    set({ status: 'authenticating' });

    // Après un rechargement hors ligne, ne pas attendre le timeout du
    // refresh HTTP. Le profil local a déjà été validé lors de la dernière
    // session connectée et permet d'ouvrir immédiatement l'espace staff.
    const offlineUser = loadOfflineUser();
    if (!networkStatusManager.getStatus() && offlineUser) {
      set({ status: 'authenticated', user: offlineUser, accessToken: null });
      return;
    }

    try {
      let accessToken = get().accessToken;

      if (!accessToken) {
        accessToken = await authService.refreshSession();
        if (!accessToken) {
          throw new Error('Failed to refresh token');
        }
      }

      const user = await authService.getCurrentUser();
      saveOfflineUser(user);
      set({ status: 'authenticated', user, accessToken });
    } catch (error) {
      // Restauration dégradée hors ligne : si le refresh a échoué à cause
      // d'une coupure réseau (aucune réponse du serveur) ET que le
      // navigateur confirme l'absence de réseau, on rétablit quand même
      // une session locale à partir du cache pour que les pages déjà
      // visitées restent consultables hors ligne. Un refus explicite du
      // serveur (401/403…) ou une indisponibilité sans cache => vraie
      // déconnexion.
      const { networkError } = await authService.refreshSessionDetailed();
      const offlineUser = loadOfflineUser();
      if (
        networkError &&
        !networkStatusManager.getStatus() &&
        offlineUser
      ) {
        console.warn('Session restaurée en mode dégradé (hors ligne).');
        set({ status: 'authenticated', user: offlineUser, accessToken: null });
        return;
      }

      console.error('Session restoration failed:', error);
      clearOfflineUser();
      set({ status: 'unauthenticated', user: null, accessToken: null });
    }
  },

  refreshAccessToken: async () => {
    try {
      const accessToken = await authService.refreshSession();
      if (accessToken) {
        set({ accessToken });
      } else {
        // If refresh fails, handle session expiry
        get().handleSessionExpired();
      }
      return accessToken;
    } catch (error) {
      console.error('Token refresh failed in store:', error);
      get().handleSessionExpired();
      return null;
    }
  },

  clearForceChangePassword: () => {
    const currentUser = get().user;
    if (!currentUser) return;

    const updatedUser = { ...currentUser, changerLeMotDePasse: false };

    // Important pour le mode offline : le profil utilisé après un
    // rechargement hors ligne vient de localStorage. Il faut donc
    // persister aussi la nouvelle valeur après un changement de mot
    // de passe réussi, sinon le cache conserverait l'ancien
    // `changerLeMotDePasse: true` et la modale réapparaîtrait à chaque
    // passage hors ligne.
    saveOfflineUser(updatedUser);
    set({ user: updatedUser });
  },
}));

export { MAX_FAILED_ATTEMPTS_WARNING };
