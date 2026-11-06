import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';

export function getErrorMessage(error: unknown): string {
  if (typeof error === 'string' && error.trim()) {
    return error;
  }

  const responseData = (error as { response?: { data?: unknown } } | null)?.response?.data;

  if (typeof responseData === 'object' && responseData && 'detail' in responseData) {
    const detail = responseData.detail;
    if (typeof detail === 'string' && detail.trim()) {
      return detail;
    }
  }

  if (typeof responseData === 'object' && responseData) {
    const entries = Object.entries(responseData as Record<string, unknown>);

    const firstValidationMessage = entries.find(([, value]) => {
      if (Array.isArray(value)) {
        return value.some((item) => typeof item === 'string' && item.trim().length > 0);
      }
      return typeof value === 'string' && value.trim().length > 0;
    });

    if (firstValidationMessage) {
      const [, value] = firstValidationMessage;
      if (Array.isArray(value)) {
        const candidate = value.find((item) => typeof item === 'string' && item.trim().length > 0);
        if (candidate) return String(candidate);
      }
      if (typeof value === 'string' && value.trim().length > 0) {
        return value;
      }
    }
  }

  const status = (error as { response?: { status?: number } } | null)?.response?.status;
  if (status === 401) {
    return 'Session expirée, veuillez vous reconnecter.';
  }
  if (status === 403) {
    return 'Vous n’avez pas les droits nécessaires pour cette action.';
  }
  if (status === 404) {
    return 'Ressource introuvable.';
  }
  if (status && status >= 500) {
    return 'Le serveur est injoignable. Vérifiez votre connexion et réessayez.';
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Le serveur est injoignable. Vérifiez votre connexion et réessayez.';
}

export function applyServerErrors<TFieldValues extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<TFieldValues>
): boolean {
  const data = (error as { response?: { data?: unknown } } | null)?.response?.data;

  if (!data || typeof data !== 'object') {
    return false;
  }

  const errors = data as Record<string, unknown>;
  let applied = false;

  Object.entries(errors).forEach(([field, value]) => {
    if (field === 'detail' || field === 'non_field_errors') {
      return;
    }

    const message = Array.isArray(value)
      ? value.find((item) => typeof item === 'string' && item.trim().length > 0)
      : typeof value === 'string'
        ? value
        : undefined;

    if (typeof message === 'string' && message.trim().length > 0) {
      setError(field as Path<TFieldValues>, {
        type: 'server',
        message,
      });
      applied = true;
    }
  });

  return applied;
}
