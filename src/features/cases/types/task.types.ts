export type TaskPriority = 'basse' | 'normale' | 'haute' | 'urgente';

export type TaskStatus =
  | 'a_faire'
  | 'en_cours'
  | 'en_attente'
  | 'termine'
  | 'annule';

export interface TaskDTO {
  id?: string | number;
  titre?: string;
  title?: string;
  description?: string;
  dossier?: string | number | { id?: string | number; titre?: string } | null;
  assigne_a?: string | number | { id?: string | number; email?: string } | null;
  assignee?: string | number | { id?: string | number; email?: string } | null;
  priorite?: TaskPriority;
  priority?: TaskPriority;
  statut?: TaskStatus;
  status?: TaskStatus;
  date_echeance?: string | null;
  dueDate?: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  dossierId: string;
  assignedToId: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
}

/**
 * Payload de création/modification envoyé à POST/PATCH /api/taches/.
 * dossier et assigne_a sont facultatifs (voir dossiers.models.Tache) :
 * une tâche peut exister sans être rattachée à un dossier ni assignée.
 * Ne jamais envoyer une chaîne vide "" pour ces deux champs — soit une
 * valeur, soit null, soit la clé omise, sous peine de 400 côté serveur.
 */
export interface CreateTaskPayload {
  titre: string;
  description?: string;
  dossier?: string | null;
  assigne_a?: string | null;
  priorite: TaskPriority;
  statut: TaskStatus;
  date_echeance?: string | null;
}

/**
 * Données du formulaire de création/modification d'une tâche (modals).
 * Créé par AddTaskModal/EditTaskModal puis transmis aux handlers — un
 * commentaire libre facultatif peut accompagner le payload de création.
 * description/assigne_a/date_echeance sont des chaînes au moment du
 * formulaire (les handlers les compactent avant envoi).
 */
export interface TaskFormData extends CreateTaskPayload {
  commentaire?: string;
  description: string;
  assigne_a: string;
  date_echeance: string;
}

export function normalizeTask(dto: TaskDTO): Task {
  const taskId = dto.id ?? `task-${Math.random().toString(36).slice(2, 10)}`;
  const dueDate = dto.date_echeance ?? dto.dueDate ?? '';

  const resolveString = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string' || typeof value === 'number') {
      return String(value);
    }
    if (typeof value === 'object' && value && 'id' in value) {
      const nested = value as { id?: string | number };
      return nested.id != null ? String(nested.id) : '';
    }
    return '';
  };

  return {
    id: String(taskId),
    title: dto.titre ?? dto.title ?? 'Tâche sans intitulé',
    description: dto.description ?? '',
    dossierId: resolveString(dto.dossier),
    assignedToId: resolveString(dto.assigne_a ?? dto.assignee),
    priority: dto.priorite ?? dto.priority ?? 'normale',
    status: dto.statut ?? dto.status ?? 'a_faire',
    dueDate,
  };
}