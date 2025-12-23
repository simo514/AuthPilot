import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { User, LoginCredentials, RegisterData, LoginResponse } from '../types/auth.types';
import { api, handleApiError } from '../lib/api';

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
