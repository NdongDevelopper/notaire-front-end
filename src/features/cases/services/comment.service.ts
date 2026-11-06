import { api } from "../../../shared/services/api";
import type { TaskComment, CommentFormData } from "../types/comment.types";

const BASE_URL = '/commentaires-taches/';

export const commentService = {
  // Récupérer tous les commentaires d'une tâche
  getCommentairesByTache: async (tacheId: string): Promise<TaskComment[]> => {
    const response = await api.get(`${BASE_URL}?tache=${tacheId}`);
    return response.data;
  },

  // Créer un commentaire
  createCommentaire: async (data: CommentFormData): Promise<TaskComment> => {
    const response = await api.post(BASE_URL, data);
    return response.data;
  },

  // Mettre à jour un commentaire
  updateCommentaire: async (id: string, contenu: string): Promise<TaskComment> => {
    const response = await api.patch(`${BASE_URL}${id}/`, { contenu });
    return response.data;
  },

  // Supprimer un commentaire
  deleteCommentaire: async (id: string): Promise<void> => {
    await api.delete(`${BASE_URL}${id}/`);
  },
};