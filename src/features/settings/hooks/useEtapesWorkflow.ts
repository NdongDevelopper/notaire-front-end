import { useMutation, useQueryClient } from '@tanstack/react-query';
import { etapesWorkflowService } from '../services/settings.service';
import type { CreateEtapePayload, TypeActeResponse } from '../types/settings';

const TYPES_ACTES_KEY = ['types-actes'];

/**
 * Mutations sur les étapes de workflow.
 * Les étapes sont imbriquées dans la liste ['types-actes'] : les mises à jour
 * et suppressions sont optimistes (l'écran change tout de suite, on reconcilie ensuite).
 */
export const useCreateEtape = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateEtapePayload) => etapesWorkflowService.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TYPES_ACTES_KEY }),
  });
};

export const useUpdateEtape = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateEtapePayload> }) => etapesWorkflowService.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: TYPES_ACTES_KEY });
      const previous = queryClient.getQueryData<TypeActeResponse[]>(TYPES_ACTES_KEY);
      queryClient.setQueryData<TypeActeResponse[]>(TYPES_ACTES_KEY, (old) =>
        old?.map((type) => ({
          ...type,
          etapes: type.etapes?.map((e) => (e.id === id ? { ...e, ...data } : e)),
        })),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(TYPES_ACTES_KEY, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: TYPES_ACTES_KEY }),
  });
};

export const useDeleteEtape = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => etapesWorkflowService.remove(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: TYPES_ACTES_KEY });
      const previous = queryClient.getQueryData<TypeActeResponse[]>(TYPES_ACTES_KEY);
      queryClient.setQueryData<TypeActeResponse[]>(TYPES_ACTES_KEY, (old) =>
        old?.map((type) => ({
          ...type,
          etapes: type.etapes?.filter((e) => e.id !== id),
        })),
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) queryClient.setQueryData(TYPES_ACTES_KEY, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: TYPES_ACTES_KEY }),
  });
};
