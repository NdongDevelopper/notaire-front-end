import { useState, useEffect } from "react";
import { Modal } from "../../../../shared/components/ui/Modal/Modal";
import { Button } from "../../../../shared/components/ui/Button/Button";
import { Calendar, User, Clock, FileText, MessageSquare, UserPlus, Info, Tag } from "lucide-react";
import { useToast } from "../../../../shared/components/ui/Toast/Toast";
import type { DossierTask } from "../../types/case";
import type { TaskComment } from "../../types/comment.types";
import { commentService } from "../../services/comment.service";
import { TaskComments } from "../tasks/TaskComments";
import { AddCommentModal } from "../modals/AddCommentModal";
import { getDisplayName } from "../../helpers/format";

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: DossierTask | null;
  currentUserId?: string;
  onCommentAdded?: () => void;
  usersList?: any[]; // Ajout de usersList
}

const PRIORITY_LABELS: Record<string, string> = {
  basse: "Basse",
  normale: "Moyenne",
  haute: "Haute",
};

const STATUS_LABELS: Record<string, string> = {
  a_faire: "À faire",
  en_cours: "En cours",
  en_attente: "En attente",
  termine: "Terminé",
  annule: "Annulé",
};

export const TaskDetailModal = ({ isOpen, onClose, task, currentUserId, onCommentAdded, usersList }: TaskDetailModalProps) => {
  const toast = useToast();
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [isAddCommentOpen, setIsAddCommentOpen] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Charger les commentaires quand la tâche change
  useEffect(() => {
    if (isOpen && task?.id) {
      loadComments();
    }
    // Réinitialiser les erreurs quand la modale se ferme
    if (!isOpen) {
      setHasError(false);
      setComments([]);
    }
  }, [isOpen, task]);

  const loadComments = async () => {
    if (!task?.id) return;
    setLoadingComments(true);
    setHasError(false);
    try {
      const taskId = String(task.id);
      const response = await commentService.getCommentairesByTache(taskId);
      
      // Gérer les deux formats possibles de réponse
      let commentsData: TaskComment[] = [];
      
      if (Array.isArray(response)) {
        // Si la réponse est directement un tableau
        commentsData = response;
      } else if (response && typeof response === 'object') {
        // Si la réponse est un objet avec une propriété 'results' (format paginé DRF)
        if (Array.isArray((response as any).results)) {
          commentsData = (response as any).results;
        } 
        // Si la réponse est un objet avec une propriété 'data' 
        else if (Array.isArray((response as any).data)) {
          commentsData = (response as any).data;
        }
        // Si la réponse est un objet unique
        else if ((response as any).id) {
          commentsData = [response as TaskComment];
        }
      }
      
      setComments(commentsData);
    } catch (error) {
      console.error("Erreur lors du chargement des commentaires:", error);
      setHasError(true);
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async (contenu: string) => {
    if (!task?.id) return;
    try {
      const taskId = String(task.id);
      const newComment = await commentService.createCommentaire({
        tache: taskId,
        contenu,
      });
      if (newComment) {
        setComments([newComment, ...comments]);
        if (onCommentAdded) {
          onCommentAdded();
        }
      }
      toast.success("Commentaire ajouté avec succès !");
    } catch (error) {
      console.error("Erreur lors de l'ajout du commentaire:", error);
      toast.error("Impossible d'ajouter le commentaire.");
    }
  };

  const handleEditComment = async (commentId: string, contenu: string) => {
    try {
      const updatedComment = await commentService.updateCommentaire(commentId, contenu);
      if (updatedComment) {
        setComments(comments.map(c => c.id === commentId ? updatedComment : c));
      }
      toast.success("Commentaire modifié avec succès !");
    } catch (error) {
      console.error("Erreur lors de la modification du commentaire:", error);
      toast.error("Impossible de modifier le commentaire.");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm("Voulez-vous vraiment supprimer ce commentaire ?")) return;
    try {
      await commentService.deleteCommentaire(commentId);
      setComments(comments.filter(c => c.id !== commentId));
      toast.success("Commentaire supprimé avec succès !");
    } catch (error) {
      console.error("Erreur lors de la suppression du commentaire:", error);
      toast.error("Impossible de supprimer le commentaire.");
    }
  };

  if (!task) return null;

  const getPriorityColor = (priorite: string): string => {
    switch (priorite) {
      case 'haute':
        return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'normale':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      default:
        return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const getStatusColor = (statut: string): string => {
    switch (statut) {
      case 'termine':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'en_cours':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'en_attente':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'annule':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const formatDate = (date: string | null | undefined): string => {
    if (!date) return "Non définie";
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Info item component
  const InfoItem = ({ icon: Icon, label, value, className = "" }: { icon: any; label: string; value: string; className?: string }) => (
    <div className={`flex items-start gap-3 p-3 rounded-xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow ${className}`}>
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500">
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-semibold text-slate-800 truncate" title={value}>{value || "Non défini"}</p>
      </div>
    </div>
  );

  const commentCount = comments?.length || 0;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Détails de la tâche"
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2 text-xs text-purple-600">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{commentCount} commentaire{commentCount > 1 ? 's' : ''}</span>
            </div>
            <Button variant="secondary" onClick={onClose} className="px-6 ml-auto">
              Fermer
            </Button>
          </div>
        }
      >
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
          {/* En-tête avec titre et badges */}
          <div className="bg-gradient-to-r from-slate-50 to-blue-50/30 -mx-6 px-6 py-4 border-b border-slate-100">
            <h3 className="text-xl font-bold text-slate-900 mb-3">{task.titre}</h3>
            <div className="flex flex-wrap gap-2">
              {task.priorite && (
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(task.priorite)}`}>
                  <Tag className="w-3 h-3 inline mr-1" />
                  {PRIORITY_LABELS[task.priorite] || task.priorite}
                </span>
              )}
              {task.statut && (
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(task.statut)}`}>
                  {STATUS_LABELS[task.statut] || task.statut}
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          {task.description && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500">
                  <Info className="w-3.5 h-3.5" />
                </div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Description</label>
              </div>
              <div className="bg-slate-50 rounded-xl px-4 py-3 border border-slate-200">
                <p className="text-sm text-slate-700 leading-relaxed">{task.description}</p>
              </div>
            </div>
          )}

          {/* Grille d'informations avec Responsable et Créateur */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500">
                <Info className="w-3.5 h-3.5" />
              </div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Informations</label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InfoItem
                icon={User}
                label="Responsable"
                value={task.assigne_a ? getDisplayName(task.assigne_a, usersList) : "Non assigné"}
              />
              <InfoItem
                icon={UserPlus}
                label="Créé par"
                value={task.created_by ? getDisplayName(task.created_by, usersList) : "Système"}
              />
              <InfoItem
                icon={Calendar}
                label="Date d'échéance"
                value={task.date_echeance ? new Date(task.date_echeance).toLocaleDateString('fr-FR') : "Non définie"}
                className="sm:col-span-1"
              />
              <InfoItem
                icon={Clock}
                label="Date de création"
                value={formatDate(task.created_at)}
                className="sm:col-span-1"
              />
            </div>
          </div>

          {/* SECTION COMMENTAIRES */}
          <div className="border-t border-slate-100 pt-4">
            {loadingComments ? (
              <div className="text-center py-4">
                <p className="text-sm text-slate-400">Chargement des commentaires...</p>
              </div>
            ) : hasError ? (
              <div className="text-center py-4">
                <p className="text-sm text-amber-600">Impossible de charger les commentaires</p>
                <button 
                  onClick={loadComments}
                  className="mt-2 text-xs text-blue-600 hover:underline"
                >
                  Réessayer
                </button>
              </div>
            ) : (
              <TaskComments
                comments={comments || []}
                currentUserId={currentUserId}
                onAddComment={() => setIsAddCommentOpen(true)}
                onEditComment={handleEditComment}
                onDeleteComment={handleDeleteComment}
              />
            )}
          </div>

          {/* Pièces associées */}
          {(task as any).documents && (task as any).documents.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-lg bg-cyan-50 flex items-center justify-center text-cyan-500">
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pièces associées</label>
              </div>
              <div className="flex flex-wrap gap-2">
                {(task as any).documents.map((doc: any, index: number) => (
                  <span key={index} className="px-3 py-1.5 bg-cyan-50 rounded-lg text-sm text-cyan-700 border border-cyan-200 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    {doc.nom || doc}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Modale d'ajout de commentaire */}
      <AddCommentModal
        isOpen={isAddCommentOpen}
        onClose={() => setIsAddCommentOpen(false)}
        onAdd={handleAddComment}
        taskTitle={task.titre}
      />
    </>
  );
};