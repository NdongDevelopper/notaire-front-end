import type { TaskPriority } from '../types/task.types';

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; className: string }> = {
  basse: { label: 'Basse', className: 'bg-slate-100 text-slate-600' },
  normale: { label: 'Normale', className: 'bg-amber-100 text-amber-700' },
  haute: { label: 'Haute', className: 'bg-red-100 text-red-700' },
  urgente: { label: 'Urgente', className: 'bg-red-600 text-white' },
};

export function TaskPriorityBadge({ priority }: { priority: TaskPriority }) {
  const config = PRIORITY_CONFIG[priority];
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
