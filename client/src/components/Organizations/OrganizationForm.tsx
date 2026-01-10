import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useOrganizationStore } from '../../store/useOrganizationStore';
import { OrganizationStatus, SubscriptionPlan } from '../../types/organization.types';
import { ArrowLeft, Save } from 'lucide-react';

export default function OrganizationForm() {
  const navigate = useNavigate();
  const { uuid } = useParams();
  const isEditMode = !!uuid;

  const {
    currentOrganization,
    loading,
    createOrganization,
    updateOrganization,
    fetchOrganizationByUuid,
  } = useOrganizationStore();

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    domain: '',
    status: OrganizationStatus.ACTIVE,
    subscriptionPlan: SubscriptionPlan.FREE,
    maxUsers: 10,
    settings: {
      allowSelfRegistration: false,
      requireEmailVerification: true,
      timezone: 'UTC',
      dateFormat: 'YYYY-MM-DD',
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isEditMode && uuid) {
      fetchOrganizationByUuid(uuid);
    }
  }, [isEditMode, uuid, fetchOrganizationByUuid]);

  useEffect(() => {
    if (isEditMode && currentOrganization) {
      setFormData({
        name: currentOrganization.name,
        slug: currentOrganization.slug,
        description: currentOrganization.description || '',
        domain: currentOrganization.domain || '',
        status: currentOrganization.status,
        subscriptionPlan: currentOrganization.subscriptionPlan,
        maxUsers: currentOrganization.maxUsers,
        settings: {
          allowSelfRegistration: currentOrganization.settings?.allowSelfRegistration ?? false,
          requireEmailVerification: currentOrganization.settings?.requireEmailVerification ?? true,
          timezone: currentOrganization.settings?.timezone ?? 'UTC',
          dateFormat: currentOrganization.settings?.dateFormat ?? 'YYYY-MM-DD',
        },
      });
    }
  }, [isEditMode, currentOrganization]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      name: value,
      slug: isEditMode ? prev.slug : generateSlug(value),
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Organization name is required';
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'Slug is required';
    } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(formData.slug)) {
      newErrors.slug = 'Slug must contain only lowercase letters, numbers, and hyphens';
    }

    if (formData.maxUsers < 1) {
      newErrors.maxUsers = 'Max users must be at least 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      if (isEditMode && uuid) {
        await updateOrganization(uuid, formData);
      } else {
        await createOrganization(formData);
      }
      navigate('/organizations');
    } catch (error) {
      console.error('Failed to save organization:', error);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/organizations')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-4"
        >
          <ArrowLeft size={20} />
          Back to Organizations
        </button>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {isEditMode ? 'Edit Organization' : 'Create New Organization'}
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">
          {isEditMode
            ? 'Update organization details and settings'
            : 'Set up a new organization for your platform'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Basic Information
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Organization Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                  errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="Acme Corporation"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Slug *
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                  errors.slug ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="acme-corporation"
              />
              {errors.slug && (
                <p className="text-red-500 text-sm mt-1">{errors.slug}</p>
              )}
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                Used in URLs and must be unique
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Brief description of the organization"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Domain (Optional)
              </label>
              <input
                type="text"
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="acme.com"
              />
            </div>
          </div>
        </div>

        {/* Organization Settings */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Organization Settings
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as OrganizationStatus })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value={OrganizationStatus.ACTIVE}>Active</option>
                <option value={OrganizationStatus.TRIAL}>Trial</option>
                <option value={OrganizationStatus.SUSPENDED}>Suspended</option>
                <option value={OrganizationStatus.INACTIVE}>Inactive</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Subscription Plan
              </label>
              <select
                value={formData.subscriptionPlan}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    subscriptionPlan: e.target.value as SubscriptionPlan,
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value={SubscriptionPlan.FREE}>Free</option>
                <option value={SubscriptionPlan.STARTER}>Starter</option>
                <option value={SubscriptionPlan.PROFESSIONAL}>Professional</option>
                <option value={SubscriptionPlan.ENTERPRISE}>Enterprise</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Max Users
              </label>
              <input
                type="number"
                value={formData.maxUsers}
                onChange={(e) =>
                  setFormData({ ...formData, maxUsers: parseInt(e.target.value) || 0 })
                }
                min="1"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                  errors.maxUsers ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
              {errors.maxUsers && (
                <p className="text-red-500 text-sm mt-1">{errors.maxUsers}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Timezone
              </label>
              <input
                type="text"
                value={formData.settings.timezone}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    settings: { ...formData.settings, timezone: e.target.value },
                  })
                }
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="UTC"
              />
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.settings.allowSelfRegistration}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    settings: {
                      ...formData.settings,
                      allowSelfRegistration: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Allow self-registration</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.settings.requireEmailVerification}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    settings: {
                      ...formData.settings,
                      requireEmailVerification: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Require email verification</span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/organizations')}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={20} />
            {loading ? 'Saving...' : isEditMode ? 'Update Organization' : 'Create Organization'}
          </button>
        </div>
      </form>
    </div>
  );
}
