/**
 * Ultra-Modern Admin User Form Component
 * World-Class SaaS ERP Platform Design
 */

import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '../../components/shared/Toast';
import { MdEmail, MdPerson, MdLock, MdBusiness, MdSecurity, MdSave, MdCancel } from 'react-icons/md';
import { cn } from '../../lib/utils';

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
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    portalType: 'admin',
    role: 'admin_superuser',
    organizationId: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || '',
        password: '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        portalType: user.portalType || 'admin',
        role: user.role || 'admin_superuser',
        organizationId: user.organizationId || '',
      });
    }
  }, [user]);

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
        throw new Error(error.error || error.message || 'Failed to create admin user');
      }
      return response.json();
    },
    onSuccess: () => {
      showToast('Admin user created successfully!', 'success');
      onSuccess();
    },
    onError: (error: Error) => {
      showToast(`Failed to create admin user: ${error.message}`, 'error');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`${API_URL}/api/v1/tech/admin-users/${user?._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || error.message || 'Failed to update admin user');
      }
      return response.json();
    },
    onSuccess: () => {
      showToast('Admin user updated successfully!', 'success');
      onSuccess();
    },
    onError: (error: Error) => {
      showToast(`Failed to update admin user: ${error.message}`, 'error');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validation
    if (!formData.email.trim()) {
      setErrors({ email: 'Email is required' });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setErrors({ email: 'Please enter a valid email address' });
      return;
    }

    if (!formData.firstName.trim()) {
      setErrors({ firstName: 'First name is required' });
      return;
    }

    if (!formData.lastName.trim()) {
      setErrors({ lastName: 'Last name is required' });
      return;
    }

    if (!user && !formData.password) {
      setErrors({ password: 'Password is required for new users' });
      showToast('Password is required for new users', 'error');
      return;
    }

    const payload = {
      email: formData.email.trim().toLowerCase(),
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      portalType: formData.portalType,
      role: formData.role,
      organizationId: formData.organizationId || undefined,
      ...(user ? {} : { password: formData.password }),
    };

    if (user) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const roles = [
    { value: 'admin_superuser', label: 'Admin Superuser' },
    { value: 'admin_user', label: 'Admin User' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Email */}
      <div>
        <label htmlFor="email" className="flex items-center gap-2 text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
          <MdEmail className="w-4 h-4 text-gray-400" />
          Email Address <span className="text-red-500">*</span>
        </label>
        <input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => {
            setFormData({ ...formData, email: e.target.value });
            setErrors({ ...errors, email: '' });
          }}
          disabled={!!user}
          className={cn(
            'w-full px-4 py-3 rounded-xl border bg-[hsl(var(--card))] text-[hsl(var(--foreground))] focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-all',
            errors.email ? 'border-red-300 dark:border-red-700' : 'border-[hsl(var(--border))]',
            user && 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed'
          )}
          placeholder="user@example.com"
        />
        {user && (
          <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
            Email cannot be changed after user creation
          </p>
        )}
        {errors.email && (
          <p className="mt-1 text-xs text-[hsl(var(--foreground))] font-semibold">{errors.email}</p>
        )}
      </div>

      {!user && (
        <div>
          <label htmlFor="password" className="flex items-center gap-2 text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
            <MdLock className="w-4 h-4 text-gray-400" />
            Password <span className="text-red-500">*</span>
          </label>
          <input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => {
              setFormData({ ...formData, password: e.target.value });
              setErrors({ ...errors, password: '' });
            }}
            className={cn(
              'w-full px-4 py-3 rounded-xl border bg-[hsl(var(--card))] text-[hsl(var(--foreground))] focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-all',
              errors.password ? 'border-red-300 dark:border-red-700' : 'border-[hsl(var(--border))]'
            )}
            placeholder="Enter password"
          />
          {errors.password && (
            <p className="mt-1 text-xs text-[hsl(var(--foreground))] font-semibold">{errors.password}</p>
          )}
        </div>
      )}

      {/* Name Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="firstName" className="flex items-center gap-2 text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
            <MdPerson className="w-4 h-4 text-gray-400" />
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            id="firstName"
            type="text"
            value={formData.firstName}
            onChange={(e) => {
              setFormData({ ...formData, firstName: e.target.value });
              setErrors({ ...errors, firstName: '' });
            }}
            className={cn(
              'w-full px-4 py-3 rounded-xl border bg-[hsl(var(--card))] text-[hsl(var(--foreground))] focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-all',
              errors.firstName ? 'border-red-300 dark:border-red-700' : 'border-[hsl(var(--border))]'
            )}
            placeholder="John"
          />
          {errors.firstName && (
            <p className="mt-1 text-xs text-[hsl(var(--foreground))] font-semibold">{errors.firstName}</p>
          )}
        </div>

        <div>
          <label htmlFor="lastName" className="flex items-center gap-2 text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
            <MdPerson className="w-4 h-4 text-gray-400" />
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            id="lastName"
            type="text"
            value={formData.lastName}
            onChange={(e) => {
              setFormData({ ...formData, lastName: e.target.value });
              setErrors({ ...errors, lastName: '' });
            }}
            className={cn(
              'w-full px-4 py-3 rounded-xl border bg-[hsl(var(--card))] text-[hsl(var(--foreground))] focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-all',
              errors.lastName ? 'border-red-300 dark:border-red-700' : 'border-[hsl(var(--border))]'
            )}
            placeholder="Doe"
          />
          {errors.lastName && (
            <p className="mt-1 text-xs text-[hsl(var(--foreground))] font-semibold">{errors.lastName}</p>
          )}
        </div>
      </div>

      {/* Organization and Role */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="organizationId" className="flex items-center gap-2 text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
            <MdBusiness className="w-4 h-4 text-gray-400" />
            Organization
          </label>
          <select
            id="organizationId"
            value={formData.organizationId}
            onChange={(e) => setFormData({ ...formData, organizationId: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-all"
          >
            <option value="">Select Organization (Optional)</option>
            {organizations.map((org) => (
              <option key={org._id} value={org._id}>
                {org.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="role" className="flex items-center gap-2 text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
            <MdSecurity className="w-4 h-4 text-gray-400" />
            Role <span className="text-red-500">*</span>
          </label>
          <select
            id="role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            className="w-full px-4 py-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-all"
          >
            {roles.map((role) => (
              <option key={role.value} value={role.value}>
                {role.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[hsl(var(--border))]">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 text-[hsl(var(--foreground))] bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl font-semibold transition-colors disabled:opacity-50"
        >
          <MdCancel className="w-4 h-4" />
          <span>Cancel</span>
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 shadow-lg hover:shadow-xl"
        >
          <MdSave className="w-4 h-4" />
          <span>{isLoading ? 'Saving...' : user ? 'Update Admin User' : 'Create Admin User'}</span>
        </button>
      </div>
    </form>
  );
}

