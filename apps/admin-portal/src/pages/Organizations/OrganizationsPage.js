/**
 * Unified Organizations Page
 * Combines Customer and Vendor Organizations
 */
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '../../components/shared/DataTable';
import { Modal } from '../../components/shared/Modal';
import { useToast } from '../../components/shared/Toast';
import { MdAdd, MdBusiness, MdFilterList, MdSearch, MdDownload, MdDelete, MdCheckBox, MdCheckBoxOutlineBlank } from 'react-icons/md';
import { cn } from '../../lib/utils';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export function OrganizationsPage() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    const [filterActive, setFilterActive] = useState('all');
    const [filterType, setFilterType] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedOrgs, setSelectedOrgs] = useState(new Set());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newOrgName, setNewOrgName] = useState('');
    const [newOrgEmail, setNewOrgEmail] = useState('');
    const [newOrgType, setNewOrgType] = useState('customer');
    const [formError, setFormError] = useState(null);
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
            }
            catch (error) {
                console.error('Error fetching organizations:', error);
                return [];
            }
        },
        retry: 1,
    });
    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: async (orgId) => {
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
        onError: (error) => {
            showToast(`Failed to delete: ${error.message}`, 'error');
        },
    });
    // Filter organizations by search query
    const filteredOrgs = React.useMemo(() => {
        if (!orgsData)
            return [];
        if (!searchQuery)
            return orgsData;
        const query = searchQuery.toLowerCase();
        return orgsData.filter(org => org.name.toLowerCase().includes(query) ||
            org.type.toLowerCase().includes(query));
    }, [orgsData, searchQuery]);
    const handleSelectAll = () => {
        if (selectedOrgs.size === filteredOrgs.length) {
            setSelectedOrgs(new Set());
        }
        else {
            setSelectedOrgs(new Set(filteredOrgs.map(org => org._id)));
        }
    };
    const handleSelectOrg = (orgId) => {
        const newSelected = new Set(selectedOrgs);
        if (newSelected.has(orgId)) {
            newSelected.delete(orgId);
        }
        else {
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
    const handleDelete = (org) => {
        if (window.confirm(`Are you sure you want to delete ${org.name}?`)) {
            deleteMutation.mutate(org._id);
        }
    };
    const createMutation = useMutation({
        mutationFn: async () => {
            const trimmedName = newOrgName.trim();
            const trimmedEmail = newOrgEmail.trim();
            if (!trimmedName || !trimmedEmail) {
                throw new Error('Name and admin email are required');
            }
            // Basic email validation
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
                throw new Error('Please enter a valid email address');
            }
            const requestData = {
                name: trimmedName,
                type: newOrgType,
                portalType: newOrgType,
                isActive: true,
                adminEmail: trimmedEmail,
            };
            const response = await fetch(`${API_URL}/api/v1/admin/organizations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                },
                body: JSON.stringify(requestData),
            });
            if (!response.ok) {
                let errorMessage = 'Failed to create organization';
                try {
                    const error = await response.json();
                    errorMessage = error.error || error.message || errorMessage;
                }
                catch {
                    errorMessage = `Server error: ${response.status} ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }
            return response.json();
        },
        onSuccess: (data) => {
            setIsModalOpen(false);
            setNewOrgName('');
            setNewOrgEmail('');
            setNewOrgType('customer');
            setFormError(null);
            queryClient.invalidateQueries({ queryKey: ['organizations'] });
            if (data?.emailSent === false && data.emailError) {
                showToast(`Organization created, but email failed: ${data.emailError}`, 'warning');
            }
            else if (data?.emailSent === true) {
                showToast(`Organization created! Invitation email sent to ${data.emailTo || newOrgEmail}`, 'success');
            }
            else if (data?.message) {
                showToast(data.message, 'success');
            }
            else {
                showToast('Organization created successfully!', 'success');
            }
        },
        onError: (error) => {
            const message = error?.message || 'Failed to create organization';
            setFormError(message);
            showToast(message, 'error');
        },
    });
    const handleOpenCreateModal = () => {
        setFormError(null);
        setNewOrgName('');
        setNewOrgEmail('');
        setNewOrgType('customer');
        setIsModalOpen(true);
    };
    const handleExport = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const url = API_URL ? `${API_URL}/api/v1/admin/export/organizations` : `/api/v1/admin/export/organizations`;
            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!response.ok) {
                throw new Error('Failed to export organizations');
            }
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `organizations-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
            showToast('Organizations exported successfully', 'success');
        }
        catch (error) {
            showToast(error.message || 'Failed to export organizations', 'error');
        }
    };
    const columns = [
        {
            key: 'select',
            header: (<button onClick={handleSelectAll} className="flex items-center justify-center w-full">
          {selectedOrgs.size === filteredOrgs.length && filteredOrgs.length > 0 ? (<MdCheckBox className="w-5 h-5 text-[hsl(var(--primary))]"/>) : (<MdCheckBoxOutlineBlank className="w-5 h-5 text-[hsl(var(--muted-foreground))]"/>)}
        </button>),
            render: (org) => (<button onClick={(e) => {
                    e.stopPropagation();
                    handleSelectOrg(org._id);
                }} className="flex items-center justify-center">
          {selectedOrgs.has(org._id) ? (<MdCheckBox className="w-5 h-5 text-[hsl(var(--primary))]"/>) : (<MdCheckBoxOutlineBlank className="w-5 h-5 text-[hsl(var(--muted-foreground))]"/>)}
        </button>),
            className: 'w-12',
        },
        {
            key: 'name',
            header: 'Name',
            render: (org) => (<div className="font-semibold text-[hsl(var(--foreground))]">{org.name}</div>),
        },
        {
            key: 'type',
            header: 'Type',
            render: (org) => (<span className={cn('px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full', org.type === 'customer'
                    ? 'bg-blue-100 text-[hsl(var(--foreground))] font-semibold dark:bg-blue-900/50 ring-1 ring-blue-200 dark:ring-blue-800'
                    : 'bg-purple-100 text-[hsl(var(--foreground))] font-semibold dark:bg-purple-900/50 ring-1 ring-purple-200 dark:ring-purple-800')}>
          {org.type === 'customer' ? 'Customer' : 'Vendor'}
        </span>),
        },
        {
            key: 'isActive',
            header: 'Status',
            render: (org) => (<span className={cn('px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full', org.isActive
                    ? 'bg-emerald-100 text-[hsl(var(--foreground))] font-semibold dark:bg-emerald-900/50 ring-1 ring-emerald-200 dark:ring-emerald-800'
                    : 'bg-red-100 text-[hsl(var(--foreground))] font-semibold dark:bg-red-900/50 ring-1 ring-red-200 dark:ring-red-800')}>
          {org.isActive ? 'Active' : 'Inactive'}
        </span>),
        },
        {
            key: 'createdAt',
            header: 'Created',
            render: (org) => (<span className="text-[hsl(var(--muted-foreground))]">
          {org.createdAt ? new Date(org.createdAt).toLocaleDateString() : 'N/A'}
        </span>),
        },
    ];
    return (<div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-4xl font-bold text-[hsl(var(--foreground))] mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Organizations
          </h1>
          <p className="text-lg text-[hsl(var(--muted-foreground))] font-medium">
            Manage customer and vendor organizations
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={handleOpenCreateModal} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[hsl(var(--primary))] text-white text-sm font-semibold shadow-md hover:shadow-lg hover:bg-[hsl(var(--primary))]/90 transition-colors">
            <MdAdd className="w-4 h-4"/>
            <span>Add Organization</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-6 rounded-2xl bg-[hsl(var(--card))]/80 backdrop-blur-xl border border-[hsl(var(--border))]/50 shadow-lg">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-[hsl(var(--secondary))] border border-[hsl(var(--border))] focus-within:border-[hsl(var(--primary))] focus-within:ring-2 focus-within:ring-[hsl(var(--primary))]/20 transition-all">
            <MdSearch className="w-5 h-5 text-[hsl(var(--muted-foreground))] flex-shrink-0"/>
            <input type="text" placeholder="Search organizations by name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 bg-transparent border-none outline-none text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]"/>
          </div>

          {/* Filters and Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 text-[hsl(var(--foreground))] font-semibold">
                <MdFilterList className="w-5 h-5"/>
                <span>Filters:</span>
              </div>
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-4 py-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-sm focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-all duration-200 font-medium">
                <option value="all">All Types</option>
                <option value="customer">Customer Only</option>
                <option value="vendor">Vendor Only</option>
              </select>
              <select value={filterActive} onChange={(e) => setFilterActive(e.target.value)} className="px-4 py-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-sm focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-all duration-200 font-medium">
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
            {selectedOrgs.size > 0 && (<div className="flex items-center gap-2">
                <span className="text-sm text-[hsl(var(--muted-foreground))]">
                  {selectedOrgs.size} selected
                </span>
                <button onClick={handleBulkDelete} className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive))]/90 text-white rounded-xl transition-colors font-semibold text-sm">
                  <MdDelete className="w-4 h-4"/>
                  Delete Selected
                </button>
              </div>)}
          </div>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (<div className="p-12 text-center rounded-2xl bg-[hsl(var(--card))]/80 backdrop-blur-xl border border-[hsl(var(--border))]/50 shadow-lg">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[hsl(var(--border))] border-t-[hsl(var(--primary))]"></div>
          <p className="mt-4 text-[hsl(var(--muted-foreground))] font-medium">Loading organizations...</p>
        </div>) : (<div className="p-6 rounded-2xl bg-[hsl(var(--card))]/80 backdrop-blur-xl border border-[hsl(var(--border))]/50 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Showing {filteredOrgs.length} organization{filteredOrgs.length !== 1 ? 's' : ''}
            </p>
            <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] transition-colors text-sm font-medium text-[hsl(var(--foreground))]">
              <MdDownload className="w-4 h-4"/>
              Export
            </button>
          </div>
          <DataTable columns={columns} data={filteredOrgs} onDelete={handleDelete} emptyMessage="No organizations found."/>
        </div>)}

      {/* Create Organization Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Organization" icon={<MdBusiness className="w-6 h-6 text-[hsl(var(--primary))]"/>}>
        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
              Organization Name <span className="text-red-500">*</span>
            </label>
            <input type="text" value={newOrgName} onChange={(e) => setNewOrgName(e.target.value)} className={cn('w-full px-4 py-2.5 border-2 rounded-lg bg-[hsl(var(--card))] text-[hsl(var(--foreground))]', 'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all')} placeholder="Enter organization name"/>
          </div>

          {/* Admin Email */}
          <div>
            <label className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
              Admin Email <span className="text-red-500">*</span>
            </label>
            <input type="email" value={newOrgEmail} onChange={(e) => setNewOrgEmail(e.target.value)} className={cn('w-full px-4 py-2.5 border-2 rounded-lg bg-[hsl(var(--card))] text-[hsl(var(--foreground))]', 'focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent transition-all')} placeholder="Enter admin email"/>
            <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
              An invitation email with login credentials will be sent to this email address.
            </p>
          </div>

          {/* Type Dropdown */}
          <div>
            <label className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
              Organization Type <span className="text-red-500">*</span>
            </label>
            <select value={newOrgType} onChange={(e) => setNewOrgType(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border-2 border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-sm focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-all duration-200 font-medium">
              <option value="customer">Customer</option>
              <option value="vendor">Vendor</option>
            </select>
          </div>

          {formError && (<div className="p-3 rounded-lg bg-[hsl(var(--destructive))]/10 border border-red-200 dark:border-red-800 text-[hsl(var(--destructive))] text-sm">
              {formError}
            </div>)}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[hsl(var(--border))]">
            <button type="button" onClick={() => setIsModalOpen(false)} disabled={createMutation.isPending} className="px-4 py-2 rounded-lg bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))] font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50">
              Cancel
            </button>
            <button type="button" onClick={() => {
            setFormError(null);
            createMutation.mutate();
        }} disabled={createMutation.isPending} className="px-4 py-2 rounded-lg bg-[hsl(var(--primary))] text-white font-semibold hover:bg-[hsl(var(--primary))]/90 transition-colors disabled:opacity-50 shadow-lg hover:shadow-xl">
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>
      </Modal>

    </div>);
}
//# sourceMappingURL=OrganizationsPage.js.map