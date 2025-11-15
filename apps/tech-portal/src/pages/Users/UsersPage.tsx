/**
 * Ultra-Modern Users Page
 * World-Class SaaS ERP Platform Design
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '../../components/shared/DataTable';
import { Modal } from '../../components/shared/Modal';
import { UserForm } from './UserForm';
import { useToast } from '../../components/shared/Toast';
import { MdCheckCircle, MdCancel, MdFilterList, MdPeople, MdSearch, MdEmail } from 'react-icons/md';
import { cn } from '../../lib/utils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  portalType: string;
  role: string;
  roleId?: string | {
    _id: string;
    name: string;
    key: string;
    permissions?: string[];
  };
  roleName?: string;
  isActive: boolean;
  organizationId?: string;
  lastLogin?: string;
  createdAt?: string;
}

export function UsersPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [filterActive, setFilterActive] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch users
  const { data: usersData, isLoading, error: queryError } = useQuery({
    queryKey: ['tech-users', filterActive],
    queryFn: async () => {
      console.log('Fetching users from API...');
      const params = new URLSearchParams();
      if (filterActive !== 'all') {
        params.append('isActive', filterActive === 'active' ? 'true' : 'false');
      }

      const response = await fetch(`${API_URL}/api/v1/tech/users?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Users API Error:', error);
        throw new Error(error.error || 'Failed to fetch users');
      }
      const data = await response.json();
      console.log('Users API Response:', data);
      console.log('Users Count:', data.data?.length || 0);
      return data.data as User[];
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`${API_URL}/api/v1/tech/users/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete user');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tech-users'] });
      toast.success('User deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete user: ${error.message}`);
    },
  });

  const handleInvite = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleDelete = (user: User) => {
    if (window.confirm(`Are you sure you want to delete user ${user.email}?`)) {
      deleteMutation.mutate(user._id);
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['tech-users'] });
    handleClose();
  };

  // Filter users by search term
  const filteredUsers = usersData?.filter((user) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    const roleLabel =
      typeof user.roleId === 'object'
        ? user.roleId.name
        : user.roleName || user.role;

    return (
      user.email.toLowerCase().includes(search) ||
      user.firstName.toLowerCase().includes(search) ||
      user.lastName.toLowerCase().includes(search) ||
      roleLabel.toLowerCase().includes(search)
    );
  });

  const columns = [
    {
      key: 'email',
      header: 'Email',
      render: (user: User) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
            {user.firstName?.[0] || user.email[0].toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-gray-900 dark:text-white">{user.email}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {user.firstName} {user.lastName}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (user: User) => (
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
          {typeof user.roleId === 'object'
            ? user.roleId.name
            : (user.roleName || user.role).replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
        </span>
      ),
    },
    {
      key: 'portalType',
      header: 'Portal Type',
      render: (user: User) => (
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
          {user.portalType.charAt(0).toUpperCase() + user.portalType.slice(1)}
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (user: User) => (
        <span
          className={cn(
            'px-3 py-1 inline-flex items-center gap-1.5 text-xs font-semibold rounded-full',
            user.isActive
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
          )}
        >
          {user.isActive ? (
            <>
              <MdCheckCircle className="w-3.5 h-3.5" /> Active
            </>
          ) : (
            <>
              <MdCancel className="w-3.5 h-3.5" /> Inactive
            </>
          )}
        </span>
      ),
    },
    {
      key: 'lastLogin',
      header: 'Last Login',
      render: (user: User) => (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created At',
      render: (user: User) => (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
        </div>
      ),
    },
  ];

  const stats = [
    { label: 'Total Users', value: usersData?.length || 0, icon: MdPeople },
    { label: 'Active', value: usersData?.filter((u) => u.isActive).length || 0, icon: MdCheckCircle },
    { label: 'Inactive', value: usersData?.filter((u) => !u.isActive).length || 0, icon: MdCancel },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            Users Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage users and permissions across the platform
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleInvite}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-semibold shadow-sm"
          >
            <MdEmail className="w-5 h-5" />
            Invite User
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters and Search */}
      <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
            <div className="relative flex-1 sm:max-w-md">
              <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <MdFilterList className="w-5 h-5 text-gray-400" />
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            >
              <option value="all">All Users</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="p-12 text-center rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <div className="inline-block w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading users...</p>
        </div>
      ) : queryError ? (
        <div className="p-12 text-center rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 shadow-sm">
          <p className="text-red-600 dark:text-red-400 font-semibold mb-2">Error loading users</p>
          <p className="text-sm text-red-500 dark:text-red-400">{queryError.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredUsers || []}
          onEdit={handleEdit}
          onDelete={handleDelete}
          emptyMessage="No users found."
        />
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleClose}
        title={editingUser ? 'Edit User' : 'Invite User'}
        size="large"
      >
        <UserForm user={editingUser} onSuccess={handleSuccess} onCancel={handleClose} />
      </Modal>
    </div>
  );
}
