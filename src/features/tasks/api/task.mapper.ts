import { normalizeTask, type TaskDTO } from '../types/task.types';

export function mapTaskDTOToTask(dto: TaskDTO) {
  return normalizeTask(dto);
}
