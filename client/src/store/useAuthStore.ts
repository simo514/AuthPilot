import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { User, LoginCredentials, RegisterData, LoginResponse } from '../types/auth.types';
import { api, handleApiError } from '../lib/api';
import toast from 'react-hot-toast';

// ============================================
// AUTH STORE STATE
// ============================================

interface AuthState {
  // State
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<string>;
  clearError: () => void;
  resetPassword: (email: string, currentPassword: string, newPassword: string) => Promise<void>;
  updateCurrentUser: (updatedUser: Partial<User>) => void;
  refreshCurrentUser: () => Promise<void>;
}

// ============================================
// AUTH STORE
// ============================================

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial State
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,

        // Actions
        login: async (credentials) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await api.post<LoginResponse>('/auth/login', credentials);
            const { accessToken, refreshToken, user } = response.data;
            
            set({
              user,
              accessToken,
              refreshToken,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } catch (error) {
            const errorMessage = handleApiError(error);
            set({
              isLoading: false,
              error: errorMessage,
            });
            throw new Error(errorMessage);
          }
        },

        register: async (data) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await api.post<LoginResponse>('/auth/register', data);
            const { accessToken, refreshToken, user } = response.data;
            
            set({
              user,
              accessToken,
              refreshToken,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } catch (error) {
            const errorMessage = handleApiError(error);
            set({
              isLoading: false,
              error: errorMessage,
            });
            throw new Error(errorMessage);
          }
        },

        logout: () => {
          set({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            error: null,
          });
        },

        resetPassword: async (email: string, currentPassword: string, newPassword: string) => {
          set({ isLoading: true, error: null });
          try {
            await api.patch(`/users/password`, { email,currentPassword, newPassword });
            set({ isLoading: false });
            toast.success('Password updated successfully');
          } catch (error) {
            const errorMessage = handleApiError(error);
            set({
              isLoading: false,
              error: errorMessage,
            });
            toast.error(errorMessage);
            throw new Error(errorMessage);
          }
        },

        refreshAccessToken: async (): Promise<string> => {
          const currentRefreshToken = get().refreshToken;

          if (!currentRefreshToken) {
            throw new Error('No refresh token available');
          }

          try {
            const response = await api.post<LoginResponse>('/auth/refresh', {
              refreshToken: currentRefreshToken,
            });
            
            const { accessToken, refreshToken: newRefreshToken } = response.data;
            
            set({
              accessToken,
              refreshToken: newRefreshToken,
            });

            return accessToken;
          } catch (error) {
            // Refresh failed - logout user
            set({
              user: null,
              accessToken: null,
              refreshToken: null,
              isAuthenticated: false,
              error: 'Session expired. Please login again.',
            });
            throw error;
          }
        },

        clearError: () => {
          set({ error: null });
        },

        updateCurrentUser: (updatedUser) => {
          set((state) => ({
            user: state.user ? { ...state.user, ...updatedUser } : null,
          }));
        },

        refreshCurrentUser: async () => {
          const currentUser = get().user;
          if (!currentUser?.uuid) return;

          console.log('Refreshing current user data...');
          try {
            const response = await api.get<User>(`/users/${currentUser.uuid}`);
            console.log('Fresh user data received:', response.data);
            set({ user: response.data });
            console.log('User state updated');
          } catch (error) {
            console.error('Failed to refresh user data:', error);
          }
        },
      }),

      
      {
        name: 'auth-storage',
        partialize: (state) => ({
          user: state.user,
          accessToken: state.accessToken,
          refreshToken: state.refreshToken,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    )
  )
);
