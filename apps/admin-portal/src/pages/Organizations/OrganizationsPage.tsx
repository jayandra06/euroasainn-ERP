/**
 * Unified Organizations Page
 * Combines Customer and Vendor Organizations
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '../../components/shared/DataTable';
import { useToast } from '../../components/shared/Toast';
import { MdBusiness, MdFilterList, MdSearch, MdDownload, MdDelete, MdCheckBox, MdCheckBoxOutlineBlank } from 'react-icons/md';
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

export function OrganizationsPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [filterActive, setFilterActive] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOrgs, setSelectedOrgs] = useState<Set<string>>(new Set());

  // Fetch all organizations (customer and vendor)
  const { data: orgsData, isLoading } = useQuery({
    queryKey: ['organizations', filterActive, filterType, searchQuery],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        if (filterType !== 'all') {
          params.append('type', filterType);
        }
        if (filterActive !== 'all') {
          params.append('isActive', filterActive === 'active' ? 'true' : 'false');
        }
        if (searchQuery) {
          params.append('search', searchQuery);
        }

        const response = await fetch(`${API_URL}/api/v1/admin/organizations?${params}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: 'Failed to fetch organizations' }));
          throw new Error(error.error || 'Failed to fetch organizations');
        }
        const data = await response.json();
        return data.data || [];
      } catch (error: any) {
        console.error('Error fetching organizations:', error);
        return [];
      }
    },
    retry: 1,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (orgId: string) => {
      const response = await fetch(`${API_URL}/api/v1/admin/organizations/${orgId}`, {
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
      showToast('Organization deleted successfully!', 'success');
    },
    onError: (error: Error) => {
      showToast(`Failed to delete: ${error.message}`, 'error');
    },
  });

  // Filter organizations by search query
  const filteredOrgs = React.useMemo(() => {
    if (!orgsData) return [];
    if (!searchQuery) return orgsData;
    const query = searchQuery.toLowerCase();
    return orgsData.filter(org => 
      org.name.toLowerCase().includes(query) ||
      org.type.toLowerCase().includes(query)
    );
  }, [orgsData, searchQuery]);

  const handleSelectAll = () => {
    if (selectedOrgs.size === filteredOrgs.length) {
      setSelectedOrgs(new Set());
    } else {
      setSelectedOrgs(new Set(filteredOrgs.map(org => org._id)));
    }
  };

  const handleSelectOrg = (orgId: string) => {
    const newSelected = new Set(selectedOrgs);
    if (newSelected.has(orgId)) {
      newSelected.delete(orgId);
    } else {
      newSelected.add(orgId);
    }
    setSelectedOrgs(newSelected);
  };

  const handleBulkDelete = () => {
    if (selectedOrgs.size === 0) {
      showToast('Please select organizations to delete', 'error');
      return;
    }
    if (window.confirm(`Are you sure you want to delete ${selectedOrgs.size} organization(s)?`)) {
      Promise.all(Array.from(selectedOrgs).map(id => deleteMutation.mutateAsync(id)))
        .then(() => {
          setSelectedOrgs(new Set());
          showToast('Organizations deleted successfully!', 'success');
        })
        .catch(() => {
          showToast('Failed to delete some organizations', 'error');
        });
    }
  };

  const handleDelete = (org: Organization) => {
    if (window.confirm(`Are you sure you want to delete ${org.name}?`)) {
      deleteMutation.mutate(org._id);
    }
  };

  const handleExport = () => {
    showToast('Export functionality will be implemented soon', 'info');
    // TODO: Implement export functionality
  };

  const columns = [
    {
      key: 'select',
      header: (
        <button
          onClick={handleSelectAll}
          className="flex items-center justify-center w-full"
        >
          {selectedOrgs.size === filteredOrgs.length && filteredOrgs.length > 0 ? (
            <MdCheckBox className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          ) : (
            <MdCheckBoxOutlineBlank className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          )}
        </button>
      ),
      render: (org: Organization) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSelectOrg(org._id);
          }}
          className="flex items-center justify-center"
        >
          {selectedOrgs.has(org._id) ? (
            <MdCheckBox className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          ) : (
            <MdCheckBoxOutlineBlank className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          )}
        </button>
      ),
      className: 'w-12',
    },
    {
      key: 'name',
      header: 'Name',
      render: (org: Organization) => (
        <div className="font-semibold text-gray-900 dark:text-white">{org.name}</div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (org: Organization) => (
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
            Organizations
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">
            Manage customer and vendor organizations
          </p>
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
              placeholder="Search organizations by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-sm text-gray-700 dark:text-gray-300 placeholder:text-gray-400 dark:placeholder:text-gray-500"
            />
          </div>

          {/* Filters and Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-semibold">
                <MdFilterList className="w-5 h-5" />
                <span>Filters:</span>
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-medium"
              >
                <option value="all">All Types</option>
                <option value="customer">Customer Only</option>
                <option value="vendor">Vendor Only</option>
              </select>
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
            {selectedOrgs.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedOrgs.size} selected
                </span>
                <button
                  onClick={handleBulkDelete}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors font-semibold text-sm"
                >
                  <MdDelete className="w-4 h-4" />
                  Delete Selected
                </button>
              </div>
            )}
          </div>
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
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {filteredOrgs.length} organization{filteredOrgs.length !== 1 ? 's' : ''}
            </p>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              <MdDownload className="w-4 h-4" />
              Export
            </button>
          </div>
          <DataTable
            columns={columns}
            data={filteredOrgs}
            onDelete={handleDelete}
            emptyMessage="No organizations found."
          />
        </div>
      )}

    </div>
  );
}


