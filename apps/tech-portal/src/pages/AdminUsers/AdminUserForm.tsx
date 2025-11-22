import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface AdminUser {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  portalType: string;
  role: string;
  isActive: boolean;
  organizationId?: string;
}

interface Organization {
  _id: string;
  name: string;
  type: string;
  portalType: string;
}

interface AdminUserFormProps {
  user?: AdminUser | null;
  organizations: Organization[];
  onSuccess: () => void;
  onCancel: () => void;
}

export function AdminUserForm({ user, organizations, onSuccess, onCancel }: AdminUserFormProps) {

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    portalType: 'admin',
    role: 'admin_superuser',
    organizationId: '',
  });

  const [buttonState, setButtonState] = useState<'idle' | 'loading' | 'success'>('idle');

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        password: '',
        firstName: user.firstName,
        lastName: user.lastName,
        portalType: user.portalType,
        role: user.role,
        organizationId: user.organizationId || '',
      });
    }
  }, [user]);

  // Create User
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`${API_URL}/api/v1/tech/admin-users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create admin user');
      }
      return response.json();
    },
    onSuccess: () => {
      setButtonState('success');
      setTimeout(() => {
        onSuccess();
        setButtonState('idle');
      }, 800);
    },
    onError: (error: Error) => {
      alert(error.message);
      setButtonState('idle');
    },
  });

  // Update User
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`${API_URL}/api/v1/tech/admin-users/${user!._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update admin user');
      }
      return response.json();
    },
    onSuccess: () => {
      setButtonState('success');
      setTimeout(() => {
        onSuccess();
        setButtonState('idle');
      }, 800);
    },
    onError: (error: Error) => {
      alert(error.message);
      setButtonState('idle');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setButtonState('loading');

    if (user) {
      updateMutation.mutate(formData);
      return;
    }

    if (!formData.password) {
      alert('Password is required');
      setButtonState('idle');
      return;
    }

    createMutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 p-4 bg-white dark:bg-gray-900 rounded-lg shadow-md">

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Email *
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          disabled={!!user}
          className="w-full border rounded-md px-3 py-2 disabled:bg-gray-200 dark:bg-gray-800"
          placeholder="example@company.com"
        />
      </div>

      {/* Password */}
      {!user && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Password *
          </label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            className="w-full border rounded-md px-3 py-2 dark:bg-gray-800"
            placeholder="Enter password"
          />
        </div>
      )}

      {/* Name Row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            First Name *
          </label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            required
            className="w-full border rounded-md px-3 py-2 dark:bg-gray-800"
            placeholder="John"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Last Name *
          </label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            required
            className="w-full border rounded-md px-3 py-2 dark:bg-gray-800"
            placeholder="Doe"
          />
        </div>
      </div>

      {/* Role & Organization */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Organization
          </label>
          <select
            value={formData.organizationId}
            onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
            className="w-full border rounded-md px-3 py-2 dark:bg-gray-800"
          >
            <option value="">Select</option>
            {organizations.map((org) => (
              <option key={org._id} value={org._id}>
                {org.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Role *
          </label>
          <select
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            required
            className="w-full border rounded-md px-3 py-2 dark:bg-gray-800"
          >
            <option value="admin_superuser">Admin Superuser</option>
            <option value="admin_user">Admin User</option>
          </select>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-md bg-gray-300 hover:bg-gray-400 text-gray-700 dark:bg-gray-700 dark:text-white"
        >
          Cancel
        </button>

        {/* Submit button with animation */}
        <button
          type="submit"
          disabled={buttonState !== 'idle'}
          className={`px-4 py-2 rounded-md text-white flex items-center gap-2 justify-center transition-all ${
            buttonState === 'loading'
              ? 'bg-gray-400 cursor-not-allowed'
              : buttonState === 'success'
              ? 'bg-green-600'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {buttonState === 'loading' && (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          )}

          {buttonState === 'success'
            ? '✔ Done'
            : buttonState === 'loading'
            ? user
              ? 'Updating...'
              : 'Creating...'
            : user
            ? 'Update User'
            : 'Create User'}
        </button>
      </div>
    </form>
  );
}
