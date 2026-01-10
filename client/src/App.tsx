import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './contexts/ThemeContext';
import { DashboardLayout } from './components/Layout/DashboardLayout';
import { AdminDashboard } from './components/Dashboard/AdminDashboard';
import { ManagerDashboard } from './components/Dashboard/ManagerDashboard';
import { UserDashboard } from './components/Dashboard/UserDashboard';
import { UserManagement } from './components/Users/UserManagement';
import { Settings } from './components/Settings/Settings';
import { RoleManagement } from './components/Roles/RoleManagement';
import { AuditLogs } from './components/Audit/AuditLogs';
import OrganizationList from './components/Organizations/OrganizationList';
import OrganizationForm from './components/Organizations/OrganizationForm';
import OrganizationDetails from './components/Organizations/OrganizationDetails';
import ProjectList from './components/Projects/ProjectList';
import ProjectForm from './components/Projects/ProjectForm';
import ProjectDetails from './components/Projects/ProjectDetails';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import { RoleGuard } from './components/Auth/RoleGuard';
import { PermissionGuard } from './components/Auth/PermissionGuard';
import { AuthPage } from './components/Auth/AuthPage';
import { GoogleCallback } from './components/Auth/GoogleCallback';
import { useAuthStore } from './store/useAuthStore';
import { useThemeStore } from './store/useThemeStore';
import { UserRole, Permission } from './types/auth.types';
import { useEffect } from 'react';
import Unauthorized from './components/Auth/Unauthorized';
import { startTokenRefresh, stopTokenRefresh } from './lib/tokenRefresh';

function App() {
  const { theme } = useThemeStore();
  const { isAuthenticated } = useAuthStore();

  // Initialize automatic token refresh on app load
  useEffect(() => {
    if (isAuthenticated) {
      startTokenRefresh();
    } else {
      stopTokenRefresh();
    }

    // Cleanup on unmount
    return () => {
      stopTokenRefresh();
    };
  }, [isAuthenticated]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else if (theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      // 'system' - use prefers-color-scheme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
      }
    }
  }, [theme]);
  return (
    <ThemeProvider>
      <Toaster position="top-right" />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<AuthPage />} />
        <Route path="/signup" element={<AuthPage isSignup />} />
        <Route path="/auth/google/callback" element={<GoogleCallback />} />
        
        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardRedirect />} />
          
          {/* Role-based Dashboards */}
          <Route 
            path="dashboard/admin" 
            element={
              <RoleGuard allowedRoles={[UserRole.ADMIN]}>
                <AdminDashboard />
              </RoleGuard>
            } 
          />
          <Route 
            path="dashboard/manager" 
            element={
              <RoleGuard allowedRoles={[UserRole.ADMIN, UserRole.MANAGER]}>
                <ManagerDashboard />
              </RoleGuard>
            } 
          />
          <Route 
            path="dashboard/user" 
            element={
              <RoleGuard allowedRoles={[UserRole.ADMIN, UserRole.MANAGER, UserRole.USER]}>
                <UserDashboard />
              </RoleGuard>
            } 
          />
          
          <Route 
            path="users" 
            element={
              <PermissionGuard 
                requiredPermissions={[Permission.USER_LIST, Permission.USER_READ]}
                requireAll={false}
              >
                <UserManagement />
              </PermissionGuard>
            } 
          />

          {/* Organization Routes */}
          <Route 
            path="organizations" 
            element={
              <PermissionGuard 
                requiredPermissions={[Permission.ORGANIZATION_LIST]}
                requireAll={false}
              >
                <OrganizationList />
              </PermissionGuard>
            } 
          />
          <Route 
            path="organizations/new" 
            element={
              <PermissionGuard 
                requiredPermissions={[Permission.ORGANIZATION_CREATE]}
                requireAll={false}
              >
                <OrganizationForm />
              </PermissionGuard>
            } 
          />
          <Route 
            path="organizations/edit/:uuid" 
            element={
              <PermissionGuard 
                requiredPermissions={[Permission.ORGANIZATION_UPDATE]}
                requireAll={false}
              >
                <OrganizationForm />
              </PermissionGuard>
            } 
          />
          <Route 
            path="organizations/:uuid" 
            element={
              <PermissionGuard 
                requiredPermissions={[Permission.ORGANIZATION_READ]}
                requireAll={false}
              >
                <OrganizationDetails />
              </PermissionGuard>
            } 
          />

          {/* Project Routes */}
          <Route 
            path="projects" 
            element={
              <PermissionGuard 
                requiredPermissions={[Permission.PROJECT_LIST]}
                requireAll={false}
              >
                <ProjectList />
              </PermissionGuard>
            } 
          />
          <Route 
            path="projects/new" 
            element={
              <PermissionGuard 
                requiredPermissions={[Permission.PROJECT_CREATE]}
                requireAll={false}
              >
                <ProjectForm />
              </PermissionGuard>
            } 
          />
          <Route 
            path="projects/edit/:uuid" 
            element={
              <PermissionGuard 
                requiredPermissions={[Permission.PROJECT_UPDATE]}
                requireAll={false}
              >
                <ProjectForm />
              </PermissionGuard>
            } 
          />
          <Route 
            path="projects/:uuid" 
            element={
              <PermissionGuard 
                requiredPermissions={[Permission.PROJECT_READ]}
                requireAll={false}
              >
                <ProjectDetails />
              </PermissionGuard>
            } 
          />

          <Route 
            path="roles" 
            element={
              <RoleGuard
                allowedRoles={[UserRole.ADMIN]}
              >
                <RoleManagement />
              </RoleGuard>
            }
          />
          <Route 
            path="audit" 
            element={
              <PermissionGuard requiredPermissions={[Permission.AUDIT_READ]}>
                <AuditLogs />
              </PermissionGuard>
            } 
          />
          <Route path="settings" element={<Settings />} />
        </Route>
        
        {/* Unauthorized Route */}
        <Route path="/unauthorized" element={<Unauthorized />} />
        {/* Catch all */}
        <Route path="*" element={<DashboardRedirect />} />
      </Routes>
    </ThemeProvider>
  );
}

// Redirect to appropriate dashboard based on user role
function DashboardRedirect() {
  const { user } = useAuthStore();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  switch (user.role) {
    case UserRole.ADMIN:
      return <Navigate to="/dashboard/admin" replace />;
    case UserRole.MANAGER:
      return <Navigate to="/dashboard/manager" replace />;
    case UserRole.USER:
    default:
      return <Navigate to="/dashboard/user" replace />;
  }
}

export default App;