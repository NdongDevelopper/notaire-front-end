// import { api } from '../../../shared/services/api';
// import type { UserPermissions, PermissionAction, PermissionResource, TaskPermissions, Permission } from '../types/permissions.types';

// // Définition de toutes les permissions disponibles
// const ALL_PERMISSIONS: Permission[] = [
//   { resource: 'dashboard', actions: ['view'] },
//   { resource: 'client', actions: ['view', 'create', 'update', 'delete', 'export'] },
//   { resource: 'dossier', actions: ['view', 'create', 'update', 'delete', 'archive', 'assign', 'export'] },
//   { resource: 'kanban', actions: ['view'] },
//   { resource: 'partie', actions: ['view', 'create', 'update', 'delete'] },
//   { resource: 'piece', actions: ['view', 'create', 'update', 'delete', 'upload', 'validate', 'export'] },
//   { resource: 'checklist', actions: ['view', 'create', 'update', 'delete'] },
//   { resource: 'acte', actions: ['view', 'create', 'update', 'delete', 'validate', 'export'] },
//   { resource: 'task', actions: ['view', 'create', 'update', 'delete', 'assign', 'export'] },
//   { resource: 'messagerie', actions: ['view', 'create', 'update'] },
//   { resource: 'finance', actions: ['view', 'create', 'update', 'delete', 'export'] },
//   { resource: 'payment', actions: ['view', 'create', 'update', 'delete', 'export'] },
//   { resource: 'report', actions: ['view', 'export'] },
//   { resource: 'audit', actions: ['view'] },
//   { resource: 'settings', actions: ['view', 'create', 'update', 'delete', 'manage'] },
//   { resource: 'users', actions: ['view', 'create', 'update', 'delete', 'manage'] },
//   { resource: 'roles', actions: ['view', 'create', 'update', 'delete', 'manage'] },
//   { resource: 'formalite', actions: ['view', 'create', 'update', 'delete'] },
// ];

// // Matrice des permissions par rôle
// const ROLE_PERMISSIONS_MATRIX: Record<string, { isAdmin: boolean; permissions: Permission[] }> = {
//   // Admin - toutes les permissions
//   'associe': {
//     isAdmin: true,
//     permissions: ALL_PERMISSIONS
//   },
//   'admin': {
//     isAdmin: true,
//     permissions: ALL_PERMISSIONS
//   },
//   'administrateur': {
//     isAdmin: true,
//     permissions: ALL_PERMISSIONS
//   },
//   'notaire': {
//     isAdmin: true,
//     permissions: ALL_PERMISSIONS
//   },
//   // Autres rôles
//   'juriste': {
//     isAdmin: false,
//     permissions: [
//       { resource: 'dashboard', actions: ['view'] },
//       { resource: 'client', actions: ['view', 'create', 'update', 'delete'] },
//       { resource: 'dossier', actions: ['view', 'create', 'update'] },
//       { resource: 'kanban', actions: ['view'] },
//       { resource: 'partie', actions: ['view', 'create', 'update', 'delete'] },
//       { resource: 'piece', actions: ['view', 'create', 'update', 'upload'] },
//       { resource: 'checklist', actions: ['view', 'update'] },
//       { resource: 'acte', actions: ['view', 'create', 'update'] },
//       { resource: 'task', actions: ['view', 'create', 'update', 'delete', 'assign'] },
//       { resource: 'messagerie', actions: ['view', 'create', 'update'] },
//       { resource: 'finance', actions: ['view'] },
//     ]
//   },
//   'assistant': {
//     isAdmin: false,
//     permissions: [
//       { resource: 'dashboard', actions: ['view'] },
//       { resource: 'client', actions: ['view', 'create', 'update', 'delete'] },
//       { resource: 'dossier', actions: ['view', 'create', 'update'] },
//       { resource: 'partie', actions: ['view', 'create', 'update', 'delete'] },
//       { resource: 'piece', actions: ['view', 'create', 'update', 'upload'] },
//       { resource: 'task', actions: ['view', 'create', 'update', 'delete'] },
//       { resource: 'messagerie', actions: ['view', 'create', 'update'] },
//     ]
//   },
//   'formaliste': {
//     isAdmin: false,
//     permissions: [
//       { resource: 'dashboard', actions: ['view'] },
//       { resource: 'formalite', actions: ['view', 'create', 'update', 'delete'] },
//       { resource: 'dossier', actions: ['view'] },
//       { resource: 'piece', actions: ['view', 'upload'] },
//       { resource: 'task', actions: ['view'] },
//     ]
//   },
//   'comptable': {
//     isAdmin: false,
//     permissions: [
//       { resource: 'dashboard', actions: ['view'] },
//       { resource: 'client', actions: ['view'] },
//       { resource: 'dossier', actions: ['view'] },
//       { resource: 'piece', actions: ['view'] },
//       { resource: 'finance', actions: ['view', 'create', 'update', 'delete', 'export'] },
//       { resource: 'payment', actions: ['view', 'create', 'update', 'delete', 'export'] },
//       { resource: 'report', actions: ['view', 'export'] },
//     ]
//   },
//   'stagiaire': {
//     isAdmin: false,
//     permissions: [
//       { resource: 'dashboard', actions: ['view'] },
//       { resource: 'client', actions: ['view'] },
//       { resource: 'dossier', actions: ['view'] },
//       { resource: 'piece', actions: ['view'] },
//       { resource: 'task', actions: ['view', 'update'] },
//     ]
//   },
//   'agent': {
//     isAdmin: false,
//     permissions: [
//       { resource: 'dashboard', actions: ['view'] },
//       { resource: 'task', actions: ['view', 'update'] },
//       { resource: 'piece', actions: ['view', 'upload'] },
//     ]
//   }
// };

