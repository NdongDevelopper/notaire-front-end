import type { AuthUser } from '../types/auth.types';

// Cache localStorage minimal de l'utilisateur authentifié.
//
// Sert UNIQUEMENT à rétablir une session en mode dégradé lorsque le
// navigateur est hors ligne au rechargement de la page : le refresh token
// est un cookie httpOnly irrécupérable sans réseau, donc sans ce cache tout
// rechargement hors ligne renverrait systématiquement vers /login alors
// que les données sont pourtant disponibles dans le service worker.
//
// Purgé à chaque déconnexion réelle et à chaque expiration de session pour
// ne jamais laisser de trace d'un autre utilisateur sur l'appareil.
const OFFLINE_USER_KEY = 'auth:offline-user:v1';

export function saveOfflineUser(user: AuthUser): void {
  try {
    localStorage.setItem(OFFLINE_USER_KEY, JSON.stringify(user));
  } catch {
    // Quota dépassé ou navigation privée : la restauration dégradée est
    // simplement inactive, le reste de l'application fonctionne.
  }
}

export function loadOfflineUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(OFFLINE_USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function clearOfflineUser(): void {
  try {
    localStorage.removeItem(OFFLINE_USER_KEY);
  } catch {
    // Rien à faire : valeur déjà absente ou stockage inaccessible.
  }
}
