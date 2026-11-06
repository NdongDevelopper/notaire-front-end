import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersService } from '../services/settings.service';
import { useToast } from '../../../shared/components/ui/Toast/Toast';
import type { PaginatedUsers } from '../types/settings';

export const useDeleteUser = (page: number) => {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (userId: string) => usersService.deleteUser(userId),

    onMutate: async (userId: string) => {
      await queryClient.cancelQueries({ queryKey: ['users', page] });

      const previous = queryClient.getQueryData<PaginatedUsers>(['users', page]);

      queryClient.setQueryData<PaginatedUsers>(['users', page], (old) => {
        if (!old) return old;
        return {
          ...old,
          count: old.count - 1,
          results: old.results.filter((u) => u.id !== userId),
        };
      });

      toast.success('Le compte utilisateur a été supprimé avec succès.');

      return { previous };
    },

    onError: (_err, _userId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['users', page], context.previous);
      }
      toast.error('La suppression a échoué. Veuillez réessayer.');
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};
