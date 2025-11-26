import React, { useState } from 'react';
import { MdSearch, MdClose } from 'react-icons/md';

export function RFQsPage() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    vesselName: '',
    brand: '',
    supplyPort: '',
    quantity: '',
    notes: '',
  });

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'rfq-received', label: 'RFQ Received' },
    { id: 'quote-sent', label: 'Quote Sent' },
    { id: 'order-confirmed', label: 'Order Confirmed' },
    { id: 'order-cancelled', label: 'Order Cancelled' },
    { id: 'order-completed', label: 'Order Completed' },
  ];

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({
      vesselName: '',
      brand: '',
      supplyPort: '',
      quantity: '',
      notes: '',
    });
  };

  const handleSubmit = () => {
    // TODO: Implement submit logic
    console.log('Create Enquiry:', formData);
    handleCloseModal();
  };

  return (
    <div className="w-full min-h-screen p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mb-2">Admin &gt; Dashboard</p>
          <h1 className="text-3xl font-bold text-[hsl(var(--foreground))]">Request for Quotes</h1>
        </div>
        <button
          onClick={handleOpenModal}
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
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-[hsl(var(--muted-foreground))]">
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

      {/* Create Enquiry Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-[hsl(var(--card))] rounded-lg shadow-xl w-full max-w-md mx-4 border border-[hsl(var(--border))]">
            <div className="flex items-center justify-between p-6 border-b border-[hsl(var(--border))]">
              <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">Create Enquiry</h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-500 dark:text-[hsl(var(--muted-foreground))] hover:text-gray-700 dark:hover:text-gray-200"
              >
                <MdClose className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-[hsl(var(--muted-foreground))] mb-6">
                Enter the details for the new enquiry.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    Vessel Name
                  </label>
                  <input
                    type="text"
                    value={formData.vesselName}
                    onChange={(e) => setFormData({ ...formData, vesselName: e.target.value })}
                    className="w-full px-4 py-2 border border-[hsl(var(--primary))] rounded-lg bg-[hsl(var(--card))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                    placeholder="Enter vessel name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    Brand
                  </label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-4 py-2 border border-[hsl(var(--primary))] rounded-lg bg-[hsl(var(--card))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                    placeholder="Enter brand"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    Supply Port
                  </label>
                  <input
                    type="text"
                    value={formData.supplyPort}
                    onChange={(e) => setFormData({ ...formData, supplyPort: e.target.value })}
                    className="w-full px-4 py-2 border border-[hsl(var(--primary))] rounded-lg bg-[hsl(var(--card))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                    placeholder="Enter supply port"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full px-4 py-2 border border-[hsl(var(--primary))] rounded-lg bg-[hsl(var(--card))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                    placeholder="Enter quantity"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-[hsl(var(--primary))] rounded-lg bg-[hsl(var(--card))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] resize-none"
                    placeholder="Enter additional notes"
                  />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-[hsl(var(--border))]">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 border border-blue-600 text-[hsl(var(--primary))] rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-white rounded-lg transition-colors"
              >
                Create Enquiry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

