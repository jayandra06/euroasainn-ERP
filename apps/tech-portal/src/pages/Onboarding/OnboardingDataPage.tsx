/**
 * Onboarding Data Page
 * Tech portal page to view customer and vendor onboarding submissions
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '../../components/shared/DataTable';
import { useToast } from '../../components/shared/Toast';
import { MdFilterList, MdBusiness, MdPerson, MdCheckCircle, MdCancel, MdInfo } from 'react-icons/md';
import { cn } from '../../lib/utils';

// Use relative URL in development (with Vite proxy) or env var, otherwise default to localhost:3000
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'http://localhost:3000');

interface CustomerOnboarding {
  _id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  status: 'pending' | 'completed' | 'approved' | 'rejected';
  submittedAt?: string;
  organizationId?: string;
  [key: string]: any; // For full form data
}

interface VendorOnboarding {
  _id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  status: 'pending' | 'completed' | 'approved' | 'rejected';
  submittedAt?: string;
  organizationId?: string;
  [key: string]: any; // For full form data
}

export function OnboardingDataPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [filterType, setFilterType] = useState<'all' | 'customer' | 'vendor'>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Fetch customer onboardings
  const { data: customerOnboardings, isLoading: customerLoading, error: customerError } = useQuery<CustomerOnboarding[]>({
    queryKey: ['customer-onboardings', filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }

      const url = API_URL ? `${API_URL}/api/v1/tech/customer-onboardings?${params}` : `/api/v1/tech/customer-onboardings?${params}`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}: ${response.statusText}` }));
        console.error('Failed to fetch customer onboardings:', errorData);
        throw new Error(errorData.error || 'Failed to fetch customer onboardings');
      }
      const data = await response.json();
      console.log('Customer onboardings data:', data);
      return data.data || [];
    },
    enabled: filterType === 'all' || filterType === 'customer',
  });

  // Fetch vendor onboardings
  const { data: vendorOnboardings, isLoading: vendorLoading, error: vendorError } = useQuery<VendorOnboarding[]>({
    queryKey: ['vendor-onboardings', filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }

      const url = API_URL ? `${API_URL}/api/v1/tech/vendor-onboardings?${params}` : `/api/v1/tech/vendor-onboardings?${params}`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}: ${response.statusText}` }));
        console.error('Failed to fetch vendor onboardings:', errorData);
        throw new Error(errorData.error || 'Failed to fetch vendor onboardings');
      }
      const data = await response.json();
      console.log('Vendor onboardings data:', data);
      return data.data || [];
    },
    enabled: filterType === 'all' || filterType === 'vendor',
  });

  const isLoading = customerLoading || vendorLoading;

  // Approve/Reject mutations
  const approveCustomerMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_URL}/api/v1/tech/customer-onboardings/${id}/approve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}: ${response.statusText}` }));
        throw new Error(errorData.error || `Failed to approve onboarding: ${response.status} ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['customer-onboardings'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-onboardings'] });
      showToast('Customer onboarding approved successfully', 'success');
      // Redirect to license creation page with organizationId
      if (data?.data?.organizationId) {
        window.location.href = `/licenses/create?organizationId=${data.data.organizationId}&type=customer`;
      }
    },
    onError: (error: any) => {
      console.error('Approve customer onboarding error:', error);
      showToast(error.message || 'Failed to approve onboarding', 'error');
    },
  });

  const rejectCustomerMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const response = await fetch(`${API_URL}/api/v1/tech/customer-onboardings/${id}/reject`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rejectionReason: reason }),
      });
      if (!response.ok) throw new Error('Failed to reject onboarding');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-onboardings'] });
      showToast('Customer onboarding rejected successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to reject onboarding', 'error');
    },
  });

  const approveVendorMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_URL}/api/v1/tech/vendor-onboardings/${id}/approve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}: ${response.statusText}` }));
        throw new Error(errorData.error || `Failed to approve onboarding: ${response.status} ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['customer-onboardings'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-onboardings'] });
      showToast('Vendor onboarding approved successfully', 'success');
      // Redirect to license creation page with organizationId
      if (data?.data?.organizationId) {
        window.location.href = `/licenses/create?organizationId=${data.data.organizationId}&type=vendor`;
      }
    },
    onError: (error: any) => {
      console.error('Approve vendor onboarding error:', error);
      showToast(error.message || 'Failed to approve onboarding', 'error');
    },
  });

  const rejectVendorMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const response = await fetch(`${API_URL}/api/v1/tech/vendor-onboardings/${id}/reject`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rejectionReason: reason }),
      });
      if (!response.ok) throw new Error('Failed to reject onboarding');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-onboardings'] });
      showToast('Vendor onboarding rejected successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to reject onboarding', 'error');
    },
  });

  const handleViewDetails = (item: CustomerOnboarding | VendorOnboarding, type: 'customer' | 'vendor') => {
    navigate(`/onboarding-data/${type}/${item._id}`);
  };

  // Combine data based on filter
  const allOnboardings = useMemo(() => {
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
        <button
          onClick={() => handleViewDetails(item, 'customer')}
          className="font-semibold text-[hsl(var(--foreground))] font-semibold hover:underline text-left"
        >
          {item.companyName}
        </button>
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
        const isApproved = item.status === 'approved';
        const isUnderReview = item.status === 'completed' || item.status === 'pending';
        
        if (isApproved) {
          return (
            <span className="inline-flex items-center" title="Approved">
              <MdCheckCircle className="w-6 h-6 text-[hsl(var(--foreground))] font-semibold" />
            </span>
          );
        }
        
        if (isUnderReview) {
          return (
            <span className="inline-flex items-center" title={item.status === 'completed' ? 'Under Review' : 'Pending'}>
              <MdInfo className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </span>
          );
        }
        
        if (item.status === 'rejected') {
          return (
            <span className="inline-flex items-center" title="Rejected">
              <MdCancel className="w-6 h-6 text-red-600 dark:text-red-400" />
            </span>
          );
        }
        
        return (
          <span className="inline-flex items-center">
            <MdInfo className="w-6 h-6 text-amber-600 dark:text-amber-400" />
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
    {
      key: 'actions',
      header: 'Actions',
      render: (item: CustomerOnboarding) => (
        <div className="flex items-center gap-2">
          {item.status === 'completed' && (
            <>
              <button
                onClick={() => {
                  approveCustomerMutation.mutate(item._id);
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1"
                title="Approve"
              >
                <MdCheckCircle className="w-6 h-6" />
                Approve
              </button>
              <button
                onClick={() => {
                  const reason = prompt('Please provide a reason for rejection (optional):');
                  if (reason !== null) {
                    rejectCustomerMutation.mutate({ id: item._id, reason });
                  }
                }}
                className="px-3 py-1.5 bg-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive))]/90 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1"
                title="Reject"
              >
                <MdCancel className="w-6 h-6" />
                Reject
              </button>
            </>
          )}
          {item.status === 'approved' && (
            <span className="text-sm font-medium text-[hsl(var(--foreground))] font-semibold">
              Approved
            </span>
          )}
          {item.status === 'rejected' && (
            <span className="text-sm font-medium text-red-600 dark:text-red-400">
              Rejected
            </span>
          )}
        </div>
      ),
    },
  ];

  const vendorColumns = [
    {
      key: 'companyName',
      header: 'Company Name',
      render: (item: VendorOnboarding) => (
        <button
          onClick={() => handleViewDetails(item, 'vendor')}
          className="font-semibold text-[hsl(var(--foreground))] font-semibold hover:underline text-left"
        >
          {item.companyName}
        </button>
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
        const isApproved = item.status === 'approved';
        const isUnderReview = item.status === 'completed' || item.status === 'pending';
        
        if (isApproved) {
          return (
            <span className="inline-flex items-center" title="Approved">
              <MdCheckCircle className="w-6 h-6 text-[hsl(var(--foreground))] font-semibold" />
            </span>
          );
        }
        
        if (isUnderReview) {
          return (
            <span className="inline-flex items-center" title={item.status === 'completed' ? 'Under Review' : 'Pending'}>
              <MdInfo className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </span>
          );
        }
        
        if (item.status === 'rejected') {
          return (
            <span className="inline-flex items-center" title="Rejected">
              <MdCancel className="w-6 h-6 text-red-600 dark:text-red-400" />
            </span>
          );
        }
        
        return (
          <span className="inline-flex items-center">
            <MdInfo className="w-6 h-6 text-amber-600 dark:text-amber-400" />
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
    {
      key: 'actions',
      header: 'Actions',
      render: (item: VendorOnboarding) => (
        <div className="flex items-center gap-2">
          {item.status === 'completed' && (
            <>
              <button
                onClick={() => {
                  approveVendorMutation.mutate(item._id);
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1"
                title="Approve"
              >
                <MdCheckCircle className="w-6 h-6" />
                Approve
              </button>
              <button
                onClick={() => {
                  const reason = prompt('Please provide a reason for rejection (optional):');
                  if (reason !== null) {
                    rejectVendorMutation.mutate({ id: item._id, reason });
                  }
                }}
                className="px-3 py-1.5 bg-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive))]/90 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1"
                title="Reject"
              >
                <MdCancel className="w-6 h-6" />
                Reject
              </button>
            </>
          )}
          {item.status === 'approved' && (
            <span className="px-3 py-1.5 inline-flex items-center gap-1.5 text-sm font-medium rounded-lg bg-emerald-100 text-[hsl(var(--foreground))] font-semibold dark:bg-emerald-900/50">
              <MdCheckCircle className="w-4 h-4" />
              Approved
            </span>
          )}
          {item.status === 'rejected' && (
            <span className="px-3 py-1.5 inline-flex items-center gap-1.5 text-sm font-medium rounded-lg bg-red-100 text-[hsl(var(--foreground))] font-semibold dark:bg-red-900/50">
              <MdCancel className="w-6 h-6" />
              Rejected
            </span>
          )}
        </div>
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
              ? 'bg-blue-100 text-[hsl(var(--foreground))] font-semibold dark:bg-blue-900/50 ring-1 ring-blue-200 dark:ring-blue-800'
              : 'bg-purple-100 text-[hsl(var(--foreground))] font-semibold dark:bg-purple-900/50 ring-1 ring-purple-200 dark:ring-purple-800'
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
        <button
          onClick={() => handleViewDetails(item, item.type)}
          className="font-semibold text-[hsl(var(--foreground))] font-semibold hover:underline text-left"
        >
          {item.companyName}
        </button>
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
        const isApproved = item.status === 'approved';
        const isUnderReview = item.status === 'completed' || item.status === 'pending';
        
        if (isApproved) {
          return (
            <span className="inline-flex items-center" title="Approved">
              <MdCheckCircle className="w-6 h-6 text-[hsl(var(--foreground))] font-semibold" />
            </span>
          );
        }
        
        if (isUnderReview) {
          return (
            <span className="inline-flex items-center" title={item.status === 'completed' ? 'Under Review' : 'Pending'}>
              <MdInfo className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </span>
          );
        }
        
        if (item.status === 'rejected') {
          return (
            <span className="inline-flex items-center" title="Rejected">
              <MdCancel className="w-6 h-6 text-red-600 dark:text-red-400" />
            </span>
          );
        }
        
        return (
          <span className="inline-flex items-center">
            <MdInfo className="w-6 h-6 text-amber-600 dark:text-amber-400" />
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
    {
      key: 'actions',
      header: 'Actions',
      render: (item: any) => (
        <div className="flex items-center gap-2">
          {item.status === 'completed' && (
            <>
              <button
                onClick={() => {
                  if (item.type === 'customer') {
                    approveCustomerMutation.mutate(item._id);
                  } else {
                    approveVendorMutation.mutate(item._id);
                  }
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1"
                title="Approve"
              >
                <MdCheckCircle className="w-6 h-6" />
                Approve
              </button>
              <button
                onClick={() => {
                  const reason = prompt('Please provide a reason for rejection (optional):');
                  if (reason !== null) {
                    if (item.type === 'customer') {
                      rejectCustomerMutation.mutate({ id: item._id, reason });
                    } else {
                      rejectVendorMutation.mutate({ id: item._id, reason });
                    }
                  }
                }}
                className="px-3 py-1.5 bg-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive))]/90 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1"
                title="Reject"
              >
                <MdCancel className="w-6 h-6" />
                Reject
              </button>
            </>
          )}
          {item.status === 'approved' && (
            <span className="px-3 py-1.5 inline-flex items-center gap-1.5 text-sm font-medium rounded-lg bg-emerald-100 text-[hsl(var(--foreground))] font-semibold dark:bg-emerald-900/50">
              <MdCheckCircle className="w-4 h-4" />
              Approved
            </span>
          )}
          {item.status === 'rejected' && (
            <span className="px-3 py-1.5 inline-flex items-center gap-1.5 text-sm font-medium rounded-lg bg-red-100 text-[hsl(var(--foreground))] font-semibold dark:bg-red-900/50">
              <MdCancel className="w-6 h-6" />
              Rejected
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-4xl font-bold text-[hsl(var(--foreground))] mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Onboarding Data
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">
            View customer and vendor onboarding submissions
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-2 text-[hsl(var(--foreground))] font-semibold">
            <MdFilterList className="w-5 h-5" />
            <span>Filters:</span>
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="px-4 py-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-sm focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-all duration-200 font-medium"
          >
            <option value="all">All Types</option>
            <option value="customer">Customer Only</option>
            <option value="vendor">Vendor Only</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-sm focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-all duration-200 font-medium"
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
        <div className="p-12 text-center rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="inline-block w-8 h-8 border-4 border-gray-300 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading onboarding data...</p>
        </div>
      ) : (customerError || vendorError) ? (
        <div className="p-12 text-center rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 shadow-sm">
          <p className="text-red-600 dark:text-red-400 font-medium">
            Error loading onboarding data: {customerError?.message || vendorError?.message || 'Unknown error'}
          </p>
          <p className="mt-2 text-sm text-red-500 dark:text-red-500">
            Please check the browser console for more details.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filterType === 'all' && (
            <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
              <div className="p-6">
                <DataTable
                  columns={combinedColumns}
                  data={allOnboardings}
                  onRowClick={(item: any) => handleViewDetails(item, item.type)}
                  emptyMessage="No onboarding data found."
                />
              </div>
            </div>
          )}

          {(filterType === 'all' || filterType === 'customer') && (
            <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-4 flex items-center gap-2">
                  <MdBusiness className="w-6 h-6 text-[hsl(var(--foreground))] font-semibold" />
                  Customer Onboardings
                </h2>
                <DataTable
                  columns={customerColumns}
                  data={customerOnboardings || []}
                  onRowClick={(item: CustomerOnboarding) => handleViewDetails(item, 'customer')}
                  emptyMessage="No customer onboarding data found."
                />
              </div>
            </div>
          )}

          {(filterType === 'all' || filterType === 'vendor') && (
            <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-4 flex items-center gap-2">
                  <MdPerson className="w-6 h-6 text-[hsl(var(--foreground))] font-semibold" />
                  Vendor Onboardings
                </h2>
                <DataTable
                  columns={vendorColumns}
                  data={vendorOnboardings || []}
                  onRowClick={(item: VendorOnboarding) => handleViewDetails(item, 'vendor')}
                  emptyMessage="No vendor onboarding data found."
                />
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}


