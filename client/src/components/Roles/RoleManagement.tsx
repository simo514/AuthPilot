import React, { useState, useEffect } from 'react';
import { Shield, Plus, Edit2, Trash2, Users } from 'lucide-react';

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
}

const defaultPermissions = [
  'view_dashboard',
  'view_profile',
  'edit_profile',
  'view_users',
  'create_users',
  'edit_users',
  'delete_users',
  'view_roles',
  'create_roles',
  'edit_roles',
  'delete_roles',
  'view_audit_logs',
  'export_data',
  'manage_settings'
];

export function RoleManagement() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  useEffect(() => {
    const storedRoles = localStorage.getItem('roles');
    if (storedRoles) {
      setRoles(JSON.parse(storedRoles));
    } else {
      // Initialize with default roles
      const defaultRoles: Role[] = [
        {
          id: '1',
          name: 'Admin',
          description: 'Full system access with all permissions',
          permissions: defaultPermissions,
          userCount: 1
        },
        {
          id: '2',
          name: 'Manager',
          description: 'Department management with limited administrative access',
          permissions: [
            'view_dashboard',
            'view_profile',
            'edit_profile',
            'view_users',
            'edit_users',
            'view_audit_logs',
            'export_data'
          ],
          userCount: 1
        },
        {
          id: '3',
          name: 'User',
          description: 'Basic user access with profile management',
          permissions: [
            'view_dashboard',
            'view_profile',
            'edit_profile'
          ],
          userCount: 1
        }
      ];
      setRoles(defaultRoles);
      localStorage.setItem('roles', JSON.stringify(defaultRoles));
    }
  }, []);

  const handleCreateRole = (roleData: Omit<Role, 'id' | 'userCount'>) => {
    const newRole: Role = {
      ...roleData,
      id: Date.now().toString(),
      userCount: 0
    };

    const updatedRoles = [...roles, newRole];
    setRoles(updatedRoles);
    localStorage.setItem('roles', JSON.stringify(updatedRoles));
    setShowCreateModal(false);
  };

  const handleUpdateRole = (roleData: Role) => {
    const updatedRoles = roles.map(r => r.id === roleData.id ? roleData : r);
    setRoles(updatedRoles);
    localStorage.setItem('roles', JSON.stringify(updatedRoles));
    setEditingRole(null);
  };

  const handleDeleteRole = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (role && role.userCount > 0) {
      alert('Cannot delete role with active users. Please reassign users first.');
      return;
    }

    if (window.confirm('Are you sure you want to delete this role?')) {
      const updatedRoles = roles.filter(r => r.id !== roleId);
      setRoles(updatedRoles);
      localStorage.setItem('roles', JSON.stringify(updatedRoles));
    }
  };

  const getPermissionLabel = (permission: string) => {
    return permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Role Management</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Create Role</span>
        </button>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map((role) => (
          <div key={role.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
                  <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{role.name}</h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                    <Users className="h-4 w-4" />
                    <span>{role.userCount} users</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setEditingRole(role)}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                {role.name !== 'Admin' && (
                  <button
                    onClick={() => handleDeleteRole(role.id)}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {role.description}
            </p>

            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Permissions</h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {role.permissions.slice(0, 5).map((permission) => (
                  <div key={permission} className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></div>
                    {getPermissionLabel(permission)}
                  </div>
                ))}
                {role.permissions.length > 5 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    +{role.permissions.length - 5} more permissions
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Role Modal */}
      {showCreateModal && (
        <RoleModal
          title="Create New Role"
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreateRole}
          permissions={defaultPermissions}
        />
      )}

      {/* Edit Role Modal */}
      {editingRole && (
        <RoleModal
          title="Edit Role"
          role={editingRole}
          onClose={() => setEditingRole(null)}
          onSave={handleUpdateRole}
          permissions={defaultPermissions}
        />
      )}
    </div>
  );
}

// Role Modal Component
function RoleModal({
  title,
  role,
  onClose,
  onSave,
  permissions
}: {
  title: string;
  role?: Role;
  onClose: () => void;
  onSave: (role: any) => void;
  permissions: string[];
}) {
  const [formData, setFormData] = useState({
    name: role?.name || '',
    description: role?.description || '',
    permissions: role?.permissions || []
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (role) {
      onSave({ ...role, ...formData });
    } else {
      onSave(formData);
    }
  };

  const handlePermissionToggle = (permission: string) => {
    const updatedPermissions = formData.permissions.includes(permission)
      ? formData.permissions.filter(p => p !== permission)
      : [...formData.permissions, permission];
    
    setFormData({ ...formData, permissions: updatedPermissions });
  };

  const getPermissionLabel = (permission: string) => {
    return permission.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Role Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
              Permissions
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
              {permissions.map((permission) => (
                <label key={permission} className="flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.permissions.includes(permission)}
                    onChange={() => handlePermissionToggle(permission)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-900 dark:text-white">
                    {getPermissionLabel(permission)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {role ? 'Update Role' : 'Create Role'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}