import { useAuthStore } from '../store/useAuthStore';

/**
 * Custom hook to check if the current user is a manager.
 * @returns {boolean} True if the user is a manager and has a uuid.
 */
export function useIsManager() {
  const { user } = useAuthStore();
  return user?.role === 'manager' && !!user?.uuid;
}
