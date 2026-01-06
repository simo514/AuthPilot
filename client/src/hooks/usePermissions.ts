import { useAuthStore } from '../store/useAuthStore';
import { Permission, UserRole } from '../types/auth.types';

/**
 * Custom hook for checking user permissions and roles
 * 
 * @example
 * const { hasPermission, hasRole, hasAnyPermission, hasAllPermissions } = usePermissions();
 * 
 * if (hasPermission(Permission.USER_CREATE)) {
 *   // Show create user button
 * }
 */
export function usePermissions() {
  const { user } = useAuthStore();

  /**
   * Check if user has a specific permission
   */
  const hasPermission = (permission: Permission): boolean => {
    if (!user || !user.roleId?.permissions) return false;
    return user.roleId.permissions.includes(permission);
  };

  /**
   * Check if user has a specific role
   */
  const hasRole = (role: UserRole): boolean => {
    if (!user) return false;
    return user.role === role;
  };

  /**
   * Check if user has ANY of the specified permissions
   */
  const hasAnyPermission = (permissions: Permission[]): boolean => {
    if (!user || !user.roleId?.permissions) return false;
    return permissions.some(permission => 
      user.roleId.permissions.includes(permission)
    );
  };

  /**
   * Check if user has ALL of the specified permissions
   */
  const hasAllPermissions = (permissions: Permission[]): boolean => {
    if (!user || !user.roleId?.permissions) return false;
    return permissions.every(permission => 
      user.roleId.permissions.includes(permission)
    );
  };

  /**
   * Check if user has ANY of the specified roles
   */
  const hasAnyRole = (roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  /**
   * Get all user permissions
   */
  const getUserPermissions = (): Permission[] => {
    return user?.roleId?.permissions || [];
  };

  /**
   * Get user role
   */
  const getUserRole = (): UserRole | null => {
    return user?.role || null;
  };

  return {
    hasPermission,
    hasRole,
    hasAnyPermission,
    hasAllPermissions,
    hasAnyRole,
    getUserPermissions,
    getUserRole,
  };
}
