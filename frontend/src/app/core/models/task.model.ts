export type TaskStatus = 'ToDo' | 'InProgress' | 'Completed' | 'Cancelled';
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export const TASK_STATUSES: readonly TaskStatus[] = ['ToDo', 'InProgress', 'Completed', 'Cancelled'];
export const TASK_PRIORITIES: readonly TaskPriority[] = ['Low', 'Medium', 'High', 'Critical'];

export const STATUS_LABELS: Record<TaskStatus, string> = {
  ToDo: 'To Do',
  InProgress: 'In Progress',
  Completed: 'Completed',
  Cancelled: 'Cancelled'
};

export interface Task {
  id: number;
  projectId: number;
  projectName: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  isOverdue: boolean;
  assigneeId?: number | null;
  assigneeName?: string | null;
  createdDate: string;
  modifiedDate?: string | null;
}

export interface CreateTaskPayload {
  projectId: number;
  title: string;
  description?: string | null;
  priority: TaskPriority;
  dueDate?: string | null;
  assigneeId?: number | null;
}

export interface UpdateTaskPayload {
  title: string;
  description?: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string | null;
}

export interface TaskQuery {
  projectId?: number;
  assigneeId?: number;
  status?: TaskStatus;
  priority?: TaskPriority;
}
