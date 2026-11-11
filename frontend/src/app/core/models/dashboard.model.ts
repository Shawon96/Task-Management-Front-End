import { CountItem } from './common.model';
import { Task } from './task.model';

export interface Dashboard {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  tasksByStatus: CountItem[];
  tasksByPriority: CountItem[];
  upcomingDueTasks: Task[];
}
