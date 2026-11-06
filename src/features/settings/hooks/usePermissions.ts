import { useQuery } from '@tanstack/react-query';
import { permissionsService } from '../services/settings.service';
import type { Permission } from '../types/settings';

/**
 * Liste des permissions filtrée (par rôle et/ou module).
 * Sert principalement à récupérer les ID nécessaires au PATCH.
 */
export const usePermissions = (filters?: { role?: string; module?: string }) => {
  return useQuery<Permission[], Error>({
    queryKey: ['permissions', 'list', filters?.role ?? null, filters?.module ?? null],
    queryFn: () => permissionsService.getPermissions(filters),
    enabled: Boolean(filters?.role || filters?.module),
  });
};
