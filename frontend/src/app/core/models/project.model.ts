export interface Project {
  id: number;
  name: string;
  description?: string | null;
  ownerId: number;
  ownerName: string;
  startDate?: string | null;
  endDate?: string | null;
  taskCount: number;
  completedTaskCount: number;
  createdDate: string;
  modifiedDate?: string | null;
}

export interface ProjectPayload {
  name: string;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}
