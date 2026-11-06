import { useQuery } from '@tanstack/react-query';
import { usersService } from '../services/settings.service';

export const useUsers = (page: number) => {
  return useQuery({
    queryKey: ['users', page], // La page est indispensable ici pour le re-fetch
    queryFn: () => usersService.getUsers(page),
    staleTime: 1000 * 60 * 5, // Garde les données fraîches pendant 5 minutes
  });
};
