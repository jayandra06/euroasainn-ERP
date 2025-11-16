/**
 * Customer Organizations Page
 * World-Class SaaS ERP Platform Design
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '../../components/shared/DataTable';
import { useToast } from '../../components/shared/Toast';
import { MdBusiness, MdFilterList } from 'react-icons/md';
import { cn } from '../../lib/utils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Organization {
  _id: string;
  name: string;
  type: string;
  portalType: string;
  isActive: boolean;
  createdAt?: string;
}

export function CustomerOrganizationsPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [filterActive, setFilterActive] = useState<string>('all');

  // Fetch customer organizations
  const { data: orgsData, isLoading } = useQuery({
    queryKey: ['customer-orgs', filterActive],
    queryFn: async () => {
      const params = new URLSearchParams({ type: 'customer' });
      if (filterActive !== 'all') {
        params.append('isActive', filterActive === 'active' ? 'true' : 'false');
      }

      const response = await fetch(`${API_URL}/api/v1/admin/customer-orgs?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch customer organizations');
      const data = await response.json();
      return data.data as Organization[];
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (orgId: string) => {
      const response = await fetch(`${API_URL}/api/v1/admin/customer-orgs/${orgId}`, {
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
      queryClient.invalidateQueries({ queryKey: ['customer-orgs'] });
      showToast('Customer organization deleted successfully!', 'success');
    },
    onError: (error: Error) => {
      showToast(`Failed to delete: ${error.message}`, 'error');
    },
  });

  const handleDelete = (org: Organization) => {
    if (window.confirm(`Are you sure you want to delete ${org.name}?`)) {
      deleteMutation.mutate(org._id);
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Organization Name',
      render: (org: Organization) => (
        <div className="font-semibold text-gray-900 dark:text-white">{org.name}</div>
      ),
    },
    {
      key: 'portalType',
      header: 'Portal Type',
      render: (org: Organization) => (
        <span className="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-800">
          {org.portalType}
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (org: Organization) => (
        <span
          className={cn(
            'px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full',
            org.isActive
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 ring-1 ring-emerald-200 dark:ring-emerald-800'
              : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 ring-1 ring-red-200 dark:ring-red-800'
          )}
        >
          {org.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (org: Organization) => (
        <span className="text-gray-600 dark:text-gray-400">
          {org.createdAt ? new Date(org.createdAt).toLocaleDateString() : 'N/A'}
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
            Customer Organizations
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">
            Manage customer organizations and their settings
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
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
            className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-medium"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="p-12 text-center rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 shadow-lg">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400 font-medium">Loading organizations...</p>
        </div>
      ) : (
        <div className="p-6 rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 shadow-lg">
          <DataTable
            columns={columns}
            data={orgsData || []}
            onDelete={handleDelete}
            emptyMessage="No customer organizations found."
          />
        </div>
      )}

    </div>
  );
}

