import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useIsManager } from '../../hooks/useIsManager';
import { useUserStore } from '../../store/useUserStore';
import { User as UserType, Permission } from '../../types/auth.types';
import { Search, Filter, Plus, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRoleStore } from '../../store';
import { PermissionGuard } from '../Auth/PermissionGuard';

type User = UserType;

export function UserManagement() {
  const { user: currentUser } = useAuthStore();
  const isManager = useIsManager();
  const { users, total, totalPages, fetchUsers, deleteUser, status, error, updateUser, createUser } = useUserStore();
  const { roles, fetchRoles } = useRoleStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (isManager && currentUser?.uuid) {
      // For managers, still fetch team members (no pagination yet)
      useUserStore.getState().fetchMyTeamMembers();
    } else {
      // For admins, use pagination and search
      fetchUsers(currentPage, itemsPerPage, debouncedSearch);
    }
  }, [currentPage, itemsPerPage, debouncedSearch, currentUser, isManager]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  // Client-side filtering for role (only for managers' team view)
  const filteredUsers = isManager
    ? users.filter(user => {
        if (currentUser?.uuid && user.uuid === currentUser.uuid) return false;
        if (filterRole !== 'all' && user.role !== filterRole) return false;
        return true;
      })
    : users.filter(user => {
        if (currentUser?.uuid && user.uuid === currentUser.uuid) return false;
        if (filterRole !== 'all' && user.role !== filterRole) return false;
        return true;
      });

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUser(userId);
      // Refresh current page after delete
      if (!isManager) {
        fetchUsers(currentPage, itemsPerPage, debouncedSearch);
      }
    } catch (err) {
      // error handled in store
    }
    setDeletingUser(null);
  };

  const handleCreateUser = async (userData: any) => {
    try {
      await createUser(userData);
      setShowCreateModal(false);
      // Refresh current page after create
      if (!isManager) {
        fetchUsers(currentPage, itemsPerPage, debouncedSearch);
      }
    } catch (err) {
      // error handled in store
    }
  };

  const handleUpdateUser = async (userData: any) => {
    if (userData.uuid) {
      // Extract only editable fields for UpdateUserDto
      const payload: any = {
        fullName: userData.fullName,
        email: userData.email,
        department: userData.department,
        managerId: userData.managerId,
        status: userData.status,
      };

      // Handle roleId - ensure it's always a string id (never name/object)
      let roleId = userData.roleId;
      if (typeof roleId === 'object' && roleId !== null) {
        roleId = roleId.id || roleId._id;
      } else if (typeof roleId === 'string') {
        // If it's a name, convert to id
        const foundById = roles.find(r => r.id === roleId);
        if (foundById) {
          roleId = foundById.id;
        } else {
          const foundByName = roles.find(r => r.name === roleId);
          if (foundByName) roleId = foundByName.id;
        }
      }
      
      // Only include roleId if it's a non-empty string
      if (roleId && typeof roleId === 'string' && roleId.trim() !== '') {
        payload.roleId = roleId;
      }

      await updateUser(userData.uuid, payload);
      // Refresh current page after update
      if (!isManager) {
        fetchUsers(currentPage, itemsPerPage, debouncedSearch);
      }
    }
    setEditingUser(null);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {currentUser?.role === 'manager' ? 'Team Members' : 'User Management'}
        </h1>
        <PermissionGuard requiredPermissions={[Permission.USER_CREATE]} noRedirect>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add User</span>
          </button>
        </PermissionGuard>
      </div>

      {/* Search and Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users (name, email)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full sm:w-48 pl-10 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Roles</option>
              {roles.map(role => (
                <option key={role.id} value={role.name.toLowerCase()}>{role.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {status === 'loading' ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    Loading users...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-red-500">
                    {error}
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.uuid} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-semibold">
                            {(user.fullName || '').split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.fullName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'admin' 
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                          : user.role === 'manager'
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                          : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {user.department || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.status === 'active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <PermissionGuard requiredPermissions={[Permission.USER_UPDATE]} noRedirect>
                          <button
                            onClick={() => setEditingUser(user)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        </PermissionGuard>
                        <PermissionGuard requiredPermissions={[Permission.USER_DELETE]} noRedirect>
                          {user.uuid !== currentUser?.uuid && (
                            <button
                              onClick={() => setDeletingUser(user)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </PermissionGuard>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination - Only show for non-managers */}
        {!isManager && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Showing {filteredUsers.length > 0 ? ((currentPage - 1) * itemsPerPage) + 1 : 0} to {Math.min(currentPage * itemsPerPage, total)} of {total} results
              </span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="ml-4 border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 text-sm dark:bg-gray-700 dark:text-white"
              >
                <option value={5}>5 per page</option>
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              <div className="flex items-center space-x-1">
                {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = idx + 1;
                  } else if (currentPage <= 3) {
                    pageNum = idx + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + idx;
                  } else {
                    pageNum = currentPage - 2 + idx;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-1 rounded-lg text-sm ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>


      {/* Create User Modal */}
      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreateUser}
          roles={roles.filter((role) => role.isActive)}
        />
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleUpdateUser}
          currentUserRole={currentUser?.role}
          roles={roles.filter((role) => role.isActive)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingUser && (
        <DeleteConfirmationModal
          userName={deletingUser.fullName}
          onConfirm={() => handleDeleteUser(deletingUser.uuid)}
          onCancel={() => setDeletingUser(null)}
        />
      )}
    </div>
  );
}

