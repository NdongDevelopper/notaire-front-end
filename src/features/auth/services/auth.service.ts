import { isAxiosError } from 'axios';
import { authApi } from '../api/auth.api';
import {
  extractAccessToken,
  mapLoginResponseToUser,
  mapMeResponseToUser,
} from '../api/auth.mapper';
import type { AuthUser, LoginCredentials } from '../types/auth.types';

export type LoginErrorKind =
  | 'invalid_credentials'
  | 'account_disabled'
  | 'unauthorized'
  | 'network'
  | 'unknown';

export class LoginError extends Error {
  kind: LoginErrorKind;

  constructor(kind: LoginErrorKind, message: string) {
    super(message);
    this.kind = kind;
    this.name = 'LoginError';
  }
}

function interpretLoginError(error: unknown): LoginError {
  if (!isAxiosError(error)) {
    if (error instanceof Error) {
      return new LoginError('unknown', error.message);
    }
    return new LoginError('unknown', "Une erreur inattendue s'est produite.");
  }

  if (!error.response) {
    return new LoginError(
      'network',
      'Impossible de contacter le serveur. Verifiez votre connexion.'
    );
  }

  const { status, data } = error.response;
  const detail = typeof data?.detail === 'string'
    ? data.detail.toLowerCase()
    : typeof data?.message === 'string'
      ? data.message.toLowerCase()
      : '';

  if (status === 403 || detail.includes('desactiv') || detail.includes('inactive')) {
    return new LoginError(
      'account_disabled',
      "Ce compte a ete desactive. Contactez un associe de l'etude."
    );
  }

  if (status === 401 || detail.includes('invalid') || detail.includes('incorrect') || detail.includes('password')) {
    return new LoginError('invalid_credentials', 'Email ou mot de passe incorrect.');
  }

  if (status === 429) {
    return new LoginError('unknown', 'Trop de tentatives. Merci de patienter un instant.');
  }

  return new LoginError('unknown', 'Une erreur inattendue s’est produite.');
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<{ user: AuthUser; accessToken: string | null }> {
    try {
      const response = await authApi.login(credentials);
      const accessToken = extractAccessToken(response.data);
      const userMinimal = mapLoginResponseToUser(response.data);

      // La réponse de /auth/login/ ne contient pas l'objet "permissions"
      // (voir MeView côté backend). On enchaîne donc immédiatement sur
      // /auth/me/ pour obtenir le profil complet, y compris les droits
      // utilisés par l'UI (ex: bouton "Nouveau Modèle" désactivé pour un
      // rôle non autorisé). En cas d'échec de cet appel, on garde quand
      // même l'utilisateur minimal plutôt que de bloquer le login.
      try {
        const user = await authService.getCurrentUser();
        return { user, accessToken };
      } catch (meError) {
        console.error('Impossible de récupérer le profil complet après connexion:', meError);
        return { user: userMinimal, accessToken };
      }
    } catch (error) {
      throw interpretLoginError(error);
    }
  },

  async logout(): Promise<void> {
    await authApi.logout();
  },

  async refreshSession(): Promise<string | null> {
    const { token } = await authService.refreshSessionDetailed();
    return token;
  },

  /**
   * Variante de refreshSession qui distingue une coupure réseau (aucune
   * réponse du serveur) d'un refus explicite du serveur (401/403…).
   * Permet au store d'opter pour une restauration hors ligne dégradée dans
   * le premier cas uniquement, sans déconnecter l'utilisateur à tort.
   */
  async refreshSessionDetailed(): Promise<{ token: string | null; networkError: boolean }> {
    try {
      const response = await authApi.refresh();
      return { token: extractAccessToken(response.data), networkError: false };
    } catch (error) {
      console.error('Token refresh failed:', error);
      return {
        token: null,
        networkError: isAxiosError(error) && !error.response,
      };
    }
  },

  async getCurrentUser(): Promise<AuthUser> {
    try {
      const response = await authApi.me();
      return mapMeResponseToUser(response.data);
    } catch (error) {
      console.error('Failed to get current user:', error);
      throw new Error('Impossible de récupérer les informations utilisateur.');
    }
  },

  async changePassword(old_password: string, new_password: string): Promise<void> {
    try {
      await authApi.changePassword(old_password, new_password);
    } catch (error) {
      console.error('Password change failed:', error);
      if (isAxiosError(error)) {
        const detail = error.response?.data?.detail || error.response?.data?.message;
        if (detail) {
          throw new Error(detail);
        }
      }
      throw new Error('Impossible de changer le mot de passe. Veuillez réessayer.');
    }
  },
};