import { toArray } from '@/shared/utils/http';
import { taskApi } from '../api/task.api';
import type { CreateTaskPayload, TaskDTO, TaskStatus } from '../types/task.types';

const normalizeTaskList = (payload: unknown): TaskDTO[] => toArray<TaskDTO>(payload);

export const taskService = {
  getTasks: async () => normalizeTaskList((await taskApi.getTasks()).data),
  getMyTasks: async () => normalizeTaskList((await taskApi.getMyTasks()).data),
  getLateTasks: async () => normalizeTaskList((await taskApi.getLateTasks()).data),
  updateTaskStatus: async (taskId: string, status: TaskStatus) => {
    const response = await taskApi.updateTaskStatus(taskId, status);
    return response.data as TaskDTO;
  },
  createTask: async (payload: CreateTaskPayload) => {
    const response = await taskApi.createTask(payload);
    return response.data as TaskDTO;
  },
  updateTask: async (taskId: string, payload: Partial<CreateTaskPayload>) => {
    const response = await taskApi.updateTask(taskId, payload);
    return response.data as TaskDTO;
  },
  deleteTask: async (taskId: string) => {
    await taskApi.deleteTask(taskId);
  },
};