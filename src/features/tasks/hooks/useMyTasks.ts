import { useEffect } from 'react';
import { useTaskStore } from '../store/task.store';

export function useMyTasks() {
  const tasks = useTaskStore((state) => state.tasks);
  const status = useTaskStore((state) => state.status);
  const error = useTaskStore((state) => state.error);
  const fetchTasks = useTaskStore((state) => state.fetchTasks);

  useEffect(() => {
    void fetchTasks();
  }, [fetchTasks]);

  return { tasks, isLoading: status === 'loading', error };
}
