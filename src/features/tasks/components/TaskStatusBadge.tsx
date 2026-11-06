import type { TaskStatus } from '../types/task.types';

const STATUS_CONFIG: Record<TaskStatus, { label: string; className: string }> = {
  a_faire: { label: 'À faire', className: 'bg-slate-100 text-slate-600' },
  en_cours: { label: 'En cours', className: 'bg-blue-100 text-[#3956EC]' },
  en_attente: { label: 'En attente', className: 'bg-amber-100 text-amber-700' },
  termine: { label: 'Terminé', className: 'bg-emerald-100 text-emerald-700' },
  annule: { label: 'Annulé', className: 'bg-slate-100 text-slate-400 line-through' },
  en_retard: { label: 'En retard', className: 'bg-red-100 text-red-700' },
};

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
