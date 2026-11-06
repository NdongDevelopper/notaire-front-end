import { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Loader } from '../../../shared/components/ui/Loader/Loader';
import { getErrorMessage } from '@/shared/utils/errors';
import { useTaskStore } from '../store/task.store';
import { TasksGrid } from '../components/TasksGrid';
import type { CreateTaskPayload, TaskPriority, TaskStatus } from '../types/task.types';

const tabs = [
  { key: 'all', label: 'Toutes' },
  { key: 'mine', label: 'Mes tâches' },
  { key: 'late', label: 'En retard' },
] as const;

const MESSAGES_VIDE: Record<(typeof tabs)[number]['key'], string> = {
  all: 'Aucune tâche pour le moment.',
  mine: "Vous n'avez aucune tâche assignée.",
  late: 'Aucune tâche en retard.',
};

function CreateTaskModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { createTask, mutating } = useTaskStore();
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [priorite, setPriorite] = useState<TaskPriority>('normale');
  const [statut, setStatut] = useState<TaskStatus>('a_faire');
  const [dateEcheance, setDateEcheance] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);

  if (!open) return null;

  function resetEtFermer() {
    setTitre('');
    setDescription('');
    setPriorite('normale');
    setStatut('a_faire');
    setDateEcheance('');
    setErreur(null);
    onClose();
  }

  async function handleSubmit() {
    setErreur(null);
    if (!titre.trim()) {
      setErreur('Le titre de la tâche est obligatoire.');
      return;
    }
    const payload: CreateTaskPayload = {
      titre: titre.trim(),
      priorite,
      statut,
      // Champs facultatifs : on envoie null plutôt qu'une chaîne vide, sinon
      // le backend rejette la valeur pour un champ UUID/Date optionnel.
      description: description.trim() || undefined,
      date_echeance: dateEcheance || null,
    };
    try {
      await createTask(payload);
      resetEtFermer();
    } catch (err) {
      setErreur(getErrorMessage(err));
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={resetEtFermer}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Nouvelle tâche</h2>
          <button
            type="button"
            onClick={resetEtFermer}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Titre *</label>
            <input
              type="text"
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              placeholder="Ex: Préparer les pièces du dossier"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-20 w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Priorité</label>
              <select
                value={priorite}
                onChange={(e) => setPriorite(e.target.value as TaskPriority)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="basse">Basse</option>
                <option value="normale">Normale</option>
                <option value="haute">Haute</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Statut</label>
              <select
                value={statut}
                onChange={(e) => setStatut(e.target.value as TaskStatus)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="a_faire">À faire</option>
                <option value="en_cours">En cours</option>
                <option value="en_attente">En attente</option>
                <option value="termine">Terminé</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Date d'échéance</label>
            <input
              type="date"
              value={dateEcheance}
              onChange={(e) => setDateEcheance(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          {erreur && (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {erreur}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={resetEtFermer}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={mutating}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {mutating ? 'Création…' : 'Créer la tâche'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TasksPage() {
  const { view, setView, tasks, myTasks, lateTasks, loading, error, fetchTasks } = useTaskStore();
  const [modalOuvert, setModalOuvert] = useState(false);

  useEffect(() => {
    void fetchTasks();
  }, [fetchTasks]);

  const currentTasks = view === 'all' ? tasks : view === 'mine' ? myTasks : lateTasks;

  return (
    <div className="p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-xl font-bold text-slate-900">Tâches</h1>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setView(tab.key)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  view === tab.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setModalOuvert(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            <Plus size={16} />
            Nouvelle tâche
          </button>
        </div>
      </div>

      <div className="mt-4">
        {loading && (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Loader />
            Chargement des tâches...
          </div>
        )}

        {!loading && error && <p className="text-sm text-red-600">{error}</p>}

        {!loading && !error && currentTasks.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 p-10 text-center">
            <p className="text-sm text-slate-500">{MESSAGES_VIDE[view]}</p>
            <button
              type="button"
              onClick={() => setModalOuvert(true)}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <Plus size={14} />
              Créer une tâche
            </button>
          </div>
        )}

        {!loading && !error && currentTasks.length > 0 && <TasksGrid tasks={currentTasks} />}
      </div>

      <CreateTaskModal open={modalOuvert} onClose={() => setModalOuvert(false)} />
    </div>
  );
}