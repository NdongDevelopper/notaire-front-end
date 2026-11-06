import { TaskPriorityBadge } from './TaskPriorityBadge';
import { TaskStatusBadge } from './TaskStatusBadge';
import type { Task, TaskStatus } from '../types/task.types';
import { useTaskStore } from '../store/task.store';

function formatDueDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }).format(
    date
  );
}

export function TaskCard({ task }: { task: Task }) {
  const isOverdue = task.status === 'en_retard';
  const updateTaskStatus = useTaskStore((state) => state.updateTaskStatus);

  const handleStatusChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextStatus = event.target.value as TaskStatus;
    await updateTaskStatus(task.id, nextStatus);
  };

  return (
    <div
      className={`rounded-xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md ${
        isOverdue ? 'border-red-200' : 'border-slate-200'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-900">{task.title}</h3>
        <TaskPriorityBadge priority={task.priority} />
      </div>

      <p className="mt-1.5 line-clamp-2 text-sm text-slate-500">{task.description}</p>

      <div className="mt-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <TaskStatusBadge status={task.status} />
          <select
            value={task.status}
            onChange={handleStatusChange}
            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 shadow-sm focus:border-blue-500 focus:outline-none"
            aria-label={`Modifier le statut de ${task.title}`}
          >
            <option value="a_faire">À faire</option>
            <option value="en_cours">En cours</option>
            <option value="en_attente">En attente</option>
            <option value="termine">Terminé</option>
            <option value="annule">Annulé</option>
            <option value="en_retard">En retard</option>
          </select>
        </div>
        <span className={`text-xs ${isOverdue ? 'font-medium text-red-600' : 'text-slate-400'}`}>
          Échéance : {formatDueDate(task.dueDate)}
        </span>
      </div>
    </div>
  );
}
