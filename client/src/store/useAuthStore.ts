import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import axios from 'axios';
import { User, LoginCredentials, RegisterData } from '../types/auth.types';
import { api, handleApiError, setAuthToken, clearAuthToken } from '../lib/api';
import toast from 'react-hot-toast';
import { startTokenRefresh, stopTokenRefresh, setAuthenticationStatus } from '../lib/tokenRefresh';

// ============================================
// AUTH STORE STATE
// ============================================

interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  loginWithGoogle: () => void;
  handleGoogleCallback: () => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<string>;
  clearError: () => void;
  resetPassword: (email: string, currentPassword: string, newPassword: string) => Promise<void>;
  updateCurrentUser: (updatedUser: Partial<User>) => void;
  updateProfile: (fullName: string, email: string) => Promise<void>;
  refreshCurrentUser: () => Promise<void>;
  initializeAuth: () => Promise<void>;
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
        isAuthenticated: false,
        isLoading: false,
        error: null,

        // Actions
        login: async (credentials) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await api.post<{ accessToken: string; user: User }>('/auth/login', credentials);
            const { accessToken, user } = response.data;
            
            // Set in-memory access token
            setAuthToken(accessToken);
            
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });

            // Start automatic token refresh
            setAuthenticationStatus(true);
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
            
            // Set in-memory access token
            setAuthToken(accessToken);
            
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });

            // Start automatic token refresh
            setAuthenticationStatus(true);
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

        handleGoogleCallback: async () => {
          set({ isLoading: true, error: null });
          const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
          
          try {
            // First, refresh to get access token from httpOnly cookie
            // Use axios directly to avoid interceptor interference
            const refreshResponse = await axios.post<{ accessToken: string }>(
              `${API_BASE_URL}/auth/refresh`,
              {},
              { withCredentials: true }
            );
            const { accessToken } = refreshResponse.data;
            
            // Set in-memory access token
            setAuthToken(accessToken);
            
            // Then fetch user info using api instance (now has token)
            const userResponse = await api.get<{ user: User }>('/auth/me');
            const { user } = userResponse.data;
            
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });

            // Start automatic token refresh
            setAuthenticationStatus(true);
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

        logout: () => {
          // Call backend logout endpoint to invalidate session
          const currentUser = get().user;
          if (currentUser?.uuid) {
            api.post('/auth/logout').catch((error) => {
              console.error('Logout error:', error);
            });
          }

          // Clear in-memory token
          clearAuthToken();
          
          // Stop automatic token refresh
          setAuthenticationStatus(false);
          stopTokenRefresh();

          set({
            user: null,
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
            
            // Set in-memory access token
            setAuthToken(accessToken);

            return accessToken;
          } catch (error) {
            // Refresh failed - logout user
            clearAuthToken();
            setAuthenticationStatus(false);
            set({
              user: null,
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

        initializeAuth: async () => {
          // Try to restore session from httpOnly cookie on app load
          const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
          
          try {
            // Use axios directly to bypass interceptor and avoid infinite loops
            const refreshResponse = await axios.post<{ accessToken: string }>(
              `${API_BASE_URL}/auth/refresh`,
              {},
              { withCredentials: true }
            );
            const { accessToken } = refreshResponse.data;
            
            // Set in-memory access token
            setAuthToken(accessToken);
            
            // Fetch user info using api instance (now has token)
            const userResponse = await api.get<{ user: User }>('/auth/me');
            const { user } = userResponse.data;
            
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
            });

            // Start automatic token refresh
            setAuthenticationStatus(true);
            startTokenRefresh();
          } catch (error) {
            // No valid session - user needs to login (this is normal on first visit)
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        },
      }),

      
      {
        name: 'auth-storage',
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
          // Do NOT persist access token - it's in memory only
          // Refresh token is in HttpOnly cookie
        }),
      }
    )
  )
);
