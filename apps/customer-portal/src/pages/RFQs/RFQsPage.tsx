import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import {
  MdAdd,
  MdKeyboardArrowDown,
  MdKeyboardArrowUp,
  MdFileUpload,
  MdChevronLeft,
  MdChevronRight,
  MdInfo,
  MdDownload,
} from 'react-icons/md';
import { authenticatedFetch } from '../../lib/api';
import { useToast } from '../../components/shared/Toast';
import { Modal } from '../../components/shared/Modal';
import { cn } from '../../lib/utils';

const RFQ_STATUS_FILTER_OPTIONS = ['All Status', 'Sent', 'Ordered', 'Quoted', 'Delivered'];
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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
  category?: string;
  status: string;
  createdAt: string;
}

export function RFQsPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeTab, setActiveTab] = useState<'your-rfqs' | 'waiting-approval'>('your-rfqs');
  const [showFilters, setShowFilters] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSampleDataModalOpen, setIsSampleDataModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const { data: rfqsData, isLoading, error: queryError, refetch } = useQuery<RFQ[]>({
    queryKey: ['customer-rfqs', activeTab],
    queryFn: async () => {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/api/v1/customer/rfq`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch RFQs');
      }
      const data = await response.json();
      return data.data || [];
    },
  });

  const rfqs = rfqsData || [];

  const bulkUploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${API_URL}/api/v1/customer/rfq/bulk-upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || responseData.message || 'Bulk upload failed');
      }

      console.log('Bulk upload RFQ response:', responseData);
      return responseData;
    },
    onSuccess: (data) => {
      console.log('Bulk upload RFQ success data:', data);
      const responseData = data.data || data;
      const created = responseData?.created || 0;
      const updated = responseData?.updated || 0;
      const skipped = responseData?.skipped || 0;
      const errors = responseData?.details?.errors || [];

      let message = `Bulk upload completed!`;
      const parts: string[] = [];
      if (created > 0) parts.push(`Created: ${created}`);
      if (updated > 0) parts.push(`Updated: ${updated}`);
      if (skipped > 0) parts.push(`Skipped: ${skipped}`);

      if (parts.length > 0) {
        message += ` ${parts.join(', ')}`;
      }

      if (errors && errors.length > 0) {
        message += `. ${errors.length} error(s) occurred.`;
        console.error('Bulk upload RFQ errors:', errors);
      }

      showToast(message, 'success');
      queryClient.invalidateQueries({ queryKey: ['customer-rfqs'] });
      setPage(1);

      if (errors && errors.length > 0) {
        setTimeout(() => {
          alert(
            `Upload completed with ${errors.length} error(s):\n\n${errors.slice(0, 10).join('\n')}${
              errors.length > 10 ? `\n... and ${errors.length - 10} more` : ''
            }`
          );
        }, 500);
      }
    },
    onError: (error: Error) => {
      console.error('Bulk upload RFQ error:', error);
      showToast(`Bulk upload failed: ${error.message}`, 'error');
    },
  });

  const handleBulkUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    if (!allowedTypes.includes(file.type)) {
      showToast('Invalid file type. Please upload CSV or Excel.', 'error');
      return;
    }

    bulkUploadMutation.mutate(file);
    if (e.target) e.target.value = '';
  };

  const handleDownloadSample = () => {
    const sampleData = [
      {
        vesselName: 'MV Atlantic',
        vesselExName: 'Atlantic Star',
        imoNumber: 'IMO1234567',
        supplyPort: 'Singapore',
        equipmentTags: 'Engine, Main',
        category: 'Engine Parts',
        subCategory: 'Piston Rings',
        brand: 'Caterpillar',
        model: 'C3516',
        hullNo: 'HULL-001',
        serialNumber: 'SN-12345',
        drawingNumber: 'DWG-001',
        remarks: 'Emergency engine parts required for maintenance',
        preferredQuality: 'Premium',
        typeOfIncoterms: 'CIF',
        typeOfLogisticContainer: '20ft Container',
        createdDate: '2026-01-10',
        leadDate: '2026-02-15',
        vendor1: 'Vendor Name 1',
        vendor2: 'Vendor Name 2',
        vendor3: '',
        items: 'Piston Ring Set|5|Set|Required for cylinder 1|IMPA-001|PART-123|ALT-456|POS-001|100x50x10\nGasket Kit|2|Kit|Standard gasket set|IMPA-002|PART-789||POS-002|200x100x5',
      },
      {
        vesselName: 'MV Pacific',
        vesselExName: 'Pacific Wave',
        imoNumber: 'IMO7654321',
        supplyPort: 'Hong Kong',
        equipmentTags: 'Navigation',
        category: 'Navigation Equipment',
        subCategory: 'GPS System',
        brand: 'Garmin',
        model: 'GPSMAP 8600',
        hullNo: 'HULL-002',
        serialNumber: 'SN-67890',
        drawingNumber: 'DWG-002',
        remarks: 'GPS and radar system upgrade required',
        preferredQuality: 'Standard',
        typeOfIncoterms: 'FOB',
        typeOfLogisticContainer: '40ft Container',
        createdDate: '2026-01-10',
        leadDate: '2026-02-20',
        vendor1: 'Vendor Name 1',
        vendor2: '',
        vendor3: '',
        items: 'GPS Unit|1|Unit|Marine grade GPS unit|IMPA-003|GPS-001||BRIDGE-001|30x20x10',
      },
    ];

    const headers = [
      'vesselName',
      'vesselExName',
      'imoNumber',
      'supplyPort',
      'equipmentTags',
      'category',
      'subCategory',
      'brand',
      'model',
      'hullNo',
      'serialNumber',
      'drawingNumber',
      'remarks',
      'preferredQuality',
      'typeOfIncoterms',
      'typeOfLogisticContainer',
      'createdDate',
      'leadDate',
      'vendor1',
      'vendor2',
      'vendor3',
      'items',
    ];
    
    const csvContent = [
      headers.join(','),
      ...sampleData.map((row) =>
        headers
          .map((header) => {
            const value = row[header as keyof typeof row] || '';
            return `"${String(value).replace(/"/g, '""')}"`;
          })
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'rfq_bulk_upload_sample.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Sample CSV downloaded!', 'success');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const filteredRFQs = useMemo(() => {
    if (!rfqs) return [];
    return rfqs.filter((rfq) => {
      // Status filter
      if (statusFilter !== 'All Status') {
        const statusMap: Record<string, string> = {
          Sent: 'sent',
          Ordered: 'ordered',
          Quoted: 'quoted',
          Delivered: 'delivered',
        };
        if (rfq.status !== statusMap[statusFilter]) {
          return false;
        }
      }
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          rfq.vesselId?.name?.toLowerCase().includes(query) ||
          rfq.supplyPort?.toLowerCase().includes(query) ||
          rfq.brand?.toLowerCase().includes(query) ||
          rfq.category?.toLowerCase().includes(query) ||
          rfq.title?.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [rfqs, statusFilter, searchQuery]);

  const totalRFQs = filteredRFQs.length;
  const totalPages = Math.ceil(totalRFQs / rowsPerPage);
  const startIndex = totalRFQs === 0 ? 0 : (page - 1) * rowsPerPage + 1;
  const endIndex = Math.min(page * rowsPerPage, totalRFQs);

  const paginatedRFQs = useMemo(() => {
    return filteredRFQs.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  }, [filteredRFQs, page, rowsPerPage]);

  // Smart sliding pagination
  const getVisiblePages = () => {
    const visibleCount = 5;
    let start = Math.max(1, page - Math.floor(visibleCount / 2));
    let end = start + visibleCount - 1;

    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - visibleCount + 1);
    }

    const pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const visiblePages = getVisiblePages();

  useEffect(() => {
    if (totalPages > 0 && page > totalPages) {
      setPage(totalPages);
    } else if (totalPages === 0) {
      setPage(1);
    }
  }, [totalPages, page]);

  return (
    <div className="w-full space-y-6">
      <input
        type="file"
        accept=".csv,.xlsx,.xls"
        ref={fileInputRef}
        onChange={handleBulkUploadFile}
        className="hidden"
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[hsl(var(--foreground))]">Your RFQs</h1>
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
            onClick={() => setIsSampleDataModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <MdInfo className="w-5 h-5" />
            Sample Data
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={bulkUploadMutation.isPending}
            className={cn(
              'flex items-center gap-2 px-4 py-2 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-[hsl(var(--primary-foreground))] rounded-lg font-medium transition-colors',
              bulkUploadMutation.isPending && 'opacity-70 cursor-wait'
            )}
          >
            {bulkUploadMutation.isPending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <MdFileUpload className="w-5 h-5" />
            )}
            Bulk Add (Excel)
          </button>
          <button
            onClick={() => navigate('/create-enquiry')}
            className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--primary))]/80 hover:bg-[hsl(var(--primary))] text-white rounded-lg font-medium transition-colors"
          >
            <MdAdd className="w-5 h-5" />
            Create Enquiry
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-[hsl(var(--border))]">
        <button
          onClick={() => setActiveTab('your-rfqs')}
          className={`pb-3 px-1 font-medium transition-colors ${
            activeTab === 'your-rfqs'
              ? 'text-[hsl(var(--foreground))] font-semibold border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          Your RFQs
        </button>
        <button
          onClick={() => setActiveTab('waiting-approval')}
          className={`pb-3 px-1 font-medium transition-colors ${
            activeTab === 'waiting-approval'
              ? 'text-[hsl(var(--foreground))] font-semibold border-b-2 border-blue-600 dark:border-blue-400'
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
                <label className="text-sm font-medium text-[hsl(var(--foreground))]">Filter by Status:</label>
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))]"
                >
                  {RFQ_STATUS_FILTER_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-[hsl(var(--foreground))]">Search RFQs:</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Vessel Name, Supply Port, Brand, or Category"
                  className="px-4 py-2 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] flex-1 min-w-[300px]"
                />
              </div>
            </div>
          )}

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
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
                      <div className="inline-block w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                      <p className="mt-4">Loading RFQs...</p>
                    </td>
                  </tr>
                ) : queryError ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-red-600">
                      Error loading RFQs: {(queryError as Error).message}
                    </td>
                  </tr>
                ) : paginatedRFQs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
                      {searchQuery || statusFilter !== 'All Status' ? 'No RFQs match your filters' : 'No RFQs found'}
                    </td>
                  </tr>
                ) : (
                  paginatedRFQs.map((rfq) => (
                    <tr key={rfq._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
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
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          rfq.status === 'sent' || rfq.status === 'draft'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            : rfq.status === 'quoted'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                        }`}>
                          {rfq.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Info */}
          {totalRFQs > 0 && (
            <div className="flex items-center justify-between text-sm text-[hsl(var(--muted-foreground))] px-2">
              <div>
                Showing {startIndex}–{endIndex} of {totalRFQs} RFQs
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-6">
              {/* Rows per page */}
              <div className="flex items-center gap-3 text-sm text-[hsl(var(--muted-foreground))]">
                <span>Rows per page:</span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setPage(1);
                  }}
                  className="px-4 py-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>

              {/* Sliding Pagination */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className={cn(
                    'p-3 rounded-xl transition-all',
                    page === 1
                      ? 'text-[hsl(var(--muted-foreground))] cursor-not-allowed'
                      : 'text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]'
                  )}
                >
                  <MdChevronLeft className="w-5 h-5" />
                </button>

                {visiblePages.map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={cn(
                      'w-12 h-12 rounded-xl font-medium transition-all',
                      page === pageNum
                        ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                        : 'hover:bg-[hsl(var(--accent))]'
                    )}
                  >
                    {pageNum}
                  </button>
                ))}

                {visiblePages[visiblePages.length - 1] < totalPages && (
                  <>
                    <span className="px-3 text-[hsl(var(--muted-foreground))]">...</span>
                    <button
                      onClick={() => setPage(totalPages)}
                      className={cn('w-12 h-12 rounded-xl font-medium transition-all hover:bg-[hsl(var(--accent))]')}
                    >
                      {totalPages}
                    </button>
                  </>
                )}

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className={cn(
                    'p-3 rounded-xl transition-all',
                    page === totalPages
                      ? 'text-[hsl(var(--muted-foreground))] cursor-not-allowed'
                      : 'text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))]'
                  )}
                >
                  <MdChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Page X of Y */}
              <div className="text-sm text-[hsl(var(--muted-foreground))] font-medium">
                Page {page} of {totalPages}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
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

          {/* Pagination for Waiting Approval - placeholder for now */}
          <div className="flex items-center justify-center py-6">
            <span className="text-sm text-[hsl(var(--muted-foreground))]">Pagination will be available when data is added</span>
          </div>
        </div>
      )}

      {/* Sample Data Modal */}
      <Modal
        isOpen={isSampleDataModalOpen}
        onClose={() => setIsSampleDataModalOpen(false)}
        title="RFQ Bulk Upload Sample Data Format"
        size="large"
      >
        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
              <MdInfo className="w-5 h-5" />
              Required Fields
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
              The following fields are <strong>required</strong>: vesselName, supplyPort, category, subCategory, brand, model, preferredQuality, typeOfIncoterms, typeOfLogisticContainer, leadDate, vendor1 (or vendors)
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              <strong>Items:</strong> Provide items as text in the "items" column. Format: Each item on a new line, fields separated by pipe (|). Format: itemDescription|requiredQuantity|uom|generalRemark|impaNo|partNo|altPartNo|positionNo|dimensions
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-3 text-lg">All Available Fields</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
              <div className="p-3 rounded-lg border bg-[hsl(var(--card))]">
                <div className="font-semibold text-sm">vesselName*</div>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">Vessel name (must exist in your vessels)</div>
              </div>
              <div className="p-3 rounded-lg border bg-[hsl(var(--card))]">
                <div className="font-semibold text-sm">vesselExName</div>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">Vessel ex name</div>
              </div>
              <div className="p-3 rounded-lg border bg-[hsl(var(--card))]">
                <div className="font-semibold text-sm">imoNumber</div>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">IMO number</div>
              </div>
              <div className="p-3 rounded-lg border bg-[hsl(var(--card))]">
                <div className="font-semibold text-sm">supplyPort*</div>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">Supply port name</div>
              </div>
              <div className="p-3 rounded-lg border bg-[hsl(var(--card))]">
                <div className="font-semibold text-sm">equipmentTags</div>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">Equipment tags</div>
              </div>
              <div className="p-3 rounded-lg border bg-[hsl(var(--card))]">
                <div className="font-semibold text-sm">category*</div>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">Category</div>
              </div>
              <div className="p-3 rounded-lg border bg-[hsl(var(--card))]">
                <div className="font-semibold text-sm">subCategory*</div>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">Sub category</div>
              </div>
              <div className="p-3 rounded-lg border bg-[hsl(var(--card))]">
                <div className="font-semibold text-sm">brand*</div>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">Brand name</div>
              </div>
              <div className="p-3 rounded-lg border bg-[hsl(var(--card))]">
                <div className="font-semibold text-sm">model*</div>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">Model name</div>
              </div>
              <div className="p-3 rounded-lg border bg-[hsl(var(--card))]">
                <div className="font-semibold text-sm">hullNo</div>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">Hull number</div>
              </div>
              <div className="p-3 rounded-lg border bg-[hsl(var(--card))]">
                <div className="font-semibold text-sm">serialNumber</div>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">Serial number</div>
              </div>
              <div className="p-3 rounded-lg border bg-[hsl(var(--card))]">
                <div className="font-semibold text-sm">drawingNumber</div>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">Drawing number</div>
              </div>
              <div className="p-3 rounded-lg border bg-[hsl(var(--card))]">
                <div className="font-semibold text-sm">remarks</div>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">Remarks/description</div>
              </div>
              <div className="p-3 rounded-lg border bg-[hsl(var(--card))]">
                <div className="font-semibold text-sm">preferredQuality*</div>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">Preferred quality</div>
              </div>
              <div className="p-3 rounded-lg border bg-[hsl(var(--card))]">
                <div className="font-semibold text-sm">typeOfIncoterms*</div>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">Type of incoterms (e.g., CIF, FOB)</div>
              </div>
              <div className="p-3 rounded-lg border bg-[hsl(var(--card))]">
                <div className="font-semibold text-sm">typeOfLogisticContainer*</div>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">Container type (e.g., 20ft, 40ft)</div>
              </div>
              <div className="p-3 rounded-lg border bg-[hsl(var(--card))]">
                <div className="font-semibold text-sm">createdDate</div>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">Created date (YYYY-MM-DD)</div>
              </div>
              <div className="p-3 rounded-lg border bg-[hsl(var(--card))]">
                <div className="font-semibold text-sm">leadDate*</div>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">Lead date (YYYY-MM-DD)</div>
              </div>
              <div className="p-3 rounded-lg border bg-[hsl(var(--card))]">
                <div className="font-semibold text-sm">vendor1*</div>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">Vendor 1 name or ID</div>
              </div>
              <div className="p-3 rounded-lg border bg-[hsl(var(--card))]">
                <div className="font-semibold text-sm">vendor2</div>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">Vendor 2 name or ID (optional)</div>
              </div>
              <div className="p-3 rounded-lg border bg-[hsl(var(--card))]">
                <div className="font-semibold text-sm">vendor3</div>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">Vendor 3 name or ID (optional)</div>
              </div>
              <div className="p-3 rounded-lg border bg-yellow-50 dark:bg-yellow-950/30 col-span-full">
                <div className="font-semibold text-sm">items (Text format - pipe separated)</div>
                <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                  Text format: Each item on a new line (or separated by semicolon). Fields separated by pipe (|).<br/>
                  Required fields: itemDescription|requiredQuantity|uom|generalRemark<br/>
                  Optional fields: |impaNo|partNo|altPartNo|positionNo|dimensions<br/>
                  <strong>Example:</strong><br/>
                  <code className="block mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                    Piston Ring Set|5|Set|Required for cylinder 1|IMPA-001|PART-123|ALT-456|POS-001|100x50x10<br/>
                    Gasket Kit|2|Kit|Standard gasket set|IMPA-002|PART-789||POS-002|200x100x5
                  </code>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border">
            <h3 className="font-semibold mb-2">Sample Data Preview (Key Fields)</h3>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mb-3">
              Note: This is a simplified preview. The actual CSV includes all fields. Items should be provided as JSON in the "items" column.
            </p>
            <div className="overflow-x-auto max-h-64">
              <table className="w-full text-xs border-collapse">
                <thead className="sticky top-0 bg-gray-100 dark:bg-gray-800">
                  <tr>
                    <th className="border p-1 text-left">vesselName*</th>
                    <th className="border p-1 text-left">supplyPort*</th>
                    <th className="border p-1 text-left">category*</th>
                    <th className="border p-1 text-left">subCategory*</th>
                    <th className="border p-1 text-left">brand*</th>
                    <th className="border p-1 text-left">model*</th>
                    <th className="border p-1 text-left">vendor1*</th>
                    <th className="border p-1 text-left">leadDate*</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border p-1">MV Atlantic</td>
                    <td className="border p-1">Singapore</td>
                    <td className="border p-1">Engine Parts</td>
                    <td className="border p-1">Piston Rings</td>
                    <td className="border p-1">Caterpillar</td>
                    <td className="border p-1">C3516</td>
                    <td className="border p-1">Vendor Name 1</td>
                    <td className="border p-1">2026-02-15</td>
                  </tr>
                  <tr>
                    <td className="border p-1">MV Pacific</td>
                    <td className="border p-1">Hong Kong</td>
                    <td className="border p-1">Navigation Equipment</td>
                    <td className="border p-1">GPS System</td>
                    <td className="border p-1">Garmin</td>
                    <td className="border p-1">GPSMAP 8600</td>
                    <td className="border p-1">Vendor Name 1</td>
                    <td className="border p-1">2026-02-20</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-xs font-semibold text-yellow-900 dark:text-yellow-100 mb-1">Items Format (Text - Pipe Separated):</p>
              <p className="text-xs text-yellow-800 dark:text-yellow-200 mb-2">Format: itemDescription|requiredQuantity|uom|generalRemark|impaNo|partNo|altPartNo|positionNo|dimensions</p>
              <code className="text-xs text-yellow-800 dark:text-yellow-200 block whitespace-pre-wrap break-all bg-yellow-100 dark:bg-yellow-900 p-2 rounded">
                Piston Ring Set|5|Set|Required for cylinder 1|IMPA-001|PART-123|ALT-456|POS-001|100x50x10{'\n'}Gasket Kit|2|Kit|Standard gasket set|IMPA-002|PART-789||POS-002|200x100x5
              </code>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={() => setIsSampleDataModalOpen(false)}
              className="px-5 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] font-semibold hover:bg-[hsl(var(--muted))] transition"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleDownloadSample}
              className="px-5 py-2.5 rounded-xl bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-semibold hover:opacity-90 flex items-center gap-2 shadow-lg"
            >
              <MdDownload className="w-5 h-5" />
              Download Sample CSV
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}