// class PermissionService {
//   private permissionsCache: Map<string, UserPermissions> = new Map();

//   /**
//    * Récupère les permissions de l'utilisateur connecté
//    */
//   async getUserPermissions(userId?: string): Promise<UserPermissions> {
//     try {
//       // Si l'ID est fourni, on cherche dans le cache
//       if (userId && this.permissionsCache.has(userId)) {
//         return this.permissionsCache.get(userId)!;
//       }

//       // Appel API pour récupérer le rôle de l'utilisateur
//       try {
//         const meResponse = await api.get('/users/me/');
//         const user = meResponse.data;
        
//         // Déterminer le rôle de l'utilisateur
//         // Vérifier plusieurs champs possibles pour le rôle
//         const role = user.role || user.user_type || user.type || user.profil || 'default';
//         console.log('👤 Rôle utilisateur détecté:', role, user);
        
//         // Vérifier si l'utilisateur est admin via plusieurs propriétés
//         const isAdmin = user.is_staff === true || 
//                        user.is_superuser === true || 
//                        user.is_admin === true ||
//                        user.isAdmin === true ||
//                        role === 'associe' ||
//                        role === 'admin' ||
//                        role === 'administrateur' ||
//                        role === 'notaire';
        
//         console.log('🔐 Est admin?', isAdmin);
        
//         // Obtenir les permissions du rôle depuis la matrice
//         let rolePermissions = ROLE_PERMISSIONS_MATRIX[role];
        
//         // Si le rôle n'existe pas dans la matrice, utiliser les permissions par défaut
//         if (!rolePermissions) {
//           console.warn(`⚠️ Rôle "${role}" non trouvé dans la matrice, utilisation des permissions par défaut`);
//           rolePermissions = {
//             isAdmin: false,
//             permissions: []
//           };
//         }
        
//         // Si l'utilisateur est admin, forcer les permissions admin
//         if (isAdmin) {
//           rolePermissions = {
//             isAdmin: true,
//             permissions: ALL_PERMISSIONS
//           };
//         }
        
//         const permissions: UserPermissions = {
//           userId: userId || user.id,
//           role: role,
//           isAdmin: rolePermissions.isAdmin,
//           permissions: rolePermissions.permissions
//         };
        
//         console.log('✅ Permissions attribuées:', {
//           userId: permissions.userId,
//           role: permissions.role,
//           isAdmin: permissions.isAdmin,
//           permissionsCount: permissions.permissions.length
//         });
        
//         if (userId) {
//           this.permissionsCache.set(userId, permissions);
//         }
        
//         return permissions;
//       } catch (error) {
//         console.warn('Erreur lors de la récupération du rôle utilisateur:', error);
        
//         // Fallback: permissions par défaut
//         return {
//           userId: userId || '',
//           role: 'default',
//           isAdmin: false,
//           permissions: []
//         };
//       }
//     } catch (error) {
//       console.error('Erreur lors de la récupération des permissions:', error);
//       return {
//         userId: userId || '',
//         role: 'default',
//         isAdmin: false,
//         permissions: []
//       };
//     }
//   }

//   /**
//    * Vérifie si l'utilisateur a une permission spécifique
//    */
//   hasPermission(
//     permissions: UserPermissions,
//     resource: PermissionResource,
//     action: PermissionAction
//   ): boolean {
//     // Si admin, toujours true
//     if (permissions.isAdmin) return true;
    
//     const resourcePerm = permissions.permissions.find(p => p.resource === resource);
//     if (!resourcePerm) return false;
    
//     return resourcePerm.actions.includes(action);
//   }

//   /**
//    * Vérifie si l'utilisateur peut modifier une tâche
//    */
//   canModifyTask(
//     permissions: UserPermissions,
//     taskCreatorId?: string,
//     currentUserId?: string
//   ): boolean {
//     if (permissions.isAdmin) return true;

//     if (this.hasPermission(permissions, 'task', 'update')) return true;

//     if (taskCreatorId && currentUserId && taskCreatorId === currentUserId) {
//       return true;
//     }

//     return false;
//   }

//   /**
//    * Vérifie si l'utilisateur peut supprimer une tâche
//    */
//   canDeleteTask(
//     permissions: UserPermissions,
//     taskCreatorId?: string,
//     currentUserId?: string
//   ): boolean {
//     if (permissions.isAdmin) return true;

//     if (this.hasPermission(permissions, 'task', 'delete')) return true;

//     if (taskCreatorId && currentUserId && taskCreatorId === currentUserId) {
//       return true;
//     }

//     return false;
//   }

//   /**
//    * Récupère les permissions pour une tâche spécifique
//    */
//   getTaskPermissions(
//     permissions: UserPermissions,
//     taskCreatorId?: string,
//     currentUserId?: string
//   ): TaskPermissions {
//     return {
//       canView: this.hasPermission(permissions, 'task', 'view'),
//       canCreate: this.hasPermission(permissions, 'task', 'create'),
//       canEdit: this.canModifyTask(permissions, taskCreatorId, currentUserId),
//       canDelete: this.canDeleteTask(permissions, taskCreatorId, currentUserId),
//       canAssign: this.hasPermission(permissions, 'task', 'assign'),
//     };
//   }

//   /**
//    * Vide le cache des permissions
//    */
//   clearCache(userId?: string): void {
//     if (userId) {
//       this.permissionsCache.delete(userId);
//     } else {
//       this.permissionsCache.clear();
//     }
//   }
// }

// export const permissionService = new PermissionService();