// src/features/settings/hooks/useActivateUser.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersService } from '../services/settings.service';

export const useActivateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => usersService.activateUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error) => {
      console.error("Erreur lors de l'activation de l'utilisateur :", error);
    },
  });
};
