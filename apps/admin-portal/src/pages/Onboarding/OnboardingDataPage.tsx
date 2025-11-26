/**
 * Onboarding Data Page
 * Admin portal page to view customer and vendor onboarding submissions
 */

import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { DataTable } from '../../components/shared/DataTable';
import { useToast } from '../../components/shared/Toast';
import { MdFilterList, MdBusiness, MdPerson, MdSearch, MdRefresh, MdDownload, MdCheckCircle, MdCancel } from 'react-icons/md';
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
  const queryClient = useQueryClient();
  const [filterType, setFilterType] = useState<'all' | 'customer' | 'vendor'>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    queryClient.invalidateQueries({ queryKey: ['customer-onboardings'] });
    queryClient.invalidateQueries({ queryKey: ['vendor-onboardings'] });
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('Onboarding data refreshed', 'success');
    }, 1000);
  };

  const handleExport = () => {
    showToast('Export functionality will be implemented soon', 'info');
    // TODO: Implement export functionality
  };

  // Approve customer onboarding mutation
  const approveCustomerMutation = useMutation({
    mutationFn: async (id: string) => {
      const url = API_URL ? `${API_URL}/api/v1/admin/customer-onboardings/${id}/approve` : `/api/v1/admin/customer-onboardings/${id}/approve`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      const text = await response.text();
      
      if (!response.ok) {
        let errorMessage = 'Failed to approve onboarding';
        try {
          if (text && isJson) {
            const error = JSON.parse(text);
            errorMessage = error.error || errorMessage;
          } else if (text) {
            errorMessage = text;
          }
        } catch (e) {
          // If parsing fails, use default error message
        }
        throw new Error(errorMessage);
      }

      try {
        if (text && isJson) {
          return JSON.parse(text);
        }
        return {};
      } catch (e) {
        return {};
      }
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['customer-onboardings'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-onboardings'] });
      queryClient.invalidateQueries({ queryKey: ['organizations-with-licenses'] });
      showToast('Onboarding approved successfully. Please create license with pricing.', 'success');
      // Redirect to license creation page with organizationId
      if (data?.data?.organizationId) {
        window.location.href = `/licenses/create?organizationId=${data.data.organizationId}&type=customer`;
      }
    },
    onError: (error: Error) => {
      console.error('Approve customer onboarding error:', error);
      const errorMessage = error.message || 'Failed to approve onboarding';
      showToast(errorMessage, 'error');
    },
  });

  // Reject customer onboarding mutation
  const rejectCustomerMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const url = API_URL ? `${API_URL}/api/v1/admin/customer-onboardings/${id}/reject` : `/api/v1/admin/customer-onboardings/${id}/reject`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ rejectionReason: reason }),
      });

      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      const text = await response.text();
      
      if (!response.ok) {
        let errorMessage = 'Failed to reject onboarding';
        try {
          if (text && isJson) {
            const error = JSON.parse(text);
            errorMessage = error.error || errorMessage;
          } else if (text) {
            errorMessage = text;
          }
        } catch (e) {
          // If parsing fails, use default error message
        }
        throw new Error(errorMessage);
      }

      try {
        if (text && isJson) {
          return JSON.parse(text);
        }
        return {};
      } catch (e) {
        return {};
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-onboardings'] });
      showToast('Onboarding rejected successfully', 'success');
    },
    onError: (error: Error) => {
      console.error('Reject onboarding error:', error);
      const errorMessage = error.message || 'Failed to reject onboarding';
      showToast(errorMessage, 'error');
    },
  });

  // Approve vendor onboarding mutation
  const approveVendorMutation = useMutation({
    mutationFn: async (id: string) => {
      const url = API_URL ? `${API_URL}/api/v1/admin/vendor-onboardings/${id}/approve` : `/api/v1/admin/vendor-onboardings/${id}/approve`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      const text = await response.text();
      
      if (!response.ok) {
        let errorMessage = 'Failed to approve onboarding';
        try {
          if (text && isJson) {
            const error = JSON.parse(text);
            errorMessage = error.error || errorMessage;
          } else if (text) {
            errorMessage = text;
          }
        } catch (e) {
          // If parsing fails, use default error message
        }
        throw new Error(errorMessage);
      }

      try {
        if (text && isJson) {
          return JSON.parse(text);
        }
        return {};
      } catch (e) {
        return {};
      }
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-onboardings'] });
      queryClient.invalidateQueries({ queryKey: ['customer-onboardings'] });
      queryClient.invalidateQueries({ queryKey: ['organizations-with-licenses'] });
      showToast('Onboarding approved successfully. Please create license with pricing.', 'success');
      // Redirect to license creation page with organizationId
      if (data?.data?.organizationId) {
        window.location.href = `/licenses/create?organizationId=${data.data.organizationId}&type=vendor`;
      }
    },
    onError: (error: Error) => {
      console.error('Approve customer onboarding error:', error);
      const errorMessage = error.message || 'Failed to approve onboarding';
      showToast(errorMessage, 'error');
    },
  });

  // Reject vendor onboarding mutation
  const rejectVendorMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const url = API_URL ? `${API_URL}/api/v1/admin/vendor-onboardings/${id}/reject` : `/api/v1/admin/vendor-onboardings/${id}/reject`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({ rejectionReason: reason }),
      });

      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      const text = await response.text();
      
      if (!response.ok) {
        let errorMessage = 'Failed to reject onboarding';
        try {
          if (text && isJson) {
            const error = JSON.parse(text);
            errorMessage = error.error || errorMessage;
          } else if (text) {
            errorMessage = text;
          }
        } catch (e) {
          // If parsing fails, use default error message
        }
        throw new Error(errorMessage);
      }

      try {
        if (text && isJson) {
          return JSON.parse(text);
        }
        return {};
      } catch (e) {
        return {};
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-onboardings'] });
      showToast('Onboarding rejected successfully', 'success');
    },
    onError: (error: Error) => {
      console.error('Reject onboarding error:', error);
      const errorMessage = error.message || 'Failed to reject onboarding';
      showToast(errorMessage, 'error');
    },
  });

  const handleApproveCustomer = (id: string) => {
    if (window.confirm('Are you sure you want to approve this onboarding? A license will be created automatically.')) {
      approveCustomerMutation.mutate(id);
    }
  };

  const handleRejectCustomer = (id: string) => {
    const reason = window.prompt('Please provide a reason for rejection (optional):');
    if (reason !== null) {
      rejectCustomerMutation.mutate({ id, reason: reason || undefined });
    }
  };

  const handleApproveVendor = (id: string) => {
    if (window.confirm('Are you sure you want to approve this onboarding? A license will be created automatically.')) {
      approveVendorMutation.mutate(id);
    }
  };

  const handleRejectVendor = (id: string) => {
    const reason = window.prompt('Please provide a reason for rejection (optional):');
    if (reason !== null) {
      rejectVendorMutation.mutate({ id, reason: reason || undefined });
    }
  };

  // Fetch customer onboardings
  const { data: customerOnboardings, isLoading: customerLoading, error: customerError } = useQuery<CustomerOnboarding[]>({
    queryKey: ['customer-onboardings', filterStatus],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (filterStatus !== 'all') {
          params.append('status', filterStatus);
        }

        const url = API_URL ? `${API_URL}/api/v1/admin/customer-onboardings?${params}` : `/api/v1/admin/customer-onboardings?${params}`;
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: 'Failed to fetch customer onboardings' }));
          console.error('Failed to fetch customer onboardings:', error);
          throw new Error(error.error || 'Failed to fetch customer onboardings');
        }
        const data = await response.json();
        console.log('Customer onboardings data:', data);
        return data.data || [];
      } catch (error: any) {
        console.error('Error fetching customer onboardings:', error);
        throw error;
      }
    },
    enabled: filterType === 'all' || filterType === 'customer',
    retry: 1,
  });

  // Fetch vendor onboardings
  const { data: vendorOnboardings, isLoading: vendorLoading, error: vendorError } = useQuery<VendorOnboarding[]>({
    queryKey: ['vendor-onboardings', filterStatus],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (filterStatus !== 'all') {
          params.append('status', filterStatus);
        }

        const url = API_URL ? `${API_URL}/api/v1/admin/vendor-onboardings?${params}` : `/api/v1/admin/vendor-onboardings?${params}`;
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: 'Failed to fetch vendor onboardings' }));
          console.error('Failed to fetch vendor onboardings:', error);
          throw new Error(error.error || 'Failed to fetch vendor onboardings');
        }
        const data = await response.json();
        console.log('Vendor onboardings data:', data);
        return data.data || [];
      } catch (error: any) {
        console.error('Error fetching vendor onboardings:', error);
        throw error;
      }
    },
    enabled: filterType === 'all' || filterType === 'vendor',
    retry: 1,
  });

  const isLoading = customerLoading || vendorLoading;

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

  // Filter by search query
  const filteredCustomerOnboardings = useMemo(() => {
    if (!searchQuery) return customerOnboardings || [];
    const query = searchQuery.toLowerCase();
    return (customerOnboardings || []).filter(item =>
      item.companyName.toLowerCase().includes(query) ||
      item.contactPerson.toLowerCase().includes(query) ||
      item.email.toLowerCase().includes(query)
    );
  }, [customerOnboardings, searchQuery]);

  const filteredVendorOnboardings = useMemo(() => {
    if (!searchQuery) return vendorOnboardings || [];
    const query = searchQuery.toLowerCase();
    return (vendorOnboardings || []).filter(item =>
      item.companyName.toLowerCase().includes(query) ||
      item.contactPerson.toLowerCase().includes(query) ||
      item.email.toLowerCase().includes(query)
    );
  }, [vendorOnboardings, searchQuery]);

  const filteredAllOnboardings = useMemo(() => {
    if (!searchQuery) return allOnboardings;
    const query = searchQuery.toLowerCase();
    return allOnboardings.filter(item =>
      item.companyName.toLowerCase().includes(query) ||
      item.contactPerson.toLowerCase().includes(query) ||
      item.email.toLowerCase().includes(query)
    );
  }, [allOnboardings, searchQuery]);

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
    {
      key: 'actions',
      header: 'Actions',
      render: (item: CustomerOnboarding) => {
        const canApproveReject = item.status === 'completed' || item.status === 'pending';
        const isProcessing = approveCustomerMutation.isPending || rejectCustomerMutation.isPending;

        if (!canApproveReject) {
          return <span className="text-gray-400 dark:text-gray-600 text-sm">-</span>;
        }

        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleApproveCustomer(item._id)}
              disabled={isProcessing}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MdCheckCircle className="w-4 h-4" />
              Approve
            </button>
            <button
              onClick={() => handleRejectCustomer(item._id)}
              disabled={isProcessing}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MdCancel className="w-4 h-4" />
              Reject
            </button>
          </div>
        );
      },
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
    {
      key: 'actions',
      header: 'Actions',
      render: (item: VendorOnboarding) => {
        const canApproveReject = item.status === 'completed' || item.status === 'pending';
        const isProcessing = approveVendorMutation.isPending || rejectVendorMutation.isPending;

        if (!canApproveReject) {
          return <span className="text-gray-400 dark:text-gray-600 text-sm">-</span>;
        }

        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleApproveVendor(item._id)}
              disabled={isProcessing}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MdCheckCircle className="w-4 h-4" />
              Approve
            </button>
            <button
              onClick={() => handleRejectVendor(item._id)}
              disabled={isProcessing}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MdCancel className="w-4 h-4" />
              Reject
            </button>
          </div>
        );
      },
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
    {
      key: 'actions',
      header: 'Actions',
      render: (item: any) => {
        const canApproveReject = item.status === 'completed' || item.status === 'pending';
        const isProcessing = approveCustomerMutation.isPending || rejectCustomerMutation.isPending || approveVendorMutation.isPending || rejectVendorMutation.isPending;

        if (!canApproveReject) {
          return <span className="text-gray-400 dark:text-gray-600 text-sm">-</span>;
        }

        const handleApprove = () => {
          if (item.type === 'customer') {
            handleApproveCustomer(item._id);
          } else {
            handleApproveVendor(item._id);
          }
        };

        const handleReject = () => {
          if (item.type === 'customer') {
            handleRejectCustomer(item._id);
          } else {
            handleRejectVendor(item._id);
          }
        };

        return (
          <div className="flex items-center gap-2">
            <button
              onClick={handleApprove}
              disabled={isProcessing}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MdCheckCircle className="w-4 h-4" />
              Approve
            </button>
            <button
              onClick={handleReject}
              disabled={isProcessing}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MdCancel className="w-4 h-4" />
              Reject
            </button>
          </div>
        );
      },
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
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MdRefresh className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
            Refresh
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            <MdDownload className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-6 rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 shadow-lg">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus-within:border-blue-500 dark:focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
            <MdSearch className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search by company name, contact person, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-sm text-gray-700 dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
          </div>

          {/* Filters */}
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
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {filteredAllOnboardings.length} onboarding{filteredAllOnboardings.length !== 1 ? 's' : ''}
                </p>
              </div>
              <DataTable
                columns={combinedColumns}
                data={filteredAllOnboardings}
                emptyMessage="No onboarding data found."
              />
            </div>
          )}

          {(filterType === 'all' || filterType === 'customer') && (
            <div className="p-6 rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <MdBusiness className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  Customer Onboardings
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {filteredCustomerOnboardings.length} result{filteredCustomerOnboardings.length !== 1 ? 's' : ''}
                </p>
              </div>
              {customerError && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                  Error loading customer onboardings: {customerError instanceof Error ? customerError.message : 'Unknown error'}
                </div>
              )}
              <DataTable
                columns={customerColumns}
                data={filteredCustomerOnboardings}
                emptyMessage="No customer onboarding data found."
              />
            </div>
          )}

          {(filterType === 'all' || filterType === 'vendor') && (
            <div className="p-6 rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <MdPerson className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  Vendor Onboardings
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {filteredVendorOnboardings.length} result{filteredVendorOnboardings.length !== 1 ? 's' : ''}
                </p>
              </div>
              {vendorError && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                  Error loading vendor onboardings: {vendorError instanceof Error ? vendorError.message : 'Unknown error'}
                </div>
              )}
              <DataTable
                columns={vendorColumns}
                data={filteredVendorOnboardings}
                emptyMessage="No vendor onboarding data found."
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}



