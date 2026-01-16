// src/pages/Organizations/OrganizationProfilePage.tsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '../../components/shared/DataTable';
import { Modal } from '../../components/shared/Modal';
import { OrganizationForm } from './OrganizationForm';
import { useToast } from '../../components/shared/Toast';
import { useAuth } from '../../context/AuthContext';
import {
  MdArrowBack,
  MdPeople,
  MdVpnKey,
  MdDirectionsBoat,
  MdBusiness,
  MdBusinessCenter,
  MdEdit,
  MdDelete,
  MdAccessTime,
  MdInfo,
  MdEmail,
  MdAdminPanelSettings,
  MdVisibility,
} from 'react-icons/md';
import { cn } from '../../lib/utils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Organization {
  _id: string;
  name: string;
  type: string;
  portalType: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  licenseKey?: string;
  metadata?: Record<string, any>;
  invitedBy?: 'admin' | 'tech' | 'customer';
  invitedByOrganizationId?: string;
  isAdminInvited?: boolean;
  visibleToCustomerIds?: string[];
}

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  lastLogin?: string;
  organizationId?: string; // For filtering
}

interface License {
  _id: string;
  status: string;
  expiresAt?: string;
  issuedAt?: string;
  usageLimits?: { users?: number; vessels?: number; businessUnits?: number };
  currentUsage?: { users?: number; vessels?: number; businessUnits?: number };
}

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

