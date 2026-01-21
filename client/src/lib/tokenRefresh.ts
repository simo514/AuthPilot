import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const REFRESH_INTERVAL = 10 * 60 * 1000; // Refresh every 10 minutes (before 1 hour expiry)

let refreshInterval: NodeJS.Timeout | null = null;

/**
 * Automatically refresh access token before it expires
 */
export const startTokenRefresh = () => {
  // Clear any existing interval
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }

  // Set up periodic token refresh
  refreshInterval = setInterval(async () => {
    const authStorage = localStorage.getItem('auth-storage');
    
    if (authStorage) {
      try {
        const { state } = JSON.parse(authStorage);
        const isAuthenticated = state?.isAuthenticated;

        if (isAuthenticated) {
          // Call refresh endpoint - refresh token is in cookie
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
            withCredentials: true, // Send cookies
          });

          const { accessToken } = response.data;

          // Update access token in storage (in memory)
          const updatedStorage = {
            state: {
              ...state,
              accessToken,
            },
          };
          localStorage.setItem('auth-storage', JSON.stringify(updatedStorage));
        } else {
          stopTokenRefresh();
        }
      } catch (error) {
        console.error('[Token Refresh] Failed to refresh token:', error);
        // If refresh fails, stop the interval and clear storage
        stopTokenRefresh();
        localStorage.removeItem('auth-storage');
        window.location.href = '/login';
      }
    } else {
      // No auth data, stop refreshing
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
};

/**
 * Manually refresh token
 */
export const refreshTokenNow = async (): Promise<boolean> => {
  const authStorage = localStorage.getItem('auth-storage');
  
  if (!authStorage) {
    return false;
  }

  try {
    const { state } = JSON.parse(authStorage);
    
    // Call refresh endpoint - refresh token is in cookie
    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
      withCredentials: true,
    });

    const { accessToken } = response.data;

    // Update access token in storage
    const updatedStorage = {
      state: {
        ...state,
        accessToken,
      },
    };
    localStorage.setItem('auth-storage', JSON.stringify(updatedStorage));
    
    return true;
  } catch (error) {
    return false;
  }
};
