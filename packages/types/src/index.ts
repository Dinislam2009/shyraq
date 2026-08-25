export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type TaskPriority = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';

export interface Task {
  id: string;
  userId: string;
  projectId: string | null;
  parentTaskId: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt: string | null;
  estimatedDuration: number | null;
  completedAt: string | null;
  version: bigint;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
