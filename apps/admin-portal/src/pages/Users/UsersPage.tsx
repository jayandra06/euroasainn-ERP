/**
 * Users Management Page
 * Admin portal page to manage users across all organizations
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '../../components/shared/DataTable';
import { useToast } from '../../components/shared/Toast';
import { MdSearch, MdFilterList, MdDownload, MdCheckCircle, MdVpnKey, MdPeople } from 'react-icons/md';
import { cn } from '../../lib/utils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  roleId?: string | {
    _id: string;
    name: string;
    key: string;
    permissions?: string[];
  };
  roleName?: string;
  organizationId?: string;
  organizationName?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt?: string;
}

export function UsersPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');


  // Fetch users
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users', filterRole, filterStatus, searchQuery],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (filterRole !== 'all') {
          params.append('role', filterRole);
        }
        if (filterStatus !== 'all') {
          params.append('isActive', filterStatus === 'active' ? 'true' : 'false');
        }
        if (searchQuery) {
          params.append('search', searchQuery);
        }

        const response = await fetch(`${API_URL}/api/v1/admin/users?${params}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.error || error.message || 'Failed to fetch users');
        }
        const data = await response.json();
        return data.data as User[];
      } catch (error: any) {
        console.error('Error fetching users:', error);
        return [];
      }
    },
  });

  // Filter users by search query
  const filteredUsers = React.useMemo(() => {
    if (!usersData) return [];
    if (!searchQuery) return usersData;
    const query = searchQuery.toLowerCase();
    return usersData.filter(user => 
      user.email.toLowerCase().includes(query) ||
      user.firstName.toLowerCase().includes(query) ||
      user.lastName.toLowerCase().includes(query) ||
      user.organizationName?.toLowerCase().includes(query)
    );
  }, [usersData, searchQuery]);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`${API_URL}/api/v1/admin/users/${userId}`, {
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
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showToast('User deleted successfully!', 'success');
    },
    onError: (error: Error) => {
      showToast(`Failed to delete: ${error.message}`, 'error');
    },
  });

  const handleDelete = (user: User) => {
    if (window.confirm(`Are you sure you want to delete ${user.email}?`)) {
      deleteMutation.mutate(user._id);
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (user: User) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
            {user.firstName?.[0] || user.email[0].toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-[hsl(var(--foreground))]">
              {(() => {
                const first = user.firstName?.trim() || '';
                const last = user.lastName?.trim() || '';
                if (!last || first.toLowerCase() === last.toLowerCase()) {
                  return first || user.email;
                }
                return `${first} ${last}`;
              })()}
            </div>
            <div className="text-sm text-[hsl(var(--muted-foreground))]">{user.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'organization',
      header: 'Organization',
      render: (user: User) => (
        <span className="text-[hsl(var(--muted-foreground))]">
          {user.organizationName || 'N/A'}
        </span>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (user: User) => (
        <span className="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-blue-100 text-[hsl(var(--foreground))] font-semibold dark:bg-blue-900/50 ring-1 ring-blue-200 dark:ring-blue-800">
          {typeof user.roleId === 'object'
            ? user.roleId.name
            : user.roleName || user.role}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (user: User) => (
        <span
          className={cn(
            'px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full',
            user.isActive
              ? 'bg-emerald-100 text-[hsl(var(--foreground))] font-semibold dark:bg-emerald-900/50 ring-1 ring-emerald-200 dark:ring-emerald-800'
              : 'bg-red-100 text-[hsl(var(--foreground))] font-semibold dark:bg-red-900/50 ring-1 ring-red-200 dark:ring-red-800'
          )}
        >
          {user.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'lastLogin',
      header: 'Last Login',
      render: (user: User) => (
        <span className="text-[hsl(var(--muted-foreground))]">
          {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
        </span>
      ),
    },
  ];

  // Calculate stats
  const stats = React.useMemo(() => {
    if (!usersData) {
      return {
        total: 0,
        active: 0,
        superAdmins: 0,
        supportStaff: 0,
      };
    }
    return {
      total: usersData.length,
      active: usersData.filter(u => u.isActive).length,
      superAdmins: usersData.filter(u => u.role?.toLowerCase().includes('super') || u.role === 'super_admin').length,
      supportStaff: usersData.filter(u => u.role?.toLowerCase().includes('support')).length,
    };
  }, [usersData]);

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-4xl font-bold text-[hsl(var(--foreground))] mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            User Management
          </h1>
          <p className="text-lg text-[hsl(var(--muted-foreground))] font-medium">
            Manage admin users and their permissions
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-1">Total Admin Users</p>
              <p className="text-3xl font-bold text-[hsl(var(--foreground))]">{stats.total}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
              <MdPeople className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-1">Active Users</p>
              <p className="text-3xl font-bold text-[hsl(var(--foreground))] font-semibold">{stats.active}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
              <MdCheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-1">Super Admins</p>
              <p className="text-3xl font-bold text-[hsl(var(--foreground))] font-semibold">{stats.superAdmins}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-md">
              <MdVpnKey className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-1">Support Staff</p>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.supportStaff}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-md">
              <MdPeople className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-6 rounded-2xl bg-[hsl(var(--card))]/80 backdrop-blur-xl border border-[hsl(var(--border))]/50 shadow-lg">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] focus-within:border-[hsl(var(--primary))] focus-within:ring-2 focus-within:ring-[hsl(var(--primary))]/20 transition-all">
            <MdSearch className="w-5 h-5 text-[hsl(var(--muted-foreground))] flex-shrink-0" />
            <input
              type="text"
              placeholder="Search users by name, email, or organization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-[hsl(var(--foreground))] font-semibold">
              <MdFilterList className="w-5 h-5" />
              <span>Filters:</span>
            </div>
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-sm focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-all duration-200 font-medium"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="user">User</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-sm focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-all duration-200 font-medium"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Admin Users Section */}
      <div className="p-6 rounded-2xl bg-[hsl(var(--card))]/80 backdrop-blur-xl border border-[hsl(var(--border))]/50 shadow-lg">
        <h2 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-4">Admin Users</h2>
        
        {/* Search Bar */}
        <div className="mb-4">
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] focus-within:border-[hsl(var(--primary))] focus-within:ring-2 focus-within:ring-[hsl(var(--primary))]/20 transition-all">
            <MdSearch className="w-5 h-5 text-[hsl(var(--muted-foreground))] flex-shrink-0" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]"
            />
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[hsl(var(--border))] border-t-[hsl(var(--primary))]"></div>
            <p className="mt-4 text-[hsl(var(--muted-foreground))] font-medium">Loading users...</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Showing {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
              </p>
              <button
                onClick={() => showToast('Export functionality will be implemented soon', 'info')}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] transition-colors text-sm font-medium text-[hsl(var(--foreground))]"
              >
                <MdDownload className="w-4 h-4" />
                Export
              </button>
            </div>
            <DataTable
              columns={columns}
              data={filteredUsers}
              onDelete={handleDelete}
              actionsLabel="Quick Actions"
              emptyMessage="No users found."
            />
          </>
        )}
      </div>

    </div>
  );
}

