import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersService } from '../services/settings.service';
import { User } from '../types/settings';

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) => usersService.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};
