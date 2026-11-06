import { useMemo } from 'react';
import { useAuthStore } from '../../features/auth/store/auth.store';
import {
  getPermissionSet,
  hasPermission,
  hasResourcePermission,
  type PermissionAction,
  type PermissionResource,
} from '../constants/permissions';

/**
 * Hook centralisé de permissions, basé sur le rôle de l'utilisateur connecté
 * (déjà disponible dans useAuthStore, pas d'appel API supplémentaire).
 *
 * Usage :
 *   const { can } = usePermissions();
 *   can('creer')                 // contrôle générique (matrice de rôle seule)
 *   can('creer', 'finance')      // contrôle + restriction CDC par ressource
 *                                // (dossier, finance, piece — voir permissions.ts)
 */
export const usePermissions = () => {
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);

  const role = user?.role;
  const loading = status === 'idle' || status === 'authenticating';

  const permissions = useMemo(() => getPermissionSet(role), [role]);

  const can = (action: PermissionAction, resource?: PermissionResource): boolean =>
    resource ? hasResourcePermission(role, resource, action) : hasPermission(role, action);

  return {
    role,
    userId: user?.id,
    loading,
    permissions,
    can,
  };
};