'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  MdUpload,
  MdDownload,
  MdDelete,
  MdSave,
  MdSearch,
  MdChevronLeft,
  MdChevronRight,
  MdAdd,
} from 'react-icons/md';
import { authenticatedFetch } from '../../lib/api';
import { useToast } from '../../components/shared/Toast';

interface Product {
  _id: string;
  impa: string;
  description: string;
  partNo?: string;
  positionNo?: string;
  alternativeNo?: string;
  brand?: string;
  model?: string;
  category?: string;
  dimensions?: string;
  uom: string;
  moq: string;
  leadTime?: string;
  price: number;
  currency: string;
  stockStatus: 'In Stock' | 'Limited' | 'Backorder' | 'Discontinued';
}

const ITEMS_PER_PAGE = 20;

export function CatalogManagementPage() {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [editedIds, setEditedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Fetch catalog
  const fetchCatalog = async (resetPage = false) => {
    if (resetPage) setCurrentPage(1);
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        search: searchTerm.trim(),
        status: statusFilter,
      });

      const res = await authenticatedFetch(`/api/v1/vendor/catalogue?${params}`);
      if (!res.ok) throw new Error('Failed to fetch');

      const json = await res.json();
      if (json.success) {
        setProducts(json.data || []);
        setTotalPages(json.meta?.totalPages || 1);
        setTotalItems(json.meta?.totalItems || 0);
      }
    } catch (err: any) {
      setError(err.message);
      showToast('Failed to load catalog', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, [currentPage, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => fetchCatalog(true), 600);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const markEdited = (id: string) => {
    setEditedIds((prev) => new Set([...prev, id]));
  };

  const handleChange = (id: string, field: keyof Product, value: string | number) => {
    markEdited(id);
    setProducts((prev) =>
      prev.map((p) => (p._id === id ? { ...p, [field]: value } : p))
    );
  };

  const handleAddNew = () => {
    const tempId = `temp-${Date.now()}`;
    const newItem: Product = {
      _id: tempId,
      impa: '',
      description: '',
      partNo: '',
      positionNo: '',
      alternativeNo: '',
      brand: '',
      model: '',
      category: 'General',
      dimensions: '',
      uom: 'PCS',
      moq: '1',
      leadTime: 'Ex-stock',
      price: 0,
      currency: 'USD',
      stockStatus: 'In Stock',
    };
    setProducts((prev) => [newItem, ...prev]);
    markEdited(tempId);
  };

  const saveItem = async (item: Product) => {
    const isNew = item._id.startsWith('temp-');
    const url = isNew ? '/api/v1/vendor/catalogue' : `/api/v1/vendor/catalogue/${item._id}`;
    const method = isNew ? 'POST' : 'PATCH';

    const body = { ...item };
    if (isNew) delete body._id;

    const res = await authenticatedFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Save failed');
    }
  };

  const handleSaveAll = async () => {
    if (editedIds.size === 0) return;
    setSaving(true);
    let success = 0;

    for (const id of editedIds) {
      const item = products.find((p) => p._id === id);
      if (item) {
        try {
          await saveItem(item);
          success++;
        } catch {}
      }
    }

    showToast(`Saved ${success} items`, success > 0 ? 'success' : 'error');
    setEditedIds(new Set());
    setSaving(false);
    fetchCatalog();
  };

  const handleDelete = async (id: string) => {
    if (id.startsWith('temp-')) {
      setProducts((prev) => prev.filter((p) => p._id !== id));
      setEditedIds((prev) => {
        const n = new Set(prev);
        n.delete(id);
        return n;
      });
      return;
    }

    if (!window.confirm('Delete permanently?')) return;

    try {
      await authenticatedFetch(`/api/v1/vendor/catalogue/${id}`, { method: 'DELETE' });
      showToast('Deleted', 'success');
      fetchCatalog();
    } catch {
      showToast('Delete failed', 'error');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return showToast('Select file first', 'error');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await authenticatedFetch('/api/v1/vendor/catalogue/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Upload failed');
      }

      const data = await res.json();
      const created = data.data?.created || 0;
      const updated = data.data?.updated || 0;
      const skipped = data.data?.skipped || 0;
      const failed = data.data?.failed || 0;
      
      const message = `${created} created • ${updated} updated${skipped > 0 ? ` • ${skipped} skipped` : ''}${failed > 0 ? ` • ${failed} failed` : ''}`;
      showToast(
        message,
        failed === 0 ? 'success' : 'warning'
      );

      fetchCatalog(true);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      showToast(err.message || 'Upload failed', 'error');
    }
  };

  const handleDownloadTemplate = () => {
    const headers = [
      'IMPA',
      'Description',
      'Part No',
      'Position No',
      'Alternative No',
      'Brand',
      'Model',
      'Category',
      'Dimensions',
      'UoM',
      'MOQ',
      'Lead Time',
      'Price',
      'Currency',
      'Stock Status',
    ];
    const csv = headers.join(',') + '\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'catalog_template.csv';
    a.click();
    URL.revokeObjectURL(url);
    showToast('Template downloaded', 'success');
  };

  // Export only current page data
  const handleExportCurrent = () => {
    if (products.length === 0) {
      showToast('No data to export on this page', 'warning');
      return;
    }

    const headers = [
      'IMPA',
      'Description',
      'Part No',
      'Position No',
      'Alternative No',
      'Brand',
      'Model',
      'Category',
      'Dimensions',
      'UoM',
      'MOQ',
      'Lead Time',
      'Price',
      'Currency',
      'Stock Status',
    ];

    const rows = products.map((item) => [
      item.impa || '',
      `"${(item.description || '').replace(/"/g, '""')}"`,
      item.partNo || '',
      item.positionNo || '',
      item.alternativeNo || '',
      item.brand || '',
      item.model || '',
      item.category || '',
      item.dimensions || '',
      item.uom || '',
      item.moq || '',
      item.leadTime || '',
      item.price || 0,
      item.currency || '',
      item.stockStatus || '',
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `catalog_page_${currentPage}_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`Exported ${products.length} items (current page)`, 'success');
  };

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="w-full min-h-screen bg-[hsl(var(--background))] p-8">
      <div className="mb-8">
        <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-widest mb-2">
          Vendor Portal
        </p>
        <h1 className="text-3xl font-extrabold text-[hsl(var(--foreground))]">Catalog Management</h1>
      </div>

      {/* Control Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="bg-[hsl(var(--card))] p-6 rounded-2xl border border-[hsl(var(--border))] shadow-lg">
          <h3 className="font-bold text-xl mb-2">Bulk Update</h3>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mb-6">
            Upload CSV/Excel to update thousands of items instantly.
          </p>
          <div className="flex gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 px-5 py-3 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-xl font-semibold text-sm shadow-md hover:shadow-xl transition-all flex items-center justify-center gap-2"
            >
              <MdUpload size={20} />
              {selectedFile ? selectedFile.name.slice(0, 20) + '...' : 'Choose File'}
            </button>
            <button
              onClick={handleUpload}
              disabled={!selectedFile}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-md hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MdUpload size={22} />
            </button>
          </div>
        </div>

        <div className="bg-[hsl(var(--card))] p-6 rounded-2xl border border-[hsl(var(--border))] shadow-lg">
          <h3 className="font-bold text-xl mb-2">Tools & Export</h3>
          <p className="text-sm text-[hsl(var(--muted-foreground))] mb-6">
            Download template or export your current catalog.
          </p>
          <div className="flex gap-4">
            <button
              onClick={handleDownloadTemplate}
              className="flex-1 px-5 py-3 border-2 border-dashed border-[hsl(var(--primary))] rounded-xl font-semibold text-sm hover:bg-[hsl(var(--primary))]/5 transition-all flex items-center justify-center gap-2"
            >
              <MdDownload size={20} />
              Download Template
            </button>
            <button
              onClick={handleExportCurrent} // ← Updated to export current page data
              className="flex-1 px-5 py-3 bg-[hsl(var(--secondary))] hover:bg-[hsl(var(--secondary))]/80 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
            >
              Export Current Catalog
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[hsl(var(--card))] p-5 rounded-2xl border border-[hsl(var(--border))] shadow-md mb-8">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 relative">
            <MdSearch
              size={20}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))]"
            />
            <input
              type="text"
              placeholder="Search by IMPA, description, part no, brand..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-5 py-3 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl focus:ring-2 focus:ring-[hsl(var(--primary))]"
            >
              <option>All</option>
              <option>In Stock</option>
              <option>Limited</option>
              <option>Backorder</option>
              <option>Discontinued</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-[hsl(var(--card))] rounded-2xl border border-[hsl(var(--border))] shadow-xl overflow-hidden">
        <div className="p-6 border-b border-[hsl(var(--border))] flex justify-between items-center bg-gradient-to-r from-[hsl(var(--muted))]/30 to-transparent">
          <h2 className="text-2xl font-bold">
            Your Catalog Items{' '}
            <span className="text-sm font-normal text-[hsl(var(--muted-foreground))]">({totalItems} found)</span>
          </h2>
          <button
            onClick={handleAddNew}
            className="px-6 py-3 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-[hsl(var(--primary-foreground))] rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
          >
            <MdAdd size={22} />
            Add New Item
          </button>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-[hsl(var(--muted-foreground))]">Loading catalog items...</div>
          ) : error ? (
            <div className="p-12 text-center text-red-500">Error: {error}</div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center text-[hsl(var(--muted-foreground))]">
              {searchTerm || statusFilter !== 'All'
                ? 'No items match your filters.'
                : 'No catalog items yet. Upload a file or add items manually.'}
            </div>
          ) : (
            <table className="w-full table-fixed border-collapse">
              <colgroup>
                <col className="w-16" />
                <col className="w-64" />
                <col className="w-40" />
                <col className="w-32" />
                <col className="w-36" />
                <col className="w-48" />
                <col className="w-32" />
                <col className="w-40" />
                <col className="w-28" />
              </colgroup>
              <thead className="bg-gradient-to-r from-[hsl(var(--secondary))] to-[hsl(var(--secondary))]/50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))] border-r border-[hsl(var(--border))]">#</th>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))] border-r border-[hsl(var(--border))]">IMPA & Description</th>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))] border-r border-[hsl(var(--border))]">Price</th>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))] border-r border-[hsl(var(--border))]">Status</th>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))] border-r border-[hsl(var(--border))]">UoM / MOQ</th>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))] border-r border-[hsl(var(--border))]">Part Info</th>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))] border-r border-[hsl(var(--border))]">Lead Time</th>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))] border-r border-[hsl(var(--border))]">Dimensions</th>
                  <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[hsl(var(--border))] bg-[hsl(var(--card))]">
                {products.map((p, index) => (
                  <tr
                    key={p._id}
                    className={`hover:bg-[hsl(var(--muted))]/30 transition-all duration-200 ${
                      editedIds.has(p._id) ? 'bg-amber-50/60 dark:bg-amber-900/20 border-l-4 border-amber-400' : ''
                    }`}
                  >
                    <td className="px-4 py-4 text-sm font-bold text-[hsl(var(--muted-foreground))] border-r border-[hsl(var(--border))] align-top">
                      {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                    </td>

                    <td className="px-4 py-4 border-r border-[hsl(var(--border))] align-top">
                      <div className="space-y-2 min-w-0">
                        <input
                          type="text"
                          value={p.impa}
                          placeholder="IMPA Code"
                          onChange={(e) => handleChange(p._id, 'impa', e.target.value)}
                          className="w-full px-3 py-2 text-sm font-mono bg-white dark:bg-gray-800 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                        <input
                          type="text"
                          value={p.description}
                          placeholder="Item Description"
                          onChange={(e) => handleChange(p._id, 'description', e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                      </div>
                    </td>

                    <td className="px-4 py-4 border-r border-[hsl(var(--border))] align-top">
                      <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-[hsl(var(--border))] rounded-md px-3 py-2">
                        <span className="text-xs font-bold text-[hsl(var(--muted-foreground))] whitespace-nowrap">
                          {p.currency === 'USD' ? '$' : p.currency === 'EUR' ? '€' : p.currency}
                        </span>
                        <input
                          type="text"
                          value={p.price}
                          placeholder="0.00"
                          onChange={(e) => handleChange(p._id, 'price', Number(e.target.value))}
                          className="flex-1 min-w-0 bg-transparent text-sm font-semibold text-green-600 dark:text-green-400 outline-none"
                        />
                        <select
                          value={p.currency}
                          onChange={(e) => handleChange(p._id, 'currency', e.target.value)}
                          className="bg-transparent text-xs font-bold uppercase outline-none cursor-pointer"
                        >
                          <option>USD</option>
                          <option>EUR</option>
                          <option>SGD</option>
                          <option>INR</option>
                        </select>
                      </div>
                    </td>

                    <td className="px-4 py-4 border-r border-[hsl(var(--border))] align-top">
                      <select
                        value={p.stockStatus}
                        onChange={(e) => handleChange(p._id, 'stockStatus', e.target.value)}
                        className={`w-full px-3 py-2 rounded-md font-bold text-xs uppercase tracking-wide transition-all cursor-pointer ${
                          p.stockStatus === 'In Stock'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-2 border-green-300 dark:border-green-700'
                            : p.stockStatus === 'Limited'
                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-2 border-amber-300 dark:border-amber-700'
                            : p.stockStatus === 'Backorder'
                            ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-2 border-orange-300 dark:border-orange-700'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-2 border-red-300 dark:border-red-700'
                        }`}
                      >
                        <option>In Stock</option>
                        <option>Limited</option>
                        <option>Backorder</option>
                        <option>Discontinued</option>
                      </select>
                    </td>

                    <td className="px-4 py-4 border-r border-[hsl(var(--border))] align-top">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap">UNIT</span>
                          <input
                            type="text"
                            value={p.uom}
                            onChange={(e) => handleChange(p._id, 'uom', e.target.value)}
                            className="flex-1 min-w-0 px-2 py-1.5 text-xs font-semibold bg-white dark:bg-gray-800 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="PCS"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[hsl(var(--muted-foreground))] uppercase whitespace-nowrap">MOQ</span>
                          <input
                            type="text"
                            value={p.moq}
                            onChange={(e) => handleChange(p._id, 'moq', e.target.value)}
                            className="flex-1 min-w-0 px-2 py-1.5 text-xs font-semibold bg-white dark:bg-gray-800 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="1"
                          />
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 border-r border-[hsl(var(--border))] align-top space-y-2">
                      <input
                        type="text"
                        value={p.partNo || ''}
                        placeholder="Part Number"
                        onChange={(e) => handleChange(p._id, 'partNo', e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-800 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={p.brand || ''}
                          placeholder="Brand"
                          onChange={(e) => handleChange(p._id, 'brand', e.target.value)}
                          className="px-2 py-1.5 text-xs font-semibold uppercase bg-white dark:bg-gray-800 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-600 dark:text-blue-400"
                        />
                        <input
                          type="text"
                          value={p.model || ''}
                          placeholder="Model"
                          onChange={(e) => handleChange(p._id, 'model', e.target.value)}
                          className="px-2 py-1.5 text-xs bg-white dark:bg-gray-800 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </td>

                    <td className="px-4 py-4 border-r border-[hsl(var(--border))] align-top">
                      <input
                        type="text"
                        value={p.leadTime || ''}
                        placeholder="Ex-stock"
                        onChange={(e) => handleChange(p._id, 'leadTime', e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>

                    <td className="px-4 py-4 border-r border-[hsl(var(--border))] align-top">
                      <input
                        type="text"
                        value={p.dimensions || ''}
                        placeholder="900x600x60"
                        onChange={(e) => handleChange(p._id, 'dimensions', e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-gray-800 border border-[hsl(var(--border))] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>

                    <td className="px-4 py-4 align-top">
                      <div className="flex justify-center gap-2">
                        {editedIds.has(p._id) && (
                          <button
                            onClick={async () => {
                              try {
                                await saveItem(p);
                                fetchCatalog();
                                showToast('Item updated', 'success');
                              } catch {
                                showToast('Update failed', 'error');
                              }
                            }}
                            disabled={saving}
                            className="p-2.5 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 text-green-600 dark:text-green-400 rounded-lg transition-all shadow-sm hover:shadow disabled:opacity-50"
                            title="Save this item"
                          >
                            <MdSave size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(p._id)}
                          className="p-2.5 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg transition-all shadow-sm hover:shadow"
                          title="Delete item"
                        >
                          <MdDelete size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        {!loading && !error && totalPages > 0 && (
          <div className="p-6 bg-gradient-to-r from-[hsl(var(--muted))]/20 to-transparent border-t border-[hsl(var(--border))] flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-[hsl(var(--muted-foreground))] italic">
              {totalItems} total items found
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2.5 rounded-lg bg-[hsl(var(--background))] border border-[hsl(var(--border))] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[hsl(var(--muted))] transition-all"
              >
                <MdChevronLeft size={18} />
              </button>

              <div className="flex gap-1">
                {pageNumbers.map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3.5 py-1.5 text-sm font-medium rounded-lg transition-all ${
                      currentPage === page
                        ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow'
                        : 'bg-[hsl(var(--background))] border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-2.5 rounded-lg bg-[hsl(var(--background))] border border-[hsl(var(--border))] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[hsl(var(--muted))] transition-all"
              >
                <MdChevronRight size={18} />
              </button>
            </div>

            <button
              onClick={handleSaveAll}
              disabled={editedIds.size === 0 || saving}
              className="px-10 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all flex items-center gap-3 disabled:opacity-50"
            >
              <MdSave size={24} />
              Save All Changes {editedIds.size > 0 && `(${editedIds.size})`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}