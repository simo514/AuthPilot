import { create } from 'zustand';
import { Organization, OrganizationFilters } from '../types/organization.types';
import { organizationService } from '../services/organizationService';
import toast from 'react-hot-toast';

// Helper to extract error message from API error
function extractApiErrorMessage(error: any, fallback = 'An error occurred.') {
  if (error?.response?.data?.message) {
    if (Array.isArray(error.response.data.message)) {
      return error.response.data.message.join(' ');
    }
    return error.response.data.message;
  }
  if (typeof error?.message === 'string') {
    return error.message;
  }
  return fallback;
}

interface OrganizationState {
  organizations: Organization[];
  currentOrganization: Organization | null;
  total: number;
  loading: boolean;
  error: string | null;

  // Actions
  fetchOrganizations: (filters?: OrganizationFilters) => Promise<void>;
  fetchOrganizationByUuid: (uuid: string) => Promise<void>;
  createOrganization: (data: any) => Promise<Organization>;
  updateOrganization: (uuid: string, data: any) => Promise<Organization>;
  deleteOrganization: (uuid: string) => Promise<void>;
  setCurrentOrganization: (organization: Organization | null) => void;
  clearError: () => void;
}

export const useOrganizationStore = create<OrganizationState>((set) => ({
  organizations: [],
  currentOrganization: null,
  total: 0,
  loading: false,
  error: null,

  fetchOrganizations: async (filters) => {
    set({ loading: true, error: null });
    try {
      const data = await organizationService.getAll(filters);
      set({
        organizations: data.organizations,
        total: data.total,
        loading: false,
      });
    } catch (error: any) {
      const errorMsg = extractApiErrorMessage(error, 'Failed to fetch organizations');
      set({
        error: errorMsg,
        loading: false,
      });
      toast.error(errorMsg);
    }
  },

  fetchOrganizationByUuid: async (uuid) => {
    set({ loading: true, error: null });
    try {
      const organization = await organizationService.getByUuid(uuid);
      set({
        currentOrganization: organization,
        loading: false,
      });
    } catch (error: any) {
      const errorMsg = extractApiErrorMessage(error, 'Failed to fetch organization');
      set({
        error: errorMsg,
        loading: false,
      });
      toast.error(errorMsg);
    }
  },

  createOrganization: async (data) => {
    set({ loading: true, error: null });
    try {
      const organization = await organizationService.create(data);
      set((state) => ({
        organizations: [...state.organizations, organization],
        total: state.total + 1,
        loading: false,
      }));
      toast.success('Organization created successfully');
      return organization;
    } catch (error: any) {
      const errorMsg = extractApiErrorMessage(error, 'Failed to create organization');
      set({
        error: errorMsg,
        loading: false,
      });
      toast.error(errorMsg);
      throw error;
    }
  },

  updateOrganization: async (uuid, data) => {
    set({ loading: true, error: null });
    try {
      const updated = await organizationService.update(uuid, data);
      set((state) => ({
        organizations: state.organizations.map((org) =>
          org.uuid === uuid ? updated : org
        ),
        currentOrganization:
          state.currentOrganization?.uuid === uuid
            ? updated
            : state.currentOrganization,
        loading: false,
      }));
      toast.success('Organization updated successfully');
      return updated;
    } catch (error: any) {
      const errorMsg = extractApiErrorMessage(error, 'Failed to update organization');
      set({
        error: errorMsg,
        loading: false,
      });
      toast.error(errorMsg);
      throw error;
    }
  },

  deleteOrganization: async (uuid) => {
    set({ loading: true, error: null });
    try {
      await organizationService.delete(uuid);
      set((state) => ({
        organizations: state.organizations.filter((org) => org.uuid !== uuid),
        total: state.total - 1,
        currentOrganization:
          state.currentOrganization?.uuid === uuid
            ? null
            : state.currentOrganization,
        loading: false,
      }));
      toast.success('Organization deleted successfully');
    } catch (error: any) {
      const errorMsg = extractApiErrorMessage(error, 'Failed to delete organization');
      set({
        error: errorMsg,
        loading: false,
      });
      toast.error(errorMsg);
      throw error;
    }
  },

  setCurrentOrganization: (organization) => {
    set({ currentOrganization: organization });
  },

  clearError: () => set({ error: null }),
}));
