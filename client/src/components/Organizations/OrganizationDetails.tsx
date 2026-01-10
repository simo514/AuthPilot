import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrganizationStore } from '../../store/useOrganizationStore';
import { organizationService } from '../../services/organizationService';
import {
  ArrowLeft,
  Users,
  FolderKanban,
  Settings,
  UserPlus,
  UserMinus,
  Edit,
} from 'lucide-react';
import { UserListItem } from '../../types/user.types';
import { OrganizationStatus } from '../../types/organization.types';

export default function OrganizationDetails() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const { currentOrganization, fetchOrganizationByUuid, loading } = useOrganizationStore();

  const getStatusColor = (status: OrganizationStatus) => {
    switch (status) {
      case OrganizationStatus.ACTIVE:
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300';
      case OrganizationStatus.TRIAL:
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300';
      case OrganizationStatus.SUSPENDED:
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300';
      case OrganizationStatus.INACTIVE:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  };

  const [activeTab, setActiveTab] = useState<'users' | 'projects'>('users');
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [unassignedUsers, setUnassignedUsers] = useState<UserListItem[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);

  useEffect(() => {
    if (uuid) {
      fetchOrganizationByUuid(uuid);
    }
  }, [uuid, fetchOrganizationByUuid]);

  useEffect(() => {
    if (uuid && activeTab === 'users') {
      loadUsers();
    }
  }, [uuid, activeTab]);

  const loadUsers = async () => {
    if (!uuid) return;
    setUsersLoading(true);
    try {
      const response = await organizationService.getUsers(uuid, 1, 100);
      setUsers(response.users);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  const loadUnassignedUsers = async () => {
    try {
      const response = await organizationService.getUnassignedUsers(1, 100);
      setUnassignedUsers(response.users);
    } catch (error) {
      console.error('Failed to load unassigned users:', error);
    }
  };

  const handleAssignUser = async (userUuid: string) => {
    if (!uuid) return;
    try {
      await organizationService.assignUser(userUuid, uuid);
      await loadUsers();
      await fetchOrganizationByUuid(uuid); // Refresh organization data to update currentUsers count
      setShowAssignModal(false);
      setUnassignedUsers([]);
    } catch (error) {
      console.error('Failed to assign user:', error);
    }
  };

  const handleRemoveUser = async (userUuid: string, userName: string) => {
    if (window.confirm(`Remove ${userName} from this organization?`)) {
      try {
        await organizationService.removeUser(userUuid);
        await loadUsers();
        await fetchOrganizationByUuid(uuid!); // Refresh organization data to update currentUsers count
      } catch (error) {
        console.error('Failed to remove user:', error);
      }
    }
  };

  const openAssignModal = async () => {
    setShowAssignModal(true);
    await loadUnassignedUsers();
  };

  if (loading || !currentOrganization) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading organization...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate('/organizations')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-4"
        >
          <ArrowLeft size={20} />
          Back to Organizations
        </button>

        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {currentOrganization.name}
              </h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentOrganization.status)}`}>
                {currentOrganization.status}
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mt-1">@{currentOrganization.slug}</p>
            {currentOrganization.description && (
              <p className="text-gray-600 dark:text-gray-400 mt-2">{currentOrganization.description}</p>
            )}
          </div>
          <button
            onClick={() => navigate(`/organizations/edit/${uuid}`)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit size={20} />
            Edit
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Users</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentOrganization.currentUsers} / {currentOrganization.maxUsers}
              </p>
            </div>
            <Users className="text-blue-600 dark:text-blue-400" size={32} />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
                {currentOrganization.status}
              </p>
            </div>
            <Settings className="text-green-600 dark:text-green-400" size={32} />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Plan</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
                {currentOrganization.subscriptionPlan}
              </p>
            </div>
            <FolderKanban className="text-purple-600 dark:text-purple-400" size={32} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-4 px-6">
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                activeTab === 'users'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users size={20} />
                Users ({currentOrganization.currentUsers})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('projects')}
              className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                activeTab === 'projects'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <FolderKanban size={20} />
                Projects (Coming Soon)
              </div>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'users' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Organization Users
                </h3>
                <button
                  onClick={openAssignModal}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <UserPlus size={20} />
                  Assign User
                </button>
              </div>

              {usersLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No users assigned to this organization yet.
                </div>
              ) : (
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
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {users.map((user) => (
                        <tr key={user.uuid} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {user.fullName}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 capitalize">
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                            {user.department || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                user.status === 'active'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {user.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <button
                              onClick={() => handleRemoveUser(user.uuid, user.fullName)}
                              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium text-sm"
                            >
                              <UserMinus size={18} className="inline" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'projects' && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <FolderKanban size={48} className="mx-auto mb-4 text-gray-400 dark:text-gray-500" />
              <p>Project management coming soon...</p>
            </div>
          )}
        </div>
      </div>

      {/* Assign User Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Assign User</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Select a user to assign to this organization
              </p>
            </div>

            <div className="p-6 overflow-y-auto max-h-96">
              {unassignedUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No unassigned users available
                </div>
              ) : (
                <div className="space-y-2">
                  {unassignedUsers.map((user) => (
                    <div
                      key={user.uuid}
                      className="flex items-center justify-between p-4 border dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {user.fullName}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                      </div>
                      <button
                        onClick={() => handleAssignUser(user.uuid)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Assign
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t dark:border-gray-700 flex justify-end">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
