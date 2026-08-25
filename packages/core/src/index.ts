import type { Task, TaskStatus } from '@shyraq/types';

export function isTaskCompleted(task: Pick<Task, 'status'>): boolean {
  return task.status === 'COMPLETED';
}

export function nextTaskStatus(status: TaskStatus): TaskStatus {
  return status === 'COMPLETED' ? 'TODO' : 'COMPLETED';
}
