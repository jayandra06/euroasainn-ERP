import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '../../components/shared/DataTable';
import { Modal } from '../../components/shared/Modal';
import { AdminUserForm } from './AdminUserForm';
import { MdSearch, MdFilterList } from 'react-icons/md';

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [filterActive, setFilterActive] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch admin users
  const { data: usersData, isLoading } = useQuery({
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

      if (!response.ok) throw new Error('Failed to fetch admin users');
      const data = await response.json();
      return data.data as AdminUser[];
    },
  });

  // Filter + Search Logic
  const filteredUsers = usersData?.filter((user) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      user.email.toLowerCase().includes(search) ||
      user.firstName.toLowerCase().includes(search) ||
      user.lastName.toLowerCase().includes(search)
    );
  });

  // Delete admin user
  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`${API_URL}/api/v1/tech/admin-users/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete admin user');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      alert('Admin user deleted successfully!');
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
    if (window.confirm(`Delete admin user ${user.email}?`)) {
      deleteMutation.mutate(user._id);
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  // Table columns
  const columns = [
    {
      key: 'email',
      header: 'Email',
      render: (u: AdminUser) => <strong>{u.email}</strong>,
    },
    { key: 'name', header: 'Name', render: (u: AdminUser) => `${u.firstName} ${u.lastName}` },
    { key: 'role', header: 'Role', render: (u: AdminUser) => u.role },
    {
      key: 'isActive',
      header: 'Status',
      render: (u: AdminUser) => (
        <span className={`status-badge ${u.isActive ? 'active' : 'inactive'}`}>
          {u.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'lastLogin',
      header: 'Last Login',
      render: (u: AdminUser) =>
        u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never',
    },
  ];

  // 🔥 LOADING UI LIKE FIRST IMAGE
  if (isLoading) {
    return (
      <div className="w-full space-y-6">

        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">Admin Users</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manage admin portal users
            </p>
          </div>

          <button
            disabled
            className="px-4 py-2 rounded-lg bg-gray-300 text-gray-500 cursor-not-allowed"
          >
            + Create Admin User
          </button>
        </div>

        {/* Loading Block */}
        <div className="p-12 flex flex-col items-center justify-center gap-4 
        rounded-xl border border-gray-200 dark:border-gray-700 
        bg-white dark:bg-gray-900 shadow-sm">

          <div className="w-10 h-10 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin" />

          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Loading admin users...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">

      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">Admin Users</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage admin portal users
          </p>
        </div>

        <button
          onClick={handleCreate}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
        >
          + Create Admin User
        </button>
      </div>

      {/* Search + Filter */}
      <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

          {/* Search */}
          <div className="relative flex-1 w-full sm:max-w-md">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 
              bg-white dark:bg-gray-800 text-gray-900 dark:text-white 
              focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Filter Dropdown */}
          <div className="flex items-center gap-2">
            <MdFilterList className="text-gray-400" />
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              className="px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 
              bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 
              focus:ring-blue-500 transition-all"
            >
              <option value="all">All Users</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>

        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredUsers || []}
        onEdit={handleEdit}
        onDelete={handleDelete}
        emptyMessage="No admin users found."
      />

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleClose}
        title={editingUser ? 'Edit Admin User' : 'Create Admin User'}
        size="medium"
      >
        <AdminUserForm
          user={editingUser}
          organizations={[]}
          onSuccess={() => {
            handleClose();
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
          }}
          onCancel={handleClose}
        />
      </Modal>
    </div>
  );
}
