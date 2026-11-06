import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersService } from '../services/settings.service';
import type { AddUserInput } from '../types/addUser.schema';

export const useAddUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData: AddUserInput) => usersService.createUser(userData),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      console.log('✅ Utilisateur créé avec succès sur le serveur !');
    },

    onError: (error) => {
      console.error('❌ Erreur lors de la création:', error);
    },
  });
};
