import { api } from '@/shared/services/api';
import type { CreateTaskPayload, TaskDTO, TaskStatus } from '../types/task.types';

export const taskApi = {
  getTasks: (params?: Record<string, string>) => api.get<unknown>('/taches/', { params }),
  getMyTasks: () => api.get<unknown>('/taches/mes-taches/'),
  getLateTasks: () => api.get<unknown>('/taches/en-retard/'),
  updateTaskStatus: (taskId: string, status: TaskStatus) =>
    api.patch<TaskDTO>(`/taches/${taskId}/`, { statut: status }),
  // Auparavant absentes : la page Tâches ne permettait aucune création,
  // ce qui était la cause principale de l'anomalie "impossible d'ajouter
  // une tâche" (l'autre cause, le filtrage serveur qui ne renvoyait que
  // les tâches assignées à l'utilisateur, est corrigée côté backend).
  createTask: (payload: CreateTaskPayload) => api.post<TaskDTO>('/taches/', payload),
  updateTask: (taskId: string, payload: Partial<CreateTaskPayload>) =>
    api.patch<TaskDTO>(`/taches/${taskId}/`, payload),
  deleteTask: (taskId: string) => api.delete(`/taches/${taskId}/`),
};