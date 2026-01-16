// src/pages/Organizations/OrganizationsPage.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '../../components/shared/DataTable';
import { Modal } from '../../components/shared/Modal';
import { OrganizationForm } from './OrganizationForm';
import { OrganizationInvitationsModal } from './OrganizationInvitationsModal';
import { useToast } from '../../components/shared/Toast';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom'; // ← Added
import { MdAdd, MdFilterList } from 'react-icons/md';
import { cn } from '../../lib/utils';

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
  const toast = useToast();
  const { permissions } = useAuth();
  const navigate = useNavigate(); // ← For profile navigation

  const canCreate = permissions.includes('organizationsCreate');
  const canUpdate = permissions.includes('organizationsUpdate');
  const canDelete = permissions.includes('organizationsDelete');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [filterActive, setFilterActive] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [invitationsOpen, setInvitationsOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);

  const { data: organizations = [], isLoading } = useQuery<Organization[]>({
    queryKey: ['organizations', filterActive, filterType],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterActive !== 'all') params.append('isActive', filterActive === 'active' ? 'true' : 'false');
      if (filterType !== 'all') params.append('type', filterType);

      const res = await fetch(`/api/v1/tech/organizations?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
      });
      if (!res.ok) throw new Error('Failed');
      const json = await res.json();
      return json.data || [];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/v1/tech/organizations/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
      }).then((res) => {
        if (!res.ok) throw new Error('Delete failed');
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast.success('Organization deleted');
    },
  });

  const handleEdit = (org: Organization) => {
    if (!canUpdate) return;
    setEditingOrg(org);
    setIsModalOpen(true);
  };

  const handleDelete = (org: Organization) => {
    if (!canDelete || !window.confirm(`Delete ${org.name}?`)) return;
    deleteMutation.mutate(org._id);
  };

  // ← NEW: Click row → go to organization profile
  const handleRowClick = (org: Organization) => {
    navigate(`/organizations/${org._id}`);
  };

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (o: Organization) => <div className="font-medium">{o.name}</div>,
    },
    {
      key: 'type',
      header: 'Type',
      render: (o: Organization) => (
        <span
          className={cn(
            "px-3 py-1 text-xs font-medium rounded-full",
            o.type === 'customer'
              ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40"
              : "bg-purple-100 text-purple-800 dark:bg-purple-900/40"
          )}
        >
          {o.type === 'customer' ? 'Customer' : 'Vendor'}
        </span>
      ),
    },
    {
      key: 'portalType',
      header: 'Portal',
      render: (o: Organization) => <span className="text-xs font-medium">{o.portalType}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (o: Organization) => (
        <span
          className={cn(
            "px-3 py-1 text-xs font-medium rounded-full",
            o.isActive ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40" : "bg-red-100 text-red-800 dark:bg-red-900/40"
          )}
        >
          {o.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'invitations',
      header: 'Invitations',
      render: (o: Organization) => (
        <button
          onClick={(e) => {
            e.stopPropagation(); // ← Prevent row navigation when clicking button
            setSelectedOrg(o);
            setInvitationsOpen(true);
          }}
          className="px-3 py-1 text-xs font-medium rounded bg-indigo-100 text-indigo-800 hover:bg-indigo-200 dark:bg-indigo-900/40"
        >
          Manage
        </button>
      ),
    },
    {
      key: 'licenseKey',
      header: 'License Key',
      render: (o: Organization) => <span className="font-mono text-xs">{o.licenseKey || '—'}</span>,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Organizations</h1>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
            Manage customer and vendor organizations
          </p>
        </div>
        <button
          onClick={() => canCreate && setIsModalOpen(true)}
          disabled={!canCreate}
          className={cn(
            "px-5 py-2 rounded-lg font-medium flex items-center gap-2 transition",
            canCreate
              ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:opacity-90"
              : "bg-gray-200 text-gray-500 cursor-not-allowed"
          )}
        >
          <MdAdd className="w-5 h-5" /> Add Organization
        </button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <select
          value={filterActive}
          onChange={(e) => setFilterActive(e.target.value)}
          className="px-4 py-2 rounded-lg border text-sm"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2 rounded-lg border text-sm"
        >
          <option value="all">All Types</option>
          <option value="customer">Customer</option>
          <option value="vendor">Vendor</option>
        </select>
      </div>

      {isLoading ? (
        <div className="p-12 text-center">
          <div className="w-10 h-10 border-4 border-[hsl(var(--border))] border-t-[hsl(var(--primary))] rounded-full animate-spin inline-block" />
        </div>
      ) : (
        <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
          <DataTable
            columns={columns}
            data={organizations}
            onRowClick={handleRowClick}        // ← Click row → Profile Page
            onEdit={handleEdit}                // ← Edit button → Modal
            onDelete={handleDelete}
            canEdit={canUpdate}
            canDelete={canDelete}
            emptyMessage="No organizations found."
          />
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingOrg(null);
        }}
        title={editingOrg ? 'Edit Organization' : 'Create Organization'}
      >
        <OrganizationForm
          organization={editingOrg}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['organizations'] });
            setIsModalOpen(false);
          }}
          onCancel={() => setIsModalOpen(false)}
        />
      </Modal>

      <OrganizationInvitationsModal
        organization={selectedOrg}
        isOpen={invitationsOpen}
        onClose={() => {
          setInvitationsOpen(false);
          setSelectedOrg(null);
        }}
        apiBasePath="/api/v1/tech"
      />
    </div>
  );
}