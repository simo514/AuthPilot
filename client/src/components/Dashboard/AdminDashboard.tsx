import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Shield, Activity, TrendingUp } from 'lucide-react';
import { useUserStore } from '../../store/useUserStore';
import { useRoleStore } from '../../store/useRoleStore';
import { useAuditStore } from '../../store/useAuditStore';
import { CreateUserDto } from '../../types/user.types';
import { Permission } from '../../types/auth.types';
import { CreateUserModal } from '../Users/UserManagement';
import { CreateRoleDto } from '../../types/role.types';
import { RoleModal } from '../Roles/RoleManagement';
import { usePermissions } from '../../hooks/usePermissions';

export function AdminDashboard() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();
  const { total: totalUsers, fetchUsers } = useUserStore();
  const { roles, fetchRoles, permissions, fetchPermissions, createRole } = useRoleStore();
  const { logs: auditLogs, fetchLogs: fetchAuditLogs } = useAuditStore();
  const { createUser } = useUserStore();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);

  // Fetch data on component mount
  useEffect(() => {
    fetchUsers(1, 1);
    if (hasPermission(Permission.ROLE_READ)) {
      fetchRoles();
    }
    fetchAuditLogs(1, 100);
  }, [fetchUsers, fetchRoles, fetchAuditLogs]);

  // Count active roles
  const activeRolesCount = roles.filter(role => role.isActive).length;

  // Count login sessions from audit logs (actions that contain "login")
  const loginSessionsCount = auditLogs.filter(log => 
    log.action?.toLowerCase().includes('login') && log.status === 'success'
  ).length;

  const stats = [
    {
      title: 'Total Users',
      value: totalUsers.toString(),
      change: '+12%',
      changeType: 'positive',
      icon: Users
    },
    {
      title: 'Active Roles',
      value: activeRolesCount.toString(),
      change: `${roles.length} total`,
      changeType: 'positive',
      icon: Shield
    },
    {
      title: 'Login Sessions',
      value: loginSessionsCount.toString(),
      change: 'Recent logins',
      changeType: 'positive',
      icon: Activity
    },
    {
      title: 'System Health',
      value: '99.9%',
      change: '+0.1%',
      changeType: 'positive',
      icon: TrendingUp
    }
  ];

  // Get recent activity from audit logs
  const recentActivity = auditLogs.slice(0, 5).map(log => ({
    user: log.user?.fullName || 'Unknown User',
    action: log.action || 'Unknown action',
    time: new Date(log.createdAt).toLocaleString()
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  {stat.title}
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </p>
                <p className={`text-sm font-medium ${
                  stat.changeType === 'positive' 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {stat.change} from last month
                </p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-full">
                <stat.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {activity.user.split(' ').map((n: any[]) => n[0]).join('')}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {activity.user}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {activity.action}
                  </p>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {activity.time}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
              onClick={() => {
                if (hasPermission(Permission.ROLE_READ)) {
                  fetchRoles();
                }
                setShowCreateModal(true);
              }}
            >
              <Users className="h-8 w-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Add New User</p>
            </button>
            <button
              className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
              onClick={() => {
                fetchPermissions();
                setShowCreateRoleModal(true);
              }}
            >
              <Shield className="h-8 w-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Create Role</p>
            </button>
                  {/* Create Role Modal (reused from RoleManagement) */}
                  {showCreateRoleModal && (
                    <RoleModal
                      title="Create New Role"
                      onClose={() => setShowCreateRoleModal(false)}
                      onSave={async (formData: CreateRoleDto) => {
                        await createRole({ ...formData, level: 0 });
                        setShowCreateRoleModal(false);
                      }}
                      permissions={(permissions as Permission[]) || []}
                    />
                  )}
            <button 
              className="p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
              onClick={() => navigate('/audit')}
            >
              <Activity className="h-8 w-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">View Reports</p>
            </button>
          </div>
        </div>
      </div>

      {/* Create User Modal (reused from UserManagement) */}
      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onSave={async (userData: CreateUserDto) => {
            await createUser(userData);
            setShowCreateModal(false);
          }}
          roles={roles}
        />
      )}
    </div>
  );
}