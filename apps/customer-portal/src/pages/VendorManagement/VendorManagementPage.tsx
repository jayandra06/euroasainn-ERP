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
  onboardingStatus?: 'pending' | 'completed' | 'approved' | 'rejected';
  invitationStatus?: 'pending' | 'accepted' | 'declined' | null;
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
      // Note: Filtering by onboarding status is done on the frontend
      // The backend returns all vendors with their onboarding status

      const response = await fetch(`${API_URL}/api/v1/customer/vendors/users?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to fetch vendors';
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorMessage;
        } catch {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      const data = await response.json();
      return data.data || [];
    },
    staleTime: 30000, // Consider data fresh for 30 seconds
    refetchInterval: false, // Disable auto-refresh - rely on manual refetch after invitation
    refetchOnWindowFocus: false, // Disable refetch on window focus
    refetchOnMount: true, // Refetch when component mounts to get latest data
    retry: 1, // Retry once on failure
  });

  // Filter vendors by search query and status
  const filteredVendors = useMemo(() => {
    if (!vendorsData) return [];
    
    let filtered = vendorsData;
    
    // Filter by status
    if (activeFilter !== 'all') {
      filtered = filtered.filter((vendor) => {
        let status = vendor.onboardingStatus || (vendor.isActive ? 'approved' : 'pending');
        // Map 'completed' to 'pending' for filtering
        if (status === 'completed') {
          status = 'pending';
        }
        return status === activeFilter;
      });
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (vendor) =>
          vendor.email?.toLowerCase().includes(query) ||
          vendor.firstName?.toLowerCase().includes(query) ||
          vendor.lastName?.toLowerCase().includes(query) ||
          vendor.fullName?.toLowerCase().includes(query) ||
          vendor.organizationName?.toLowerCase().includes(query) ||
          vendor.phone?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [vendorsData, searchQuery, activeFilter]);

  const handleSuccess = () => {
    // Invalidate and refetch the vendors query to show the newly invited vendor
    queryClient.invalidateQueries({ queryKey: ['customer-vendors'] });
    // Also explicitly refetch to ensure the data is updated immediately
    queryClient.refetchQueries({ queryKey: ['customer-vendors'] });
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
      key: 'onboardingStatus',
      header: 'Status',
      render: (vendor: Vendor) => {
        // Priority: invitationStatus > onboardingStatus > isActive
        let status = 'pending';
        let label = 'Pending';
        
        if (vendor.invitationStatus) {
          // Show invitation status for existing vendors
          status = vendor.invitationStatus;
          if (status === 'accepted') {
            label = 'Accepted';
          } else if (status === 'declined') {
            label = 'Declined';
          } else {
            label = 'Invitation Pending';
          }
        } else {
          // Show onboarding status for new vendors
          status = vendor.onboardingStatus || (vendor.isActive ? 'approved' : 'pending');
          // Map 'completed' to 'pending' since both mean waiting for approval
          if (status === 'completed') {
            status = 'pending';
          }
        }
        
        const statusConfig: Record<string, { label: string; className: string }> = {
          pending: {
            label: label === 'Invitation Pending' ? 'Invitation Pending' : 'Pending',
            className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 ring-1 ring-yellow-200 dark:ring-yellow-800',
          },
          accepted: {
            label: 'Accepted',
            className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 ring-1 ring-emerald-200 dark:ring-emerald-800',
          },
          declined: {
            label: 'Declined',
            className: 'bg-red-100 text-red-800 dark:bg-red-900/50 ring-1 ring-red-200 dark:ring-red-800',
          },
          approved: {
            label: 'Approved',
            className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 ring-1 ring-emerald-200 dark:ring-emerald-800',
          },
          rejected: {
            label: 'Rejected',
            className: 'bg-red-100 text-red-800 dark:bg-red-900/50 ring-1 ring-red-200 dark:ring-red-800',
          },
        };
        
        const config = statusConfig[status] || statusConfig.pending;
        
        return (
          <span
            className={cn(
              'px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full',
              config.className
            )}
          >
            {config.label}
          </span>
        );
      },
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
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
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




