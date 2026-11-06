import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersService } from '../services/settings.service';
import { CreateTypeActePayload } from '../types/settings';

export const useAddTypeActe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTypeActePayload) => usersService.createTypeActe(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['types-actes'] });
    },
    onError: (error) => {
      console.error("Erreur lors de la création du type d'acte :", error);
    },
  });
};
