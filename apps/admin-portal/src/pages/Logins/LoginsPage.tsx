/**
 * Logins Page
 * Shows login activity from vendor and customer portals
 */

import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '../../components/shared/DataTable';
import { useToast } from '../../components/shared/Toast';
import { MdSearch, MdFilterList, MdDownload, MdRefresh, MdPerson, MdBusiness, MdCheckCircle, MdCancel } from 'react-icons/md';
import { cn } from '../../lib/utils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Login {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  portalType: 'customer' | 'vendor';
  role: string;
  organizationId?: string;
  organizationName?: string;
  lastLogin: string;
  isActive: boolean;
}

export function LoginsPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [filterPortal, setFilterPortal] = useState<string>('all');
  const [filterActive, setFilterActive] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    queryClient.invalidateQueries({ queryKey: ['logins'] });
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('Logins data refreshed', 'success');
    }, 1000);
  };

  const handleExport = () => {
    showToast('Export functionality will be implemented soon', 'info');
  };

  // Mock data for development
  const getMockLogins = (): Login[] => {
    const now = Date.now();
    return [
      {
        _id: '1',
        email: 'john.doe@acme.com',
        firstName: 'John',
        lastName: 'Doe',
        fullName: 'John Doe',
        portalType: 'customer',
        role: 'admin',
        organizationId: 'org1',
        organizationName: 'Acme Corporation',
        lastLogin: new Date(now - 30 * 60 * 1000).toISOString(),
        isActive: true,
      },
      {
        _id: '2',
        email: 'jane.smith@techsolutions.com',
        firstName: 'Jane',
        lastName: 'Smith',
        fullName: 'Jane Smith',
        portalType: 'customer',
        role: 'user',
        organizationId: 'org2',
        organizationName: 'Tech Solutions Inc',
        lastLogin: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
        isActive: true,
      },
      {
        _id: '3',
        email: 'emily.davis@globalindustries.com',
        firstName: 'Emily',
        lastName: 'Davis',
        fullName: 'Emily Davis',
        portalType: 'vendor',
        role: 'admin',
        organizationId: 'org3',
        organizationName: 'Global Industries',
        lastLogin: new Date(now - 5 * 60 * 60 * 1000).toISOString(),
        isActive: true,
      },
      {
        _id: '4',
        email: 'michael.brown@digitalventures.com',
        firstName: 'Michael',
        lastName: 'Brown',
        fullName: 'Michael Brown',
        portalType: 'customer',
        role: 'user',
        organizationId: 'org4',
        organizationName: 'Digital Ventures LLC',
        lastLogin: new Date(now - 8 * 60 * 60 * 1000).toISOString(),
        isActive: true,
      },
      {
        _id: '5',
        email: 'robert.miller@enterprisesolutions.com',
        firstName: 'Robert',
        lastName: 'Miller',
        fullName: 'Robert Miller',
        portalType: 'vendor',
        role: 'admin',
        organizationId: 'org5',
        organizationName: 'Enterprise Solutions',
        lastLogin: new Date(now - 12 * 60 * 60 * 1000).toISOString(),
        isActive: true,
      },
      {
        _id: '6',
        email: 'sarah.johnson@cloudsystems.com',
        firstName: 'Sarah',
        lastName: 'Johnson',
        fullName: 'Sarah Johnson',
        portalType: 'customer',
        role: 'user',
        organizationId: 'org6',
        organizationName: 'Cloud Systems Group',
        lastLogin: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
      },
      {
        _id: '7',
        email: 'david.wilson@innovationlabs.com',
        firstName: 'David',
        lastName: 'Wilson',
        fullName: 'David Wilson',
        portalType: 'vendor',
        role: 'user',
        organizationId: 'org7',
        organizationName: 'Innovation Labs',
        lastLogin: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: false,
      },
      {
        _id: '8',
        email: 'lisa.anderson@startuphub.com',
        firstName: 'Lisa',
        lastName: 'Anderson',
        fullName: 'Lisa Anderson',
        portalType: 'customer',
        role: 'admin',
        organizationId: 'org8',
        organizationName: 'Startup Hub',
        lastLogin: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
      },
    ];
  };

  // Fetch logins
  const { data: loginsData, isLoading } = useQuery({
    queryKey: ['logins', filterPortal, filterActive],
    queryFn: async () => {
      try {
        const response = await fetch(`${API_URL}/api/v1/admin/logins`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        });

        if (!response.ok) {
          // Return mock data if endpoint doesn't exist yet
          if (response.status === 404) {
            return getMockLogins();
          }
          const error = await response.json().catch(() => ({ error: 'Failed to fetch logins' }));
          throw new Error(error.error || 'Failed to fetch logins');
        }
        const data = await response.json();
        return data.data || getMockLogins();
      } catch (error: any) {
        // Return mock data on network errors
        if (error.name === 'TypeError' || error.message.includes('fetch')) {
          console.error('Network error fetching logins:', error);
          return getMockLogins();
        }
        throw error;
      }
    },
    retry: 1,
  });

  // Apply filters and search
  const filteredLogins = useMemo(() => {
    if (!loginsData) return [];
    
    let filtered = loginsData;

    // Filter by portal type
    if (filterPortal !== 'all') {
      filtered = filtered.filter(login => login.portalType === filterPortal);
    }

    // Filter by active status
    if (filterActive !== 'all') {
      filtered = filtered.filter(login => 
        filterActive === 'active' ? login.isActive : !login.isActive
      );
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(login =>
        login.fullName.toLowerCase().includes(query) ||
        login.email.toLowerCase().includes(query) ||
        login.organizationName?.toLowerCase().includes(query) ||
        login.role.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [loginsData, filterPortal, filterActive, searchQuery]);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const columns = [
    {
      key: 'user',
      header: 'User',
      render: (login: Login) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
            {login.firstName[0]}{login.lastName[0]}
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">{login.fullName}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{login.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'portalType',
      header: 'Portal',
      render: (login: Login) => (
        <span
          className={cn(
            'px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full',
            login.portalType === 'customer'
              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-800'
              : 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 ring-1 ring-purple-200 dark:ring-purple-800'
          )}
        >
          {login.portalType === 'customer' ? 'Customer' : 'Vendor'}
        </span>
      ),
    },
    {
      key: 'organization',
      header: 'Organization',
      render: (login: Login) => (
        <div className="flex items-center gap-2">
          <MdBusiness className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {login.organizationName || 'N/A'}
          </span>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (login: Login) => (
        <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
          {login.role.replace('_', ' ')}
        </span>
      ),
    },
    {
      key: 'lastLogin',
      header: 'Last Login',
      render: (login: Login) => (
        <div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {formatTimeAgo(login.lastLogin)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {new Date(login.lastLogin).toLocaleString()}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (login: Login) => (
        <div className="flex items-center gap-2">
          {login.isActive ? (
            <>
              <MdCheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">Active</span>
            </>
          ) : (
            <>
              <MdCancel className="w-5 h-5 text-red-600 dark:text-red-400" />
              <span className="text-sm font-semibold text-red-600 dark:text-red-400">Inactive</span>
            </>
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
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            Portal Logins
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">
            View login activity from vendor and customer portals
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
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl transition-colors font-semibold shadow-lg shadow-emerald-500/30"
          >
            <MdDownload className="w-5 h-5" />
            Export
          </button>
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
              placeholder="Search by name, email, organization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-sm text-gray-700 dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-semibold">
              <MdFilterList className="w-5 h-5" />
              <span>Filters:</span>
            </div>
            <select
              value={filterPortal}
              onChange={(e) => setFilterPortal(e.target.value)}
              className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 font-medium"
            >
              <option value="all">All Portals</option>
              <option value="customer">Customer Portal</option>
              <option value="vendor">Vendor Portal</option>
            </select>
            <select
              value={filterActive}
              onChange={(e) => setFilterActive(e.target.value)}
              className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 font-medium"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="p-12 text-center rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 shadow-lg">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-emerald-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Loading logins...</p>
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {filteredLogins.length} login{filteredLogins.length !== 1 ? 's' : ''}
            </p>
          </div>
          <DataTable
            columns={columns}
            data={filteredLogins}
            emptyMessage="No logins found."
          />
        </div>
      )}
    </div>
  );
}

