import { useState } from "react";
import { Modal } from "../../../../shared/components/ui/Modal/Modal";
import { Button } from "../../../../shared/components/ui/Button/Button";
import { Input } from "../../../../shared/components/ui/Input/Input";

interface AddDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (document: { nom: string; type_piece: string; obligatoire: boolean }) => Promise<void>;
}

export const AddDocumentModal = ({ isOpen, onClose, onAdd }: AddDocumentModalProps) => {
  const [nom, setNom] = useState("");
  const [typePiece, setTypePiece] = useState("");
  const [obligatoire, setObligatoire] = useState(false);
  const [submitting, setSubmitting] = useState(false);


  const handleSubmit = async () => {
    if (!nom.trim()) return;
    setSubmitting(true);
    try {
      await onAdd({ nom: nom.trim(), type_piece: typePiece.trim(), obligatoire });
      setNom("");
      setTypePiece("");
      setObligatoire(false);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ajouter une pièce"
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} className="hover:!bg-slate-200" disabled={submitting}>
            Annuler
          </Button>
          <Button variant="primary" onClick={handleSubmit} className="hover:!bg-blue-700" disabled={submitting || !nom.trim()}>
            {submitting ? "Ajout..." : "Ajouter"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input
          label="Nom de la pièce *"
          type="text"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Ex: Titre foncier"
        />
        <Input
          label="Type de pièce"
          type="text"
          value={typePiece}
          onChange={(e) => setTypePiece(e.target.value)}
          placeholder="Ex: foncier, identite, etc."
        />
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="obligatoire"
            checked={obligatoire}
            onChange={(e) => setObligatoire(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded border-slate-300"
          />
          <label htmlFor="obligatoire" className="text-sm font-medium text-slate-700">
            Pièce obligatoire
          </label>
        </div>
      </div>
    </Modal>
  );
};