import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { UserListItem, CreateUserDto, UpdateUserDto, UserFilters } from '../types/user.types';
import { RequestStatus } from '../types/api.types';
import api from '../lib/api';
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

// ============================================
// USER STORE STATE
// ============================================

interface UserState {
  // State
  users: UserListItem[];
  total: number;
  page: number;
  totalPages: number;
  managers: UserListItem[];
  selectedUser: UserListItem | null;
  filters: UserFilters;
  status: RequestStatus;
  error: string | null;

  // Actions
  fetchUsers: (page?: number, limit?: number, search?: string) => Promise<void>;
  fetchUserById: (uuid: string) => Promise<void>;
  createUser: (data: CreateUserDto) => Promise<void>;
  updateUser: (uuid: string, data: UpdateUserDto) => Promise<void>;
  deleteUser: (uuid: string) => Promise<void>;
  setFilters: (filters: UserFilters) => void;
  clearFilters: () => void;
  clearError: () => void;
  fetchMyTeamMembers: () => Promise<void>;
  fetchUsersByManagerId: (managerId: string) => Promise<void>;
  fetchManagers: () => Promise<void>;
}

// ============================================
// USER STORE
// ============================================

export const useUserStore = create<UserState>()(
  devtools(
    (set, get) => ({
      // Initial State
      users: [],
      total: 0,
      page: 1,
      totalPages: 0,
      managers: [],
      selectedUser: null,
      filters: {},
      status: RequestStatus.IDLE,
      error: null,

      // Actions
      fetchUsers: async (page = 1, limit = 10, search = '') => {
        set({ status: RequestStatus.LOADING, error: null });
        try {
          const params = new URLSearchParams();
          params.append('page', page.toString());
          params.append('limit', limit.toString());
          if (search) params.append('search', search);

          const filters = get().filters;
          if (filters.department) params.append('department', filters.department);
          if (filters.role) params.append('role', filters.role);

          const usersData = await api.get(`/users?${params.toString()}`);
          set({
            users: usersData.data.users,
            total: usersData.data.total,
            page: usersData.data.page,
            totalPages: usersData.data.totalPages,
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
          toast.success('User created successfully');
        } catch (error: any) {
          const errorMsg = extractApiErrorMessage(error, 'Failed to create user.');
          set({
            status: RequestStatus.ERROR,
            error: errorMsg,
          });
          toast.error(errorMsg);
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
          toast.success('User updated successfully');
        } catch (error: any) {
          const errorMsg = extractApiErrorMessage(error, 'Failed to update user.');
          set({
            status: RequestStatus.ERROR,
            error: errorMsg,
          });
          toast.error(errorMsg);          
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
          toast.success('User deleted successfully');
        } catch (error) {
          set({
            status: RequestStatus.ERROR,
            error: 'Failed to delete user.',
          });
          toast.error(extractApiErrorMessage(error, 'Failed to delete user.'));
        }
      },

      // For managers: Fetch their own team members using JWT
      fetchMyTeamMembers: async () => {
        set({ status: RequestStatus.LOADING, error: null });
        try {
          const response = await api.get<UserListItem[]>('/users/my-team');
          set({
            users: response.data,
            status: RequestStatus.SUCCESS,
            error: null,
          });
        } catch (error) {
          set({
            status: RequestStatus.ERROR,
            error: 'Failed to fetch team members.',
          });
        }
      },

      // For admins: Fetch users by any manager ID
      fetchUsersByManagerId: async (managerId) => {
        set({ status: RequestStatus.LOADING, error: null });
        try {
          const response = await api.get<UserListItem[]>(`/users/users-by-manager/${managerId}`);
          set({
            users: response.data,
            status: RequestStatus.SUCCESS,
            error: null,
          });
        } catch (error) {
          set({
            status: RequestStatus.ERROR,
            error: 'Failed to fetch users by manager ID.',
          });
        }
      },


      fetchManagers: async () => {  
        set({ status: RequestStatus.LOADING, error: null });
        try {
          const response = await api.get<UserListItem[]>(`/users/managers`);
          set({
            managers: response.data,
            status: RequestStatus.SUCCESS,
            error: null,
          });
        } catch (error) {
          set({
            status: RequestStatus.ERROR,
            error: 'Failed to fetch managers.',
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
