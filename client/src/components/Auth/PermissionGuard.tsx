import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { Permission } from '../../types/auth.types';

interface PermissionGuardProps {
  children: React.ReactNode;
  requiredPermissions: Permission[];
  requireAll?: boolean; // If true, user must have ALL permissions. If false, user needs ANY permission
  fallback?: React.ReactNode;
  redirectTo?: string;
  noRedirect?: boolean; // If true, will show fallback instead of redirecting (useful for UI elements)
}

/**
 * PermissionGuard Component
 * 
 * Restricts access based on user permissions.
 * 
 * @example
 * // Require a single permission
 * <PermissionGuard requiredPermissions={[Permission.USER_CREATE]}>
 *   <CreateUserButton />
 * </PermissionGuard>
 * 
 * @example
 * // Require ALL permissions
 * <PermissionGuard 
 *   requiredPermissions={[Permission.USER_UPDATE, Permission.USER_DELETE]} 
 *   requireAll={true}
 * >
 *   <UserManagementPanel />
 * </PermissionGuard>
 * 
 * @example
 * // Require ANY permission
 * <PermissionGuard 
 *   requiredPermissions={[Permission.USER_READ, Permission.USER_LIST]} 
 *   requireAll={false}
 * >
 *   <UserList />
 * </PermissionGuard>
 * 
 * @example
 * // With custom fallback
 * <PermissionGuard 
 *   requiredPermissions={[Permission.ROLE_CREATE]}
 *   fallback={<div className="text-red-500">You don't have permission to create roles.</div>}
 * >
 *   <CreateRoleButton />
 * </PermissionGuard>
 */
export function PermissionGuard({ 
  children, 
  requiredPermissions, 
  requireAll = true,
  fallback,
  redirectTo = '/unauthorized',
  noRedirect = false
}: PermissionGuardProps) {
  const { user, isAuthenticated, isLoading } = useAuthStore();

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Get user's permissions from their role
  let userPermissions: string[] = [];
  
  if (user.roleId && typeof user.roleId === 'object' && 'permissions' in user.roleId) {
    userPermissions = user.roleId.permissions || [];
  }

  // Check permissions
  let hasRequiredPermissions = false;

  if (requireAll) {
    // User must have ALL required permissions
    hasRequiredPermissions = requiredPermissions.every(permission => 
      userPermissions.includes(permission)
    );
  } else {
    // User must have AT LEAST ONE required permission
    hasRequiredPermissions = requiredPermissions.some(permission => 
      userPermissions.includes(permission)
    );
  }

  if (!hasRequiredPermissions) {
    // If noRedirect is true, always show fallback (or null)
    if (noRedirect) {
      return <>{fallback}</>;
    }
    
    // Show custom fallback or redirect
    if (fallback) {
      return <>{fallback}</>;
    }
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}


