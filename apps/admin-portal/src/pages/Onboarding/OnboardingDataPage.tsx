/**
 * Onboarding Data Page
 * Admin portal page to view customer and vendor onboarding submissions
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from '../../components/shared/DataTable';
import { useToast } from '../../components/shared/Toast';
import { MdFilterList, MdBusiness, MdPerson } from 'react-icons/md';
import { cn } from '../../lib/utils';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'http://localhost:3000');

interface CustomerOnboarding {
  _id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  status: 'pending' | 'completed' | 'approved' | 'rejected';
  submittedAt?: string;
  organizationId?: string;
}

interface VendorOnboarding {
  _id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  status: 'pending' | 'completed' | 'approved' | 'rejected';
  submittedAt?: string;
  organizationId?: string;
}

export function OnboardingDataPage() {
  const { showToast } = useToast();
  const [filterType, setFilterType] = useState<'all' | 'customer' | 'vendor'>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Fetch customer onboardings
  const { data: customerOnboardings, isLoading: customerLoading } = useQuery<CustomerOnboarding[]>({
    queryKey: ['customer-onboardings', filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }

      const response = await fetch(`${API_URL}/api/v1/admin/customer-onboardings?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch customer onboardings');
      const data = await response.json();
      return data.data || [];
    },
    enabled: filterType === 'all' || filterType === 'customer',
  });

  // Fetch vendor onboardings
  const { data: vendorOnboardings, isLoading: vendorLoading } = useQuery<VendorOnboarding[]>({
    queryKey: ['vendor-onboardings', filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }

      const response = await fetch(`${API_URL}/api/v1/admin/vendor-onboardings?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch vendor onboardings');
      const data = await response.json();
      return data.data || [];
    },
    enabled: filterType === 'all' || filterType === 'vendor',
  });

  const isLoading = customerLoading || vendorLoading;

  // Combine data based on filter
  const allOnboardings = React.useMemo(() => {
    const data: Array<CustomerOnboarding | VendorOnboarding & { type: string }> = [];
    
    if (filterType === 'all' || filterType === 'customer') {
      (customerOnboardings || []).forEach((item) => {
        data.push({ ...item, type: 'customer' });
      });
    }
    
    if (filterType === 'all' || filterType === 'vendor') {
      (vendorOnboardings || []).forEach((item) => {
        data.push({ ...item, type: 'vendor' });
      });
    }

    return data;
  }, [customerOnboardings, vendorOnboardings, filterType]);

  const customerColumns = [
    {
      key: 'companyName',
      header: 'Company Name',
      render: (item: CustomerOnboarding) => (
        <div className="font-semibold text-gray-900 dark:text-white">{item.companyName}</div>
      ),
    },
    {
      key: 'contactPerson',
      header: 'Contact Person',
      render: (item: CustomerOnboarding) => (
        <span className="text-gray-600 dark:text-gray-400">{item.contactPerson}</span>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (item: CustomerOnboarding) => (
        <span className="text-gray-600 dark:text-gray-400">{item.email}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: CustomerOnboarding) => {
        const statusColors = {
          pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 ring-amber-200 dark:ring-amber-800',
          completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 ring-blue-200 dark:ring-blue-800',
          approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 ring-emerald-200 dark:ring-emerald-800',
          rejected: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 ring-red-200 dark:ring-red-800',
        };
        return (
          <span className={cn('px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ring-1', statusColors[item.status] || statusColors.pending)}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </span>
        );
      },
    },
    {
      key: 'submittedAt',
      header: 'Submitted At',
      render: (item: CustomerOnboarding) => (
        <span className="text-gray-600 dark:text-gray-400">
          {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : 'N/A'}
        </span>
      ),
    },
  ];

  const vendorColumns = [
    {
      key: 'companyName',
      header: 'Company Name',
      render: (item: VendorOnboarding) => (
        <div className="font-semibold text-gray-900 dark:text-white">{item.companyName}</div>
      ),
    },
    {
      key: 'contactPerson',
      header: 'Contact Person',
      render: (item: VendorOnboarding) => (
        <span className="text-gray-600 dark:text-gray-400">{item.contactPerson}</span>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (item: VendorOnboarding) => (
        <span className="text-gray-600 dark:text-gray-400">{item.email}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: VendorOnboarding) => {
        const statusColors = {
          pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 ring-amber-200 dark:ring-amber-800',
          completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 ring-blue-200 dark:ring-blue-800',
          approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 ring-emerald-200 dark:ring-emerald-800',
          rejected: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 ring-red-200 dark:ring-red-800',
        };
        return (
          <span className={cn('px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ring-1', statusColors[item.status] || statusColors.pending)}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </span>
        );
      },
    },
    {
      key: 'submittedAt',
      header: 'Submitted At',
      render: (item: VendorOnboarding) => (
        <span className="text-gray-600 dark:text-gray-400">
          {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : 'N/A'}
        </span>
      ),
    },
  ];

  const combinedColumns = [
    {
      key: 'type',
      header: 'Type',
      render: (item: any) => (
        <span
          className={cn(
            'px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full',
            item.type === 'customer'
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-800'
              : 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 ring-1 ring-purple-200 dark:ring-purple-800'
          )}
        >
          {item.type === 'customer' ? 'Customer' : 'Vendor'}
        </span>
      ),
    },
    {
      key: 'companyName',
      header: 'Company Name',
      render: (item: any) => (
        <div className="font-semibold text-gray-900 dark:text-white">{item.companyName}</div>
      ),
    },
    {
      key: 'contactPerson',
      header: 'Contact Person',
      render: (item: any) => (
        <span className="text-gray-600 dark:text-gray-400">{item.contactPerson}</span>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (item: any) => (
        <span className="text-gray-600 dark:text-gray-400">{item.email}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: any) => {
        const statusColors = {
          pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 ring-amber-200 dark:ring-amber-800',
          completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 ring-blue-200 dark:ring-blue-800',
          approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 ring-emerald-200 dark:ring-emerald-800',
          rejected: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 ring-red-200 dark:ring-red-800',
        };
        return (
          <span className={cn('px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ring-1', statusColors[item.status] || statusColors.pending)}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </span>
        );
      },
    },
    {
      key: 'submittedAt',
      header: 'Submitted At',
      render: (item: any) => (
        <span className="text-gray-600 dark:text-gray-400">
          {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString() : 'N/A'}
        </span>
      ),
    },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Onboarding Data
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">
            View customer and vendor onboarding submissions
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="p-6 rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-semibold">
            <MdFilterList className="w-5 h-5" />
            <span>Filters:</span>
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-medium"
          >
            <option value="all">All Types</option>
            <option value="customer">Customer Only</option>
            <option value="vendor">Vendor Only</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-medium"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Tables */}
      {isLoading ? (
        <div className="p-12 text-center rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 shadow-lg">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Loading onboarding data...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filterType === 'all' && (
            <div className="p-6 rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 shadow-lg">
              <DataTable
                columns={combinedColumns}
                data={allOnboardings}
                emptyMessage="No onboarding data found."
              />
            </div>
          )}

          {(filterType === 'all' || filterType === 'customer') && (
            <div className="p-6 rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 shadow-lg">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <MdBusiness className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                Customer Onboardings
              </h2>
              <DataTable
                columns={customerColumns}
                data={customerOnboardings || []}
                emptyMessage="No customer onboarding data found."
              />
            </div>
          )}

          {(filterType === 'all' || filterType === 'vendor') && (
            <div className="p-6 rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 shadow-lg">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <MdPerson className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                Vendor Onboardings
              </h2>
              <DataTable
                columns={vendorColumns}
                data={vendorOnboardings || []}
                emptyMessage="No vendor onboarding data found."
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

