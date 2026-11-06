import { useMutation, useQueryClient } from '@tanstack/react-query';
import { permissionsService } from '../services/settings.service';

interface UpdatePermissionParams {
  id: string;
  allowed: boolean;
}

export const useUpdatePermission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, allowed }: UpdatePermissionParams) => permissionsService.updatePermission(id, allowed),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['permissions', 'matrice'] });
    },
    onError: (error) => {
      console.error('Erreur lors de la modification de la permission :', error);
    },
  });
};
