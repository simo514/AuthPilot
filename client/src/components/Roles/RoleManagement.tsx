import React, { useState, useEffect } from 'react';
import { Shield, Plus, Edit2, Trash2 } from 'lucide-react';
import { useRoleStore } from '../../store/useRoleStore';
import { Role } from '../../types/role.types';
import { Permission } from '../../types/auth.types';

export function RoleManagement() {
  const { roles, fetchRoles, status, error, fetchPermissions, permissions, createRole, deleteRole } = useRoleStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);

  // Fetch permissions when opening the create modal
  useEffect(() => {
    if (showCreateModal) {
      fetchPermissions();
    }
  }, [showCreateModal, fetchPermissions]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

    // Converts 'user:create' to 'Create User', 'role:update' to 'Update Role', etc.
  const getPermissionLabel = (permission: string) => {
    if (!permission.includes(':')) return permission;
    const [resource, action] = permission.split(':');
    // Capitalize first letter of each word
    const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    return `${cap(action)} ${cap(resource)}`;
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
        {status === 'loading' ? (
          <div className="col-span-full text-center text-gray-500 dark:text-gray-400 py-8">Loading roles...</div>
        ) : error ? (
          <div className="col-span-full text-center text-red-500 py-8">{error}</div>
        ) : roles.length === 0 ? (
          <div className="col-span-full text-center text-gray-500 dark:text-gray-400 py-8">No roles found</div>
        ) : (
          roles.map((role: Role) => (
            <div key={role.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
                    <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{role.name}</h3>
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
                      onClick={() => setDeletingRole(role)}
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
                  {role.permissions.slice(0, 5).map((permission: string) => (
                    <div key={permission} className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></div>
                      {getPermissionLabel(permission)}
                    </div>
                  ))}
                  {role.permissions.length > 5 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      +{role.permissions.length - 5} more
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Role Modal */}

      {showCreateModal && (
        <RoleModal
          title="Create New Role"
          onClose={() => setShowCreateModal(false)}
          onSave={async (formData) => {
            await createRole({ ...formData, level: 0 });
            setShowCreateModal(false);
          }}
          permissions={(permissions as Permission[]) || []}
        />
      )}

      {/* Edit Role Modal */}
      {editingRole && (
        <RoleModal
          title="Edit Role"
          role={editingRole}
          onClose={() => setEditingRole(null)}
          onSave={() => {}}
          permissions={(permissions as Permission[]) || []}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingRole && (
        <DeleteConfirmationModal
          roleName={deletingRole.name}
          onConfirm={async () => {
            await deleteRole(deletingRole.id);
            setDeletingRole(null);
          }}
          onCancel={() => setDeletingRole(null)}
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
  permissions = [],
}: {
  title: string;
  role?: Role;
  onClose: () => void;
  onSave: (role: any) => void;
  permissions?: Permission[];
}) {
  const [formData, setFormData] = useState({
    name: role?.name || '',
    description: role?.description || '',
    permissions: (role?.permissions || []) as Permission[],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (role) {
      onSave({ ...role, ...formData });
    } else {
      onSave(formData);
    }
  };

  const handlePermissionToggle = (permission: Permission) => {
    const updatedPermissions = formData.permissions.includes(permission)
      ? formData.permissions.filter((p) => p !== permission)
      : [...formData.permissions, permission];
    setFormData({ ...formData, permissions: updatedPermissions });
  };

  // Converts 'user:create' to 'Create User', 'role:update' to 'Update Role', etc.
  const getPermissionLabel = (permission: string) => {
    if (!permission.includes(':')) return permission;
    const [resource, action] = permission.split(':');
    // Capitalize first letter of each word
    const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    return `${cap(action)} ${cap(resource)}`;
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-64 overflow-y-auto">
              {permissions.map((permission) => (
                <label
                  key={permission}
                  className="flex items-center gap-3 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-150 cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    checked={formData.permissions.includes(permission)}
                    onChange={() => handlePermissionToggle(permission)}
                    className="accent-blue-600 w-5 h-5 rounded border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-100 group-hover:text-blue-600 transition-colors">
                    {/* Optionally add an icon here for each permission type */}
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

// Delete Confirmation Modal Component
function DeleteConfirmationModal({
  roleName,
  onConfirm,
  onCancel,
}: {
  roleName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full mb-4">
          <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-2">
          Delete Role
        </h3>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
          Are you sure you want to delete the role <span className="font-semibold text-gray-900 dark:text-white">"{roleName}"</span>? This action cannot be undone.
        </p>
        
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-2 py-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
          >
            Cancel
          </button>
          <div className="flex-1" />
          <button
            type="button"
            onClick={onConfirm}
            className="px-2 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
          >
            Delete Role
          </button>
        </div>
      </div>
    </div>
  );
}