// Create User Modal Component
export function CreateUserModal({ onClose, onSave, roles = [] }: {
  onClose: () => void;
  onSave: (user: any) => void;
  roles?: any[];
}) {
  const { managers, fetchManagers } = useUserStore();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    roleId: '',
    department: '',
    managerId: ''
  });

  useEffect(() => {
    fetchManagers();
  }, [fetchManagers]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Only send the fields defined in CreateUserDto
    const payload = {
      fullName: formData.fullName,
      email: formData.email,
      password: formData.password,
      roleId: formData.roleId,
      department: formData.department,
      managerId: formData.managerId
    };
    onSave(payload);
  };

  // Determine if selected role is 'user' by checking role name
  const selectedRole = roles.find(r => (r.id || r._id) === formData.roleId);
  const isUserRole = selectedRole?.name?.toLowerCase() === 'user';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Create New User
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Role
            </label>
            <select
              value={formData.roleId || ''}
              onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              disabled={roles.length === 0}
              required
            >
              {roles.length === 0 ? (
                <option>Loading roles...</option>
              ) : (
                <>
                  <option value="">Select a role</option>
                  {roles.map((role) => (
                    <option key={role.id || role._id} value={role.id || role._id}>
                      {role.name}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>

          {/* Manager Select - Only show when role is 'user' */}
          {isUserRole && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Manager
              </label>
              <select
                value={formData.managerId}
                onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                required
              >
                <option value="">Select a manager</option>
                {managers.map((manager) => (
                  <option key={manager.uuid} value={manager.uuid}>
                    {manager.fullName}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Department
            </label>
            <input
              type="text"
              value={formData.department || ''}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4">
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
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Delete Confirmation Modal Component
function DeleteConfirmationModal({
  userName,
  onConfirm,
  onCancel,
}: {
  userName: string;
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
          Delete User
        </h3>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
          Are you sure you want to delete <span className="font-semibold text-gray-900 dark:text-white">"{userName}"</span>? This action cannot be undone.
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
            Delete User
          </button>
        </div>
      </div>
    </div>
  );
}

// Edit User Modal Component
function EditUserModal({ user, onClose, onSave, currentUserRole, roles }: {
  user: any;
  onClose: () => void;
  onSave: (user: any) => void;
  currentUserRole?: string;
  roles: any[];
}) {
  // Ensure formData.roleId is always the role's id (not name)
  const initialRoleId = (() => {
    if (user.roleId && typeof user.roleId === 'object') return user.roleId.id;
    if (user.roleId && typeof user.roleId === 'string') {
      // Try to match by id, fallback to match by name
      const found = roles.find(r => r.id === user.roleId);
      if (found) return found.id;
      // If not found by id, try by name
      const byName = roles.find(r => r.name === user.roleId);
      if (byName) return byName.id;
      return user.roleId;
    }
    if (user.role) {
      const byName = roles.find(r => r.name === user.role);
      if (byName) return byName.id;
    }
    return '';
  })();
  const [formData, setFormData] = useState<any>({ ...user, roleId: initialRoleId });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Edit User
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {currentUserRole === 'admin' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Role
              </label>
              <select
                value={formData.roleId}
                onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                disabled={roles.length === 0}
              >
                {roles.length === 0 ? (
                  <option>Loading roles...</option>
                ) : (
                  roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Department
            </label>
            <input
              type="text"
              value={formData.department || ''}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {currentUserRole === 'admin' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          )}

          <div className="flex items-center justify-end space-x-4 pt-4">
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
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}