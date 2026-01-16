/**
 * Ultra-Modern Users Page
 * Row Click → Opens Dedicated User Profile Page
 * Smart Sliding Pagination + Rows per page + Page info
 */
import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { DataTable } from '../../components/shared/DataTable';
import { Modal } from '../../components/shared/Modal';
import { UserForm } from './UserForm';
import { useToast } from '../../components/shared/Toast';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  MdCheckCircle,
  MdCancel,
  MdFilterList,
  MdPeople,
  MdSearch,
  MdEmail,
  MdUpload,
  MdChevronLeft,
  MdChevronRight,
  MdInfo,
  MdDownload,
  MdClose,
} from 'react-icons/md';
import { cn } from '../../lib/utils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  portalType: string;
  role: string;
  roleId?: string | { _id: string; name: string; key: string; permissions?: string[] };
  roleName?: string;
  isActive: boolean;
  organizationId?: string;
  lastLogin?: string;
  createdAt?: string;
}

export function UsersPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { permissions } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const canCreate = permissions.includes('techUsersCreate');
  const canUpdate = permissions.includes('techUsersUpdate');
  const canDelete = permissions.includes('techUsersDelete');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSampleDataModalOpen, setIsSampleDataModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Initialize state from URL params
  const [filterActive, setFilterActive] = useState<string>(searchParams.get('filter') || 'all');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));
  const [rowsPerPage, setRowsPerPage] = useState(parseInt(searchParams.get('limit') || '10', 10));

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Update URL params when state changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (filterActive !== 'all') params.set('filter', filterActive);
    if (searchTerm) params.set('search', searchTerm);
    if (page > 1) params.set('page', page.toString());
    if (rowsPerPage !== 10) params.set('limit', rowsPerPage.toString());
    
    setSearchParams(params, { replace: true });
  }, [filterActive, searchTerm, page, rowsPerPage, setSearchParams]);

  const { data: usersResponse, isLoading, error: queryError } = useQuery<{
    users: User[];
    total: number;
    filteredTotal?: number;
    activeCount?: number;
    inactiveCount?: number;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      filteredTotal?: number;
      totalPages: number;
      activeCount?: number;
      inactiveCount?: number;
    };
  }>({
    queryKey: ['tech-users', filterActive, page, rowsPerPage, searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterActive !== 'all') {
        params.append('isActive', filterActive === 'active' ? 'true' : 'false');
      }
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      params.append('page', page.toString());
      params.append('limit', rowsPerPage.toString());
      const response = await fetch(`${API_URL}/api/v1/tech/users?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch users');
      }
      const data = await response.json();
      // Handle both paginated and non-paginated responses
      if (data.pagination) {
        return {
          users: data.data as User[],
          total: data.pagination.total, // Total all users (for stats)
          filteredTotal: data.pagination.filteredTotal !== undefined ? data.pagination.filteredTotal : data.pagination.total, // Filtered count (for pagination)
          activeCount: data.pagination.activeCount || 0,
          inactiveCount: data.pagination.inactiveCount || 0,
          pagination: data.pagination,
        };
      }
      // Backward compatibility: if no pagination, treat as array
      const users = Array.isArray(data.data) ? data.data : [];
      const activeCount = users.filter((u: User) => u.isActive).length;
      const inactiveCount = users.filter((u: User) => !u.isActive).length;
      return {
        users: users as User[],
        total: users.length,
        filteredTotal: users.length,
        activeCount,
        inactiveCount,
      };
    },
  });

  const usersData = usersResponse?.users || [];
  const totalUsers = usersResponse?.total || 0; // Total all users (for stats cards)
  const filteredTotal = usersResponse?.filteredTotal ?? usersResponse?.total ?? 0; // Filtered count (for pagination)
  const totalActiveUsers = usersResponse?.activeCount ?? 0;
  const totalInactiveUsers = usersResponse?.inactiveCount ?? 0;

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

  const bulkUploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch(`${API_URL}/api/v1/tech/users/bulk-upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: formData,
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || responseData.message || 'Bulk upload failed');
      }
      
      // Log the response for debugging
      console.log('Bulk upload response:', responseData);
      
      return responseData;
    },
    onSuccess: (data) => {
      console.log('Bulk upload success data:', data);
      
      // Handle both response structures for backward compatibility
      const responseData = data.data || data;
      const created = responseData?.created || 0;
      const updated = responseData?.updated || 0;
      const skipped = responseData?.skipped || 0;
      const errors = responseData?.details?.errors || [];
      
      let message = `Bulk upload completed!`;
      const parts: string[] = [];
      if (created > 0) parts.push(`Created: ${created}`);
      if (updated > 0) parts.push(`Updated: ${updated}`);
      if (skipped > 0) parts.push(`Skipped: ${skipped}`);
      
      if (parts.length > 0) {
        message += ` ${parts.join(', ')}`;
      }
      
      if (errors && errors.length > 0) {
        message += `. ${errors.length} error(s) occurred.`;
        console.error('Bulk upload errors:', errors);
      }
      
      toast.success(message);
      queryClient.invalidateQueries({ queryKey: ['tech-users'] });
      
      if (errors && errors.length > 0) {
        setTimeout(() => {
          alert(`Upload completed with ${errors.length} error(s):\n\n${errors.slice(0, 10).join('\n')}${errors.length > 10 ? `\n... and ${errors.length - 10} more` : ''}`);
        }, 500);
      }
    },
    onError: (error: Error) => {
      console.error('Bulk upload error:', error);
      toast.error(`Bulk upload failed: ${error.message}`);
    },
  });

  const handleBulkUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload CSV or Excel.');
      return;
    }

    bulkUploadMutation.mutate(file);
    if (e.target) e.target.value = '';
  };

  const handleDownloadSample = () => {
    const sampleData = [
      {
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        roleName: 'Tech Lead',
        portalType: 'tech',
        isActive: 'true',
        employeeId: 'EA-TECH-001',
        phone: '+91 98765 43210',
        department: 'Technology',
        designation: 'Senior DevOps Engineer',
        location: 'Delhi HQ',
        reportingTo: 'manager@example.com',
      },
      {
        email: 'jane.smith@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        roleName: 'Developer',
        portalType: 'tech',
        isActive: 'true',
        employeeId: 'EA-TECH-002',
        phone: '+91 98765 43211',
        department: 'Technology',
        designation: 'Frontend Developer',
        location: 'Delhi HQ',
        reportingTo: 'john.doe@example.com',
      },
    ];

    const headers = ['email', 'firstName', 'lastName', 'roleName', 'portalType', 'isActive', 'employeeId', 'phone', 'department', 'designation', 'location', 'reportingTo'];
    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => headers.map(header => {
        const value = row[header as keyof typeof row] || '';
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'bulk_upload_sample.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Sample CSV downloaded!');
  };

  const handleInvite = () => {
    if (!canCreate) return;
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleEdit = (user: User) => {
    if (!canUpdate) return;
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleDelete = (user: User) => {
    if (!canDelete) return;
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
    setPage(1);
  };

  const handleRowClick = (user: User) => {
    navigate(`/users/${user._id}`);
  };

  const getSafeRoleLabel = (user: User): string => {
    if (typeof user.roleId === 'object' && user.roleId?.name) return user.roleId.name;
    if (user.roleName) return user.roleName;
    if (user.role) return user.role.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    return 'No Role';
  };

  // Use filteredTotal for pagination (when filter/search is applied)
  // Use totalUsers for stats cards (always show total counts)
  const totalPages = Math.ceil(filteredTotal / rowsPerPage);
  const startIndex = filteredTotal === 0 ? 0 : (page - 1) * rowsPerPage + 1;
  const endIndex = Math.min(page * rowsPerPage, filteredTotal);
  
  // Display users from server (search and filter are server-side)
  const paginatedUsers = usersData;

  // Smart sliding pagination: shows 5 pages, shifts smoothly
  const getVisiblePages = () => {
    const visibleCount = 5;
    let start = Math.max(1, page - Math.floor(visibleCount / 2));
    let end = start + visibleCount - 1;

    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - visibleCount + 1);
    }

    const pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const visiblePages = getVisiblePages();

  useEffect(() => {
    // Only adjust page if we have valid totalPages and page is out of bounds
    // Don't reset to page 1 when data is loading (totalPages === 0)
    if (totalPages > 0 && page > totalPages) {
      setPage(totalPages);
    }
    // Removed: else if (totalPages === 0) setPage(1);
    // This was causing page to reset to 1 during data loading
  }, [totalPages, page]);

  const columns = [
    {
      key: 'email',
      header: 'Email',
      render: (user: User) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
            {user.firstName?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
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
      key: 'role',
      header: 'Role',
      render: (user: User) => (
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40">
          {getSafeRoleLabel(user)}
        </span>
      ),
    },
    {
      key: 'portalType',
      header: 'Portal Type',
      render: (user: User) => (
        <span className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/40">
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
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40'
              : 'bg-red-100 text-red-800 dark:bg-red-900/40'
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
        <div className="text-sm text-[hsl(var(--muted-foreground))]">
          {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created At',
      render: (user: User) => (
        <div className="text-sm text-[hsl(var(--muted-foreground))]">
          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
        </div>
      ),
    },
  ];

  // Stats use server-side total counts
  const stats = [
    { label: 'Total Users', value: totalUsers, icon: MdPeople },
    { label: 'Active', value: totalActiveUsers, icon: MdCheckCircle },
    { label: 'Inactive', value: totalInactiveUsers, icon: MdCancel },
  ];

  return (
    <div className="w-full space-y-6">
      <input
        type="file"
        accept=".csv,.xlsx,.xls"
        ref={fileInputRef}
        onChange={handleBulkUploadFile}
        className="hidden"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-1">
            Users Management
          </h1>
          <p className="text-[hsl(var(--muted-foreground))]">
            Manage users and permissions across the platform
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsSampleDataModalOpen(true)}
            disabled={!canCreate}
            className={cn(
              'flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold shadow-sm transition-all',
              canCreate
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            )}
          >
            <MdInfo className="w-5 h-5" />
            Sample Data
          </button>
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={!canCreate || bulkUploadMutation.isPending}
            className={cn(
              'flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold shadow-sm transition-all border-2',
              canCreate && !bulkUploadMutation.isPending
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 border-emerald-600 dark:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-400 border-gray-300 dark:border-gray-700 cursor-not-allowed'
            )}
          >
            {bulkUploadMutation.isPending ? (
              <div className="w-5 h-5 border-2 border-emerald-600 dark:border-emerald-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <MdUpload className="w-5 h-5" />
            )}
            Bulk Upload
          </button>

          <button
            type="button"
            onClick={handleInvite}
            disabled={!canCreate}
            className={cn(
              'flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold shadow-sm transition-all',
              canCreate
                ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            )}
          >
            <MdEmail className="w-5 h-5" />
            Invite User
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[hsl(var(--muted-foreground))] mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-[hsl(var(--foreground))]">{stat.value}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-[hsl(var(--primary))]" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search & Filter */}
      <div className="p-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="relative flex-1 w-full">
            <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[hsl(var(--muted-foreground))]" />
            <input
              type="text"
              placeholder="Search by email, name, or role..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <MdFilterList className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
            <select
              value={filterActive}
              onChange={(e) => {
                setFilterActive(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] focus:ring-2 focus:ring-[hsl(var(--primary))] transition-all"
            >
              <option value="all">All Users</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table + Pagination */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-12 text-center rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
            <div className="inline-block w-8 h-8 border-4 border-[hsl(var(--border))] border-t-[hsl(var(--primary))] rounded-full animate-spin"></div>
            <p className="mt-4 text-[hsl(var(--muted-foreground))]">Loading users...</p>
          </div>
        ) : queryError ? (
          <div className="p-12 text-center rounded-xl border border-red-200 bg-red-50 shadow-sm">
            <p className="text-red-600 font-semibold mb-2">Error loading users</p>
            <p className="text-sm text-red-500">{(queryError as Error).message}</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between text-sm text-[hsl(var(--muted-foreground))]">
              <div>
                {filteredTotal > 0
                  ? `Showing ${startIndex}–${endIndex} of ${filteredTotal} users`
                  : 'No users found.'}
              </div>
            </div>

            <DataTable
              columns={columns}
              data={paginatedUsers}
              onRowClick={handleRowClick}
              onEdit={handleEdit}
              onDelete={handleDelete}
              canEdit={canUpdate}
              canDelete={canDelete}
              emptyMessage="No users found matching your search."
            />

            {/* Full Pagination with Rows per page + Page info */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-6">
                {/* Rows per page */}
                <div className="flex items-center gap-3 text-sm text-[hsl(var(--muted-foreground))]">
                  <span>Rows per page:</span>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => {
                      setRowsPerPage(Number(e.target.value));
                      setPage(1);
                    }}
                    className="px-4 py-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>

                {/* Sliding Pagination */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className={cn(
                      'p-3 rounded-xl transition-all',
                      page === 1
                        ? 'text-[hsl(var(--muted-foreground))] cursor-not-allowed'
                        : 'text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]'
                    )}
                  >
                    <MdChevronLeft className="w-5 h-5" />
                  </button>

                  {visiblePages.map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={cn(
                        'w-12 h-12 rounded-xl font-medium transition-all',
                        page === pageNum
                          ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                          : 'hover:bg-[hsl(var(--accent))]'
                      )}
                    >
                      {pageNum}
                    </button>
                  ))}

                  {visiblePages[visiblePages.length - 1] < totalPages && (
                    <>
                      <span className="px-3 text-[hsl(var(--muted-foreground))]">...</span>
                      <button
                        onClick={() => setPage(totalPages)}
                        className={cn(
                          'w-12 h-12 rounded-xl font-medium transition-all hover:bg-[hsl(var(--accent))]'
                        )}
                      >
                        {totalPages}
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className={cn(
                      'p-3 rounded-xl transition-all',
                      page === totalPages
                        ? 'text-[hsl(var(--muted-foreground))] cursor-not-allowed'
                        : 'text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]'
                    )}
                  >
                    <MdChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Page X of Y */}
                <div className="text-sm text-[hsl(var(--muted-foreground))] font-medium">
                  Page {page} of {totalPages}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleClose}
        title={editingUser ? 'Edit User' : 'Invite New User'}
        size="large"
      >
        <UserForm user={editingUser} onSuccess={handleSuccess} onCancel={handleClose} />
      </Modal>

      {/* Sample Data Modal */}
      <Modal
        isOpen={isSampleDataModalOpen}
        onClose={() => setIsSampleDataModalOpen(false)}
        title="Bulk Upload Sample Data Format"
        size="large"
      >
        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
              <MdInfo className="w-5 h-5" />
              Required Fields
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              The following fields are <strong>required</strong>: email, firstName, lastName, roleName, portalType
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-3 text-lg">Available Fields</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg border bg-[hsl(var(--card))]">
                <div className="font-semibold text-sm">email*</div>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">User email address</div>
              </div>
              <div className="p-3 rounded-lg border bg-[hsl(var(--card))]">
                <div className="font-semibold text-sm">firstName*</div>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">First name</div>
              </div>
              <div className="p-3 rounded-lg border bg-[hsl(var(--card))]">
                <div className="font-semibold text-sm">lastName*</div>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">Last name</div>
              </div>
              <div className="p-3 rounded-lg border bg-[hsl(var(--card))]">
                <div className="font-semibold text-sm">roleName*</div>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">Role name (e.g., Tech Lead, Developer)</div>
              </div>
              <div className="p-3 rounded-lg border bg-[hsl(var(--card))]">
                <div className="font-semibold text-sm">portalType*</div>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">tech, admin, customer, or vendor</div>
              </div>
              <div className="p-3 rounded-lg border bg-[hsl(var(--card))]">
                <div className="font-semibold text-sm">isActive</div>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">true/false (default: true)</div>
              </div>
              <div className="p-3 rounded-lg border bg-[hsl(var(--card))]">
                <div className="font-semibold text-sm">employeeId</div>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">Employee ID (e.g., EA-TECH-001)</div>
              </div>
              <div className="p-3 rounded-lg border bg-[hsl(var(--card))]">
                <div className="font-semibold text-sm">phone</div>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">Phone number</div>
              </div>
              <div className="p-3 rounded-lg border bg-[hsl(var(--card))]">
                <div className="font-semibold text-sm">department</div>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">Department name</div>
              </div>
              <div className="p-3 rounded-lg border bg-[hsl(var(--card))]">
                <div className="font-semibold text-sm">designation</div>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">Job title/designation</div>
              </div>
              <div className="p-3 rounded-lg border bg-[hsl(var(--card))]">
                <div className="font-semibold text-sm">location</div>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">Office location</div>
              </div>
              <div className="p-3 rounded-lg border bg-[hsl(var(--card))]">
                <div className="font-semibold text-sm">reportingTo</div>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">Manager email or name</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border">
            <h3 className="font-semibold mb-2">Sample Data Preview</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-800">
                    <th className="border p-2 text-left">email</th>
                    <th className="border p-2 text-left">firstName</th>
                    <th className="border p-2 text-left">lastName</th>
                    <th className="border p-2 text-left">roleName</th>
                    <th className="border p-2 text-left">portalType</th>
                    <th className="border p-2 text-left">employeeId</th>
                    <th className="border p-2 text-left">department</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border p-2">john.doe@example.com</td>
                    <td className="border p-2">John</td>
                    <td className="border p-2">Doe</td>
                    <td className="border p-2">Tech Lead</td>
                    <td className="border p-2">tech</td>
                    <td className="border p-2">EA-TECH-001</td>
                    <td className="border p-2">Technology</td>
                  </tr>
                  <tr>
                    <td className="border p-2">jane.smith@example.com</td>
                    <td className="border p-2">Jane</td>
                    <td className="border p-2">Smith</td>
                    <td className="border p-2">Developer</td>
                    <td className="border p-2">tech</td>
                    <td className="border p-2">EA-TECH-002</td>
                    <td className="border p-2">Technology</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => setIsSampleDataModalOpen(false)}
              className="px-5 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] font-semibold hover:bg-[hsl(var(--muted))] transition"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleDownloadSample}
              className="px-5 py-2.5 rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-semibold hover:opacity-90 flex items-center gap-2 shadow-lg"
            >
              <MdDownload className="w-5 h-5" />
              Download Sample CSV
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}