import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Role, CreateRoleDto, UpdateRoleDto } from '../types/role.types';
import { RequestStatus } from '../types/api.types';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from './useAuthStore';

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

// ============================================
// ROLE STORE STATE
// ============================================

interface RoleState {
  // State
  roles: Role[];
  selectedRole: Role | null;
  status: RequestStatus;
  error: string | null;
  permissions: string[];

  // Actions
  fetchRoles: () => Promise<void>;
  fetchRoleById: (id: string) => Promise<void>;
  createRole: (data: CreateRoleDto) => Promise<void>;
  updateRole: (id: string, data: UpdateRoleDto) => Promise<void>;
  deleteRole: (id: string) => Promise<void>;
  updateRolePermissions: (id: string, permissions: string[]) => Promise<void>;
  toggleRoleStatus: (id: string) => Promise<void>;
  fetchPermissions: () => Promise<void>;
  clearError: () => void;
}

// ============================================
// ROLE STORE
// ============================================

export const useRoleStore = create<RoleState>()(
  devtools(
    (set, get) => ({
      // Initial State
      roles: [],
      selectedRole: null,
      status: RequestStatus.IDLE,
      error: null,

      // Actions
      fetchRoles: async () => {
        set({ status: RequestStatus.LOADING, error: null });
        try {
            const rolesData = await api.get<Role[]>('/roles');
            set({
              roles: rolesData.data,
              status: RequestStatus.SUCCESS,
              error: null,
            });
        } catch (error) {
          set({
            status: RequestStatus.ERROR,
            error: 'Failed to fetch roles',
          });
        }   
      },

      fetchRoleById: async (id) => {
      },

      createRole: async (data) => {
        set({ status: RequestStatus.LOADING, error: null });
        try {
            const response = await api.post<Role>('/roles', data);
            set((state) => ({
              roles: [...state.roles, response.data],
              status: RequestStatus.SUCCESS,
              error: null,
            }));
            toast.success('Role created successfully');
        } catch (error) {
          set({
            status: RequestStatus.ERROR,
            error: 'Failed to create role',
          });
          toast.error(extractApiErrorMessage(error, 'Failed to create role'));
        }
      },

      updateRole: async (id, data) => {
        // TODO: Implement update role logic
      },

      deleteRole: async (id) => {
        set({ status: RequestStatus.LOADING, error: null });
        try {
            await api.delete(`/roles/${id}`);
            set((state) => ({
              roles: state.roles.filter((role) => role.id !== id),
              status: RequestStatus.SUCCESS,
              error: null,
            }));
            toast.success('Role deleted successfully');
        } catch (error) {
          set({
            status: RequestStatus.ERROR,
            error: 'Failed to delete role',
          });
            toast.error(extractApiErrorMessage(error, 'Failed to delete role'));
        }
      },

      updateRolePermissions: async (id, permissions) => {
        set({ status: RequestStatus.LOADING, error: null });
        try {
            const response = await api.patch<Role>(`/roles/${id}/permissions`, { permissions });
            set((state) => ({
              roles: state.roles.map((role) =>
                role.id === id ? response.data : role
              ),
              status: RequestStatus.SUCCESS,
              error: null,
            }));
            
            // Refresh current user if they have this role
            const currentUser = useAuthStore.getState().user;
            let needsRefresh = false;
            
            if (currentUser?.roleId && typeof currentUser.roleId === 'object' && 'name' in currentUser.roleId) {
              const userRoleId = currentUser.roleId;
              if (response.data.id === id || response.data.name === userRoleId.name) {
                needsRefresh = true;
                // Refresh user data
                await useAuthStore.getState().refreshCurrentUser();
                // Wait a bit for state to propagate
                await new Promise(resolve => setTimeout(resolve, 100));
                toast.success('Role permissions updated. Your permissions have been refreshed.');
              }
            }
            
            if (!needsRefresh) {
              toast.success('Role permissions updated successfully');
            }
        } catch (error) {
          set({
            status: RequestStatus.ERROR,
            error: 'Failed to update role permissions',
          });
          toast.error(extractApiErrorMessage(error, 'Failed to update role permissions'));
        }   
      },

      toggleRoleStatus: async (id) => {
        set({ status: RequestStatus.LOADING, error: null });
        try {
            const role = get().roles.find((r) => r.id === id);
            if (!role) throw new Error('Role not found');

            const response = await api.patch<Role>(`/roles/${id}/toggle-status`, {
              isActive: !role.isActive,
            });

            set((state) => ({
              roles: state.roles.map((r) =>
                r.id === id ? response.data : r
              ),
              status: RequestStatus.SUCCESS,
              error: null,
            }));
            toast.success(`Role ${response.data.isActive ? 'activated' : 'deactivated'} successfully`);
        } catch (error) {
          set({
            status: RequestStatus.ERROR,
            error: 'Failed to toggle role status',
          });
          toast.error(extractApiErrorMessage(error, 'Failed to toggle role status'));
        }   
      },

      fetchPermissions: async () => {
        set({ status: RequestStatus.LOADING, error: null });
        try {
            const response = await api.get<string[]>('/roles/permissions');
            set({
              permissions: response.data,  
              status: RequestStatus.SUCCESS,
              error: null,
            });
        } catch (error) {
          set({
            status: RequestStatus.ERROR,
            error: 'Failed to fetch permissions',
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    { name: 'RoleStore' }
  )
);
