import { useQuery } from '@tanstack/react-query';
import { permissionsService } from '../services/settings.service';
import type { PermissionMatrice } from '../types/settings';

export const usePermissionsMatrice = () => {
  return useQuery<PermissionMatrice, Error>({
    queryKey: ['permissions', 'matrice'],
    queryFn: () => permissionsService.getMatrice(),
  });
};
