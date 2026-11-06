import { useState } from 'react';

// ADJUST THIS IMPORT to match the shared Toast hook's actual location.
import { useToast } from '../../../shared/components/ui/Toast/Toast';

import { clientService } from '../services/client.service';
import { useClientStore } from '../store/client.store';
import type { ClientFormValues } from '../schemas/client.schema';

export function useCreateClient() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const clients = useClientStore((s) => s.clients);
  const createClient = useClientStore((s) => s.createClient);
  const closeModal = useClientStore((s) => s.closeModal);
  const toast = useToast();

  async function submit(values: ClientFormValues) {
    setIsSubmitting(true);

    // CDC criteria: "Alerte si un telephone ou email existe deja."
    // Best-effort, client-side only (see client.service.ts) — the
    // backend's own uniqueness validation is the real safety net.
    const duplicate = clientService.findLocalDuplicate(clients, {
      telephone: values.telephone,
      email: values.email,
    });

    if (duplicate) {
      toast.warning('Un client avec ce téléphone ou cet email existe déjà.');
      setIsSubmitting(false);
      return { success: false as const };
    }

    try {
      const client = await createClient({ ...values, notes: values.notes || undefined });
      toast.success('Client créé avec succès.');
      closeModal();
      return { success: true as const, client };
    } catch (err: any) {
      const backendMessage = extractBackendErrorMessage(err);
      toast.error(backendMessage ?? 'Impossible de créer le client. Veuillez réessayer.');
      return { success: false as const };
    } finally {
      setIsSubmitting(false);
    }
  }

  return { submit, isSubmitting };
}

/**
 * DRF validation errors typically come back as
 * { field_name: ["message"] } on a 400. Surface the first one we find
 * so a genuine backend-side duplicate (or other constraint) isn't
 * silently swallowed.
 */
function extractBackendErrorMessage(err: any): string | undefined {
  const data = err?.response?.data;
  if (!data || typeof data !== 'object') return undefined;
  const firstKey = Object.keys(data)[0];
  const firstValue = data[firstKey];
  if (Array.isArray(firstValue)) return String(firstValue[0]);
  if (typeof firstValue === 'string') return firstValue;
  return undefined;
}
