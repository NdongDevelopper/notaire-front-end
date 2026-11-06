import { Plus } from "lucide-react";
import { Button } from "../../../../shared/components/ui/Button/Button";
import { TaskCard } from "./TaskCard";
import type { DossierTask } from "../../types/case";

interface TasksTabProps {
  tasks: DossierTask[];
  onAddTask: () => void;
  onViewTask: (task: DossierTask) => void;
  onEditTask: (task: DossierTask) => void;
  onDeleteTask: (taskId: string | number) => void;
  usersList?: any[];
  currentUserId?: string;
  canCreate?: boolean;
  canModify?: boolean;
  canDelete?: boolean;
}

export const TasksTab = ({
  tasks,
  onAddTask,
  onViewTask,
  onEditTask,
  onDeleteTask,
  usersList,
  currentUserId,
  canCreate = true,
  canModify = true,
  canDelete = true,
}: TasksTabProps) => {
  const activeTasks = tasks.filter((t) => t.statut !== 'termine' && t.statut !== 'annule');
  const overdueTasks = tasks.filter(
    (t) => {
      if (!t.date_echeance) return false;
      if (t.statut === 'termine' || t.statut === 'annule') return false;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dueDate = new Date(t.date_echeance);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate < today;
    }
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-base font-bold text-slate-900">Suivi des tâches</h3>
          <p className="text-xs text-slate-400">
            {activeTasks.length} tâche(s) en cours
            {overdueTasks.length > 0 && (
              <span className="ml-2 text-red-500">
                ({overdueTasks.length} en retard)
              </span>
            )}
          </p>
        </div>
        {canCreate && (
          <Button
            variant="secondary"
            onClick={onAddTask}
            className="text-xs font-bold text-blue-600 bg-transparent hover:!bg-transparent flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" /> Ajouter une tâche
          </Button>
        )}
      </div>
      <div className="space-y-3">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onView={onViewTask}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              usersList={usersList}
              currentUserId={currentUserId}
              canModify={canModify}
              canDelete={canDelete}
            />
          ))
        ) : (
          <p className="text-sm text-slate-400 italic text-center py-6">Aucune tâche assignée à ce dossier.</p>
        )}
      </div>
    </div>
  );
};