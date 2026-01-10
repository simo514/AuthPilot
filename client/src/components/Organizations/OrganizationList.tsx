import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrganizationStore } from '../../store/useOrganizationStore';
import { OrganizationStatus, SubscriptionPlan } from '../../types/organization.types';
import { Plus, Building2, Users, TrendingUp, Search, Edit, Trash2 } from 'lucide-react';
import { PermissionGuard } from '../Auth/PermissionGuard';
import { Permission } from '../../types/auth.types';

export default function OrganizationList() {
  const navigate = useNavigate();
  const {
    organizations,
    loading,
    fetchOrganizations,
    deleteOrganization,
  } = useOrganizationStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrganizationStatus | ''>('');
  const [deletingOrganization, setDeletingOrganization] = useState<{ uuid: string; name: string } | null>(null);

  useEffect(() => {
    fetchOrganizations({ page: 1, limit: 50 });
  }, [fetchOrganizations]);

  const handleDelete = async (uuid: string) => {
    try {
      await deleteOrganization(uuid);
      setDeletingOrganization(null);
    } catch (error) {
      console.error('Failed to delete organization:', error);
    }
  };

  const filteredOrganizations = organizations.filter((org) => {
    const matchesSearch =
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || org.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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

  const getPlanColor = (plan: SubscriptionPlan) => {
    switch (plan) {
      case SubscriptionPlan.ENTERPRISE:
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300';
      case SubscriptionPlan.PROFESSIONAL:
        return 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300';
      case SubscriptionPlan.STARTER:
        return 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-300';
      case SubscriptionPlan.FREE:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Organizations</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage organizations and their settings
          </p>
        </div>
        <PermissionGuard requiredPermissions={[Permission.ORGANIZATION_CREATE]} noRedirect={true}>  
        <button
          onClick={() => navigate('/organizations/new')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Create Organization
        </button>
        </PermissionGuard>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Organizations</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{organizations.length}</p>
            </div>
            <Building2 className="text-blue-600" size={32} />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Organizations</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {organizations.filter((o) => o.status === OrganizationStatus.ACTIVE).length}
              </p>
            </div>
            <TrendingUp className="text-green-600 dark:text-green-400" size={32} />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {organizations.reduce((sum, org) => sum + org.currentUsers, 0)}
              </p>
            </div>
            <Users className="text-purple-600 dark:text-purple-400" size={32} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
            <input
              type="text"
              placeholder="Search organizations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as OrganizationStatus | '')}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">All Statuses</option>
            <option value={OrganizationStatus.ACTIVE}>Active</option>
            <option value={OrganizationStatus.TRIAL}>Trial</option>
            <option value={OrganizationStatus.SUSPENDED}>Suspended</option>
            <option value={OrganizationStatus.INACTIVE}>Inactive</option>
          </select>
        </div>
      </div>

      {/* Organizations Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Loading organizations...</p>
        </div>
      ) : filteredOrganizations.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <Building2 size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No organizations found</p>
          <button
            onClick={() => navigate('/organizations/new')}
            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
          >
            Create your first organization
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOrganizations.map((org) => (
            <div
              key={org.uuid}
              className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                      {org.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">@{org.slug}</p>
                  </div>
                  <div className="flex gap-2">
                    <PermissionGuard requiredPermissions={[Permission.ORGANIZATION_UPDATE]} noRedirect={true}>
                      <button
                        onClick={() => navigate(`/organizations/edit/${org.uuid}`)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit size={18} />
                      </button>
                    </PermissionGuard>
                    <PermissionGuard requiredPermissions={[Permission.ORGANIZATION_DELETE]} noRedirect={true}>
                      <button
                        onClick={() => setDeletingOrganization({ uuid: org.uuid, name: org.name })}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </PermissionGuard>
                  </div>
                </div>

                {org.description && (
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                    {org.description}
                  </p>
                )}

                <div className="flex items-center gap-2 mb-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(org.status)}`}>
                    {org.status}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPlanColor(org.subscriptionPlan)}`}>
                    {org.subscriptionPlan}
                  </span>
                </div>

                <div className="border-t dark:border-gray-700 pt-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Users size={16} />
                      <span>
                        {org.currentUsers} / {org.maxUsers} users
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                    <div
                      className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min((org.currentUsers / org.maxUsers) * 100, 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/organizations/${org.uuid}`)}
                  className="w-full mt-4 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingOrganization && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900/20 rounded-full mb-4">
              <Trash2 className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-2">
              Delete Organization
            </h3>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
              Are you sure you want to delete <span className="font-semibold text-gray-900 dark:text-white">"{deletingOrganization.name}"</span>? This action cannot be undone.
            </p>
            
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setDeletingOrganization(null)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
              >
                Cancel
              </button>
              <div className="flex-1" />
              <button
                type="button"
                onClick={() => handleDelete(deletingOrganization.uuid)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                Delete Organization
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
