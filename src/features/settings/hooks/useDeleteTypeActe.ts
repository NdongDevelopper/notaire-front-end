import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersService } from '../services/settings.service';

export const useDeleteTypeActe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => usersService.deleteTypeActe(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['types-actes'] });
    },
    onError: (error) => {
      console.error("Erreur lors de la suppression du type d'acte :", error);
    },
  });
};
