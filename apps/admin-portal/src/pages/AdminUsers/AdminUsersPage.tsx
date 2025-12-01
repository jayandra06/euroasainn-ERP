import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '../../components/shared/DataTable';
import { Modal } from '../../components/shared/Modal';
import { useToast } from '../../components/shared/Toast';
import { MdSearch, MdFilterList, MdDownload, MdCheckCircle, MdVpnKey, MdPeople, MdAdd, MdEdit, MdDelete } from 'react-icons/md';
import { cn } from '../../lib/utils';

// Use relative URL in development (with Vite proxy) or env var, otherwise default to localhost:3000
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'http://localhost:3000');

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
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Fetch admin users
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin-users', filterActive, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterActive !== 'all') {
        params.append('isActive', filterActive === 'active' ? 'true' : 'false');
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      const url = API_URL ? `${API_URL}/api/v1/admin/admin-users?${params}` : `/api/v1/admin/admin-users?${params}`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to fetch admin users' }));
        throw new Error(error.error || 'Failed to fetch admin users');
      }
      const data = await response.json();
      return data.data as AdminUser[];
    },
  });

  // Fetch organizations for dropdown
  const { data: orgsData } = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const url = API_URL ? `${API_URL}/api/v1/admin/organizations` : `/api/v1/admin/organizations`;
      const response = await fetch(url, {
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
      const url = API_URL ? `${API_URL}/api/v1/admin/users/${userId}` : `/api/v1/admin/users/${userId}`;
      const response = await fetch(url, {
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
      showToast('Admin user deleted successfully', 'success');
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

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSave = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    handleCloseModal();
  };

  const users = usersData || [];

  const columns = [
    {
      key: 'email',
      header: 'Email',
      render: (user: AdminUser) => (
        <span className="font-medium text-gray-900 dark:text-white">{user.email}</span>
      ),
    },
    {
      key: 'name',
      header: 'Name',
      render: (user: AdminUser) => (
        <span className="text-gray-600 dark:text-gray-400">
          {user.firstName} {user.lastName}
        </span>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (user: AdminUser) => (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300">
          {user.role}
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (user: AdminUser) => (
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2 py-1 text-xs font-semibold rounded-full',
            user.isActive
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
              : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
          )}
        >
          {user.isActive ? (
            <>
              <MdCheckCircle className="w-3 h-3" />
              Active
            </>
          ) : (
            <>
              <MdVpnKey className="w-3 h-3" />
              Inactive
            </>
          )}
        </span>
      ),
    },
    {
      key: 'lastLogin',
      header: 'Last Login',
      render: (user: AdminUser) => (
        <span className="text-gray-600 dark:text-gray-400">
          {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (user: AdminUser) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEdit(user)}
            className="p-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors"
            title="Edit user"
          >
            <MdEdit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(user)}
            className="p-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
            title="Delete user"
          >
            <MdDelete className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full min-h-screen p-8 space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Admin Users
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">
          Manage admin portal users
        </p>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between p-6 rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 shadow-lg">
        <div className="flex flex-wrap gap-4 items-center flex-1">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all"
            />
          </div>

          {/* Filter */}
          <div className="flex items-center gap-2">
            <MdFilterList className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              className="px-4 py-2 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:shadow-lg hover:shadow-blue-500/30 transition-all transform hover:scale-105"
          >
            <MdAdd className="w-5 h-5" />
            Create Admin User
          </button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="p-12 text-center rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 shadow-lg">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Loading admin users...</p>
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 shadow-lg">
          <DataTable
            columns={columns}
            data={users}
            emptyMessage="No admin users found."
          />
        </div>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={editingUser ? 'Edit Admin User' : 'Create Admin User'}
        >
          <div className="p-6">
            <p className="text-gray-600 dark:text-gray-400">
              User form will be implemented here. For now, use the Users page to manage admin users.
            </p>
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}








