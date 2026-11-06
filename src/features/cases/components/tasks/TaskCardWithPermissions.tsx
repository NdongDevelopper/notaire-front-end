// import { Clock, User, UserPlus, Eye, Pencil, Trash2 } from "lucide-react";
// import { getPriorityColor, PRIORITY_LABELS } from "../../helpers/priority";
// import { getStatusLabel, getStatusColor } from "../../helpers/status";
// import { getDisplayName } from "../../helpers/format";
// import { TaskBadges } from "./TaskBadges";
// import type { DossierTask } from "../../types/case";

// interface TaskCardProps {
//   task: DossierTask;
//   onView: (task: DossierTask) => void;
//   onEdit: (task: DossierTask) => void;
//   onDelete: (taskId: string | number) => void;
//   usersList?: any[];
//   currentUserId?: string;
// }

// const isTaskOverdue = (task: DossierTask): boolean => {
//   if (!task.date_echeance) return false;
//   if (task.statut === 'termine' || task.statut === 'annule') return false;
//   const today = new Date();
//   today.setHours(0, 0, 0, 0);
//   const dueDate = new Date(task.date_echeance);
//   dueDate.setHours(0, 0, 0, 0);
//   return dueDate < today;
// };

// // Vérifier si l'utilisateur est le responsable de la tâche
// const isAssignee = (task: DossierTask, userId?: string): boolean => {
//   if (!userId || !task.assigne_a) return false;
//   const assigneeId = typeof task.assigne_a === 'object' 
//     ? (task.assigne_a as any).id 
//     : task.assigne_a;
//   return assigneeId === userId;
// };

// // Vérifier si l'utilisateur est le créateur de la tâche
// const isCreator = (task: DossierTask, userId?: string): boolean => {
//   if (!userId || !task.created_by) return false;
//   const creatorId = typeof task.created_by === 'object' 
//     ? (task.created_by as any).id 
//     : task.created_by;
//   return creatorId === userId;
// };

// export const TaskCardWithPermissions = ({ task, onView, onEdit, onDelete, usersList, currentUserId }: TaskCardProps) => {
//   const isOverdue = isTaskOverdue(task);
//   const displayStatus = isOverdue && task.statut !== 'termine' && task.statut !== 'annule' ? 'en_retard' : task.statut;
  
//   const userIsAssignee = isAssignee(task, currentUserId);
//   const userIsCreator = isCreator(task, currentUserId);
  
//   // Le responsable peut modifier le statut, le créateur peut tout modifier
//   const canEdit = userIsAssignee || userIsCreator;
//   const canDelete = userIsCreator; // Seul le créateur peut supprimer

//   return (
//     <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors">
//       <div className="flex-1 min-w-[200px]">
//         <div className="flex items-center gap-2">
//           <p className="text-sm font-semibold text-slate-800">{task.titre}</p>
//           <TaskBadges task={task} isOverdue={isOverdue} />
//           {userIsAssignee && (
//             <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-600">
//               Assigné à moi
//             </span>
//           )}
//           {userIsCreator && (
//             <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-green-100 text-green-600">
//               Créé par moi
//             </span>
//           )}
//         </div>
//         {task.description && (
//           <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[300px]">{task.description}</p>
//         )}
//         {(task as any).commentaire && (
//           <p className="text-xs text-slate-400 mt-0.5 italic truncate max-w-[300px]">
//             💬 {(task as any).commentaire}
//           </p>
//         )}
//         <div className="flex flex-wrap items-center gap-3 mt-1">
//           {task.assigne_a && (
//             <span className="text-xs text-slate-500 flex items-center gap-1">
//               <User className="w-3 h-3" />
//               <span className="font-medium">Responsable:</span> {getDisplayName(task.assigne_a, usersList)}
//             </span>
//           )}
//           {task.created_by && (
//             <span className="text-xs text-slate-400 flex items-center gap-1">
//               <UserPlus className="w-3 h-3" />
//               <span className="font-medium">Créé par:</span> {getDisplayName(task.created_by, usersList)}
//             </span>
//           )}
//           {task.date_echeance && (
//             <span className="text-xs text-slate-400 flex items-center gap-1">
//               <Clock className="w-3 h-3" />
//               Échéance : {new Date(task.date_echeance).toLocaleDateString('fr-FR')}
//             </span>
//           )}
//           <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${getPriorityColor(task.priorite || 'normale')}`}>
//             {PRIORITY_LABELS[task.priorite || 'normale'] || task.priorite}
//           </span>
//         </div>
//       </div>
//       <div className="flex items-center gap-2 flex-wrap">
//         <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase border ${getStatusColor(displayStatus)}`}>
//           {getStatusLabel(displayStatus)}
//         </span>
//         <button
//           onClick={() => onView(task)}
//           className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
//           title="Voir détails"
//         >
//           <Eye className="w-3.5 h-3.5" />
//         </button>
//         {canEdit && (
//           <button
//             onClick={() => onEdit(task)}
//             className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
//             title={userIsAssignee && !userIsCreator ? "Modifier le statut" : "Modifier"}
//           >
//             <Pencil className="w-3.5 h-3.5" />
//           </button>
//         )}
//         {canDelete && (
//           <button
//             onClick={() => onDelete(task.id!)}
//             className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
//             title="Supprimer"
//           >
//             <Trash2 className="w-3.5 h-3.5" />
//           </button>
//         )}
//         {!canEdit && !canDelete && (
//           <span className="text-xs text-slate-400 italic">Lecture seule</span>
//         )}
//       </div>
//     </div>
//   );
// };