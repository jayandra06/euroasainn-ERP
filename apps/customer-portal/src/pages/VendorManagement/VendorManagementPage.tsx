import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '../../components/shared/DataTable';
import { Modal } from '../../components/shared/Modal';
import { VendorInviteForm } from './VendorInviteForm';
import { useToast } from '../../components/shared/Toast';
import { MdAdd, MdSearch } from 'react-icons/md';
import { cn } from '../../lib/utils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Vendor {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName?: string;
  phone?: string;
  organizationId?: string;
  organizationName?: string;
  role?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt?: string;
}

export function VendorManagementPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch vendor users invited by this customer
  const { data: vendorsData, isLoading } = useQuery<Vendor[]>({
    queryKey: ['customer-vendors', activeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activeFilter !== 'all') {
        if (activeFilter === 'approved' || activeFilter === 'active') {
          params.append('isActive', 'true');
        } else if (activeFilter === 'disabled' || activeFilter === 'inactive') {
          params.append('isActive', 'false');
        }
      }

      const response = await fetch(`${API_URL}/api/v1/customer/vendors/users?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch vendors');
      const data = await response.json();
      return data.data || [];
    },
  });

  // Filter vendors by search query
  const filteredVendors = useMemo(() => {
    if (!vendorsData) return [];
    if (!searchQuery.trim()) return vendorsData;

    const query = searchQuery.toLowerCase();
    return vendorsData.filter(
      (vendor) =>
        vendor.email?.toLowerCase().includes(query) ||
        vendor.firstName?.toLowerCase().includes(query) ||
        vendor.lastName?.toLowerCase().includes(query) ||
        vendor.fullName?.toLowerCase().includes(query) ||
        vendor.organizationName?.toLowerCase().includes(query) ||
        vendor.phone?.toLowerCase().includes(query)
    );
  }, [vendorsData, searchQuery]);

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['customer-vendors'] });
    setShowInviteModal(false);
  };

  const handleClose = () => {
    setShowInviteModal(false);
  };

  const columns = [
    {
      key: 'name',
      header: 'Vendor Name',
      render: (vendor: Vendor) => (
        <div className="font-semibold text-[hsl(var(--foreground))]">
          {vendor.fullName || `${vendor.firstName || ''} ${vendor.lastName || ''}`.trim() || 'N/A'}
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email ID',
      render: (vendor: Vendor) => (
        <span className="text-[hsl(var(--muted-foreground))]">{vendor.email}</span>
      ),
    },
    {
      key: 'phone',
      header: 'Contact No.',
      render: (vendor: Vendor) => (
        <span className="text-[hsl(var(--muted-foreground))]">{vendor.phone || 'N/A'}</span>
      ),
    },
    {
      key: 'organizationName',
      header: 'Company',
      render: (vendor: Vendor) => (
        <span className="text-[hsl(var(--muted-foreground))]">{vendor.organizationName || 'N/A'}</span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (vendor: Vendor) => (
        <span
          className={cn(
            'px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full',
            vendor.isActive
              ? 'bg-emerald-100 text-[hsl(var(--foreground))] font-semibold dark:bg-emerald-900/50 ring-1 ring-emerald-200 dark:ring-emerald-800'
              : 'bg-red-100 text-[hsl(var(--foreground))] font-semibold dark:bg-red-900/50 ring-1 ring-red-200 dark:ring-red-800'
          )}
        >
          {vendor.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[hsl(var(--foreground))]">Manage Your Vendors</h1>
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
        >
          <MdAdd className="w-5 h-5" />
          Invite Vendor
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-[hsl(var(--foreground))]">Filter by Status</label>
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="px-3 py-2 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))]"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <div className="flex items-center gap-2 flex-1">
          <label className="text-sm font-medium text-[hsl(var(--foreground))]">Search Vendors</label>
          <div className="relative flex-1">
            <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by vendor name, email, company, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="bg-[hsl(var(--card))] rounded-lg border border-[hsl(var(--border))] p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-purple-600"></div>
          <p className="mt-4 text-[hsl(var(--muted-foreground))] font-medium">Loading vendors...</p>
        </div>
      ) : (
        <div className="bg-[hsl(var(--card))] rounded-lg border border-[hsl(var(--border))] overflow-hidden">
          <DataTable
            columns={columns}
            data={filteredVendors}
            emptyMessage="No vendors found. Invite vendors to get started."
          />
        </div>
      )}

      {/* Invite Vendor Modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={handleClose}
        title="Invite New Vendor"
        size="medium"
      >
        <VendorInviteForm
          onSuccess={handleSuccess}
          onCancel={handleClose}
        />
      </Modal>
    </div>
  );
}




