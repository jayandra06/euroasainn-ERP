import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MdAdd, MdFileUpload, MdEdit, MdDelete } from 'react-icons/md';
import { authenticatedFetch } from '../../lib/api';
import { useToast } from '../../components/shared/Toast';

interface Vessel {
  _id: string;
  name: string;
  imoNumber?: string;
  exVesselName?: string;
  type?: string;
}

interface License {
  _id: string;
  usageLimits: {
    vessels?: number;
  };
  currentUsage: {
    vessels?: number;
  };
}

export function VesselManagementPage() {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    imoNumber: '',
    exVesselName: '',
    type: '',
  });

  // Fetch vessels using React Query
  const { data: vessels = [], isLoading } = useQuery<Vessel[]>({
    queryKey: ['customer-vessels'],
    queryFn: async () => {
      const response = await authenticatedFetch('/api/v1/customer/vessels');
      if (!response.ok) {
        throw new Error('Failed to fetch vessels');
      }
      const data = await response.json();
      return data.data || [];
    },
  });

  // Fetch license
  const { data: license } = useQuery<License | null>({
    queryKey: ['customer-license'],
    queryFn: async () => {
      const response = await authenticatedFetch('/api/v1/customer/licenses');
      if (!response.ok) return null;
      const data = await response.json();
      const activeLicense = (data.data || []).find((l: any) => 
        l.status === 'active' && new Date(l.expiresAt) > new Date()
      );
      return activeLicense || null;
    },
  });

  // Create vessel mutation
  const createVesselMutation = useMutation({
    mutationFn: async (vesselData: { name: string; imoNumber?: string; exVesselName?: string; type: string }) => {
      const response = await authenticatedFetch('/api/v1/customer/vessels', {
        method: 'POST',
        body: JSON.stringify({
          name: vesselData.name,
          imoNumber: vesselData.imoNumber || undefined,
          exVesselName: vesselData.exVesselName || undefined,
          type: vesselData.type,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create vessel');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch vessels query
      queryClient.invalidateQueries({ queryKey: ['customer-vessels'] });
      queryClient.invalidateQueries({ queryKey: ['customer-license'] });
      showToast('Vessel created successfully', 'success');
      setShowAddModal(false);
      setFormData({ name: '', imoNumber: '', exVesselName: '', type: '' });
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to create vessel', 'error');
    },
  });

  const handleAddVessel = () => {
    if (!formData.name.trim()) {
      showToast('Vessel name is required', 'error');
      return;
    }

    if (!formData.type.trim()) {
      showToast('Vessel type is required', 'error');
      return;
    }

    createVesselMutation.mutate({
      name: formData.name,
      imoNumber: formData.imoNumber,
      exVesselName: formData.exVesselName,
      type: formData.type,
    });
  };

  // Delete vessel mutation
  const deleteVesselMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await authenticatedFetch(`/api/v1/customer/vessels/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete vessel');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch vessels query
      queryClient.invalidateQueries({ queryKey: ['customer-vessels'] });
      queryClient.invalidateQueries({ queryKey: ['customer-license'] });
      showToast('Vessel deleted successfully', 'success');
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to delete vessel', 'error');
    },
  });

  const handleDeleteVessel = (id: string) => {
    if (!confirm('Are you sure you want to delete this vessel?')) {
      return;
    }
    deleteVesselMutation.mutate(id);
  };

  const filteredVessels = vessels.filter((vessel) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      vessel.name?.toLowerCase().includes(query) ||
      vessel.imoNumber?.toLowerCase().includes(query) ||
      vessel.type?.toLowerCase().includes(query)
    );
  });

  const vesselsUsed = license?.currentUsage?.vessels || 0;
  const vesselsLimit = license?.usageLimits?.vessels || 0;
  const vesselsRemaining = vesselsLimit > 0 ? vesselsLimit - vesselsUsed : 'Unlimited';

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[hsl(var(--foreground))]">Vessel Management</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-[hsl(var(--primary-foreground))] rounded-lg font-medium transition-colors"
          >
            <MdAdd className="w-5 h-5" />
            Add Vessel
          </button>
          <button
            onClick={() => setShowBulkModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--primary))]/80 hover:bg-[hsl(var(--primary))] text-white rounded-lg font-medium transition-colors"
          >
            <MdFileUpload className="w-5 h-5" />
            Bulk Add (Excel)
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400">
        Allowed Vessels: {vesselsUsed} / {vesselsLimit === 0 ? 'Unlimited' : vesselsLimit} 
        {vesselsLimit > 0 && ` (${vesselsRemaining} remaining)`}
      </p>

      {/* Search */}
      <div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by IMO Number, Vessel Name, or Vessel Type"
          className="w-full px-4 py-2 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]"
        />
      </div>

      {/* Table */}
      <div className="bg-[hsl(var(--card))] rounded-lg border border-[hsl(var(--border))] overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[hsl(var(--foreground))] uppercase">IMO NUMBER</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[hsl(var(--foreground))] uppercase">VESSEL NAME</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[hsl(var(--foreground))] uppercase">EX VESSEL NAME</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[hsl(var(--foreground))] uppercase">VESSEL TYPE</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[hsl(var(--foreground))] uppercase">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
                  Loading...
                </td>
              </tr>
            ) : filteredVessels.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
                  No vessels found
                </td>
              </tr>
            ) : (
              filteredVessels.map((vessel) => (
                <tr key={vessel._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-3 text-sm text-[hsl(var(--foreground))]">
                    {vessel.imoNumber || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-[hsl(var(--foreground))]">
                    {vessel.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-[hsl(var(--foreground))]">
                    {vessel.exVesselName || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-[hsl(var(--foreground))]">
                    {vessel.type || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button className="text-blue-600 hover:text-blue-900 dark:hover:text-blue-400" title="Edit">
                        <MdEdit className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteVessel(vessel._id)}
                        className="text-red-600 hover:text-red-900 dark:hover:text-red-400" 
                        title="Delete"
                      >
                        <MdDelete className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Vessel Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[hsl(var(--card))] rounded-lg p-6 w-full max-w-2xl mx-4 border border-[hsl(var(--border))]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-[hsl(var(--foreground))]">Add New Vessels</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Add one or more new vessels.</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-[hsl(var(--foreground))] mb-2 block">Vessel Details</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-[hsl(var(--foreground))] font-semibold mb-1 block">IMO Number (optional)</label>
                    <input
                      type="text"
                      value={formData.imoNumber}
                      onChange={(e) => setFormData({ ...formData, imoNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))]"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[hsl(var(--foreground))] font-semibold mb-1 block">Vessel Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))]"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[hsl(var(--foreground))] font-semibold mb-1 block">Ex Vessel Name (optional)</label>
                    <input
                      type="text"
                      value={formData.exVesselName}
                      onChange={(e) => setFormData({ ...formData, exVesselName: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))]"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[hsl(var(--foreground))] font-semibold mb-1 block">
                      Vessel Type *
                    </label>
                    <input
                      type="text"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))]"
                    />
                  </div>
                </div>
              </div>

            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddVessel}
                disabled={
                  createVesselMutation.isPending ||
                  !formData.name.trim() ||
                  !formData.type.trim() ||
                  (vesselsLimit > 0 && vesselsUsed >= vesselsLimit)
                }
                className="px-4 py-2 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-[hsl(var(--primary-foreground))] rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createVesselMutation.isPending ? 'Adding...' : 'Add Vessel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Add Vessels (Excel) Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[hsl(var(--card))] rounded-lg p-6 w-full max-w-lg mx-4 border border-[hsl(var(--border))]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[hsl(var(--foreground))]">Bulk Add Vessels (Excel)</h2>
              <button
                onClick={() => setShowBulkModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Upload an Excel file (.xlsx or .csv) containing vessel details. The file should have columns named: IMO
              Number, Vessel Name, Ex Vessel Name (optional), Vessel Type (optional). The column names are
              case-insensitive.
            </p>

            <div className="space-y-3 mb-4">
              <label className="text-sm font-medium text-[hsl(var(--foreground))] block">Select Excel File</label>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[hsl(var(--primary))] file:text-[hsl(var(--primary-foreground))] hover:file:bg-blue-700"
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-[hsl(var(--foreground))] font-semibold rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-[hsl(var(--primary-foreground))] rounded-lg font-medium"
              >
                Upload &amp; Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




