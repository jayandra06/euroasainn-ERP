import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MdAdd, MdKeyboardArrowDown, MdKeyboardArrowUp, MdFileUpload, MdSearch } from 'react-icons/md';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const RFQ_STATUS_FILTER_OPTIONS = ['All Status', 'Sent', 'Ordered', 'Quoted', 'Delivered', 'draft'];
// NOTE: this expects the file to be placed in apps/customer-portal/public with this exact name
const BULK_EXCEL_URL = '/bulk-template (1).xlsx';

interface Vessel {
  _id: string;
  name: string;
  imoNumber?: string;
  type?: string;
}

interface RFQ {
  _id: string;
  rfqNumber: string;
  title: string;
  description?: string;
  status: string;
  dueDate?: string;
  vesselId?: Vessel | string;
  brand?: string;
  model?: string;
  category?: string;
  categories?: string[];
  supplyPort?: string;
  createdAt: string;
}

export function RFQsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'your-rfqs' | 'waiting-approval'>('your-rfqs');
  const [showFilters, setShowFilters] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch RFQs
  const { data: rfqs, isLoading } = useQuery<RFQ[]>({
    queryKey: ['rfqs', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'All Status') {
        params.append('status', statusFilter.toLowerCase());
      }
      const response = await fetch(
        `${API_URL}/api/v1/customer/rfq${params.toString() ? `?${params.toString()}` : ''}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        }
      );
      if (!response.ok) throw new Error('Failed to fetch RFQs');
      const data = await response.json();
      return data.data || [];
    },
  });

  // Filter RFQs based on search
  const filteredRFQs = rfqs?.filter((rfq) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const vesselName =
      typeof rfq.vesselId === 'object' && rfq.vesselId ? rfq.vesselId.name : '';
    return (
      vesselName.toLowerCase().includes(query) ||
      rfq.supplyPort?.toLowerCase().includes(query) ||
      rfq.brand?.toLowerCase().includes(query) ||
      rfq.category?.toLowerCase().includes(query) ||
      rfq.categories?.some((cat) => cat.toLowerCase().includes(query)) ||
      rfq.title.toLowerCase().includes(query)
    );
  }) || [];

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  // Get vessel name
  const getVesselName = (rfq: RFQ) => {
    if (!rfq.vesselId) return '-';
    if (typeof rfq.vesselId === 'object') {
      return rfq.vesselId.name || '-';
    }
    return '-';
  };

  // Get category display
  const getCategoryDisplay = (rfq: RFQ) => {
    if (rfq.categories && rfq.categories.length > 0) {
      return rfq.categories.join(', ');
    }
    return rfq.category || '-';
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Your RFQs</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters((prev) => !prev)}
            className="p-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors"
            aria-expanded={showFilters}
            aria-label={showFilters ? 'Hide filters' : 'Show filters'}
          >
            {showFilters ? <MdKeyboardArrowUp className="w-5 h-5" /> : <MdKeyboardArrowDown className="w-5 h-5" />}
          </button>
          <button
            onClick={() => navigate('/create-enquiry')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-400 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
          >
            <MdAdd className="w-5 h-5" />
            Create Enquiry
          </button>
          <button
            onClick={() => window.open(BULK_EXCEL_URL, '_blank')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <MdFileUpload className="w-5 h-5" />
            Bulk Add (Excel)
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('your-rfqs')}
          className={`pb-3 px-1 font-medium transition-colors ${
            activeTab === 'your-rfqs'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Your RFQs
        </button>
        <button
          onClick={() => setActiveTab('waiting-approval')}
          className={`pb-3 px-1 font-medium transition-colors ${
            activeTab === 'waiting-approval'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Waiting for Approval
        </button>
      </div>

      {/* Content */}
      {activeTab === 'your-rfqs' ? (
        <div className="space-y-4">
          {/* Filters */}
          {showFilters && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Status:</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
                >
                  {RFQ_STATUS_FILTER_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 flex-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Search RFQs:</label>
                <div className="relative flex-1 min-w-[300px]">
                  <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Vessel Name, Supply Port, Brand, or Category"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {isLoading ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                Loading RFQs...
              </div>
            ) : filteredRFQs.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                {searchQuery ? 'No RFQs found matching your search' : 'No RFQs found'}
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                      LEAD DATE
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                      TIME
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                      VESSEL NAME
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                      SUPPLY PORT
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                      BRAND
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                      CATEGORY
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                      STATUS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRFQs.map((rfq) => (
                    <tr
                      key={rfq._id}
                      className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {formatDate(rfq.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {formatTime(rfq.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {getVesselName(rfq)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {rfq.supplyPort || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{rfq.brand || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                        {getCategoryDisplay(rfq)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            rfq.status === 'sent' || rfq.status === 'ordered'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              : rfq.status === 'quoted'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                              : rfq.status === 'delivered'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {rfq.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed">
              Previous
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Page 1 of {Math.ceil((filteredRFQs.length || 0) / 10)}
            </span>
            <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors">
              Next
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">RFQs Waiting for Your Approval</h2>

          {/* Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            {isLoading ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                Loading RFQs...
              </div>
            ) : filteredRFQs.filter((rfq) => rfq.status === 'draft' || rfq.status === 'pending').length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                No RFQs waiting for approval
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                      LEAD DATE
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                      SUPPLY PORT
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                      VESSEL NAME
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                      BRAND
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                      STATUS
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRFQs
                    .filter((rfq) => rfq.status === 'draft' || rfq.status === 'pending')
                    .map((rfq) => (
                      <tr
                        key={rfq._id}
                        className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {formatDate(rfq.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {rfq.supplyPort || '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {getVesselName(rfq)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{rfq.brand || '-'}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              rfq.status === 'sent' || rfq.status === 'ordered'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                : rfq.status === 'quoted'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                : rfq.status === 'delivered'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {rfq.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed">
              Previous
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400">Page 1 of 0</span>
            <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors">
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
