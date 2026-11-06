// export type PermissionAction = 
//   | 'view'
//   | 'create'
//   | 'update'
//   | 'delete'
//   | 'export'
//   | 'validate'
//   | 'assign'
//   | 'archive'
//   | 'upload'
//   | 'manage';

// export type PermissionResource = 
//   | 'dashboard'
//   | 'client'
//   | 'dossier'
//   | 'piece'
//   | 'task'
//   | 'finance'
//   | 'payment'
//   | 'report'
//   | 'audit'
//   | 'settings'
//   | 'users'
//   | 'roles'
//   | 'acte'
//   | 'formalite'
//   | 'kanban'
//   | 'partie'
//   | 'checklist'
//   | 'messagerie';

// export interface Permission {
//   resource: PermissionResource;
//   actions: PermissionAction[];
// }

// export interface UserPermissions {
//   userId: string;
//   role: 'associe' | 'juriste' | 'assistant' | 'formaliste' | 'comptable' | 'stagiaire' | 'agent' | 'default';
//   permissions: Permission[];
//   isAdmin: boolean;
// }

// export interface TaskPermissions {
//   canView: boolean;
//   canCreate: boolean;
//   canEdit: boolean;
//   canDelete: boolean;
//   canAssign: boolean;
// }