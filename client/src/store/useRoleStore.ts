import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Role, CreateRoleDto, UpdateRoleDto } from '../types/role.types';
import { RequestStatus } from '../types/api.types';
import api from '../lib/api';

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
        } catch (error) {
          set({
            status: RequestStatus.ERROR,
            error: 'Failed to create role',
          });
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
        } catch (error) {
          set({
            status: RequestStatus.ERROR,
            error: 'Failed to delete role',
          });
        }
      },

      updateRolePermissions: async (id, permissions) => {
        // TODO: Implement update role permissions logic
      },

      toggleRoleStatus: async (id) => {
        // TODO: Implement toggle role status logic
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
