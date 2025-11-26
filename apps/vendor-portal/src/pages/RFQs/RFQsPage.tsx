import React, { useState } from 'react';
import { MdSearch } from 'react-icons/md';

export function RFQsPage() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'rfq-received', label: 'RFQ Received' },
    { id: 'quote-sent', label: 'Quote Sent' },
    { id: 'order-confirmed', label: 'Order Confirmed' },
    { id: 'order-cancelled', label: 'Order Cancelled' },
    { id: 'order-completed', label: 'Order Completed' },
  ];

  return (
    <div className="w-full min-h-screen p-8">
      <div className="mb-6">
        <p className="text-sm text-[hsl(var(--muted-foreground))] mb-2">Vendor &gt; Dashboard</p>
        <h1 className="text-3xl font-bold text-[hsl(var(--foreground))]">Request for Quotes</h1>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">DATE</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">TIME</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">SUPPLY PORT</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">VESSEL NAME</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">BRAND</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">STATUS</th>
              </tr>
            </thead>
            <tbody className="bg-[hsl(var(--card))] divide-y divide-[hsl(var(--border))]">
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-[hsl(var(--muted-foreground))]">
                  No RFQs available for the selected filter.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-[hsl(var(--border))] flex items-center justify-between">
          <button
            disabled
            className="px-4 py-2 text-sm font-medium text-[hsl(var(--muted-foreground))] bg-[hsl(var(--muted))] rounded-lg cursor-not-allowed"
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

