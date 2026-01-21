export class ProjectResponseDto {
  uuid: string;
  name: string;
  description?: string;
  slug: string;
  organizationId: string;
  organizationName?: string;
  status: string;
  currentUsers: number;
  startDate?: Date;
  endDate?: Date;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}
