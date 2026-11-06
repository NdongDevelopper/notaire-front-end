import { useState, useEffect } from "react";
import { Modal } from '../../../../shared/components/ui/Modal/Modal';
import { Button } from "../../../../shared/components/ui/Button/Button";
import { Input } from "../../../../shared/components/ui/Input/Input";
import { UserPlus, AlertCircle, CheckCircle2 } from "lucide-react";
import { usePermissions } from "../../../../shared/hooks/usePermissions";
import type { DossierTask, User as UserType } from "../../types/case";
import type { TaskFormData, TaskPriority, TaskStatus } from "../../types/task.types";

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: DossierTask | null;
  onSave: (task: TaskFormData) => Promise<void>;
  usersList?: UserType[];
  currentUserId?: string;
}

// Fonction pour obtenir le nom affichable d'un utilisateur
const getDisplayName = (user: any): string => {
  if (!user) return "Système";
  if (typeof user === 'object' && user !== null) {
    const firstName = user.first_name || '';
    const lastName = user.last_name || '';
    const username = user.username || '';

    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim();
    }
    return username || "Utilisateur";
  }
  return String(user);
};

// Extrait un ID depuis un champ user (objet ou string)
const extractId = (value: any): string | null => {
  if (!value) return null;
  if (typeof value === 'object' && value !== null) {
    return (value as any).id ?? null;
  }
  return String(value);
};

export const EditTaskModal = ({ isOpen, onClose, task, onSave, usersList, currentUserId }: EditTaskModalProps) => {
  const { can } = usePermissions();

  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [assigneA, setAssigneA] = useState("");
  const [priorite, setPriorite] = useState<TaskPriority>("normale");
  const [dateEcheance, setDateEcheance] = useState("");
  const [statut, setStatut] = useState<TaskStatus>("a_faire");
  const [submitting, setSubmitting] = useState(false);

  const isCreator = (): boolean => {
    if (!task || !currentUserId) return false;
    return extractId(task.created_by) === currentUserId;
  };

  const isAssignee = (): boolean => {
    if (!task || !currentUserId) return false;
    return extractId(task.assigne_a) === currentUserId;
  };

  // Droit d'édition complète : le rôle a "modifier" dans la matrice, OU l'utilisateur
  // est le créateur de la tâche (propriétaire de l'objet, indépendamment du rôle).
  const canEditAll = can('modifier', 'tache') || isCreator();

  // Le responsable assigné (sans droit "modifier" global et sans être créateur)
  // ne peut modifier que le statut — exigence CDC Parcours 13.
  const canEditStatusOnly = !canEditAll && isAssignee();

  const canEditStatus = canEditAll || canEditStatusOnly;
  const hasAnyAccess = canEditAll || canEditStatusOnly;

  useEffect(() => {
    if (task && isOpen) {
      setTitre(task.titre || "");
      setDescription(task.description || "");
      if (task.assigne_a) {
        if (typeof task.assigne_a === 'object') {
          setAssigneA((task.assigne_a as any).id || "");
        } else {
          setAssigneA(task.assigne_a as string);
        }
      } else {
        setAssigneA("");
      }
      setPriorite((task.priorite as TaskPriority) || "normale");
      setDateEcheance(task.date_echeance ? String(task.date_echeance).slice(0, 10) : "");
      setStatut((task.statut as TaskStatus) || "a_faire");
    }
  }, [task, isOpen]);

  if (!task) return null;

  const handleSubmit = async () => {
    if (!hasAnyAccess) {
      alert("⛔ Vous n'avez pas les permissions nécessaires pour modifier cette tâche.");
      return;
    }
    if (!titre.trim() || !assigneA) return;
    setSubmitting(true);
    try {
      // Édition complète si autorisé ; sinon seul le statut est réellement modifié,
      // les autres champs repartent avec leur valeur d'origine.
      const payload: TaskFormData = canEditAll
        ? {
            titre: titre.trim(),
            description: description.trim(),
            assigne_a: assigneA,
            priorite,
            date_echeance: dateEcheance,
            statut,
            commentaire: "",
          }
        : {
            titre: task.titre || "",
            description: task.description || "",
            assigne_a: assigneA,
            priorite: (task.priorite as TaskPriority) || "normale",
            date_echeance: task.date_echeance ? String(task.date_echeance).slice(0, 10) : "",
            statut,
            commentaire: "",
          };

      await onSave(payload);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const creatorName = task.created_by ? getDisplayName(task.created_by) : "Système";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Modifier la tâche"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} className="hover:!bg-slate-200" disabled={submitting}>
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            className="hover:!bg-blue-700"
            disabled={submitting || !titre.trim() || !assigneA || !hasAnyAccess}
          >
            {submitting ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </>
      }
    >
      <div className="space-y-4 max-h-[60vh] overflow-y-auto">
        {!hasAnyAccess && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-medium">⛔ Accès restreint :</span> Vous n'avez pas les permissions nécessaires pour modifier cette tâche.
            </div>
          </div>
        )}

        {canEditStatusOnly && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-medium">Vous êtes le responsable de cette tâche.</span>
              <br />
              <span className="text-xs">Vous pouvez uniquement modifier le statut. Les autres champs sont en lecture seule.</span>
            </div>
          </div>
        )}

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-500 font-medium">Créé par:</span>
          <span className="text-sm font-semibold text-slate-700">{creatorName}</span>
        </div>

        <Input
          label="Titre de la tâche *"
          type="text"
          value={titre}
          onChange={(e) => setTitre(e.target.value)}
          placeholder="Ex: Préparer les pièces"
          disabled={!canEditAll}
        />

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description détaillée de la tâche..."
            className="w-full text-sm bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 font-medium text-slate-700 resize-none h-20 disabled:bg-slate-50 disabled:text-slate-400"
            disabled={!canEditAll}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Responsable *
          </label>
          <select
            value={assigneA}
            onChange={(e) => setAssigneA(e.target.value)}
            className="w-full text-sm bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 font-medium text-slate-700 shadow-sm disabled:bg-slate-50 disabled:text-slate-400"
            required
            disabled={!canEditAll}
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
            className="w-full text-sm bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 font-medium text-slate-700 shadow-sm disabled:bg-slate-50 disabled:text-slate-400"
            disabled={!canEditAll}
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
            className="w-full text-sm bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 font-medium text-slate-700 shadow-sm disabled:bg-slate-50 disabled:text-slate-400"
            disabled={!canEditAll}
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Statut
          </label>
          <select
            value={statut}
            onChange={(e) => setStatut(e.target.value as TaskStatus)}
            className="w-full text-sm bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500 font-medium text-slate-700 shadow-sm disabled:bg-slate-50 disabled:text-slate-400"
            disabled={!canEditStatus}
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