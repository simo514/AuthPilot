import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { UserListItem, CreateUserDto, UpdateUserDto, UserFilters } from '../types/user.types';
import { RequestStatus } from '../types/api.types';
import api from '../lib/api';

// ============================================
// USER STORE STATE
// ============================================

interface UserState {
  // State
  users: UserListItem[];
  selectedUser: UserListItem | null;
  filters: UserFilters;
  status: RequestStatus;
  error: string | null;

  // Actions
  fetchUsers: () => Promise<void>;
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
      status: RequestStatus.IDLE,
      error: null,

      // Actions
      fetchUsers: async () => {
        set({ status: RequestStatus.LOADING, error: null });
        try {
          const usersData = await api.get<UserListItem[]>('/users', {
            params: {
              ...get().filters,
            },
          });
          set({
            users: usersData.data,
            status: RequestStatus.SUCCESS,
            error: null,
          });
        } catch (error) {
          set({
            status: RequestStatus.ERROR,
            error: 'Failed to fetch users.',
          });
        }
      },

      fetchUserById: async (uuid) => {
        // TODO: Implement fetch user by ID logic
      },

      createUser: async (data) => {
        set({ status: RequestStatus.LOADING, error: null });
        try {
          const response = await api.post<UserListItem>('/users', data);
          set((state) => ({
            users: [...state.users, response.data],
            status: RequestStatus.SUCCESS,
            error: null,
          }));
        } catch (error) {
          set({
            status: RequestStatus.ERROR,
            error: 'Failed to create user.',
          });
        }
      },

      updateUser: async (uuid, data) => {
        set({ status: RequestStatus.LOADING, error: null });
        try {
          const response = await api.patch<UserListItem>(`/users/${uuid}`, data);
          set((state) => ({
            users: state.users.map((user) =>
              user.uuid === uuid ? response.data : user
            ),
            status: RequestStatus.SUCCESS,
            error: null,
          }));
        } catch (error) {
          set({
            status: RequestStatus.ERROR,
            error: 'Failed to update user.',
          });
        }
      },

      deleteUser: async (uuid) => {
        set({ status: RequestStatus.LOADING, error: null });
        try {
          await api.delete(`/users/${uuid}`);
          set((state) => ({
            users: state.users.filter((user) => user.uuid !== uuid),
            status: RequestStatus.SUCCESS,
            error: null,
          }));
        } catch (error) {
          set({
            status: RequestStatus.ERROR,
            error: 'Failed to delete user.',
          });
        }
      },

      setFilters: (filters) => {
        set({ filters });
      },

      clearFilters: () => {
        set({ filters: {} });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    { name: 'UserStore' }
  )
);
