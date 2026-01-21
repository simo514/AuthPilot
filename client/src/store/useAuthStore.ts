import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { User, LoginCredentials, RegisterData } from '../types/auth.types';
import { api, handleApiError } from '../lib/api';
import toast from 'react-hot-toast';
import { startTokenRefresh, stopTokenRefresh } from '../lib/tokenRefresh';

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
  loginWithGoogle: () => void;
  handleGoogleCallback: (accessToken: string, user: User) => void;
  logout: () => void;
  refreshAccessToken: () => Promise<string>;
  clearError: () => void;
  resetPassword: (email: string, currentPassword: string, newPassword: string) => Promise<void>;
  updateCurrentUser: (updatedUser: Partial<User>) => void;
  updateProfile: (fullName: string, email: string) => Promise<void>;
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
        accessToken: null, // Will be in memory only, not persisted
        refreshToken: null, // Will be in HttpOnly cookie, not used here
        isAuthenticated: false,
        isLoading: false,
        error: null,

        // Actions
        login: async (credentials) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await api.post<{ accessToken: string; user: User }>('/auth/login', credentials);
            const { accessToken, user } = response.data;
            
            set({
              user,
              accessToken,
              refreshToken: null, // Refresh token is in HttpOnly cookie
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });

            // Start automatic token refresh
            startTokenRefresh();
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
            const response = await api.post<{ accessToken: string; user: User }>('/auth/register', data);
            const { accessToken, user } = response.data;
            
            set({
              user,
              accessToken,
              refreshToken: null, // Refresh token is in HttpOnly cookie
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });

            // Start automatic token refresh
            startTokenRefresh();
          } catch (error) {
            const errorMessage = handleApiError(error);
            set({
              isLoading: false,
              error: errorMessage,
            });
            throw new Error(errorMessage);
          }
        },

        loginWithGoogle: () => {
          const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
          // Redirect to backend Google OAuth endpoint
          window.location.href = `${API_BASE_URL}/auth/google`;
        },

        handleGoogleCallback: (accessToken: string, user: User) => {
          set({
            user,
            accessToken,
            refreshToken: null, // Refresh token is in HttpOnly cookie
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          // Start automatic token refresh
          startTokenRefresh();
        },

        logout: () => {
          // Call backend logout endpoint to invalidate session
          const currentUser = get().user;
          if (currentUser?.uuid) {
            api.post('/auth/logout').catch((error) => {
              console.error('Logout error:', error);
            });
          }

          // Stop automatic token refresh
          stopTokenRefresh();

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
          try {
            const response = await api.post<{ accessToken: string }>('/auth/refresh', {});
            
            const { accessToken } = response.data;
            
            set({
              accessToken,
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

        updateProfile: async (fullName, email) => {
          try {
            const response = await api.patch<User>('/users/profile', { fullName, email });
            set((state) => ({
              user: state.user ? { ...state.user, fullName, email } : null,
            }));
            toast.success('Profile updated successfully!');
          } catch (error) {
            const errorMessage = handleApiError(error);
            toast.error(errorMessage);
            throw new Error(errorMessage);
          }
        },

        refreshCurrentUser: async () => {
          const currentUser = get().user;
          if (!currentUser?.uuid) return;

          try {
            const response = await api.get<User>(`/users/${currentUser.uuid}`);
            set({ user: response.data });
          } catch (error) {
            // Silent fail - user data refresh is not critical
          }
        },
      }),

      
      {
        name: 'auth-storage',
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
          // Do NOT persist tokens - access token in memory, refresh token in cookie
        }),
      }
    )
  )
);
