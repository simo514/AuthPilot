import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { 
  Home, 
  Users, 
  Settings, 
  Shield, 
  FileText, 
  Moon, 
  Sun,
  LogOut,
  Building2
} from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';
import { Permission } from '../../types/auth.types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Sidebar({ activeTab: _activeTab, setActiveTab }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { hasPermission } = usePermissions();

  // Build menu items based on permissions
  const baseItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/dashboard' },
    { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' }
  ];

  // Permission checks
  const canViewUsers = hasPermission(Permission.USER_LIST) || hasPermission(Permission.USER_READ);
  const canViewRoles = hasPermission(Permission.ROLE_READ) || hasPermission(Permission.ROLE_LIST);
  const canViewAudit = hasPermission(Permission.AUDIT_READ) || hasPermission(Permission.AUDIT_LIST);
  const canViewOrganizations = hasPermission(Permission.ORGANIZATION_LIST) || hasPermission(Permission.ORGANIZATION_READ);

  // Dynamically build menu
  const menuItems = [
    ...baseItems,
    ...(canViewOrganizations ? [{ id: 'organizations', label: 'Organizations', icon: Building2, path: '/organizations' }] : []),
    ...(canViewUsers ? [{ id: 'users', label: 'Users', icon: Users, path: '/users' }] : []),
    ...(canViewRoles ? [{ id: 'roles', label: 'Roles', icon: Shield, path: '/roles' }] : []),
    ...(canViewAudit ? [{ id: 'audit', label: 'Audit Logs', icon: FileText, path: '/audit' }] : []),
  ];
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="bg-white dark:bg-gray-900 w-64 min-h-screen shadow-lg border-r border-gray-200 dark:border-gray-700">
      <div className="p-6">
        <div className="flex items-center space-x-2 mb-8">
          <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">AuthPilot</h1>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  navigate(item.path);
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="absolute bottom-0 w-64 p-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold">
              {user?.fullName?.split(' ').map(n => n[0]).join('') || 'U'}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{user?.fullName}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{user?.role}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={toggleTheme}
            className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {theme === 'light' ? (
              <Moon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            ) : (
              <Sun className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            )}
          </button>
          
          <button
            onClick={handleLogout}
            className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}