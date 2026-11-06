import { useMutation, useQueryClient } from '@tanstack/react-query';
import { checklistPiecesService } from '../services/settings.service';
import type { CreateChecklistPiecePayload, TypeActeResponse } from '../types/settings';

const TYPES_ACTES_KEY = ['types-actes'];

/**
 * Mutations sur les pièces de checklist (imbriquées dans ['types-actes']).
 * Mise à jour et suppression optimistes ; l'ajout invalide simplement.
 */
export const useCreateChecklistPiece = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateChecklistPiecePayload) => checklistPiecesService.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TYPES_ACTES_KEY }),
  });
};

export const useUpdateChecklistPiece = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateChecklistPiecePayload> }) => checklistPiecesService.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: TYPES_ACTES_KEY });
      const previous = queryClient.getQueryData<TypeActeResponse[]>(TYPES_ACTES_KEY);
      queryClient.setQueryData<TypeActeResponse[]>(TYPES_ACTES_KEY, (old) =>
        old?.map((type) => ({
          ...type,
          checklist: type.checklist?.map((p) => (p.id === id ? { ...p, ...data } : p)),
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

export const useDeleteChecklistPiece = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => checklistPiecesService.remove(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: TYPES_ACTES_KEY });
      const previous = queryClient.getQueryData<TypeActeResponse[]>(TYPES_ACTES_KEY);
      queryClient.setQueryData<TypeActeResponse[]>(TYPES_ACTES_KEY, (old) =>
        old?.map((type) => ({
          ...type,
          checklist: type.checklist?.filter((p) => p.id !== id),
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
