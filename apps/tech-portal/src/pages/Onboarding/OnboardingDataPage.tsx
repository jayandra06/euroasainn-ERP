/**
 * Onboarding Data Page
 * Tech portal page to view customer and vendor onboarding submissions
 */

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '../../components/shared/DataTable';
import { Modal } from '../../components/shared/Modal';
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
  const [filterType, setFilterType] = useState<'all' | 'customer' | 'vendor'>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedOnboarding, setSelectedOnboarding] = useState<CustomerOnboarding | VendorOnboarding | null>(null);
  const [selectedType, setSelectedType] = useState<'customer' | 'vendor' | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      queryClient.invalidateQueries({ queryKey: ['onboarding-details'] });
      showToast('Customer onboarding approved successfully', 'success');
      setIsModalOpen(false);
      setSelectedOnboarding(null);
      setSelectedType(null);
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
      setIsModalOpen(false);
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
      queryClient.invalidateQueries({ queryKey: ['onboarding-details'] });
      showToast('Vendor onboarding approved successfully', 'success');
      setIsModalOpen(false);
      setSelectedOnboarding(null);
      setSelectedType(null);
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
      setIsModalOpen(false);
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to reject onboarding', 'error');
    },
  });

  // Fetch full onboarding details
  const { data: onboardingDetails } = useQuery({
    queryKey: ['onboarding-details', selectedOnboarding?._id, selectedType],
    queryFn: async () => {
      if (!selectedOnboarding || !selectedType) return null;
      const endpoint = selectedType === 'customer' 
        ? `/api/v1/tech/customer-onboardings/${selectedOnboarding._id}`
        : `/api/v1/tech/vendor-onboardings/${selectedOnboarding._id}`;
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch onboarding details');
      const data = await response.json();
      return data.data;
    },
    enabled: !!selectedOnboarding && !!selectedType && isModalOpen,
  });

  const handleViewDetails = async (item: CustomerOnboarding | VendorOnboarding, type: 'customer' | 'vendor') => {
    setSelectedOnboarding(item);
    setSelectedType(type);
    setIsModalOpen(true);
  };

  const handleApprove = () => {
    if (!selectedOnboarding || !selectedType) return;
    if (selectedType === 'customer') {
      approveCustomerMutation.mutate(selectedOnboarding._id);
    } else {
      approveVendorMutation.mutate(selectedOnboarding._id);
    }
  };

  const handleReject = () => {
    if (!selectedOnboarding || !selectedType) return;
    const reason = prompt('Please provide a reason for rejection (optional):');
    if (selectedType === 'customer') {
      rejectCustomerMutation.mutate({ id: selectedOnboarding._id, reason: reason || undefined });
    } else {
      rejectVendorMutation.mutate({ id: selectedOnboarding._id, reason: reason || undefined });
    }
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
                  emptyMessage="No vendor onboarding data found."
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Onboarding Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedOnboarding(null);
          setSelectedType(null);
        }}
        title={`${selectedType === 'customer' ? 'Customer' : 'Vendor'} Onboarding Details - ${selectedOnboarding?.companyName || ''}`}
        size="large"
      >
        {onboardingDetails ? (
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-4 pb-2 border-b border-[hsl(var(--border))]">
                Basic Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Company Name</label>
                  <p className="text-[hsl(var(--foreground))]">{onboardingDetails.companyName || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Contact Person</label>
                  <p className="text-[hsl(var(--foreground))]">{onboardingDetails.contactPerson || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Email</label>
                  <p className="text-[hsl(var(--foreground))]">{onboardingDetails.email || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Status</label>
                  <p className="text-[hsl(var(--foreground))]">
                    <span className={cn(
                      'px-2 py-1 rounded text-xs font-semibold',
                      onboardingDetails.status === 'approved' ? 'bg-emerald-100 text-[hsl(var(--foreground))] font-semibold dark:bg-emerald-900/50' :
                      onboardingDetails.status === 'rejected' ? 'bg-red-100 text-[hsl(var(--foreground))] font-semibold dark:bg-red-900/50' :
                      onboardingDetails.status === 'completed' ? 'bg-blue-100 text-[hsl(var(--foreground))] font-semibold dark:bg-blue-900/50' :
                      'bg-amber-100 text-[hsl(var(--foreground))] font-semibold dark:bg-amber-900/50'
                    )}>
                      {onboardingDetails.status?.toUpperCase() || 'N/A'}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-4 pb-2 border-b border-[hsl(var(--border))]">
                Contact Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Mobile Phone</label>
                  <p className="text-[hsl(var(--foreground))]">
                    {onboardingDetails.mobileCountryCode || ''} {onboardingDetails.mobilePhone || 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Desk Phone</label>
                  <p className="text-[hsl(var(--foreground))]">
                    {onboardingDetails.deskCountryCode || ''} {onboardingDetails.deskPhone || 'N/A'}
                  </p>
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Address</label>
                  <p className="text-[hsl(var(--foreground))]">
                    {onboardingDetails.address1 || 'N/A'}
                    {onboardingDetails.address2 && `, ${onboardingDetails.address2}`}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-[hsl(var(--muted-foreground))]">City</label>
                  <p className="text-[hsl(var(--foreground))]">{onboardingDetails.city || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Province</label>
                  <p className="text-[hsl(var(--foreground))]">{onboardingDetails.province || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Postal Code</label>
                  <p className="text-[hsl(var(--foreground))]">{onboardingDetails.postalCode || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Country</label>
                  <p className="text-[hsl(var(--foreground))]">{onboardingDetails.country || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Vendor-specific fields */}
            {selectedType === 'vendor' && (
              <>
                {onboardingDetails.managingDirector && (
                  <div>
                    <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-4 pb-2 border-b border-[hsl(var(--border))]">
                      Managing Director
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Name</label>
                        <p className="text-[hsl(var(--foreground))]">{onboardingDetails.managingDirector || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Email</label>
                        <p className="text-[hsl(var(--foreground))]">{onboardingDetails.managingDirectorEmail || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Phone</label>
                        <p className="text-[hsl(var(--foreground))]">{onboardingDetails.managingDirectorPhone || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                )}
                {onboardingDetails.salesManager && (
                  <div>
                    <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-4 pb-2 border-b border-[hsl(var(--border))]">
                      Sales Manager
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Name</label>
                        <p className="text-[hsl(var(--foreground))]">{onboardingDetails.salesManager || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Email</label>
                        <p className="text-[hsl(var(--foreground))]">{onboardingDetails.salesManagerEmail || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                )}
                {(onboardingDetails.brands?.length > 0 || onboardingDetails.categories?.length > 0 || onboardingDetails.models?.length > 0) && (
                  <div>
                    <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-4 pb-2 border-b border-[hsl(var(--border))]">
                      Product Information
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      {onboardingDetails.brands?.length > 0 && (
                        <div>
                          <label className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Brands</label>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {onboardingDetails.brands.map((brand: string, i: number) => (
                              <span key={i} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-[hsl(var(--foreground))] font-semibold rounded text-xs">
                                {brand}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {onboardingDetails.categories?.length > 0 && (
                        <div>
                          <label className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Categories</label>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {onboardingDetails.categories.map((cat: string, i: number) => (
                              <span key={i} className="px-2 py-1 bg-purple-100 dark:bg-purple-900/50 text-[hsl(var(--foreground))] font-semibold rounded text-xs">
                                {cat}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {onboardingDetails.models?.length > 0 && (
                        <div>
                          <label className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Models</label>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {onboardingDetails.models.map((model: string, i: number) => (
                              <span key={i} className="px-2 py-1 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 rounded text-xs">
                                {model}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Customer-specific fields */}
            {selectedType === 'customer' && onboardingDetails.vessels && (
              <div>
                <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-4 pb-2 border-b border-[hsl(var(--border))]">
                  Vessel Information
                </h3>
                <div>
                  <label className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Number of Vessels</label>
                  <p className="text-[hsl(var(--foreground))]">{onboardingDetails.vessels || 'N/A'}</p>
                </div>
              </div>
            )}

            {/* Banking Information */}
            <div>
              <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-4 pb-2 border-b border-[hsl(var(--border))]">
                Banking Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Account Name</label>
                  <p className="text-[hsl(var(--foreground))]">{onboardingDetails.accountName || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Bank Name</label>
                  <p className="text-[hsl(var(--foreground))]">{onboardingDetails.bankName || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-[hsl(var(--muted-foreground))]">IBAN</label>
                  <p className="text-[hsl(var(--foreground))]">{onboardingDetails.iban || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-[hsl(var(--muted-foreground))]">SWIFT</label>
                  <p className="text-[hsl(var(--foreground))]">{onboardingDetails.swift || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {onboardingDetails.status === 'completed' && (
              <div className="flex items-center justify-end gap-4 pt-4 border-t border-[hsl(var(--border))]">
                <button
                  onClick={handleReject}
                  disabled={rejectCustomerMutation.isPending || rejectVendorMutation.isPending}
                  className="px-4 py-2 bg-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive))]/90 disabled:opacity-50 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  <MdCancel className="w-5 h-5" />
                  Reject
                </button>
                <button
                  onClick={handleApprove}
                  disabled={approveCustomerMutation.isPending || approveVendorMutation.isPending}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  <MdCheckCircle className="w-6 h-6" />
                  Approve
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[hsl(var(--border))] border-t-[hsl(var(--primary))]"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading onboarding details...</p>
          </div>
        )}
      </Modal>
    </div>
  );
}


