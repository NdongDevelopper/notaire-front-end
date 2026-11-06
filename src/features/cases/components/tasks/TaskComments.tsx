import { useState } from "react";
import { MessageSquare, User, Clock, Trash2, Edit2, Check, X, Plus } from "lucide-react";
import { Button } from "../../../../shared/components/ui/Button/Button";
import { getDisplayName, formatDateTime } from "../../helpers/format";
import type { TaskComment } from "../../types/comment.types";

interface TaskCommentsProps {
  comments: TaskComment[];
  currentUserId?: string;
  onAddComment: () => void;
  onEditComment: (commentId: string, contenu: string) => void;
  onDeleteComment: (commentId: string) => void;
}

export const TaskComments = ({
  comments,
  currentUserId,
  onAddComment,
  onEditComment,
  onDeleteComment,
}: TaskCommentsProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const startEdit = (comment: TaskComment) => {
    setEditingId(comment.id);
    setEditContent(comment.contenu);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent("");
  };

  const saveEdit = (commentId: string) => {
    if (!editContent.trim()) return;
    onEditComment(commentId, editContent.trim());
    setEditingId(null);
    setEditContent("");
  };

  const isCurrentUserComment = (comment: TaskComment) => {
    if (!currentUserId) return false;
    const userId = typeof comment.utilisateur === 'object' 
      ? comment.utilisateur.id 
      : comment.utilisateur;
    return userId === currentUserId;
  };

  if (comments.length === 0) {
    return (
      <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center">
        <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-sm text-slate-400">Aucun commentaire</p>
        <p className="text-xs text-slate-300 mt-1">Soyez le premier à commenter cette tâche</p>
        <Button 
          variant="secondary" 
          onClick={onAddComment} 
          className="mt-3 text-xs font-bold text-blue-600 bg-transparent hover:!bg-blue-50 flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" /> Ajouter un commentaire
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-purple-500" />
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Commentaires ({comments.length})
          </label>
        </div>
        <Button 
          variant="secondary" 
          onClick={onAddComment} 
          className="text-xs font-bold text-blue-600 bg-transparent hover:!bg-blue-50 flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" /> Ajouter
        </Button>
      </div>

      {comments.map((comment) => {
        const isEditing = editingId === comment.id;
        const isOwner = isCurrentUserComment(comment);

        return (
          <div 
            key={comment.id} 
            className={`bg-white rounded-xl border ${isOwner ? 'border-purple-200 bg-purple-50/30' : 'border-slate-100'} p-4 transition-all`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isOwner ? 'bg-purple-100 text-purple-500' : 'bg-slate-100 text-slate-500'}`}>
                  <User className="w-4 h-4" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-800">
                      {getDisplayName(comment.utilisateur)}
                    </span>
                    {isOwner && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-purple-600">
                        Vous
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Clock className="w-3 h-3" />
                    <span>{formatDateTime(comment.created_at)}</span>
                  </div>
                </div>

                {isEditing ? (
                  <div className="mt-2 space-y-2">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full text-sm bg-white border border-purple-300 rounded-xl px-3 py-2 focus:outline-none focus:border-purple-500 font-medium text-slate-700 resize-none h-20"
                      autoFocus
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => saveEdit(comment.id)}
                        className="px-3 py-1 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors flex items-center gap-1 text-xs font-medium"
                      >
                        <Check className="w-3.5 h-3.5" /> Enregistrer
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="px-3 py-1 rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors flex items-center gap-1 text-xs font-medium"
                      >
                        <X className="w-3.5 h-3.5" /> Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-700 leading-relaxed mt-1">
                    {comment.contenu}
                  </p>
                )}

                {!isEditing && isOwner && (
                  <div className="flex items-center gap-1 mt-2">
                    <button
                      onClick={() => startEdit(comment)}
                      className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Modifier"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteComment(comment.id)}
                      className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};