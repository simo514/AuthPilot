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

  // Actions
  fetchRoles: () => Promise<void>;
  fetchRoleById: (id: string) => Promise<void>;
  createRole: (data: CreateRoleDto) => Promise<void>;
  updateRole: (id: string, data: UpdateRoleDto) => Promise<void>;
  deleteRole: (id: string) => Promise<void>;
  updateRolePermissions: (id: string, permissions: string[]) => Promise<void>;
  toggleRoleStatus: (id: string) => Promise<void>;
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
        // TODO: Implement fetch role by ID logic
      },

      createRole: async (data) => {
        // TODO: Implement create role logic
      },

      updateRole: async (id, data) => {
        // TODO: Implement update role logic
      },

      deleteRole: async (id) => {
        // TODO: Implement delete role logic
      },

      updateRolePermissions: async (id, permissions) => {
        // TODO: Implement update role permissions logic
      },

      toggleRoleStatus: async (id) => {
        // TODO: Implement toggle role status logic
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    { name: 'RoleStore' }
  )
);
