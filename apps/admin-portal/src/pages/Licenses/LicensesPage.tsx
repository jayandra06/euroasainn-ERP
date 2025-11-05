/**
 * Licenses Page
 * Professional Admin Portal Design
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DataTable } from '../../components/shared/DataTable';
import { MdFilterList } from 'react-icons/md';
import { cn } from '../../lib/utils';

// Use relative URL in development (with Vite proxy) or env var, otherwise default to localhost:3000
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'http://localhost:3000');

interface License {
  _id: string;
  organizationId: string;
  organizationName?: string;
  status: 'active' | 'expired' | 'pending';
  expiresAt: string;
  usageLimits?: {
    maxUsers?: number;
    maxStorage?: number;
  };
  createdAt?: string;
}

export function LicensesPage() {
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Fetch licenses
  const { data: licensesData, isLoading } = useQuery({
    queryKey: ['licenses', filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      }

      const response = await fetch(`${API_URL}/api/v1/admin/licenses?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch licenses');
      const data = await response.json();
      return data.data as License[];
    },
  });

  const columns = [
    {
      key: 'organizationName',
      header: 'Organization',
      render: (license: License) => (
        <div className="font-semibold text-gray-900 dark:text-white">
          {license.organizationName || license.organizationId}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (license: License) => {
        const statusColors = {
          active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 ring-emerald-200 dark:ring-emerald-800',
          expired: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 ring-red-200 dark:ring-red-800',
          pending: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 ring-amber-200 dark:ring-amber-800',
        };
        return (
          <span className={cn('px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ring-1', statusColors[license.status])}>
            {license.status.charAt(0).toUpperCase() + license.status.slice(1)}
          </span>
        );
      },
    },
    {
      key: 'expiresAt',
      header: 'Expires At',
      render: (license: License) => (
        <span className="text-gray-600 dark:text-gray-400">
          {license.expiresAt ? new Date(license.expiresAt).toLocaleDateString() : 'N/A'}
        </span>
      ),
    },
    {
      key: 'usageLimits',
      header: 'Usage Limits',
      render: (license: License) => (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {license.usageLimits?.maxUsers ? `Users: ${license.usageLimits.maxUsers}` : 'N/A'}
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (license: License) => (
        <span className="text-gray-600 dark:text-gray-400">
          {license.createdAt ? new Date(license.createdAt).toLocaleDateString() : 'N/A'}
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
            Manage organization licenses and subscriptions
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
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all duration-200 font-medium"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="expired">Expired Only</option>
            <option value="pending">Pending Only</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="p-12 text-center rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 shadow-lg">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-emerald-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Loading licenses...</p>
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 shadow-lg">
          <DataTable
            columns={columns}
            data={licensesData || []}
            emptyMessage="No licenses found."
          />
        </div>
      )}
    </div>
  );
}

