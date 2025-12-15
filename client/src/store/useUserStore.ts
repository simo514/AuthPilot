import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { UserListItem, CreateUserDto, UpdateUserDto, UserFilters } from '../types/user.types';
import { RequestStatus } from '../types/api.types';

// ============================================
// USER STORE STATE
// ============================================

interface UserState {
  // State
  users: UserListItem[];
  selectedUser: UserListItem | null;
  filters: UserFilters;
  total: number;
  page: number;
  limit: number;
  status: RequestStatus;
  error: string | null;

  // Actions
  fetchUsers: (page?: number, limit?: number) => Promise<void>;
  fetchUserById: (uuid: string) => Promise<void>;
  createUser: (data: CreateUserDto) => Promise<void>;
  updateUser: (uuid: string, data: UpdateUserDto) => Promise<void>;
  deleteUser: (uuid: string) => Promise<void>;
  setFilters: (filters: UserFilters) => void;
  clearFilters: () => void;
  clearError: () => void;
}

// ============================================
// USER STORE
// ============================================

export const useUserStore = create<UserState>()(
  devtools(
    (set, get) => ({
      // Initial State
      users: [],
      selectedUser: null,
      filters: {},
      total: 0,
      page: 1,
      limit: 10,
      status: RequestStatus.IDLE,
      error: null,

      // Actions
      fetchUsers: async (page = 1, limit = 10) => {
        // TODO: Implement fetch users logic
      },

      fetchUserById: async (uuid) => {
        // TODO: Implement fetch user by ID logic
      },

      createUser: async (data) => {
        // TODO: Implement create user logic
      },

      updateUser: async (uuid, data) => {
        // TODO: Implement update user logic
      },

      deleteUser: async (uuid) => {
        // TODO: Implement delete user logic
      },

      setFilters: (filters) => {
        set({ filters, page: 1 });
      },

      clearFilters: () => {
        set({ filters: {}, page: 1 });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    { name: 'UserStore' }
  )
);