export function OrganizationProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const { permissions } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'license' | 'vessels' | 'business-units'>('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const canUpdate = permissions.includes('organizationsUpdate');
  const canDelete = permissions.includes('organizationsDelete');

  // Fetch organization
  const { data: organization, isLoading: orgLoading } = useQuery<Organization>({
    queryKey: ['organization', id],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/v1/tech/organizations/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
      });
      if (!res.ok) throw new Error('Failed to fetch organization');
      const json = await res.json();
      return json.data;
    },
    enabled: !!id,
  });

  // Fetch and filter users (only those belonging to this org)
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['org-users', id],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/v1/tech/users?organizationId=${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
      });
      if (!res.ok) return [];

      const json = await res.json();
      const allUsers: User[] = json.data || [];

      // Client-side filter — adjust field if needed (e.g., organization?._id)
      return allUsers.filter((user) => user.organizationId === id);
    },
    enabled: !!id,
  });

  // Fetch license
  const { data: license, isLoading: licenseLoading } = useQuery<License | null>({
    queryKey: ['org-license', id],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/v1/tech/licenses?organizationId=${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data?.[0] || null;
    },
    enabled: !!id,
  });

  // Fetch customer onboarding data
  const { data: customerOnboarding, isLoading: customerOnboardingLoading } = useQuery<CustomerOnboarding | null>({
    queryKey: ['customer-onboarding', id],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/v1/tech/customer-onboardings?organizationId=${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data?.[0] || null;
    },
    enabled: !!id && organization?.type === 'customer',
  });

  // Fetch vendor onboarding data
  const { data: vendorOnboarding, isLoading: vendorOnboardingLoading } = useQuery<VendorOnboarding | null>({
    queryKey: ['vendor-onboarding', id],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/v1/tech/vendor-onboardings?organizationId=${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data?.[0] || null;
    },
    enabled: !!id && organization?.type === 'vendor',
  });

  // Placeholder data
  const vessels = [];
  const businessUnits = [];

  const deleteMutation = useMutation({
    mutationFn: async (orgId: string) => {
      const response = await fetch(`${API_URL}/api/v1/tech/organizations/${orgId}`, {
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
      queryClient.invalidateQueries({ queryKey: ['organization', id] });
      toast.success('Organization deleted successfully!');
      navigate('/organizations');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete organization: ${error.message}`);
    },
  });

  const handleEdit = () => {
    if (canUpdate && organization) {
      setIsEditModalOpen(true);
    }
  };

  const handleDelete = () => {
    if (!canDelete || !organization) return;
    
    const confirmDelete = window.confirm(
      `Are you sure you want to delete ${organization.name}? This action cannot be undone.`
    );
    
    if (confirmDelete) {
      deleteMutation.mutate(organization._id);
    }
  };

  const handleEditSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['organization', id] });
    queryClient.invalidateQueries({ queryKey: ['organizations'] });
    setIsEditModalOpen(false);
    toast.success('Organization updated successfully!');
  };

  if (orgLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-[hsl(var(--border))] border-t-[hsl(var(--primary))] rounded-full animate-spin" />
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="p-12 text-center">
        <p className="text-[hsl(var(--destructive))] text-lg font-medium">Organization not found</p>
        <button
          onClick={() => navigate('/organizations')}
          className="mt-4 px-6 py-3 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-lg hover:opacity-90 transition"
        >
          Back to Organizations
        </button>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: MdBusinessCenter },
    { id: 'users', label: 'Users', icon: MdPeople },
    { id: 'license', label: 'License', icon: MdVpnKey },
    ...(organization.type === 'customer'
      ? [
          { id: 'vessels', label: 'Vessels', icon: MdDirectionsBoat },
          { id: 'business-units', label: 'Business Units', icon: MdBusiness },
        ]
      : []),
  ];

  const userColumns = [
    {
      key: 'name',
      header: 'Name',
      render: (u: User) => (
        <div className="font-semibold">{u.firstName} {u.lastName}</div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (u: User) => <span className="text-[hsl(var(--muted-foreground))]">{u.email}</span>,
    },
    {
      key: 'role',
      header: 'Role',
      render: (u: User) => (
        <span className="px-3 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 ring-1 ring-blue-200 dark:ring-blue-800">
          {u.role}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (u: User) => (
        <span
          className={cn(
            'px-3 py-1 text-xs font-bold rounded-full ring-1',
            u.isActive
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 ring-emerald-200 dark:ring-emerald-800'
              : 'bg-red-100 text-red-800 dark:bg-red-900/50 ring-red-200 dark:ring-red-800'
          )}
        >
          {u.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'lastLogin',
      header: 'Last Login',
      render: (u: User) => (
        <span className="text-[hsl(var(--muted-foreground))]">
          {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}
        </span>
      ),
    },
  ];

  return (
    <div className="w-full space-y-8 py-6 px-4 max-w-7xl mx-auto">
      {/* Header with Back Button */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/organizations')}
            className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors"
          >
            <MdArrowBack className="w-6 h-6 text-[hsl(var(--muted-foreground))]" />
          </button>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {organization.name}
            </h1>
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <span
                className={cn(
                  'px-4 py-1.5 text-xs font-bold rounded-full ring-1',
                  organization.type === 'customer'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 ring-blue-200 dark:ring-blue-800'
                    : 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 ring-purple-200 dark:ring-purple-800'
                )}
              >
                {organization.type === 'customer' ? 'Customer' : 'Vendor'}
              </span>
              <span
                className={cn(
                  'px-4 py-1.5 text-xs font-bold rounded-full ring-1',
                  organization.isActive
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 ring-emerald-200 dark:ring-emerald-800'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/50 ring-red-200 dark:ring-red-800'
                )}
              >
                {organization.isActive ? 'Active' : 'Inactive'}
              </span>
              <span className="px-4 py-1.5 text-xs font-bold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-800/50 ring-1 ring-gray-300 dark:ring-gray-700">
                {organization.portalType} Portal
              </span>
              {organization.createdAt && (
                <span className="text-sm text-[hsl(var(--muted-foreground))]">
                  Created {new Date(organization.createdAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          {canUpdate && (
            <button
              onClick={handleEdit}
              disabled={!organization}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl flex items-center gap-2 shadow-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MdEdit className="w-5 h-5" /> Edit Organization
            </button>
          )}
          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={!organization || deleteMutation.isPending}
              className="px-6 py-3 bg-red-600 text-white rounded-xl flex items-center gap-2 shadow-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleteMutation.isPending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <MdDelete className="w-5 h-5" /> Delete Organization
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[hsl(var(--border))]">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  'flex items-center gap-2 py-4 px-1 border-b-2 font-semibold text-sm transition-colors',
                  isActive
                    ? 'border-[hsl(var(--primary))] text-[hsl(var(--primary))]'
                    : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                )}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Main Content Card */}
      <div className="p-8 rounded-2xl bg-[hsl(var(--card))]/80 backdrop-blur-xl border border-[hsl(var(--border))]/50 shadow-xl">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Organization Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-6 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <MdInfo className="w-5 h-5 text-gray-600 dark:text-gray-400" /> Organization Information
                </h3>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Organization ID</span>
                    <span className="font-medium font-mono text-xs">{organization._id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Name</span>
                    <span className="font-medium">{organization.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Type</span>
                    <span className="font-medium capitalize">{organization.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Portal Type</span>
                    <span className="font-medium capitalize">{organization.portalType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Status</span>
                    <span className={cn(
                      "font-medium",
                      organization.isActive ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                    )}>
                      {organization.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {organization.licenseKey && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">License Key</span>
                      <span className="font-medium font-mono text-xs">{organization.licenseKey}</span>
                    </div>
                  )}
                  {organization.createdAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Created At</span>
                      <span className="font-medium">{new Date(organization.createdAt).toLocaleString()}</span>
                    </div>
                  )}
                  {organization.updatedAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Last Updated</span>
                      <span className="font-medium">{new Date(organization.updatedAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Invitation & Visibility Info */}
              {(organization.invitedBy || organization.isAdminInvited !== undefined || organization.visibleToCustomerIds) && (
                <div className="p-6 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <MdEmail className="w-5 h-5 text-gray-600 dark:text-gray-400" /> Invitation Details
                  </h3>
                  <div className="space-y-4 text-sm">
                    {organization.invitedBy && (
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Invited By</span>
                        <span className="font-medium capitalize">{organization.invitedBy}</span>
                      </div>
                    )}
                    {organization.isAdminInvited !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Admin Invited</span>
                        <span className={cn(
                          "font-medium",
                          organization.isAdminInvited ? "text-green-600 dark:text-green-400" : "text-gray-600 dark:text-gray-400"
                        )}>
                          {organization.isAdminInvited ? 'Yes' : 'No'}
                        </span>
                      </div>
                    )}
                    {organization.visibleToCustomerIds && organization.visibleToCustomerIds.length > 0 && (
                      <div className="flex flex-col gap-2">
                        <span className="text-gray-500 dark:text-gray-400">Visible To Customers</span>
                        <div className="flex flex-wrap gap-2">
                          {organization.visibleToCustomerIds.map((customerId) => (
                            <span
                              key={customerId}
                              className="px-2 py-1 rounded text-xs font-mono bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300"
                            >
                              {customerId}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {!organization.invitedBy && organization.isAdminInvited === undefined && (!organization.visibleToCustomerIds || organization.visibleToCustomerIds.length === 0) && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 italic">No invitation details available</p>
                    )}
                  </div>
                </div>
              )}

              {/* Metadata */}
              {organization.metadata && Object.keys(organization.metadata).length > 0 && (
                <div className="p-6 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 lg:col-span-2">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <MdInfo className="w-5 h-5 text-gray-600 dark:text-gray-400" /> Additional Metadata
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(organization.metadata).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <span className="font-medium">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            {usersLoading ? (
              <div className="text-center py-12">
                <div className="w-10 h-10 border-4 border-[hsl(var(--border))] border-t-[hsl(var(--primary))] rounded-full animate-spin inline-block" />
              </div>
            ) : (
              <DataTable
                columns={userColumns}
                data={users}
                onRowClick={(user: User) => navigate(`/users/${user._id}`)}
                emptyMessage="No users found in this organization."
              />
            )}
          </div>
        )}

        {/* License Tab */}
        {activeTab === 'license' && (
          <div>
            {licenseLoading ? (
              <div className="text-center py-12">
                <div className="w-10 h-10 border-4 border-[hsl(var(--border))] border-t-[hsl(var(--primary))] rounded-full animate-spin inline-block" />
              </div>
            ) : license ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-5 rounded-lg bg-[hsl(var(--secondary))]">
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">Status</p>
                    <p className="text-2xl font-bold capitalize mt-2">{license.status}</p>
                  </div>
                  <div className="p-5 rounded-lg bg-[hsl(var(--secondary))]">
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">Expires On</p>
                    <p className="text-2xl font-bold mt-2">
                      {license.expiresAt ? new Date(license.expiresAt).toLocaleDateString() : 'Never'}
                    </p>
                  </div>
                  <div className="p-5 rounded-lg bg-[hsl(var(--secondary))]">
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">Issued</p>
                    <p className="text-2xl font-bold mt-2">
                      {license.issuedAt ? new Date(license.issuedAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>

                {license.usageLimits && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Usage Limits</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(license.usageLimits).map(([key, limit]) => (
                        <div key={key} className="p-5 rounded-lg bg-[hsl(var(--secondary))]">
                          <p className="text-sm text-[hsl(var(--muted-foreground))] capitalize">{key}</p>
                          <p className="text-2xl font-bold mt-2">
                            {license.currentUsage?.[key as keyof typeof license.currentUsage] || 0} / {limit}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-center py-12 text-[hsl(var(--muted-foreground))]">
                No license assigned to this organization.
              </p>
            )}
          </div>
        )}

        {/* Placeholder Tabs */}
        {(activeTab === 'vessels' || activeTab === 'business-units') && (
          <div className="text-center py-16">
            <p className="text-xl font-medium text-[hsl(var(--muted-foreground))]">
              {activeTab === 'vessels' ? 'Vessel' : 'Business Unit'} management coming soon
            </p>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-2">
              API endpoint is under development.
            </p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && organization && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit Organization"
          size="large"
        >
          <OrganizationForm
            organization={organization}
            onSuccess={handleEditSuccess}
            onCancel={() => setIsEditModalOpen(false)}
          />
        </Modal>
      )}
    </div>
  );
}