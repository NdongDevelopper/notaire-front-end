import type { User as UserType } from "./case";

export interface TaskComment {
  id: string;
  tache: string;
  utilisateur: string | UserType;
  contenu: string;
  created_at: string;
  updated_at: string;
}

export interface CommentFormData {
  tache: string;
  contenu: string;
}