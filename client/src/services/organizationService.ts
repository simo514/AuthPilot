import api from '../lib/api';
import {
  Organization,
  CreateOrganizationDto,
  UpdateOrganizationDto,
  PaginatedOrganizations,
  OrganizationFilters,
  OrganizationStatus,
} from '../types/organization.types';

export const organizationService = {
  // Get all organizations
  async getAll(filters?: OrganizationFilters): Promise<PaginatedOrganizations> {
    const params = new URLSearchParams();
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.status) params.append('status', filters.status);

    const response = await api.get(`/organizations?${params.toString()}`);
    return response.data;
  },

  // Get organization by UUID
  async getByUuid(uuid: string): Promise<Organization> {
    const response = await api.get(`/organizations/${uuid}`);
    return response.data;
  },

  // Get organization by slug
  async getBySlug(slug: string): Promise<Organization> {
    const response = await api.get(`/organizations/slug/${slug}`);
    return response.data;
  },

  // Create new organization
  async create(data: CreateOrganizationDto): Promise<Organization> {
    const response = await api.post('/organizations', data);
    return response.data;
  },

  // Update organization
  async update(uuid: string, data: UpdateOrganizationDto): Promise<Organization> {
    const response = await api.patch(`/organizations/${uuid}`, data);
    return response.data;
  },

  // Update organization status
  async updateStatus(uuid: string, status: OrganizationStatus): Promise<Organization> {
    const response = await api.patch(`/organizations/${uuid}/status`, { status });
    return response.data;
  },

  // Delete organization
  async delete(uuid: string): Promise<void> {
    await api.delete(`/organizations/${uuid}`);
  },

  // Get users in organization
  async getUsers(organizationId: string, page = 1, limit = 10) {
    const response = await api.get(`/users/organization/${organizationId}/users`, {
      params: { page, limit },
    });
    return response.data;
  },

  // Assign user to organization
  async assignUser(userUuid: string, organizationId: string): Promise<void> {
    await api.patch(`/users/${userUuid}/organization`, { organizationId });
  },

  // Remove user from organization
  async removeUser(userUuid: string): Promise<void> {
    await api.delete(`/users/${userUuid}/organization`);
  },

  // Get unassigned users
  async getUnassignedUsers(page = 1, limit = 10) {
    const response = await api.get('/users/unassigned/list', {
      params: { page, limit },
    });
    return response.data;
  },
};
