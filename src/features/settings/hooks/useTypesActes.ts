import { useQuery } from '@tanstack/react-query';
import { usersService } from '../services/settings.service';
import { TypeActeResponse } from '../types/settings';

export const useTypesActes = () => {
  return useQuery<TypeActeResponse[], Error>({
    queryKey: ['types-actes'],
    queryFn: () => usersService.getAll(),
  });
};
