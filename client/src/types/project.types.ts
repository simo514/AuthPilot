export interface Project {
  uuid: string;
  name: string;
  description?: string;
  slug: string;
  organizationId: string;
  organizationName?: string;
  status: 'active' | 'inactive' | 'archived';
  currentUsers: number;
  startDate?: string;
  endDate?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectDto {
  name: string;
  description?: string;
  slug: string;
  organizationId: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  tags?: string[];
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
  slug?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  tags?: string[];
}
