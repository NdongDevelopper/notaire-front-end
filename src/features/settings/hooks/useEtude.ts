import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { etudeService } from '../services/settings.service';
import type { Etude, EtudePayload } from '../types/settings';

/** Charge l'étude (informations générales). */
export const useEtude = () => {
  return useQuery<Etude | null, Error>({
    queryKey: ['etude'],
    queryFn: () => etudeService.get(),
  });
};

/**
 * Enregistre l'étude : PATCH si elle existe déjà, POST sinon (premier enregistrement).
 */
export const useSaveEtude = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: EtudePayload }) => (id ? etudeService.update(id, data) : etudeService.create(data)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['etude'] }),
  });
};
