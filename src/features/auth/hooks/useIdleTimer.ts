import { useCallback, useEffect, useRef } from 'react';

/**
 * Inactivity timeout configuration
 * After 30 minutes of inactivity, user will be automatically disconnected
 */
export const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'] as const;

interface UseIdleTimerOptions {
  onExpire: () => void;
  /** Coupe-circuit — n'écoute rien si l'utilisateur n'est pas authentifié. */
  enabled: boolean;
}

/**
 * Timer d'inactivité côté client pour déconnexion automatique
 * Après 30 minutes sans activité, l'utilisateur est déconnecté
 */
export function useIdleTimer({ onExpire, enabled }: UseIdleTimerOptions) {
  const expiryTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const resetTimers = useCallback(() => {
    clearTimeout(expiryTimeout.current);

    if (!enabled) return;

    expiryTimeout.current = setTimeout(onExpire, INACTIVITY_TIMEOUT_MS);
  }, [enabled, onExpire]);

  useEffect(() => {
    if (!enabled) {
      clearTimeout(expiryTimeout.current);
      return;
    }

    resetTimers();
    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, resetTimers));

    return () => {
      clearTimeout(expiryTimeout.current);
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, resetTimers));
    };
  }, [enabled, resetTimers]);

  return { resetTimers };
}
