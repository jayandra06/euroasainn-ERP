import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DataTable } from '../../components/shared/DataTable';
import { useToast } from '../../components/shared/Toast';
import { MdAdd, MdSearch, MdClose } from 'react-icons/md';
import { cn } from '../../lib/utils';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export function VendorsPage() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        company: '',
    });
    // Fetch vendor users
    const { data: vendorsData, isLoading } = useQuery({
        queryKey: ['vendors', activeFilter],
        queryFn: async () => {
            const params = new URLSearchParams({ portalType: 'vendor' });
            if (activeFilter !== 'all') {
                if (activeFilter === 'approved' || activeFilter === 'waiting' || activeFilter === 'rejected') {
                    // These filters might need to be mapped to onboarding status
                    // For now, we'll use isActive for approved/disabled
                    if (activeFilter === 'approved') {
                        params.append('isActive', 'true');
                    }
                    else if (activeFilter === 'disabled') {
                        params.append('isActive', 'false');
                    }
                }
                else if (activeFilter === 'disabled') {
                    params.append('isActive', 'false');
                }
            }
            const response = await fetch(`${API_URL}/api/v1/admin/vendors?${params}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                },
            });
            if (!response.ok)
                throw new Error('Failed to fetch vendors');
            const data = await response.json();
            return data.data || [];
        },
    });
    // Filter vendors by search query
    const filteredVendors = useMemo(() => {
        if (!vendorsData)
            return [];
        if (!searchQuery.trim())
            return vendorsData;
        const query = searchQuery.toLowerCase();
        return vendorsData.filter((vendor) => vendor.email?.toLowerCase().includes(query) ||
            vendor.firstName?.toLowerCase().includes(query) ||
            vendor.lastName?.toLowerCase().includes(query) ||
            `${vendor.firstName} ${vendor.lastName}`.toLowerCase().includes(query) ||
            vendor.organizationName?.toLowerCase().includes(query) ||
            vendor.phone?.toLowerCase().includes(query));
    }, [vendorsData, searchQuery]);
    const filters = [
        { id: 'all', label: 'All' },
        { id: 'approved', label: 'Active' },
        { id: 'disabled', label: 'Inactive' },
    ];
    const handleOpenModal = () => {
        setIsModalOpen(true);
    };
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setFormData({
            name: '',
            email: '',
            phone: '',
            company: '',
        });
    };
    const handleSubmit = () => {
        // TODO: Implement submit logic - this should navigate to vendor organizations page
        console.log('Add Vendor:', formData);
        showToast('Please use "Vendor Organizations" page to invite new vendors', 'info');
        handleCloseModal();
    };
    const columns = [
        {
            key: 'name',
            header: 'Name',
            render: (vendor) => (<div className="font-semibold text-[hsl(var(--foreground))]">
          {vendor.fullName || `${vendor.firstName || ''} ${vendor.lastName || ''}`.trim() || 'N/A'}
        </div>),
        },
        {
            key: 'email',
            header: 'Email',
            render: (vendor) => (<span className="text-[hsl(var(--muted-foreground))]">{vendor.email}</span>),
        },
        {
            key: 'phone',
            header: 'Phone',
            render: (vendor) => (<span className="text-[hsl(var(--muted-foreground))]">{vendor.phone || 'N/A'}</span>),
        },
        {
            key: 'organizationName',
            header: 'Company',
            render: (vendor) => (<span className="text-[hsl(var(--muted-foreground))]">{vendor.organizationName || 'N/A'}</span>),
        },
        {
            key: 'isActive',
            header: 'Status',
            render: (vendor) => (<span className={cn('px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full', vendor.isActive
                    ? 'bg-emerald-100 text-[hsl(var(--foreground))] font-semibold dark:bg-emerald-900/50 ring-1 ring-emerald-200 dark:ring-emerald-800'
                    : 'bg-red-100 text-[hsl(var(--foreground))] font-semibold dark:bg-red-900/50 ring-1 ring-red-200 dark:ring-red-800')}>
          {vendor.isActive ? 'Active' : 'Inactive'}
        </span>),
        },
    ];
    return (<div className="w-full min-h-screen p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mb-2">Admin &gt; Dashboard</p>
          <h1 className="text-3xl font-bold text-[hsl(var(--foreground))]">All Merchants</h1>
        </div>
        <button onClick={handleOpenModal} className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-[hsl(var(--primary-foreground))] rounded-lg transition-colors">
          <MdAdd className="w-5 h-5"/>
          Add Vendor
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex gap-2 overflow-x-auto">
        {filters.map((filter) => (<button key={filter.id} onClick={() => setActiveFilter(filter.id)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${activeFilter === filter.id
                ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                : 'bg-[hsl(var(--card))] text-[hsl(var(--foreground))] border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]'}`}>
            {filter.label}
          </button>))}
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"/>
          <input type="text" placeholder="Search by name, email, or company" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent"/>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (<div className="bg-[hsl(var(--card))] rounded-lg border border-[hsl(var(--border))] p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-[hsl(var(--primary))]"></div>
          <p className="mt-4 text-[hsl(var(--muted-foreground))] font-medium">Loading vendors...</p>
        </div>) : (<div className="bg-[hsl(var(--card))] rounded-lg border border-[hsl(var(--border))] overflow-hidden">
          <DataTable columns={columns} data={filteredVendors} emptyMessage="No vendors found."/>
        </div>)}

      {/* Add Vendor Modal */}
      {isModalOpen && (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-[hsl(var(--card))] rounded-lg shadow-xl w-full max-w-md mx-4 border border-[hsl(var(--border))]">
            <div className="flex items-center justify-between p-6 border-b border-[hsl(var(--border))]">
              <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">Add New Vendor</h2>
              <button onClick={handleCloseModal} className="text-[hsl(var(--muted-foreground))] hover:text-gray-700 dark:hover:text-gray-200">
                <MdClose className="w-6 h-6"/>
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-[hsl(var(--muted-foreground))] mb-6">
                Enter the details for the new vendor.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    Name
                  </label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 border border-[hsl(var(--primary))] rounded-lg bg-[hsl(var(--card))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]" placeholder="Enter vendor name"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    Email
                  </label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2 border border-[hsl(var(--primary))] rounded-lg bg-[hsl(var(--card))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]" placeholder="Enter email address"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    Phone
                  </label>
                  <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-2 border border-[hsl(var(--primary))] rounded-lg bg-[hsl(var(--card))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]" placeholder="Enter phone number"/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    Company
                  </label>
                  <input type="text" value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} className="w-full px-4 py-2 border border-[hsl(var(--primary))] rounded-lg bg-[hsl(var(--card))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]" placeholder="Enter company name"/>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-[hsl(var(--border))]">
              <button onClick={handleCloseModal} className="px-4 py-2 border border-blue-600 text-[hsl(var(--primary))] rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors">
                Cancel
              </button>
              <button onClick={handleSubmit} className="px-4 py-2 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-[hsl(var(--primary-foreground))] rounded-lg transition-colors">
                Add Vendor
              </button>
            </div>
          </div>
        </div>)}
    </div>);
}
//# sourceMappingURL=VendorsPage.js.map