// import { useState, useEffect } from 'react';
// import { permissionService } from '../services/permission.service';
// import type { UserPermissions, PermissionAction, PermissionResource, TaskPermissions } from '../types/permissions.types';

// interface UsePermissionsReturn {
//   permissions: UserPermissions | null;
//   loading: boolean;
//   error: string | null;
//   hasPermission: (resource: PermissionResource, action: PermissionAction) => boolean;
//   canModifyTask: (taskCreatorId?: string, currentUserId?: string) => boolean;
//   canDeleteTask: (taskCreatorId?: string, currentUserId?: string) => boolean;
//   getTaskPermissions: (taskCreatorId?: string, currentUserId?: string) => TaskPermissions;
//   refresh: () => Promise<void>;
// }

// export const usePermissions = (userId?: string): UsePermissionsReturn => {
//   const [permissions, setPermissions] = useState<UserPermissions | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   const loadPermissions = async () => {
//     setLoading(true);
//     setError(null);
//     try {
//       const data = await permissionService.getUserPermissions(userId);
//       setPermissions(data);
//     } catch (err: any) {
//       setError(err.message || 'Erreur lors du chargement des permissions');
//       console.error('Erreur de chargement des permissions:', err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     loadPermissions();
//   }, [userId]);

//   const hasPermission = (resource: PermissionResource, action: PermissionAction): boolean => {
//     if (!permissions) return false;
//     return permissionService.hasPermission(permissions, resource, action);
//   };

//   const canModifyTask = (taskCreatorId?: string, currentUserId?: string): boolean => {
//     if (!permissions) return false;
//     return permissionService.canModifyTask(permissions, taskCreatorId, currentUserId);
//   };

//   const canDeleteTask = (taskCreatorId?: string, currentUserId?: string): boolean => {
//     if (!permissions) return false;
//     return permissionService.canDeleteTask(permissions, taskCreatorId, currentUserId);
//   };

//   const getTaskPermissions = (taskCreatorId?: string, currentUserId?: string): TaskPermissions => {
//     if (!permissions) {
//       return {
//         canView: false,
//         canCreate: false,
//         canEdit: false,
//         canDelete: false,
//         canAssign: false,
//       };
//     }
//     return permissionService.getTaskPermissions(permissions, taskCreatorId, currentUserId);
//   };

//   const refresh = async () => {
//     if (userId) {
//       permissionService.clearCache(userId);
//     }
//     await loadPermissions();
//   };

//   return {
//     permissions,
//     loading,
//     error,
//     hasPermission,
//     canModifyTask,
//     canDeleteTask,
//     getTaskPermissions,
//     refresh,
//   };
// };