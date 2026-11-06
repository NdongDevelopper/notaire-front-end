// import { usePermissions } from './usePermissions';
// import type { DossierTask } from '../types/case';

// interface UseTaskPermissionsReturn {
//   canEdit: boolean;
//   canDelete: boolean;
//   canAssign: boolean;
//   canView: boolean;
//   isCreator: boolean;
//   loading: boolean;
// }

// export const useTaskPermissions = (task: DossierTask | null, currentUserId?: string): UseTaskPermissionsReturn => {
//   const { permissions, loading, getTaskPermissions } = usePermissions(currentUserId);

//   if (!task || !permissions) {
//     return {
//       canEdit: false,
//       canDelete: false,
//       canAssign: false,
//       canView: false,
//       isCreator: false,
//       loading,
//     };
//   }

//   // Récupérer l'ID du créateur de la tâche
//   let creatorId: string | undefined;
//   if (task.created_by) {
//     if (typeof task.created_by === 'object' && task.created_by !== null) {
//       creatorId = (task.created_by as any).id;
//     } else {
//       creatorId = String(task.created_by);
//     }
//   }

//   const taskPerms = getTaskPermissions(creatorId, currentUserId);
//   const isCreator = creatorId === currentUserId;

//   return {
//     canEdit: taskPerms.canEdit,
//     canDelete: taskPerms.canDelete,
//     canAssign: taskPerms.canAssign,
//     canView: taskPerms.canView,
//     isCreator,
//     loading,
//   };
// };