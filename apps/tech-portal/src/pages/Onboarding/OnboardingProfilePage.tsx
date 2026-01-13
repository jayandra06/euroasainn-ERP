// src/pages/Onboarding/OnboardingProfilePage.tsx
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../components/shared/Toast';
import {
  MdArrowBack,
  MdBusiness,
  MdPerson,
  MdEmail,
  MdPhone,
  MdLocationOn,
  MdAccountBalance,
  MdCheckCircle,
  MdCancel,
  MdInfo,
  MdDirectionsBoat,
  MdWarehouse,
  MdLocalShipping,
} from 'react-icons/md';
import { cn } from '../../lib/utils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface CustomerOnboarding {
  _id: string;
  organizationId?: string;
  companyName: string;
  contactPerson: string;
  email: string;
  mobileCountryCode: string;
  mobilePhone: string;
  deskCountryCode: string;
  deskPhone: string;
  address1: string;
  address2?: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  vessels: number;
  taxId: string;
  accountName: string;
  bankName: string;
  iban: string;
  swift?: string;
  invoiceEmail: string;
  billingAddress1: string;
  billingAddress2?: string;
  billingCity: string;
  billingProvince: string;
  billingPostal: string;
  billingCountry: string;
  status: 'pending' | 'completed' | 'approved' | 'rejected';
  submittedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface VendorOnboarding {
  _id: string;
  organizationId?: string;
  companyName: string;
  contactPerson: string;
  email: string;
  mobileCountryCode: string;
  mobilePhone: string;
  deskCountryCode: string;
  deskPhone: string;
  address1: string;
  address2?: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  taxId: string;
  accountName: string;
  bankName: string;
  iban: string;
  swift?: string;
  invoiceEmail: string;
  billingAddress1: string;
  billingAddress2?: string;
  billingCity: string;
  billingProvince: string;
  billingPostal: string;
  billingCountry: string;
  brands?: string[];
  categories?: string[];
  models?: string[];
  warehouseAddress: string;
  managingDirector: string;
  managingDirectorEmail: string;
  managingDirectorPhone: string;
  managingDirectorDeskPhone: string;
  port: string;
  salesManager: string;
  salesManagerEmail: string;
  salesManagerPhone: string;
  salesManagerDeskPhone: string;
  logisticService: string;
  status: 'pending' | 'completed' | 'approved' | 'rejected';
  submittedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export function OnboardingProfilePage() {
  const { id, type } = useParams<{ id: string; type: 'customer' | 'vendor' }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();

  // Fetch onboarding details
  const { data: onboardingData, isLoading, error } = useQuery<CustomerOnboarding | VendorOnboarding>({
    queryKey: ['onboarding-details', id, type],
    queryFn: async () => {
      const endpoint = type === 'customer'
        ? `/api/v1/tech/customer-onboardings/${id}`
        : `/api/v1/tech/vendor-onboardings/${id}`;
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch onboarding details');
      const data = await response.json();
      return data.data;
    },
    enabled: !!id && !!type,
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async () => {
      const endpoint = type === 'customer'
        ? `/api/v1/tech/customer-onboardings/${id}/approve`
        : `/api/v1/tech/vendor-onboardings/${id}/approve`;
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP ${response.status}` }));
        throw new Error(errorData.error || 'Failed to approve onboarding');
      }
      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-details', id, type] });
      queryClient.invalidateQueries({ queryKey: ['customer-onboardings'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-onboardings'] });
      toast.success(`${type === 'customer' ? 'Customer' : 'Vendor'} onboarding approved successfully!`);
      if (data?.data?.organizationId) {
        window.location.href = `/licenses/create?organizationId=${data.data.organizationId}&type=${type}`;
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to approve onboarding');
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async (reason?: string) => {
      const endpoint = type === 'customer'
        ? `/api/v1/tech/customer-onboardings/${id}/reject`
        : `/api/v1/tech/vendor-onboardings/${id}/reject`;
      
      const response = await fetch(`${API_URL}${endpoint}`, {
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
      queryClient.invalidateQueries({ queryKey: ['onboarding-details', id, type] });
      queryClient.invalidateQueries({ queryKey: ['customer-onboardings'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-onboardings'] });
      toast.success(`${type === 'customer' ? 'Customer' : 'Vendor'} onboarding rejected successfully!`);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reject onboarding');
    },
  });

  const handleApprove = () => {
    if (window.confirm(`Are you sure you want to approve this ${type} onboarding?`)) {
      approveMutation.mutate();
    }
  };

  const handleReject = () => {
    const reason = window.prompt('Please provide a reason for rejection (optional):');
    if (reason !== null) {
      if (window.confirm(`Are you sure you want to reject this ${type} onboarding?`)) {
        rejectMutation.mutate(reason || undefined);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-[hsl(var(--border))] border-t-[hsl(var(--primary))] rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !onboardingData) {
    return (
      <div className="p-12 text-center">
        <p className="text-[hsl(var(--destructive))] text-lg font-medium">
          {error ? 'Failed to load onboarding details' : 'Onboarding not found'}
        </p>
        <button
          onClick={() => navigate('/onboarding-data')}
          className="mt-4 px-6 py-3 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-lg hover:opacity-90 transition"
        >
          Back to Onboarding Data
        </button>
      </div>
    );
  }

  const isCustomer = type === 'customer';
  const onboarding = onboardingData;

  return (
    <div className="w-full space-y-8 py-6 px-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/onboarding-data')}
            className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors"
          >
            <MdArrowBack className="w-6 h-6 text-[hsl(var(--muted-foreground))]" />
          </button>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {onboarding.companyName}
            </h1>
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <span
                className={cn(
                  'px-4 py-1.5 text-xs font-bold rounded-full ring-1',
                  isCustomer
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 ring-blue-200 dark:ring-blue-800'
                    : 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 ring-purple-200 dark:ring-purple-800'
                )}
              >
                {isCustomer ? 'Customer' : 'Vendor'} Onboarding
              </span>
              <span
                className={cn(
                  'px-4 py-1.5 text-xs font-bold rounded-full ring-1',
                  onboarding.status === 'approved'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 ring-emerald-200 dark:ring-emerald-800'
                    : onboarding.status === 'rejected'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/50 ring-red-200 dark:ring-red-800'
                    : onboarding.status === 'completed'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 ring-blue-200 dark:ring-blue-800'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 ring-amber-200 dark:ring-amber-800'
                )}
              >
                {onboarding.status?.toUpperCase() || 'PENDING'}
              </span>
              {onboarding.submittedAt && (
                <span className="text-sm text-[hsl(var(--muted-foreground))]">
                  Submitted {new Date(onboarding.submittedAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
        {onboarding.status === 'completed' && (
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleReject}
              disabled={rejectMutation.isPending}
              className="px-6 py-3 bg-red-600 text-white rounded-xl flex items-center gap-2 shadow-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {rejectMutation.isPending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <MdCancel className="w-5 h-5" /> Reject
                </>
              )}
            </button>
            <button
              onClick={handleApprove}
              disabled={approveMutation.isPending}
              className="px-6 py-3 bg-emerald-600 text-white rounded-xl flex items-center gap-2 shadow-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {approveMutation.isPending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <MdCheckCircle className="w-5 h-5" /> Approve
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="p-8 rounded-2xl bg-[hsl(var(--card))]/80 backdrop-blur-xl border border-[hsl(var(--border))]/50 shadow-xl space-y-8">
        {/* Basic Information */}
        <div className="p-6 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MdInfo className="w-5 h-5 text-gray-600 dark:text-gray-400" /> Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Company Name</span>
              <span className="font-medium">{onboarding.companyName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Contact Person</span>
              <span className="font-medium">{onboarding.contactPerson}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Email</span>
              <span className="font-medium">{onboarding.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Tax ID</span>
              <span className="font-medium">{onboarding.taxId}</span>
            </div>
            {isCustomer && 'vessels' in onboarding && (
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Number of Vessels</span>
                <span className="font-medium">{onboarding.vessels}</span>
              </div>
            )}
          </div>
        </div>

        {/* Contact Information */}
        <div className="p-6 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MdPhone className="w-5 h-5 text-gray-600 dark:text-gray-400" /> Contact Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Mobile Phone</span>
              <span className="font-medium">{onboarding.mobileCountryCode} {onboarding.mobilePhone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Desk Phone</span>
              <span className="font-medium">{onboarding.deskCountryCode} {onboarding.deskPhone}</span>
            </div>
            <div className="md:col-span-2">
              <div className="flex justify-between mb-2">
                <span className="text-gray-500 dark:text-gray-400">Address</span>
              </div>
              <p className="font-medium">
                {onboarding.address1}
                {onboarding.address2 && `, ${onboarding.address2}`}
                <br />
                {onboarding.city}, {onboarding.province} {onboarding.postalCode}
                <br />
                {onboarding.country}
              </p>
            </div>
          </div>
        </div>

        {/* Vendor-Specific Information */}
        {!isCustomer && 'managingDirector' in onboarding && (
          <>
            <div className="p-6 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MdPerson className="w-5 h-5 text-gray-600 dark:text-gray-400" /> Managing Director
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Name</span>
                  <span className="font-medium">{onboarding.managingDirector}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Email</span>
                  <span className="font-medium">{onboarding.managingDirectorEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Mobile Phone</span>
                  <span className="font-medium">{onboarding.managingDirectorPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Desk Phone</span>
                  <span className="font-medium">{onboarding.managingDirectorDeskPhone}</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MdPerson className="w-5 h-5 text-gray-600 dark:text-gray-400" /> Sales Manager
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Name</span>
                  <span className="font-medium">{onboarding.salesManager}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Email</span>
                  <span className="font-medium">{onboarding.salesManagerEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Mobile Phone</span>
                  <span className="font-medium">{onboarding.salesManagerPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Desk Phone</span>
                  <span className="font-medium">{onboarding.salesManagerDeskPhone}</span>
                </div>
              </div>
            </div>

            {(onboarding.brands?.length > 0 || onboarding.categories?.length > 0 || onboarding.models?.length > 0) && (
              <div className="p-6 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <MdBusiness className="w-5 h-5 text-gray-600 dark:text-gray-400" /> Product Information
                </h3>
                <div className="space-y-4">
                  {onboarding.brands && onboarding.brands.length > 0 && (
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Brands</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {onboarding.brands.map((brand, i) => (
                          <span key={i} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 rounded-full text-xs font-medium">
                            {brand}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {onboarding.categories && onboarding.categories.length > 0 && (
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Categories</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {onboarding.categories.map((cat, i) => (
                          <span key={i} className="px-3 py-1 bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 rounded-full text-xs font-medium">
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {onboarding.models && onboarding.models.length > 0 && (
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Models</span>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {onboarding.models.map((model, i) => (
                          <span key={i} className="px-3 py-1 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 rounded-full text-xs font-medium">
                            {model}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="p-6 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MdWarehouse className="w-5 h-5 text-gray-600 dark:text-gray-400" /> Additional Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Warehouse Address</span>
                  <span className="font-medium">{onboarding.warehouseAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Port</span>
                  <span className="font-medium">{onboarding.port}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Logistic Service</span>
                  <span className="font-medium">{onboarding.logisticService}</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Banking Information */}
        <div className="p-6 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MdAccountBalance className="w-5 h-5 text-gray-600 dark:text-gray-400" /> Banking Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Account Name</span>
              <span className="font-medium">{onboarding.accountName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Bank Name</span>
              <span className="font-medium">{onboarding.bankName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">IBAN</span>
              <span className="font-medium font-mono text-xs">{onboarding.iban}</span>
            </div>
            {onboarding.swift && (
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">SWIFT</span>
                <span className="font-medium font-mono text-xs">{onboarding.swift}</span>
              </div>
            )}
          </div>
        </div>

        {/* Billing Information */}
        <div className="p-6 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MdEmail className="w-5 h-5 text-gray-600 dark:text-gray-400" /> Billing Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Invoice Email</span>
              <span className="font-medium">{onboarding.invoiceEmail}</span>
            </div>
            <div className="md:col-span-2">
              <div className="flex justify-between mb-2">
                <span className="text-gray-500 dark:text-gray-400">Billing Address</span>
              </div>
              <p className="font-medium">
                {onboarding.billingAddress1}
                {onboarding.billingAddress2 && `, ${onboarding.billingAddress2}`}
                <br />
                {onboarding.billingCity}, {onboarding.billingProvince} {onboarding.billingPostal}
                <br />
                {onboarding.billingCountry}
              </p>
            </div>
          </div>
        </div>

        {/* Status Information */}
        <div className="p-6 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MdInfo className="w-5 h-5 text-gray-600 dark:text-gray-400" /> Status Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {onboarding.submittedAt && (
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Submitted At</span>
                <span className="font-medium">{new Date(onboarding.submittedAt).toLocaleString()}</span>
              </div>
            )}
            {onboarding.approvedAt && (
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Approved At</span>
                <span className="font-medium">{new Date(onboarding.approvedAt).toLocaleString()}</span>
              </div>
            )}
            {onboarding.rejectedAt && (
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Rejected At</span>
                <span className="font-medium">{new Date(onboarding.rejectedAt).toLocaleString()}</span>
              </div>
            )}
            {onboarding.rejectionReason && (
              <div className="md:col-span-2">
                <span className="text-gray-500 dark:text-gray-400">Rejection Reason</span>
                <p className="font-medium mt-1 text-red-600 dark:text-red-400">{onboarding.rejectionReason}</p>
              </div>
            )}
            {onboarding.createdAt && (
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Created At</span>
                <span className="font-medium">{new Date(onboarding.createdAt).toLocaleString()}</span>
              </div>
            )}
            {onboarding.updatedAt && (
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">Last Updated</span>
                <span className="font-medium">{new Date(onboarding.updatedAt).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
