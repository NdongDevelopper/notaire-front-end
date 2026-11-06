import { TaskCard } from './TaskCard';
import type { Task } from '../types/task.types';

export function TasksGrid({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) {
    return <p className="text-sm italic text-slate-400">Aucune tâche correspondante pour cette vue.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  );
}
