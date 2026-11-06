import { create } from 'zustand';
import { taskService } from '../services/task.service';
import { normalizeTask, type CreateTaskPayload, type Task, type TaskDTO, type TaskStatus } from '../types/task.types';

export type TasksView = 'all' | 'mine' | 'late';
export type TaskRequestStatus = 'idle' | 'loading' | 'success' | 'error';

interface TaskState {
  tasks: Task[];
  myTasks: Task[];
  lateTasks: Task[];
  loading: boolean;
  /** Distinct de `loading` : une création/modification ne doit pas faire
   * disparaître la liste déjà affichée pendant qu'elle s'exécute. */
  mutating: boolean;
  status: TaskRequestStatus;
  error: string | null;
  view: TasksView;
  setView: (view: TasksView) => void;
  fetchTasks: () => Promise<void>;
  fetchMyTasks: () => Promise<void>;
  createTask: (payload: CreateTaskPayload) => Promise<void>;
  updateTask: (taskId: string, payload: Partial<CreateTaskPayload>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  updateTaskStatus: (taskId: string, nextStatus: TaskStatus) => Promise<void>;
}

const mapTaskList = (items: TaskDTO[]): Task[] => items.map((item) => normalizeTask(item));

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  myTasks: [],
  lateTasks: [],
  loading: false,
  mutating: false,
  status: 'idle',
  error: null,
  view: 'all',
  setView: (view) => set({ view }),

  fetchTasks: async () => {
    set({ loading: true, status: 'loading', error: null });
    try {
      const [tasks, myTasks, lateTasks] = await Promise.all([
        taskService.getTasks(),
        taskService.getMyTasks(),
        taskService.getLateTasks(),
      ]);
      set({
        tasks: mapTaskList(tasks),
        myTasks: mapTaskList(myTasks),
        lateTasks: mapTaskList(lateTasks),
        loading: false,
        status: 'success',
      });
    } catch (error) {
      set({
        loading: false,
        status: 'error',
        error: 'Impossible de charger les tâches.',
      });
      console.error(error);
    }
  },

  fetchMyTasks: async () => {
    set({ loading: true, status: 'loading', error: null });
    try {
      const myTasks = mapTaskList(await taskService.getMyTasks());
      set({ myTasks, loading: false, status: 'success' });
    } catch (error) {
      set({ loading: false, status: 'error', error: 'Impossible de charger vos tâches.' });
      console.error(error);
    }
  },

  createTask: async (payload) => {
    set({ mutating: true, error: null });
    try {
      await taskService.createTask(payload);
      // On recharge les trois vues plutôt que d'insérer localement la
      // réponse : la nouvelle tâche peut apparaître dans "Mes tâches" ou
      // "En retard" selon son assignation et son échéance, et ces règles
      // sont calculées côté serveur, pas dupliquées ici.
      await get().fetchTasks();
    } catch (error) {
      set({ mutating: false, error: 'Impossible de créer la tâche.' });
      console.error(error);
      throw error;
    } finally {
      set({ mutating: false });
    }
  },

  updateTask: async (taskId, payload) => {
    set({ mutating: true, error: null });
    try {
      await taskService.updateTask(taskId, payload);
      await get().fetchTasks();
    } catch (error) {
      set({ mutating: false, error: 'Impossible de modifier la tâche.' });
      console.error(error);
      throw error;
    } finally {
      set({ mutating: false });
    }
  },

  deleteTask: async (taskId) => {
    set({ mutating: true, error: null });
    try {
      await taskService.deleteTask(taskId);
      set((state) => ({
        tasks: state.tasks.filter((task) => task.id !== taskId),
        myTasks: state.myTasks.filter((task) => task.id !== taskId),
        lateTasks: state.lateTasks.filter((task) => task.id !== taskId),
      }));
    } catch (error) {
      set({ error: 'Impossible de supprimer la tâche.' });
      console.error(error);
      throw error;
    } finally {
      set({ mutating: false });
    }
  },

  updateTaskStatus: async (taskId, nextStatus) => {
    // Mise à jour optimiste : on applique le changement immédiatement dans
    // les trois listes, et on revient en arrière si le serveur refuse.
    const etatPrecedent = get();
    set((state) => ({
      tasks: state.tasks.map((task) => (task.id === taskId ? { ...task, status: nextStatus } : task)),
      myTasks: state.myTasks.map((task) => (task.id === taskId ? { ...task, status: nextStatus } : task)),
      lateTasks: state.lateTasks.map((task) => (task.id === taskId ? { ...task, status: nextStatus } : task)),
    }));
    try {
      const updatedTask = await taskService.updateTaskStatus(taskId, nextStatus);
      const normalized = normalizeTask(updatedTask);
      set((state) => ({
        tasks: state.tasks.map((task) => (task.id === taskId ? { ...task, ...normalized, id: taskId } : task)),
        myTasks: state.myTasks.map((task) => (task.id === taskId ? { ...task, ...normalized, id: taskId } : task)),
        lateTasks: state.lateTasks.map((task) => (task.id === taskId ? { ...task, ...normalized, id: taskId } : task)),
      }));
    } catch (error) {
      set({
        tasks: etatPrecedent.tasks,
        myTasks: etatPrecedent.myTasks,
        lateTasks: etatPrecedent.lateTasks,
        error: 'Impossible de modifier le statut de la tâche.',
      });
      console.error(error);
    }
  },
}));