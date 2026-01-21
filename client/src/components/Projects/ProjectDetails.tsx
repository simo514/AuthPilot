import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProjectStore } from '../../store/useProjectStore';
import { ArrowLeft, Edit, Users, UserPlus, X, Calendar, Tag } from 'lucide-react';
import { PermissionGuard } from '../Auth/PermissionGuard';
import { Permission } from '../../types/auth.types';
import { usePermissions } from '../../hooks/usePermissions';
import TaskList from '../Tasks/TaskList';

export default function ProjectDetails() {
  const navigate = useNavigate();
  const { uuid } = useParams<{ uuid: string }>();
  const { hasPermission } = usePermissions();
  const {
    currentProject,
    projectUsers,
    availableUsers,
    loading,
    fetchProjectByUuid,
    fetchProjectUsers,
    fetchAvailableUsers,
    assignUserToProject,
    removeUserFromProject,
  } = useProjectStore();

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');

  const canManageUsers = hasPermission(Permission.PROJECT_MANAGE_USERS);
  const canViewAllProjects = hasPermission(Permission.PROJECT_LIST);

  useEffect(() => {
    if (uuid) {
      fetchProjectByUuid(uuid);
      fetchProjectUsers(uuid);
      // Only fetch available users if user has permission to manage users
      if (canManageUsers) {
        fetchAvailableUsers(uuid);
      }
    }
  }, [uuid, fetchProjectByUuid, fetchProjectUsers, fetchAvailableUsers, canManageUsers]);

  const handleBack = () => {
    // Navigate to appropriate projects page based on permissions
    if (canViewAllProjects) {
      navigate('/projects');
    } else {
      navigate('/my-projects');
    }
  };

  const handleAssignUser = async () => {
    if (!uuid || !selectedUserId) return;

    try {
      await assignUserToProject(uuid, selectedUserId);
      setShowAssignModal(false);
      setSelectedUserId('');
    } catch (error) {
      console.error('Failed to assign user:', error);
    }
  };

  const handleRemoveUser = async (userUuid: string) => {
    if (!uuid) return;

    try {
      await removeUserFromProject(uuid, userUuid);
    } catch (error) {
      console.error('Failed to remove user:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case 'inactive':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
      case 'archived':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  };

  if (loading && !currentProject) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
          Project not found
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{currentProject.name}</h1>
            <p className="text-gray-600 dark:text-gray-400">@{currentProject.slug}</p>
          </div>
        </div>
        <PermissionGuard requiredPermissions={[Permission.PROJECT_UPDATE]} noRedirect={true}>
          <button
            onClick={() => navigate(`/projects/edit/${uuid}`)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit size={20} />
            Edit Project
          </button>
        </PermissionGuard>
      </div>

      {/* Project Info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
        <div className="flex items-center gap-4">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentProject.status)}`}>
            {currentProject.status}
          </span>
          {currentProject.organizationName && (
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Organization: {currentProject.organizationName}
            </span>
          )}
        </div>

        {currentProject.description && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</h3>
            <p className="text-gray-600 dark:text-gray-400">{currentProject.description}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentProject.startDate && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Calendar size={16} />
              <span>Start: {new Date(currentProject.startDate).toLocaleDateString()}</span>
            </div>
          )}
          {currentProject.endDate && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Calendar size={16} />
              <span>End: {new Date(currentProject.endDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {currentProject.tags && currentProject.tags.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <Tag size={16} />
              Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {currentProject.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Team Members */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={24} className="text-gray-600 dark:text-gray-400" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Team Members ({projectUsers.length})
              </h2>
            </div>
            <PermissionGuard requiredPermissions={[Permission.PROJECT_MANAGE_USERS]} noRedirect={true}>
              <button
                onClick={() => setShowAssignModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <UserPlus size={20} />
                Assign User
              </button>
            </PermissionGuard>
          </div>
        </div>

        <div className="p-6">
          {projectUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No team members assigned to this project yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Email</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Name</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Role</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {projectUsers.map((user: any) => (
                    <tr key={user.uuid} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">{user.email}</td>
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                        {user.fullName}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-400">{user.role}</td>
                      <td className="py-3 px-4 text-right">
                        <PermissionGuard requiredPermissions={[Permission.PROJECT_MANAGE_USERS]} noRedirect={true}>
                          <button
                            onClick={() => handleRemoveUser(user.uuid)}
                            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm"
                          >
                            Remove
                          </button>
                        </PermissionGuard>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Tasks Section */}
      {uuid && <TaskList projectUuid={uuid} />}

      {/* Assign User Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Assign User to Project</h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={24} />
              </button>
            </div>

            {availableUsers.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No available users from this organization. All users are either assigned to other projects or not in this organization.
              </p>
            ) : (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Select User
                  </label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select a user</option>
                    {availableUsers.map((user: any) => (
                      <option key={user.uuid} value={user.uuid}>
                        {user.email} - {user.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowAssignModal(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAssignUser}
                    disabled={!selectedUserId}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Assign
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
