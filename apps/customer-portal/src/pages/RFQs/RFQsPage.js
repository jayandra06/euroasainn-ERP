import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdAdd, MdKeyboardArrowDown, MdKeyboardArrowUp, MdFileUpload } from 'react-icons/md';
import { authenticatedFetch } from '../../lib/api';
import { useToast } from '../../components/shared/Toast';
const RFQ_STATUS_FILTER_OPTIONS = ['All Status', 'Sent', 'Ordered', 'Quoted', 'Delivered'];
// NOTE: this expects the file to be placed in apps/customer-portal/public with this exact name
const BULK_EXCEL_URL = '/bulk-template (1).xlsx';
export function RFQsPage() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState('your-rfqs');
    const [showFilters, setShowFilters] = useState(true);
    const [rfqs, setRfqs] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState('All Status');
    const [searchQuery, setSearchQuery] = useState('');
    useEffect(() => {
        fetchRFQs();
    }, [activeTab]);
    const fetchRFQs = async () => {
        setIsLoading(true);
        try {
            const response = await authenticatedFetch('/api/v1/customer/rfq');
            if (!response.ok) {
                throw new Error('Failed to fetch RFQs');
            }
            const data = await response.json();
            setRfqs(data.data || []);
        }
        catch (error) {
            showToast(error.message || 'Failed to fetch RFQs', 'error');
        }
        finally {
            setIsLoading(false);
        }
    };
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };
    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };
    const filteredRFQs = rfqs.filter((rfq) => {
        // Status filter
        if (statusFilter !== 'All Status') {
            const statusMap = {
                'Sent': 'sent',
                'Ordered': 'ordered',
                'Quoted': 'quoted',
                'Delivered': 'delivered',
            };
            if (rfq.status !== statusMap[statusFilter]) {
                return false;
            }
        }
        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (rfq.vesselId?.name?.toLowerCase().includes(query) ||
                rfq.supplyPort?.toLowerCase().includes(query) ||
                rfq.brand?.toLowerCase().includes(query) ||
                rfq.category?.toLowerCase().includes(query) ||
                rfq.title?.toLowerCase().includes(query));
        }
        return true;
    });
    return (<div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[hsl(var(--foreground))]">Your RFQs</h1>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowFilters((prev) => !prev)} className="p-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors" aria-expanded={showFilters} aria-label={showFilters ? 'Hide filters' : 'Show filters'}>
            {showFilters ? <MdKeyboardArrowUp className="w-5 h-5"/> : <MdKeyboardArrowDown className="w-5 h-5"/>}
          </button>
          <button onClick={() => navigate('/create-enquiry')} className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--primary))]/80 hover:bg-[hsl(var(--primary))] text-white rounded-lg font-medium transition-colors">
            <MdAdd className="w-5 h-5"/>
            Create Enquiry
          </button>
          <button onClick={() => window.open(BULK_EXCEL_URL, '_blank')} className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-[hsl(var(--primary-foreground))] rounded-lg font-medium transition-colors">
            <MdFileUpload className="w-5 h-5"/>
            Bulk Add (Excel)
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-[hsl(var(--border))]">
        <button onClick={() => setActiveTab('your-rfqs')} className={`pb-3 px-1 font-medium transition-colors ${activeTab === 'your-rfqs'
            ? 'text-[hsl(var(--foreground))] font-semibold border-b-2 border-blue-600 dark:border-blue-400'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>
          Your RFQs
        </button>
        <button onClick={() => setActiveTab('waiting-approval')} className={`pb-3 px-1 font-medium transition-colors ${activeTab === 'waiting-approval'
            ? 'text-[hsl(var(--foreground))] font-semibold border-b-2 border-blue-600 dark:border-blue-400'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}>
          Waiting for Approval
        </button>
      </div>

      {/* Content */}
      {activeTab === 'your-rfqs' ? (<div className="space-y-4">
          {/* Filters */}
          {showFilters && (<div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-[hsl(var(--foreground))]">Filter by Status:</label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))]">
                  {RFQ_STATUS_FILTER_OPTIONS.map((status) => (<option key={status} value={status}>
                      {status}
                    </option>))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-[hsl(var(--foreground))]">Search RFQs:</label>
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Vessel Name, Supply Port, Brand, or Category" className="px-4 py-2 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] flex-1 min-w-[300px]"/>
              </div>
            </div>)}

          {/* Table */}
          <div className="bg-[hsl(var(--card))] rounded-lg border border-[hsl(var(--border))] overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[hsl(var(--foreground))] uppercase">LEAD DATE</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[hsl(var(--foreground))] uppercase">TIME</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[hsl(var(--foreground))] uppercase">VESSEL NAME</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[hsl(var(--foreground))] uppercase">SUPPLY PORT</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[hsl(var(--foreground))] uppercase">BRAND</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[hsl(var(--foreground))] uppercase">CATEGORY</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[hsl(var(--foreground))] uppercase">STATUS</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (<tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
                      Loading...
                    </td>
                  </tr>) : filteredRFQs.length === 0 ? (<tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
                      No RFQs found
                    </td>
                  </tr>) : (filteredRFQs.map((rfq) => (<tr key={rfq._id} onClick={() => navigate(`/rfqs/${rfq._id}`)} className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                      <td className="px-4 py-3 text-sm text-[hsl(var(--foreground))]">
                        {formatDate(rfq.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-sm text-[hsl(var(--foreground))]">
                        {formatTime(rfq.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-sm text-[hsl(var(--foreground))]">
                        {rfq.vesselId?.name || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-[hsl(var(--foreground))]">
                        {rfq.supplyPort || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-[hsl(var(--foreground))]">
                        {rfq.brand || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-[hsl(var(--foreground))]">
                        {rfq.category || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${rfq.status === 'sent' || rfq.status === 'draft'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    : rfq.status === 'quoted'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'}`}>
                          {rfq.status}
                        </span>
                      </td>
                    </tr>)))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-[hsl(var(--foreground))] rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed">
              Previous
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400">Page 1 of 0</span>
            <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors">
              Next
            </button>
          </div>
        </div>) : (<div className="space-y-4">
          <h2 className="text-2xl font-bold text-[hsl(var(--foreground))]">RFQs Waiting for Your Approval</h2>
          
          {/* Table */}
          <div className="bg-[hsl(var(--card))] rounded-lg border border-[hsl(var(--border))] overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[hsl(var(--foreground))] uppercase">LEAD DATE</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[hsl(var(--foreground))] uppercase">SUPPLY PORT</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[hsl(var(--foreground))] uppercase">VESSEL NAME</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[hsl(var(--foreground))] uppercase">BRAND</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-[hsl(var(--foreground))] uppercase">STATUS</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
                    No RFQs found
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-[hsl(var(--foreground))] rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed">
              Previous
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400">Page 1 of 0</span>
            <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors">
              Next
            </button>
          </div>
        </div>)}
    </div>);
}
//# sourceMappingURL=RFQsPage.js.map