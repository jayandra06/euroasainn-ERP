/**
 * Ultra-Modern Admin Users Page
 * World-Class SaaS ERP Platform Design
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '../../components/shared/DataTable';
import { Modal } from '../../components/shared/Modal';
import { AdminUserForm } from './AdminUserForm';
import { useToast } from '../../components/shared/Toast';
import { MdCheckCircle, MdCancel, MdFilterList, MdPeople, MdSearch, MdPersonAddAlt, MdVpnKey, MdAdd } from 'react-icons/md';
import { Button } from '../../components/ui/button';
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
  lastLogin?: string;
  createdAt?: string;
}

export function AdminUsersPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [filterActive, setFilterActive] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch admin users
  const { data: usersData, isLoading, error: queryError } = useQuery({
    queryKey: ['admin-users', filterActive],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterActive !== 'all') {
        params.append('isActive', filterActive === 'active' ? 'true' : 'false');
      }

      const response = await fetch(`${API_URL}/api/v1/tech/admin-users?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || error.message || 'Failed to fetch admin users');
      }
      const data = await response.json();
      return data.data as AdminUser[];
    },
  });

  // Fetch organizations for dropdown
  const { data: orgsData } = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/v1/tech/organizations`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      if (!response.ok) return [];
      const data = await response.json();
      return data.data || [];
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
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      showToast('Admin user deleted successfully!', 'success');
    },
    onError: (error: Error) => {
      showToast(`Failed to delete admin user: ${error.message}`, 'error');
    },
  });

  const handleCreate = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleEdit = (user: AdminUser) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleDelete = (user: AdminUser) => {
    if (window.confirm(`Are you sure you want to delete admin user ${user.email}?`)) {
      deleteMutation.mutate(user._id);
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    handleClose();
  };

  // Filter users by search term
  const filteredUsers = usersData?.filter((user) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      user.email.toLowerCase().includes(search) ||
      user.firstName.toLowerCase().includes(search) ||
      user.lastName.toLowerCase().includes(search) ||
      user.role.toLowerCase().includes(search)
    );
  });

  const columns = [
    {
      key: 'email',
      header: 'Email',
      render: (user: AdminUser) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold text-sm shadow-sm">
            {user.firstName?.[0] || user.email[0].toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-[hsl(var(--foreground))]">{user.email}</div>
            <div className="text-xs text-[hsl(var(--muted-foreground))]">
              {user.firstName} {user.lastName}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'name',
      header: 'Name',
      render: (user: AdminUser) => (
        <div className="text-sm text-[hsl(var(--foreground))] font-medium">
          {user.firstName} {user.lastName}
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (user: AdminUser) => (
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-[hsl(var(--foreground))] font-semibold dark:bg-indigo-900/30">
          {user.role.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (user: AdminUser) => (
        <span
          className={cn(
            'px-3 py-1 inline-flex items-center gap-1.5 text-xs font-semibold rounded-full',
            user.isActive
              ? 'bg-emerald-100 text-[hsl(var(--foreground))] font-semibold dark:bg-emerald-900/30'
              : 'bg-red-100 text-[hsl(var(--foreground))] font-semibold dark:bg-red-900/30'
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
      render: (user: AdminUser) => (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
        </div>
      ),
    },
  ];

  const stats = [
    { label: 'Total Admin Users', value: usersData?.length || 0, icon: MdPeople },
    { label: 'Active', value: usersData?.filter((u) => u.isActive).length || 0, icon: MdCheckCircle },
    { label: 'Inactive', value: usersData?.filter((u) => !u.isActive).length || 0, icon: MdCancel },
    { label: 'Super Admins', value: usersData?.filter((u) => u.role?.includes('super')).length || 0, icon: MdVpnKey },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-1">
            Admin Users Management
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage admin portal users and their permissions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={handleCreate} className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40">
            <MdAdd className="w-5 h-5" /> Add Admin User
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-[hsl(var(--foreground))]">{stat.value}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-[hsl(var(--foreground))] font-semibold" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters and Search */}
      <div className="p-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1 w-full sm:w-auto">
            <div className="relative flex-1 sm:max-w-md">
              <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search admin users by name, email, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-all"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <MdFilterList className="w-5 h-5 text-gray-400" />
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-all"
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
        <div className="p-12 text-center rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="inline-block w-8 h-8 border-4 border-gray-300 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading admin users...</p>
        </div>
      ) : queryError ? (
        <div className="p-12 text-center rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 shadow-sm">
          <p className="text-red-600 dark:text-red-400 font-semibold mb-2">Error loading admin users</p>
          <p className="text-sm text-red-500 dark:text-red-400">{queryError.message}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))] rounded-lg hover:bg-red-700 transition-colors"
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
          emptyMessage="No admin users found. Create your first admin user to get started!"
        />
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleClose}
        title={editingUser ? 'Edit Admin User' : 'Create Admin User'}
        size="medium"
      >
        <AdminUserForm
          user={editingUser}
          organizations={orgsData || []}
          onSuccess={handleSuccess}
          onCancel={handleClose}
        />
      </Modal>
    </div>
  );
}

