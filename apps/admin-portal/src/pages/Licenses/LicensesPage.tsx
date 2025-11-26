/**
 * Licenses Page
 * Shows all organizations with onboarding and license status
 * Clicking on an organization opens OrganizationProfilePage
 */

import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '../../components/shared/DataTable';
import { useToast } from '../../components/shared/Toast';
import { MdFilterList, MdBusiness, MdCheckCircle, MdCancel, MdSearch, MdDownload, MdRefresh } from 'react-icons/md';
import { cn } from '../../lib/utils';

// Use relative URL in development (with Vite proxy) or env var, otherwise default to localhost:3000
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'http://localhost:3000');

interface OrganizationWithLicense {
  _id: string;
  name: string;
  type: 'customer' | 'vendor';
  portalType: string;
  isActive: boolean;
  license?: {
    status: 'active' | 'expired' | 'suspended' | 'revoked';
    expiresAt?: string;
    issuedAt?: string;
    usageLimits?: {
      users?: number;
      vessels?: number;
      items?: number;
      employees?: number;
      businessUnits?: number;
    };
    currentUsage?: {
      users?: number;
      vessels?: number;
      items?: number;
      employees?: number;
      businessUnits?: number;
    };
  };
  onboardingCompleted?: boolean;
  createdAt?: string;
}

export function LicensesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterOnboarding, setFilterOnboarding] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    queryClient.invalidateQueries({ queryKey: ['organizations-with-licenses'] });
    queryClient.invalidateQueries({ queryKey: ['licenses'] });
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('Licenses data refreshed', 'success');
    }, 1000);
  };

  const handleExport = () => {
    showToast('Export functionality will be implemented soon', 'info');
    // TODO: Implement export functionality
  };

  // Helper function to apply filters
  const applyFilters = (orgs: OrganizationWithLicense[]): OrganizationWithLicense[] => {
    let filtered = orgs;

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter((org) => org.type === filterType);
    }

    // Filter by license status
    if (filterStatus !== 'all') {
      filtered = filtered.filter((org) => {
        if (!org.license) return filterStatus === 'no-license';
        return org.license.status === filterStatus;
      });
    }

    // Filter by onboarding status
    if (filterOnboarding !== 'all') {
      filtered = filtered.filter((org) => {
        if (filterOnboarding === 'completed') return org.onboardingCompleted === true;
        if (filterOnboarding === 'pending') return org.onboardingCompleted === false;
        return true;
      });
    }

    return filtered;
  };

  // Fetch organizations with license information and onboarding status
  const { data: orgsData, isLoading } = useQuery({
    queryKey: ['organizations-with-licenses', filterStatus, filterType, filterOnboarding],
    queryFn: async () => {
      try {
        // Use the new optimized endpoint that returns organizations with licenses and onboarding status
        const url = API_URL ? `${API_URL}/api/v1/admin/organizations-with-licenses` : `/api/v1/admin/organizations-with-licenses`;
        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to fetch organizations: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        const orgsWithLicenses = data.data as OrganizationWithLicense[];

        // Apply filters
        return applyFilters(orgsWithLicenses);
      } catch (error: any) {
        console.error('Error fetching organizations with licenses:', error);
        throw error;
      }
    },
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    refetchOnWindowFocus: false,
  });

  // Apply search filter client-side
  const filteredOrgs: OrganizationWithLicense[] = useMemo(() => {
    if (!orgsData) return [];
    if (!searchQuery.trim()) return orgsData;
    const query = searchQuery.toLowerCase();
    return orgsData.filter(org => 
      org.name.toLowerCase().includes(query)
    );
  }, [orgsData, searchQuery]);

  const handleRowClick = (org: OrganizationWithLicense) => {
    navigate(`/organizations/${org._id}`);
  };

  const columns = [
    {
      key: 'name',
      header: 'Organization',
      render: (org: OrganizationWithLicense) => (
        <div className="font-semibold text-gray-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
          {org.name}
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (org: OrganizationWithLicense) => (
        <span
          className={cn(
            'px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full',
            org.type === 'customer'
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-800'
              : 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 ring-1 ring-purple-200 dark:ring-purple-800'
          )}
        >
          {org.type === 'customer' ? 'Customer' : 'Vendor'}
        </span>
      ),
    },
    {
      key: 'onboarding',
      header: 'Onboarding',
      render: (org: OrganizationWithLicense) => (
        <div className="flex items-center gap-2">
          {org.onboardingCompleted ? (
            <>
              <MdCheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Completed</span>
            </>
          ) : (
            <>
              <MdCancel className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">Pending</span>
            </>
          )}
        </div>
      ),
    },
    {
      key: 'licenseStatus',
      header: 'License Status',
      render: (org: OrganizationWithLicense) => {
        if (!org.license) {
          return (
            <span className="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300 ring-1 ring-gray-200 dark:ring-gray-800">
              No License
            </span>
          );
        }

        const statusColors = {
          active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 ring-emerald-200 dark:ring-emerald-800',
          expired: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 ring-red-200 dark:ring-red-800',
          suspended: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 ring-amber-200 dark:ring-amber-800',
          revoked: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 ring-red-200 dark:ring-red-800',
        };

        return (
          <span className={cn('px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ring-1', statusColors[org.license.status] || statusColors.active)}>
            {org.license.status.charAt(0).toUpperCase() + org.license.status.slice(1)}
          </span>
        );
      },
    },
    {
      key: 'expiresAt',
      header: 'Expires At',
      render: (org: OrganizationWithLicense) => (
        <span className="text-gray-600 dark:text-gray-400">
          {org.license?.expiresAt ? new Date(org.license.expiresAt).toLocaleDateString() : 'N/A'}
        </span>
      ),
    },
  ];

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Licenses
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">
            View all organizations, their onboarding status, and license information
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-6 rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 shadow-lg">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus-within:border-emerald-500 dark:focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-500/20 transition-all">
            <MdSearch className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search organizations..."
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
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 font-medium"
            >
              <option value="all">All Types</option>
              <option value="customer">Customer Only</option>
              <option value="vendor">Vendor Only</option>
            </select>
            <select
              value={filterOnboarding}
              onChange={(e) => setFilterOnboarding(e.target.value)}
              className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 font-medium"
            >
              <option value="all">All Onboarding</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 font-medium"
            >
              <option value="all">All License Status</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="suspended">Suspended</option>
              <option value="revoked">Revoked</option>
              <option value="no-license">No License</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="p-12 text-center rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 shadow-lg">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-emerald-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Loading organizations...</p>
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {filteredOrgs.length} organization{filteredOrgs.length !== 1 ? 's' : ''}
            </p>
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
          <DataTable
            columns={columns}
            data={filteredOrgs || []}
            onRowClick={handleRowClick}
            emptyMessage="No organizations found."
          />
        </div>
      )}
    </div>
  );
}
