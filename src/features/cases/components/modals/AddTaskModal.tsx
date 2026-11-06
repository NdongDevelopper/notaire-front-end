import { useState, useEffect } from "react";
import { Modal } from "../../../../shared/components/ui/Modal/Modal";
import { Button } from "../../../../shared/components/ui/Button/Button";
import { Input } from "../../../../shared/components/ui/Input/Input";
import { AlertCircle } from "lucide-react";
import { usePermissions } from "../../../../shared/hooks/usePermissions";
import type { User as UserType } from "../../types/case";
import type { TaskFormData, TaskPriority, TaskStatus } from "../../types/task.types";

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (task: TaskFormData) => void;
  usersList?: UserType[];
}

export const AddTaskModal = ({ isOpen, onClose, onAdd, usersList }: AddTaskModalProps) => {
  const { can } = usePermissions();
  const canCreate = can('creer', 'tache');

  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [assigneA, setAssigneA] = useState("");
  const [priorite, setPriorite] = useState<TaskPriority>("normale");
  const [dateEcheance, setDateEcheance] = useState("");
  const [statut, setStatut] = useState<TaskStatus>("a_faire");

  useEffect(() => {
    if (isOpen && usersList && usersList.length > 0 && !assigneA) {
      setAssigneA(usersList[0].id);
    }
  }, [isOpen, usersList, assigneA]);

  const handleSubmit = () => {
    if (!canCreate) return;
    if (!titre.trim() || !assigneA) return;
    onAdd({
      titre: titre.trim(),
      description: description.trim(),
      assigne_a: assigneA,
      priorite,
      date_echeance: dateEcheance,
      statut,
      commentaire: "",
    });
    setTitre("");
    setDescription("");
    setAssigneA("");
    setPriorite("normale");
    setDateEcheance("");
    setStatut("a_faire");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ajouter une tâche"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} className="hover:!bg-slate-200">
            Annuler
          </Button>
          <Button variant="primary" onClick={handleSubmit} className="hover:!bg-blue-700" disabled={!titre.trim() || !assigneA || !canCreate}>
            Ajouter
          </Button>
        </>
      }
    >
      <div className="space-y-4 max-h-[60vh] overflow-y-auto">
        {!canCreate && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>Vous n'avez pas les permissions nécessaires pour créer une tâche.</span>
          </div>
        )}

        <Input
          label="Titre de la tâche *"
          type="text"
          value={titre}
          onChange={(e) => setTitre(e.target.value)}
          placeholder="Ex: Préparer les pièces"
          disabled={!canCreate}
        />

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description détaillée de la tâche..."
            className="w-full text-sm bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 font-medium text-slate-700 resize-none h-20"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Responsable *
          </label>
          <select
            value={assigneA}
            onChange={(e) => setAssigneA(e.target.value)}
            className="w-full text-sm bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 font-medium text-slate-700 shadow-sm"
            required
          >
            <option value="">Sélectionner un responsable</option>
            {usersList?.map((user) => (
              <option key={user.id} value={user.id}>
                {user.first_name} {user.last_name} ({user.username})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Priorité
          </label>
          <select
            value={priorite}
            onChange={(e) => setPriorite(e.target.value as TaskPriority)}
            className="w-full text-sm bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 font-medium text-slate-700 shadow-sm"
          >
            <option value="basse">Basse</option>
            <option value="normale">Normale</option>
            <option value="haute">Haute</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Date d'échéance
          </label>
          <input
            type="date"
            value={dateEcheance}
            onChange={(e) => setDateEcheance(e.target.value)}
            className="w-full text-sm bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 font-medium text-slate-700 shadow-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Statut
          </label>
          <select
            value={statut}
            onChange={(e) => setStatut(e.target.value as TaskStatus)}
            className="w-full text-sm bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 font-medium text-slate-700 shadow-sm"
          >
            <option value="a_faire">À faire</option>
            <option value="en_cours">En cours</option>
            <option value="termine">Terminé</option>
          </select>
        </div>
      </div>
    </Modal>
  );
};