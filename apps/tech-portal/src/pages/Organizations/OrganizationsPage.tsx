/**
 * Polished Modern Organizations Page
 * Professional Enterprise Dashboard - Fixed Layout & Spacing
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '../../components/shared/DataTable';
import { Modal } from '../../components/shared/Modal';
import { OrganizationForm } from './OrganizationForm';
import { useToast } from '../../components/shared/Toast';
import { MdAdd, MdFilterList } from 'react-icons/md';
import { Button } from '../../components/ui/button';
import { cn } from '../../lib/utils';
import { apiFetch } from '../../utils/api';
import { OrganizationInvitationsModal } from './OrganizationInvitationsModal';

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [filterActive, setFilterActive] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [isInvitationsModalOpen, setIsInvitationsModalOpen] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);

  const handleOpenInvitations = (org: Organization) => {
    setSelectedOrganization(org);
    setIsInvitationsModalOpen(true);
  };

  const handleCloseInvitations = () => {
    setIsInvitationsModalOpen(false);
    setSelectedOrganization(null);
  };

  // Fetch organizations with optimized caching
  const { data: orgsData, isLoading } = useQuery({
    queryKey: ['organizations', filterActive, filterType],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterActive !== 'all') {
        params.append('isActive', filterActive === 'active' ? 'true' : 'false');
      }
      if (filterType !== 'all') {
        params.append('type', filterType);
      }

      const response = await apiFetch(`/api/v1/tech/organizations?${params}`);

      if (!response.ok) throw new Error('Failed to fetch organizations');
      const data = await response.json();
      return data.data as Organization[];
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes (gcTime replaces cacheTime in v5)
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch if data exists in cache
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (orgId: string) => {
      const response = await apiFetch(`/api/v1/tech/organizations/${orgId}`, {
        method: 'DELETE',
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
      showToast(`Failed to delete organization: ${error.message}`, 'error');
    },
  });

  const handleCreate = () => {
    setEditingOrg(null);
    setIsModalOpen(true);
  };

  const handleEdit = (org: Organization) => {
    setEditingOrg(org);
    setIsModalOpen(true);
  };

  const handleDelete = (org: Organization) => {
    if (window.confirm(`Are you sure you want to delete organization ${org.name}?`)) {
      deleteMutation.mutate(org._id);
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setEditingOrg(null);
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['organizations'] });
    // The OrganizationForm will show its own success message with email status
    // We don't need to show a generic message here
    handleClose();
  };

  const columns = [
    {
      key: 'name',
      header: 'Organization Name',
      render: (org: Organization) => (
        <div className="font-semibold text-[hsl(var(--foreground))]">{org.name}</div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (org: Organization) => (
        <span
          className={cn(
            'px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full',
            org.type === 'customer'
              ? 'bg-blue-100 text-[hsl(var(--foreground))] font-semibold dark:bg-blue-900/50 ring-1 ring-blue-200 dark:ring-blue-800'
              : 'bg-purple-100 text-[hsl(var(--foreground))] font-semibold dark:bg-purple-900/50 ring-1 ring-purple-200 dark:ring-purple-800'
          )}
        >
          {org.type === 'customer' ? 'Customer' : 'Vendor'}
        </span>
      ),
    },
    {
      key: 'portalType',
      header: 'Portal Type',
      render: (org: Organization) => (
        <span className="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-blue-100 text-[hsl(var(--foreground))] font-semibold dark:bg-blue-900/50 ring-1 ring-blue-200 dark:ring-blue-800">
          {org.portalType}
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (org: Organization) => (
        <span
          className={cn(
            'px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full',
            org.isActive
              ? 'bg-emerald-100 text-[hsl(var(--foreground))] font-semibold dark:bg-emerald-900/50 ring-1 ring-emerald-200 dark:ring-emerald-800'
              : 'bg-red-100 text-[hsl(var(--foreground))] font-semibold dark:bg-red-900/50 ring-1 ring-red-200 dark:ring-red-800'
          )}
        >
          {org.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'invitations',
      header: 'Invitations',
      render: (org: Organization) => (
        <button
          onClick={(event) => {
            event.stopPropagation();
            handleOpenInvitations(org);
          }}
          className="px-3 py-2 text-xs font-semibold rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-[hsl(var(--foreground))] font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition"
        >
          Manage
        </button>
      ),
    },
    {
      key: 'licenseKey',
      header: 'License Key',
      render: (org: Organization) => (
        <div className="text-[hsl(var(--foreground))] font-mono text-sm">
          {org.licenseKey || 'N/A'}
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created At',
      render: (org: Organization) => (
        <div className="text-[hsl(var(--muted-foreground))] text-sm">
          {org.createdAt ? new Date(org.createdAt).toLocaleDateString() : 'N/A'}
        </div>
      ),
    },
  ];

  return (
    <div className="w-full min-h-screen p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-4xl font-bold text-[hsl(var(--foreground))] mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Organizations
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">
            Manage organizations and their configurations
          </p>
        </div>
        <Button onClick={handleCreate} className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40">
          <MdAdd className="w-5 h-5" /> Add Organization
        </Button>
      </div>

      {/* Filters */}
      <div className="p-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-2 text-[hsl(var(--foreground))] font-semibold">
            <MdFilterList className="w-5 h-5" />
            <span>Filters:</span>
          </div>
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
            className="px-4 py-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-sm focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-all duration-200 font-medium"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-sm focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-all duration-200 font-medium"
          >
            <option value="all">All Types</option>
            <option value="customer">Customer</option>
            <option value="vendor">Vendor</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="p-12 text-center rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="inline-block w-8 h-8 border-4 border-gray-300 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading organizations...</p>
        </div>
      ) : (
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="p-6">
            <DataTable
              columns={columns}
              data={(orgsData as Organization[]) || []}
              onEdit={handleEdit}
              onDelete={handleDelete}
              emptyMessage="No organizations found."
            />
          </div>
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleClose}
        title={editingOrg ? 'Edit Organization' : 'Create New Organization'}
      >
        <OrganizationForm organization={editingOrg} onSuccess={handleSuccess} onCancel={handleClose} />
      </Modal>

      <OrganizationInvitationsModal
        organization={selectedOrganization}
        isOpen={isInvitationsModalOpen}
        onClose={handleCloseInvitations}
        apiBasePath="/api/v1/tech"
      />
    </div>
  );
}
