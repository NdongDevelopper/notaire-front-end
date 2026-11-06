import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LoginError } from '../services/auth.service';
import { useAuthStore } from '../store/auth.store';
import type { LoginCredentials } from '../types/auth.types';
import { getHomeRouteForRole } from '../../../routes/Paths';

export function useLogin() {
  const login = useAuthStore((state) => state.login);
  const status = useAuthStore((state) => state.status);
  const failedLoginAttempts = useAuthStore((state) => state.failedLoginAttempts);
  const [formError, setFormError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const submit = async (credentials: LoginCredentials) => {
    setFormError(null);
    try {
      await login(credentials);
      // login() resolves void — the store sets `user` as a side effect,
      // so read it back from state right after rather than from the
      // return value.
      const user = useAuthStore.getState().user;
      
      // Check if there's a redirect parameter (from inactivity disconnect)
      const redirectParam = searchParams.get('redirect');
      if (redirectParam) {
        navigate(redirectParam, { replace: true });
      } else {
        navigate(user ? getHomeRouteForRole(user.role) : '/', { replace: true });
      }
    } catch (error) {
      if (error instanceof LoginError) {
        setFormError(error.message);
      } else {
        setFormError("Une erreur inattendue s'est produite.");
      }
    }
  };

  return {
    submit,
    isSubmitting: status === 'authenticating',
    formError,
    failedLoginAttempts,
  };
}