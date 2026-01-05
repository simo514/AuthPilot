import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { UserRole } from '../../types/auth.types';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallback?: React.ReactNode;
  redirectTo?: string;
}

/**
 * RoleGuard Component
 * 
 * Restricts access based on user roles.
 * 
 * @example
 * // Only allow admin users
 * <RoleGuard allowedRoles={[UserRole.ADMIN]}>
 *   <AdminPanel />
 * </RoleGuard>
 * 
 * @example
 * // Allow admin and manager users
 * <RoleGuard allowedRoles={[UserRole.ADMIN, UserRole.MANAGER]}>
 *   <ManagementDashboard />
 * </RoleGuard>
 * 
 * @example
 * // With custom fallback
 * <RoleGuard 
 *   allowedRoles={[UserRole.ADMIN]} 
 *   fallback={<div>Access Denied</div>}
 * >
 *   <AdminPanel />
 * </RoleGuard>
 */
export function RoleGuard({ 
  children, 
  allowedRoles, 
  fallback,
  redirectTo = '/unauthorized'
}: RoleGuardProps) {
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

  // Check if user's role is in the allowed roles
  const hasRequiredRole = allowedRoles.includes(user.role);

  if (!hasRequiredRole) {
    // Show custom fallback or redirect to /unauthorized
    if (fallback) {
      return <>{fallback}</>;
    }
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
