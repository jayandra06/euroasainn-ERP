// src/pages/Organizations/OrganizationsPage.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '../../components/shared/DataTable';
import { Modal } from '../../components/shared/Modal';
import { useToast } from '../../components/shared/Toast';
import {
  MdAdd,
  MdBusiness,
  MdFilterList,
  MdSearch,
  MdDelete,
  MdEdit,
} from 'react-icons/md';
import { cn } from '../../lib/utils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Organization {
  _id: string;
  name: string;
  type: string;
  portalType: string;
  isActive: boolean;
  licenseKey?: string;
  createdAt?: string;
}

export function OrganizationsPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [filterActive, setFilterActive] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Editing state
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);

  // Form fields
  const [orgName, setOrgName] = useState('');
  const [orgEmail, setOrgEmail] = useState('');
  const [orgType, setOrgType] = useState<'customer' | 'vendor'>('customer');
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch organizations
  const { data: orgsData = [], isLoading } = useQuery<Organization[]>({
    queryKey: ['organizations', filterActive, filterType, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterType !== 'all') params.append('type', filterType);
      if (filterActive !== 'all') params.append('isActive', filterActive === 'active' ? 'true' : 'false');
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`${API_URL}/api/v1/admin/organizations?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to fetch' }));
        throw new Error(error.error || 'Failed');
      }

      const json = await response.json();
      return json.data || [];
    },
  });

  const filteredOrgs = React.useMemo(() => {
    if (!searchQuery) return orgsData;
    const query = searchQuery.toLowerCase();
    return orgsData.filter(
      (org) =>
        org.name.toLowerCase().includes(query) ||
        org.type.toLowerCase().includes(query)
    );
  }, [orgsData, searchQuery]);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (orgId: string) => {
      const response = await fetch(`${API_URL}/api/v1/admin/organizations/${orgId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete organization');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      showToast('Organization deleted successfully!', 'success');
    },
    onError: (error: Error) => {
      showToast(`Failed to delete: ${error.message}`, 'error');
    },
  });

  const handleDelete = (org: Organization) => {
    if (window.confirm(`Are you sure you want to delete ${org.name}?`)) {
      deleteMutation.mutate(org._id);
    }
  };

  // Save (Create + Update)
  const saveMutation = useMutation({
    mutationFn: async () => {
      const trimmedName = orgName.trim();
      if (!trimmedName) throw new Error('Organization name is required');

      const url = editingOrg
        ? `${API_URL}/api/v1/admin/organizations/${editingOrg._id}`
        : `${API_URL}/api/v1/admin/organizations`;

      const method = editingOrg ? 'PUT' : 'POST';

      const body: any = {
        name: trimmedName,
        type: orgType,
        portalType: orgType,
      };

      if (!editingOrg) {
        const trimmedEmail = orgEmail.trim();
        if (!trimmedEmail) throw new Error('Admin email is required');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail))
          throw new Error('Please enter a valid email address');
        body.adminEmail = trimmedEmail;
        body.isActive = true;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || err.message || 'Operation failed');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      setIsModalOpen(false);
      setEditingOrg(null);
      setOrgName('');
      setOrgEmail('');
      setFormError(null);
      showToast(editingOrg ? 'Updated successfully!' : 'Created successfully!', 'success');
    },
    onError: (error: any) => {
      setFormError(error.message);
      showToast(error.message, 'error');
    },
  });

  const handleOpenCreateModal = () => {
    setEditingOrg(null);
    setOrgName('');
    setOrgEmail('');
    setOrgType('customer');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (org: Organization) => {
    setEditingOrg(org);
    setOrgName(org.name);
    setOrgType(org.type as 'customer' | 'vendor');
    setOrgEmail('');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Columns — NO CHECKBOX COLUMN
  const columns = [
    {
      key: 'name',
      header: 'NAME',
      render: (org: Organization) => (
        <button
          onClick={() => navigate(`/organizations/${org._id}`)}
          className="font-medium text-[hsl(var(--primary))] hover:underline text-left"
        >
          {org.name}
        </button>
      ),
    },
    {
      key: 'type',
      header: 'TYPE',
      render: (org: Organization) => (
        <span
          className={cn(
            'px-4 py-1.5 text-xs font-bold rounded-full ring-1 ring-inset',
            org.type === 'customer'
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 ring-blue-200 dark:ring-blue-800'
              : 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 ring-purple-200 dark:ring-purple-800'
          )}
        >
          {org.type === 'customer' ? 'Customer' : 'Vendor'}
        </span>
      ),
    },
    {
      key: 'portalType',
      header: 'PORTAL',
      render: (org: Organization) => (
        <span className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
          {org.portalType}
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'STATUS',
      render: (org: Organization) => (
        <span
          className={cn(
            'px-4 py-1.5 text-xs font-bold rounded-full ring-1 ring-inset',
            org.isActive
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 ring-emerald-200 dark:ring-emerald-800'
              : 'bg-red-100 text-red-800 dark:bg-red-900/50 ring-red-200 dark:ring-red-800'
          )}
        >
          {org.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'invitations',
      header: 'INVITATIONS',
      render: () => (
        <button className="px-4 py-1.5 text-xs font-medium rounded-lg bg-indigo-100 text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-900/50 dark:text-indigo-300 transition">
          Manage
        </button>
      ),
    },
    {
      key: 'licenseKey',
      header: 'LICENSE KEY',
      render: (org: Organization) => (
        <span className="font-mono text-xs text-[hsl(var(--muted-foreground))]">
          {org.licenseKey || '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'ACTIONS',
      render: (org: Organization) => (
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={() => handleOpenEditModal(org)}
            className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors text-blue-600 dark:text-blue-400"
            title="Edit"
          >
            <MdEdit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(org)}
            className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-red-600 dark:text-red-400"
            title="Delete"
          >
            <MdDelete className="w-4 h-4" />
          </button>
        </div>
      ),
      className: 'w-32',
    },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-4xl font-bold text-[hsl(var(--foreground))] mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Organizations
          </h1>
          <p className="text-lg text-[hsl(var(--muted-foreground))] font-medium">
            Manage customer and vendor organizations
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[hsl(var(--primary))] text-white text-sm font-semibold shadow-md hover:shadow-lg hover:bg-[hsl(var(--primary))]/90 transition-colors"
        >
          <MdAdd className="w-4 h-4" />
          <span>Add Organization</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="p-6 rounded-2xl bg-[hsl(var(--card))]/80 backdrop-blur-xl border border-[hsl(var(--border))]/50 shadow-lg">
        <div className="space-y-4">
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] focus-within:border-[hsl(var(--primary))] focus-within:ring-2 focus-within:ring-[hsl(var(--primary))]/20 transition-all">
            <MdSearch className="w-5 h-5 text-[hsl(var(--muted-foreground))] flex-shrink-0" />
            <input
              type="text"
              placeholder="Search organizations by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-[hsl(var(--foreground))] font-semibold">
              <MdFilterList className="w-5 h-5" />
              <span>Filters:</span>
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-sm focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-all duration-200 font-medium"
            >
              <option value="all">All Types</option>
              <option value="customer">Customer Only</option>
              <option value="vendor">Vendor Only</option>
            </select>
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              className="px-4 py-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-sm focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-all duration-200 font-medium"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="p-12 text-center rounded-2xl bg-[hsl(var(--card))]/80 backdrop-blur-xl border border-[hsl(var(--border))]/50 shadow-lg">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[hsl(var(--border))] border-t-[hsl(var(--primary))]"></div>
          <p className="mt-4 text-[hsl(var(--muted-foreground))] font-medium">Loading organizations...</p>
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-[hsl(var(--card))]/80 backdrop-blur-xl border border-[hsl(var(--border))]/50 shadow-lg">
          <div className="mb-6">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Showing {filteredOrgs.length} organization{filteredOrgs.length !== 1 ? 's' : ''}
            </p>
          </div>

          <DataTable
            columns={columns}
            data={filteredOrgs}
            emptyMessage="No organizations found."
          />
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingOrg ? 'Edit Organization' : 'Add Organization'}
        icon={<MdBusiness className="w-6 h-6 text-[hsl(var(--primary))]" />}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
              Organization Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className={cn(
                'w-full px-4 py-2.5 border-2 rounded-lg bg-[hsl(var(--card))] text-[hsl(var(--foreground))]',
                'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all',
              )}
              placeholder="Enter organization name"
            />
          </div>

          {!editingOrg && (
            <div>
              <label className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
                Admin Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={orgEmail}
                onChange={(e) => setOrgEmail(e.target.value)}
                className={cn(
                  'w-full px-4 py-2.5 border-2 rounded-lg bg-[hsl(var(--card))] text-[hsl(var(--foreground))]',
                  'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all',
                )}
                placeholder="Enter admin email"
              />
              <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                An invitation email with login credentials will be sent to this email address.
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
              Organization Type <span className="text-red-500">*</span>
            </label>
            <select
              value={orgType}
              onChange={(e) => setOrgType(e.target.value as 'customer' | 'vendor')}
              className="w-full px-4 py-2.5 rounded-lg border-2 border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-sm focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-all duration-200 font-medium"
            >
              <option value="customer">Customer</option>
              <option value="vendor">Vendor</option>
            </select>
          </div>

          {formError && (
            <div className="p-3 rounded-lg bg-[hsl(var(--destructive))]/10 border border-red-200 dark:border-red-800 text-[hsl(var(--destructive))] text-sm">
              {formError}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[hsl(var(--border))]">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              disabled={saveMutation.isPending}
              className="px-4 py-2 rounded-lg bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))] font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setFormError(null);
                saveMutation.mutate();
              }}
              disabled={saveMutation.isPending}
              className="px-4 py-2 rounded-lg bg-[hsl(var(--primary))] text-white font-semibold hover:bg-[hsl(var(--primary))]/90 transition-colors disabled:opacity-50 shadow-lg hover:shadow-xl"
            >
              {saveMutation.isPending ? 'Saving...' : editingOrg ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}