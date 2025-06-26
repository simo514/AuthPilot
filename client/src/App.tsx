import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Login } from './components/Auth/Login';
import { Signup } from './components/Auth/Signup';
import { Sidebar } from './components/Layout/Sidebar';
import { AdminDashboard } from './components/Dashboard/AdminDashboard';
import { ManagerDashboard } from './components/Dashboard/ManagerDashboard';
import { UserDashboard } from './components/Dashboard/UserDashboard';
import { UserManagement } from './components/Users/UserManagement';
import { Settings } from './components/Settings/Settings';
import { RoleManagement } from './components/Roles/RoleManagement';
import { AuditLogs } from './components/Audit/AuditLogs';

function AuthWrapper() {
  const [isLogin, setIsLogin] = useState(true);
  
  return isLogin ? (
    <Login onToggleMode={() => setIsLogin(false)} />
  ) : (
    <Signup onToggleMode={() => setIsLogin(true)} />
  );
}

function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        if (user?.role === 'Admin') return <AdminDashboard />;
        if (user?.role === 'Manager') return <ManagerDashboard />;
        return <UserDashboard />;
      case 'users':
        return <UserManagement />;
      case 'settings':
        return <Settings />;
      case 'roles':
        return <RoleManagement />;
      case 'audit':
        return <AuditLogs />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 overflow-auto">
        {renderContent()}
      </main>
    </div>
  );
}

function AppContent() {
  const { user } = useAuth();
  
  return user ? <Dashboard /> : <AuthWrapper />;
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;