import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { MdPeople, MdPersonAddAlt, MdMail, MdPerson, MdShield } from 'react-icons/md';
import { useToast } from '../components/shared/Toast';

const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';

interface RoleDto {
  _id?: string;
  name: string;
  key: string;
  portalType: string;
  permissions: string[];
  description?: string;
}

interface RoleOption {
  id: string;
  mongoId?: string;
  key: string;
  name: string;
  permissions: string[];
  description?: string;
}

const DEFAULT_VENDOR_ROLES: RoleOption[] = [
  {
    id: 'vendor_admin',
    key: 'vendor_admin',
    name: 'Vendor Admin',
    permissions: ['*'],
    description: 'Invite team members, manage everything.',
  },
  {
    id: 'vendor_manager',
    key: 'vendor_manager',
    name: 'Vendor Manager',
    permissions: ['orders:update', 'products:create'],
    description: 'Handle catalogues and orders.',
  },
  {
    id: 'vendor_accountant',
    key: 'vendor_accountant',
    name: 'Vendor Accountant',
    permissions: ['invoices:read', 'transactions:update'],
    description: 'Manage invoices and payments.',
  },
  {
    id: 'vendor_staff',
    key: 'vendor_staff',
    name: 'Vendor Staff',
    permissions: ['orders:read', 'products:read'],
    description: 'Process assigned orders.',
  },
  {
    id: 'vendor_viewer',
    key: 'vendor_viewer',
    name: 'Vendor Viewer',
    permissions: ['dashboard:read', 'orders:read'],
    description: 'Read-only dashboard access.',
  },
];

export function UsersPage() {
  const toast = useToast();
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    roleId: '',
    roleKey: '',
  });

  const {
    data: rolesResponse,
    isLoading: isRolesLoading,
  } = useQuery({
    queryKey: ['roles', 'vendor'],
    queryFn: async (): Promise<RoleDto[]> => {
      try {
        const response = await fetch(`${API_URL}/api/v1/roles?portalType=vendor`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        });
        if (!response.ok) {
          return [];
        }
        const data = await response.json();
        return (data.data as RoleDto[]) || [];
      } catch (error) {
        console.error('Failed to fetch vendor roles', error);
        return [];
      }
    },
  });

  const roleOptions: RoleOption[] = useMemo(() => {
    const apiRoles =
      rolesResponse && rolesResponse.length > 0
        ? rolesResponse.map((role) => ({
            id: role._id || role.key,
            mongoId: role._id,
            key: role.key,
            name: role.name,
            permissions: role.permissions || [],
            description: role.description,
          }))
        : [];

    if (apiRoles.length === 0) {
      return DEFAULT_VENDOR_ROLES;
    }

    return apiRoles;
  }, [rolesResponse]);

  useEffect(() => {
    if (roleOptions.length === 0) {
      return;
    }
    if (!formData.roleId && !formData.roleKey) {
      const defaultRole = roleOptions[0];
      setFormData((prev) => ({
        ...prev,
        roleId: defaultRole.mongoId || '',
        roleKey: defaultRole.key,
      }));
    }
  }, [roleOptions, formData.roleId, formData.roleKey]);

  const inviteMutation = useMutation({
    mutationFn: async (payload: {
      email: string;
      firstName: string;
      lastName: string;
      roleId?: string;
      role?: string;
    }) => {
      const response = await fetch(`${API_URL}/api/v1/vendor/users/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          ...payload,
          portalType: 'vendor',
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || error.message || 'Failed to invite team member');
      }

      return response.json();
    },
    onSuccess: (data) => {
      toast.success('Invitation sent successfully!');
      setFormData({
        email: '',
        fullName: '',
        roleId: '',
        roleKey: '',
      });
      if (data?.data?.temporaryPassword) {
        toast.info(`Temporary password: ${data.data.temporaryPassword}`);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const selectedRoleValue = formData.roleId || formData.roleKey;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!formData.fullName.trim()) {
      toast.warning('Please provide a full name');
      return;
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      toast.warning('A valid email address is required');
      return;
    }

    if (!selectedRoleValue) {
      toast.warning('Select a role for this team member');
      return;
    }

    const [firstNameRaw, ...rest] = formData.fullName.trim().split(/\s+/);
    const firstName = firstNameRaw;
    const lastName = rest.length ? rest.join(' ') : firstNameRaw;

    inviteMutation.mutate({
      email: formData.email.trim().toLowerCase(),
      firstName,
      lastName,
      roleId: formData.roleId || undefined,
      role: formData.roleId ? undefined : formData.roleKey,
    });
  };

  const handleRoleChange = (value: string) => {
    if (value === '') {
      setFormData((prev) => ({ ...prev, roleId: '', roleKey: '' }));
      return;
    }

    const role = roleOptions.find((option) => option.id === value);
    if (role) {
      setFormData((prev) => ({
        ...prev,
        roleId: role.mongoId || '',
        roleKey: role.key,
      }));
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg">
              <MdPeople className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Team Members</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Invite your team to collaborate, manage orders, and keep operations running smoothly.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Invite a team member</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Send an invitation email with a temporary password so they can join immediately.
          </p>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="fullName" className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <MdPerson className="w-4 h-4 text-gray-400" />
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Alex Vendor"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="email" className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <MdMail className="w-4 h-4 text-gray-400" />
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="team@yourvendor.com"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label htmlFor="role" className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <MdShield className="w-4 h-4 text-gray-400" />
                Role
              </label>
              <select
                id="role"
                disabled={isRolesLoading || roleOptions.length === 0}
                value={selectedRoleValue}
                onChange={(e) => handleRoleChange(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-70"
              >
                {roleOptions.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={inviteMutation.isPending}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <MdPersonAddAlt className="w-5 h-5" />
                {inviteMutation.isPending ? 'Sending invite...' : 'Send invite'}
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-4">
          <div className="p-6 rounded-2xl border border-blue-200/60 dark:border-blue-800/60 bg-blue-50/80 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 shadow-sm">
            <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
              <MdPeople className="w-5 h-5" />
              Why invite your team?
            </h3>
            <ul className="space-y-2 text-sm">
              <li>• Share order management and approvals with colleagues.</li>
              <li>• Assign catalog management to the right person.</li>
              <li>• Keep finance, operations, and support in sync.</li>
            </ul>
          </div>

          <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Available roles</h3>
            <div className="space-y-3">
              {roleOptions.map((role) => (
                <div key={role.id} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 px-3 py-3">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">{role.name}</p>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{role.permissions.length} permissions</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {role.description || `Permissions: ${role.permissions.join(', ')}`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UsersPage;

