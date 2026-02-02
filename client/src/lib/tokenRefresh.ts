import axios from 'axios';
import { setAuthToken, clearAuthToken } from './api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const REFRESH_INTERVAL = 10 * 60 * 1000; // Refresh every 10 minutes (before 1 hour expiry)

let refreshInterval: NodeJS.Timeout | null = null;
let isAuthenticated = false;

/**
 * Set authentication status
 */
export const setAuthenticationStatus = (status: boolean) => {
  isAuthenticated = status;
};

/**
 * Automatically refresh access token before it expires
 */
export const startTokenRefresh = () => {
  // Clear any existing interval
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }

  isAuthenticated = true;

  // Set up periodic token refresh
  refreshInterval = setInterval(async () => {
    if (isAuthenticated) {
      try {
        // Call refresh endpoint - refresh token is in cookie
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
          withCredentials: true, // Send cookies
        });

        const { accessToken } = response.data;

        // Update in-memory access token
        setAuthToken(accessToken);
      } catch (error) {
        console.error('[Token Refresh] Failed to refresh token:', error);
        // If refresh fails, stop the interval and clear storage
        stopTokenRefresh();
        clearAuthToken();
        window.location.href = '/login';
      }
    } else {
      stopTokenRefresh();
    }
  }, REFRESH_INTERVAL);
};

/**
 * Stop automatic token refresh
 */
export const stopTokenRefresh = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
  isAuthenticated = false;
};

/**
 * Manually refresh token
 */
export const refreshTokenNow = async (): Promise<boolean> => {
  if (!isAuthenticated) {
    return false;
  }

  try {
    // Call refresh endpoint - refresh token is in cookie
    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
      withCredentials: true,
    });

    const { accessToken } = response.data;

    // Update in-memory access token
    setAuthToken(accessToken);
    
    return true;
  } catch (error) {
    return false;
  }
};
