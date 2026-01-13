/**
 * Organization Profile Page
 * Shows detailed information about an organization including:
 * - Users and their roles
 * - License information
 * - Vessels
 * - Business Units
 * - Business Rules
 */
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from '../../components/shared/DataTable';
import { MdArrowBack, MdPeople, MdVpnKey, MdDirectionsBoat, MdBusiness, MdBusinessCenter } from 'react-icons/md';
import { cn } from '../../lib/utils';
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'http://localhost:3000');
export function OrganizationProfilePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    // Fetch organization details
    const { data: organization, isLoading: orgLoading } = useQuery({
        queryKey: ['organization', id],
        queryFn: async () => {
            const response = await fetch(`${API_URL}/api/v1/tech/organizations/${id}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                },
            });
            if (!response.ok)
                throw new Error('Failed to fetch organization');
            const data = await response.json();
            return data.data;
        },
        enabled: !!id,
    });
    // Fetch users for this organization
    const { data: users, isLoading: usersLoading } = useQuery({
        queryKey: ['organization-users', id],
        queryFn: async () => {
            const response = await fetch(`${API_URL}/api/v1/tech/users?organizationId=${id}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                },
            });
            if (!response.ok)
                return [];
            const data = await response.json();
            return data.data || [];
        },
        enabled: !!id,
    });
    // Fetch license for this organization
    const { data: license, isLoading: licenseLoading } = useQuery({
        queryKey: ['organization-license', id],
        queryFn: async () => {
            const response = await fetch(`${API_URL}/api/v1/tech/licenses?organizationId=${id}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                },
            });
            if (!response.ok)
                return null;
            const data = await response.json();
            return data.data?.[0] || null;
        },
        enabled: !!id,
    });
    // Fetch vessels (for customer organizations)
    const { data: vessels, isLoading: vesselsLoading } = useQuery({
        queryKey: ['organization-vessels', id],
        queryFn: async () => {
            if (organization?.type !== 'customer')
                return [];
            // TODO: Add tech endpoint to fetch vessels for organization
            // For now, return empty array
            return [];
        },
        enabled: !!id && organization?.type === 'customer',
    });
    // Fetch business units (for customer organizations)
    const { data: businessUnits, isLoading: busLoading } = useQuery({
        queryKey: ['organization-business-units', id],
        queryFn: async () => {
            if (organization?.type !== 'customer')
                return [];
            // TODO: Add tech endpoint to fetch business units for organization
            // For now, return empty array
            return [];
        },
        enabled: !!id && organization?.type === 'customer',
    });
    if (orgLoading) {
        return (<div className="flex items-center justify-center min-h-screen">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[hsl(var(--border))] border-t-[hsl(var(--primary))]"></div>
      </div>);
    }
    if (!organization) {
        return (<div className="p-12 text-center">
        <p className="text-red-600 dark:text-red-400">Organization not found</p>
        <button onClick={() => navigate('/licenses')} className="mt-4 px-4 py-2 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-lg">
          Back to Licenses
        </button>
      </div>);
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
            render: (user) => (<div className="font-semibold text-[hsl(var(--foreground))]">
          {user.firstName} {user.lastName}
        </div>),
        },
        {
            key: 'email',
            header: 'Email',
            render: (user) => (<span className="text-gray-600 dark:text-gray-400">{user.email}</span>),
        },
        {
            key: 'role',
            header: 'Role',
            render: (user) => (<span className="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-blue-100 text-[hsl(var(--foreground))] font-semibold dark:bg-blue-900/50 ring-1 ring-blue-200 dark:ring-blue-800">
          {user.role}
        </span>),
        },
        {
            key: 'status',
            header: 'Status',
            render: (user) => (<span className={cn('px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full', user.isActive
                    ? 'bg-emerald-100 text-[hsl(var(--foreground))] font-semibold dark:bg-emerald-900/50 ring-1 ring-emerald-200 dark:ring-emerald-800'
                    : 'bg-red-100 text-[hsl(var(--foreground))] font-semibold dark:bg-red-900/50 ring-1 ring-red-200 dark:ring-red-800')}>
          {user.isActive ? 'Active' : 'Inactive'}
        </span>),
        },
        {
            key: 'lastLogin',
            header: 'Last Login',
            render: (user) => (<span className="text-gray-600 dark:text-gray-400">
          {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
        </span>),
        },
    ];
    return (<div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/licenses')} className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] transition-colors">
          <MdArrowBack className="w-6 h-6 text-gray-600 dark:text-gray-400"/>
        </button>
        <div>
          <h1 className="text-4xl font-bold text-[hsl(var(--foreground))] mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {organization.name}
          </h1>
          <div className="flex items-center gap-3">
            <span className={cn('px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full', organization.type === 'customer'
            ? 'bg-blue-100 text-[hsl(var(--foreground))] font-semibold dark:bg-blue-900/50 ring-1 ring-blue-200 dark:ring-blue-800'
            : 'bg-purple-100 text-[hsl(var(--foreground))] font-semibold dark:bg-purple-900/50 ring-1 ring-purple-200 dark:ring-purple-800')}>
              {organization.type === 'customer' ? 'Customer' : 'Vendor'}
            </span>
            <span className={cn('px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full', organization.isActive
            ? 'bg-emerald-100 text-[hsl(var(--foreground))] font-semibold dark:bg-emerald-900/50 ring-1 ring-emerald-200 dark:ring-emerald-800'
            : 'bg-red-100 text-[hsl(var(--foreground))] font-semibold dark:bg-red-900/50 ring-1 ring-red-200 dark:ring-red-800')}>
              {organization.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[hsl(var(--border))]">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (<button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn('flex items-center gap-2 py-4 px-1 border-b-2 font-semibold text-sm transition-colors', isActive
                    ? 'border-blue-600 text-[hsl(var(--foreground))] font-semibold'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300')}>
                <Icon className="w-5 h-5"/>
                {tab.label}
              </button>);
        })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6 rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 shadow-lg">
        {activeTab === 'overview' && (<div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-3 mb-2">
                  <MdPeople className="w-6 h-6 text-[hsl(var(--foreground))] font-semibold"/>
                  <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">Users</h3>
                </div>
                <p className="text-3xl font-bold text-[hsl(var(--foreground))] font-semibold">{users?.length || 0}</p>
              </div>
              {organization.type === 'customer' && (<>
                  <div className="p-6 rounded-xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-center gap-3 mb-2">
                      <MdDirectionsBoat className="w-6 h-6 text-[hsl(var(--foreground))] font-semibold"/>
                      <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">Vessels</h3>
                    </div>
                    <p className="text-3xl font-bold text-[hsl(var(--foreground))] font-semibold">{vessels?.length || 0}</p>
                  </div>
                  <div className="p-6 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center gap-3 mb-2">
                      <MdBusiness className="w-6 h-6 text-[hsl(var(--foreground))] font-semibold"/>
                      <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">Business Units</h3>
                    </div>
                    <p className="text-3xl font-bold text-[hsl(var(--foreground))] font-semibold">{businessUnits?.length || 0}</p>
                  </div>
                </>)}
            </div>
            {license && (<div className="p-6 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/20 border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-3 mb-4">
                  <MdVpnKey className="w-6 h-6 text-amber-600 dark:text-amber-400"/>
                  <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">License Status</h3>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Status</p>
                    <p className="text-lg font-bold text-[hsl(var(--foreground))] capitalize">{license.status}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Expires</p>
                    <p className="text-lg font-bold text-[hsl(var(--foreground))]">
                      {license.expiresAt ? new Date(license.expiresAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  {license.usageLimits?.users && (<div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Users Limit</p>
                      <p className="text-lg font-bold text-[hsl(var(--foreground))]">
                        {license.currentUsage?.users || 0} / {license.usageLimits.users}
                      </p>
                    </div>)}
                  {organization.type === 'customer' && license.usageLimits?.vessels && (<div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Vessels Limit</p>
                      <p className="text-lg font-bold text-[hsl(var(--foreground))]">
                        {license.currentUsage?.vessels || 0} / {license.usageLimits.vessels}
                      </p>
                    </div>)}
                </div>
              </div>)}
          </div>)}

        {activeTab === 'users' && (<div>
            {usersLoading ? (<div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[hsl(var(--border))] border-t-[hsl(var(--primary))]"></div>
              </div>) : (<DataTable columns={userColumns} data={users || []} emptyMessage="No users found for this organization."/>)}
          </div>)}

        {activeTab === 'license' && (<div>
            {licenseLoading ? (<div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[hsl(var(--border))] border-t-[hsl(var(--primary))]"></div>
              </div>) : license ? (<div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">License Status</h3>
                    <p className="text-xl font-bold text-[hsl(var(--foreground))] capitalize">{license.status}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">Expires At</h3>
                    <p className="text-xl font-bold text-[hsl(var(--foreground))]">
                      {license.expiresAt ? new Date(license.expiresAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
                {license.usageLimits && (<div>
                    <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-4">Usage Limits</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {Object.entries(license.usageLimits).map(([key, limit]) => (<div key={key} className="p-4 rounded-lg bg-[hsl(var(--secondary))]">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1 capitalize">{key}</p>
                          <p className="text-xl font-bold text-[hsl(var(--foreground))]">
                            {license.currentUsage?.[key] || 0} / {limit}
                          </p>
                        </div>))}
                    </div>
                  </div>)}
              </div>) : (<p className="text-gray-600 dark:text-gray-400">No license found for this organization.</p>)}
          </div>)}

        {activeTab === 'vessels' && organization.type === 'customer' && (<div>
            {vesselsLoading ? (<div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[hsl(var(--border))] border-t-[hsl(var(--primary))]"></div>
              </div>) : (<p className="text-gray-600 dark:text-gray-400">
                Vessel management coming soon. API endpoint needs to be implemented.
              </p>)}
          </div>)}

        {activeTab === 'business-units' && organization.type === 'customer' && (<div>
            {busLoading ? (<div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[hsl(var(--border))] border-t-[hsl(var(--primary))]"></div>
              </div>) : (<p className="text-gray-600 dark:text-gray-400">
                Business unit management coming soon. API endpoint needs to be implemented.
              </p>)}
          </div>)}

      </div>
    </div>);
}
//# sourceMappingURL=OrganizationProfilePage.js.map