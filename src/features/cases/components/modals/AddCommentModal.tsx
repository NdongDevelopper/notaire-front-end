import { useState } from "react";
import { Modal } from "../../../../shared/components/ui/Modal/Modal";
import { Button } from "../../../../shared/components/ui/Button/Button";

interface AddCommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (contenu: string) => void;
  taskTitle?: string;
}

export const AddCommentModal = ({ isOpen, onClose, onAdd, taskTitle }: AddCommentModalProps) => {
  const [contenu, setContenu] = useState("");

  const handleSubmit = () => {
    if (!contenu.trim()) return;
    onAdd(contenu.trim());
    setContenu("");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Ajouter un commentaire${taskTitle ? ` - ${taskTitle}` : ''}`}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} className="hover:!bg-slate-200">
            Annuler
          </Button>
          <Button variant="primary" onClick={handleSubmit} className="hover:!bg-blue-700" disabled={!contenu.trim()}>
            Ajouter
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Commentaire *
          </label>
          <textarea
            value={contenu}
            onChange={(e) => setContenu(e.target.value)}
            placeholder="Écrivez votre commentaire ici..."
            className="w-full text-sm bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 font-medium text-slate-700 resize-none h-32"
            autoFocus
          />
          <p className="text-xs text-slate-400 mt-1">
            {contenu.length} caractères
          </p>
        </div>
      </div>
    </Modal>
  );
};