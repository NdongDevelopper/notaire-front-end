import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersService } from '../services/settings.service';

interface UpdateTypeActeParams {
  id: string;
  libelle: string;
}

export const useUpdateTypeActe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, libelle }: UpdateTypeActeParams) => usersService.updateTypeActe(id, libelle),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['types-actes'] });
    },
    onError: (error) => {
      console.error("Erreur lors de la modification du type d'acte :", error);
    },
  });
};
