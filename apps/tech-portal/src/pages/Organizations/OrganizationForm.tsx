/**
 * Organization Form Component
 * Professional Tech Portal Design
 */

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { MdSave, MdCancel } from 'react-icons/md';
import { cn } from '../../lib/utils';
import { useToast } from '../../components/shared/Toast';
import { apiFetch } from '../../utils/api';

interface Organization {
  _id?: string;
  name: string;
  type: string;
  portalType: string;
  isActive: boolean;
}

interface OrganizationFormProps {
  organization?: Organization | null;
  organizationType?: 'customer' | 'vendor';
  onSuccess: () => void;
  onCancel: () => void;
}

export function OrganizationForm({ organization, organizationType, onSuccess, onCancel }: OrganizationFormProps) {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    name: organization?.name || '',
    type: organization?.type || organizationType || 'customer',
    portalType: organization?.portalType || organizationType || 'customer',
    isActive: organization?.isActive ?? true,
    adminEmail: '', // Admin email for the organization
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiFetch('/api/v1/tech/organizations', {
        method: 'POST',
        body: JSON.stringify({
          name: data.name,
          type: data.type,
          portalType: data.portalType,
          isActive: data.isActive,
          adminEmail: data.adminEmail,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create organization');
      }
      return response.json();
    },
    onSuccess: () => {
      showToast('Organization created successfully!', 'success');
      onSuccess();
    },
    onError: (error: Error) => {
      setErrors({ submit: error.message });
      showToast(`Failed to create organization: ${error.message}`, 'error');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiFetch(`/api/v1/tech/organizations/${organization?._id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: data.name,
          portalType: data.portalType,
          isActive: data.isActive,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update organization');
      }
      return response.json();
    },
    onSuccess: () => {
      showToast('Organization updated successfully!', 'success');
      onSuccess();
    },
    onError: (error: Error) => {
      setErrors({ submit: error.message });
      showToast(`Failed to update organization: ${error.message}`, 'error');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!formData.name.trim()) {
      setErrors({ name: 'Organization name is required' });
      return;
    }

    // Validate admin email (required for new organizations)
    if (!organization && !formData.adminEmail.trim()) {
      setErrors({ adminEmail: 'Admin email is required' });
      return;
    }

    // Validate email format
    if (formData.adminEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.adminEmail)) {
      setErrors({ adminEmail: 'Please enter a valid email address' });
      return;
    }

    if (organization) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Organization Name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className={cn(
            'w-full px-4 py-2.5 border-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all',
            errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
          )}
          placeholder="Enter organization name"
        />
        {errors.name && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>}
      </div>

      {/* Admin Email */}
      {!organization && (
        <div>
          <label htmlFor="adminEmail" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Admin Email <span className="text-red-500">*</span>
          </label>
          <input
            id="adminEmail"
            type="email"
            value={formData.adminEmail}
            onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
            className={cn(
              'w-full px-4 py-2.5 border-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all',
              errors.adminEmail ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'
            )}
            placeholder="admin@organization.com"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            This will be the top-level admin account for this organization
          </p>
          {errors.adminEmail && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.adminEmail}</p>}
        </div>
      )}

      {/* Portal Type */}
      <div>
        <label htmlFor="portalType" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Portal Type
        </label>
        <select
          id="portalType"
          value={formData.portalType}
          onChange={(e) => {
            const newPortalType = e.target.value;
            setFormData({ ...formData, portalType: newPortalType, type: newPortalType });
          }}
          className="w-full px-4 py-2.5 border-2 border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        >
          <option value="customer">Customer</option>
          <option value="vendor">Vendor</option>
        </select>
      </div>

      {/* Active Status */}
      <div className="flex items-center gap-3">
        <input
          id="isActive"
          type="checkbox"
          checked={formData.isActive}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="isActive" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Active Organization
        </label>
      </div>

      {errors.submit && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
          {errors.submit}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg font-semibold transition-colors disabled:opacity-50"
        >
          <MdCancel className="w-4 h-4" />
          <span>Cancel</span>
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 shadow-lg hover:shadow-xl"
        >
          <MdSave className="w-4 h-4" />
          <span>{isLoading ? 'Saving...' : organization ? 'Update' : 'Create'}</span>
        </button>
      </div>
    </form>
  );
}

