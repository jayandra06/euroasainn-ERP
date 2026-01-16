import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MdSearch } from 'react-icons/md';
import { authenticatedFetch } from '../../lib/api';

interface RFQ {
  _id: string;
  rfqNumber: string;
  title: string;
  vesselId?: {
    _id: string;
    name: string;
    imoNumber?: string;
  };
  supplyPort?: string;
  brand?: string;
  status: string;
  createdAt: string;
  senderType?: 'admin' | 'customer';
  senderId?: {
    _id: string;
    name: string;
  };
  organizationId?: {
    _id: string;
    name: string;
  };
}

export function RFQsPage() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all RFQs
  const { data: rfqs = [], isLoading, error: queryError } = useQuery<RFQ[]>({
    queryKey: ['admin-rfqs', activeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activeFilter !== 'all') {
        params.append('status', activeFilter);
      }
      const response = await authenticatedFetch(`/api/v1/admin/rfq?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch RFQs' }));
        console.error('RFQ fetch error:', errorData);
        throw new Error(errorData.error || 'Failed to fetch RFQs');
      }
      const data = await response.json();
      console.log('RFQs fetched:', data.data?.length || 0, 'RFQs');
      return data.data || [];
    },
  });

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'rfq-received', label: 'RFQ Received' },
    { id: 'quote-sent', label: 'Quote Sent' },
    { id: 'order-confirmed', label: 'Order Confirmed' },
    { id: 'order-cancelled', label: 'Order Cancelled' },
    { id: 'order-completed', label: 'Order Completed' },
  ];

  const handleCreateEnquiry = () => {
    navigate('/dashboard/admin/create-enquiry');
  };

  return (
    <div className="w-full min-h-screen p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mb-2">Admin &gt; Dashboard</p>
          <h1 className="text-3xl font-bold text-[hsl(var(--foreground))]">Request for Quotes</h1>
        </div>
        <button
          onClick={handleCreateEnquiry}
          className="px-4 py-2 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-white rounded-lg transition-colors"
        >
          Create Enquiry
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[hsl(var(--muted-foreground))] w-5 h-5" />
          <input
            type="text"
            placeholder="Search by vessel name, brand, or supply port"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex gap-2 overflow-x-auto">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeFilter === filter.id
                ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                : 'bg-[hsl(var(--card))] text-[hsl(var(--foreground))] border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[hsl(var(--card))] rounded-lg border border-[hsl(var(--border))] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[hsl(var(--secondary))]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[hsl(var(--muted-foreground))] uppercase tracking-wider">DATE</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[hsl(var(--muted-foreground))] uppercase tracking-wider">TIME</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[hsl(var(--muted-foreground))] uppercase tracking-wider">SUPPLY PORT</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[hsl(var(--muted-foreground))] uppercase tracking-wider">VESSEL NAME</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[hsl(var(--muted-foreground))] uppercase tracking-wider">BRAND</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-[hsl(var(--muted-foreground))] uppercase tracking-wider">STATUS</th>
              </tr>
            </thead>
            <tbody className="bg-[hsl(var(--card))] divide-y divide-gray-200 dark:divide-gray-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-[hsl(var(--muted-foreground))]">
                    Loading RFQs...
                  </td>
                </tr>
              ) : queryError ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-red-500 dark:text-red-400">
                    Error: {queryError instanceof Error ? queryError.message : 'Failed to load RFQs'}
                  </td>
                </tr>
              ) : rfqs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-[hsl(var(--muted-foreground))]">
                    No RFQs available for the selected filter.
                  </td>
                </tr>
              ) : (
                rfqs
                  .filter((rfq) => {
                    if (searchQuery) {
                      const query = searchQuery.toLowerCase();
                      return (
                        rfq.vesselId?.name?.toLowerCase().includes(query) ||
                        rfq.supplyPort?.toLowerCase().includes(query) ||
                        rfq.brand?.toLowerCase().includes(query) ||
                        rfq.title?.toLowerCase().includes(query) ||
                        rfq.senderId?.name?.toLowerCase().includes(query)
                      );
                    }
                    return true;
                  })
                  .map((rfq) => {
                    const date = new Date(rfq.createdAt);
                    const dateStr = date.toLocaleDateString();
                    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    return (
                      <tr 
                        key={rfq._id} 
                        className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                        onClick={() => navigate(`/dashboard/admin/rfqs/${rfq._id}`)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-[hsl(var(--foreground))]">{dateStr}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-[hsl(var(--foreground))]">{timeStr}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-[hsl(var(--foreground))]">{rfq.supplyPort || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-[hsl(var(--foreground))]">{rfq.vesselId?.name || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-[hsl(var(--foreground))]">{rfq.brand || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            rfq.status === 'draft' ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' :
                            rfq.status === 'sent' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                            rfq.status === 'quoted' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                            rfq.status === 'ordered' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                          }`}>
                            {rfq.status || 'draft'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-[hsl(var(--border))] flex items-center justify-between">
          <button
            disabled
            className="px-4 py-2 text-sm font-medium text-gray-500 dark:text-[hsl(var(--muted-foreground))] bg-[hsl(var(--secondary))] rounded-lg cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-[hsl(var(--foreground))]">Page 1 of 0</span>
          <button className="px-4 py-2 text-sm font-medium text-white bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 rounded-lg transition-colors">
            Next
          </button>
        </div>
      </div>

    </div>
  );
}

