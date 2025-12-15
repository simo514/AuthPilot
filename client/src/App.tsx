import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { DashboardLayout } from './components/Layout/DashboardLayout';
import { AdminDashboard } from './components/Dashboard/AdminDashboard';
import { ManagerDashboard } from './components/Dashboard/ManagerDashboard';
import { UserDashboard } from './components/Dashboard/UserDashboard';
import { UserManagement } from './components/Users/UserManagement';
import { Settings } from './components/Settings/Settings';
import { RoleManagement } from './components/Roles/RoleManagement';
import { AuditLogs } from './components/Audit/AuditLogs';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import { AuthPage } from './components/Auth/AuthPage';
import { useAuthStore } from './store/useAuthStore';

function App() {
  return (
    <ThemeProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<AuthPage />} />
        <Route path="/signup" element={<AuthPage isSignup />} />
        
        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardRouter />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="roles" element={<RoleManagement />} />
          <Route path="audit" element={<AuditLogs />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        
        {/* Catch all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </ThemeProvider>
  );
}

// Dashboard router based on user role
function DashboardRouter() {
  const { user } = useAuthStore();
  
  if (user?.role === 'admin') return <AdminDashboard />;
  if (user?.role === 'manager') return <ManagerDashboard />;
  return <UserDashboard />;
}

export default App;