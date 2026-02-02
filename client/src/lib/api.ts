import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

// ============================================
// API CONFIGURATION
// ============================================

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// ============================================
// IN-MEMORY TOKEN STORAGE
// ============================================

let inMemoryAccessToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  inMemoryAccessToken = token;
};

export const getAuthToken = (): string | null => {
  return inMemoryAccessToken;
};

export const clearAuthToken = () => {
  inMemoryAccessToken = null;
};

// ============================================
// AXIOS INSTANCE
// ============================================

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true, // Include cookies in requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============================================
// REQUEST INTERCEPTOR
// ============================================

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from in-memory storage
    const token = getAuthToken();
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ============================================
// RESPONSE INTERCEPTOR
// ============================================

api.interceptors.response.use(
  (response) => {
    // Return the response data directly
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Don't retry on auth endpoints (login, register, refresh)
    // These endpoints are expected to return 401 for invalid credentials
    const authEndpoints = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/google'];
    const isAuthEndpoint = authEndpoints.some(endpoint => originalRequest.url?.includes(endpoint));
    
    // Handle 401 Unauthorized - Token expired (but not for auth endpoints)
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      try {
        // Call refresh token endpoint - refresh token is in cookie
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
          withCredentials: true,
        });

        const { accessToken } = response.data;

        // Update in-memory access token
        setAuthToken(accessToken);

        // Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh token failed - clear state and redirect to login
        clearAuthToken();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors (including 401 on auth endpoints)
    return Promise.reject(error);
  }
);

// ============================================
// HELPER FUNCTIONS
// ============================================

// Note: setAuthToken, getAuthToken, and clearAuthToken are already defined above

// ============================================
// ERROR HANDLER
// ============================================

export const handleApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message: string; error?: string }>;
    
    if (axiosError.response) {
      // Server responded with error
      return axiosError.response.data?.message || axiosError.response.data?.error || 'An error occurred';
    } else if (axiosError.request) {
      // Request made but no response
      return 'No response from server. Please check your connection.';
    }
  }
  
  return 'An unexpected error occurred';
};

export default api;
