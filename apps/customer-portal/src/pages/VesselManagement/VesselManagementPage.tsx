import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../components/shared/Toast';
import { MdAdd, MdFileUpload, MdEdit, MdDelete, MdSearch } from 'react-icons/md';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Vessel {
  _id: string;
  name: string;
  type: string;
  imoNumber?: string;
  exVesselName?: string;
  flag?: string;
  createdAt: string;
}

interface VesselFormData {
  name: string;
  type: string;
  imoNumber: string;
  exVesselName: string;
}

interface License {
  _id: string;
  licenseKey: string;
  status: string;
  expiresAt: string;
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
  const [formData, setFormData] = useState<VesselFormData>({
    name: '',
    type: '',
    imoNumber: '',
    exVesselName: '',
  });

  // Fetch license information
  const { data: licenses } = useQuery<License[]>({
    queryKey: ['licenses'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/v1/customer/licenses`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      if (!response.ok) return [];
      const data = await response.json();
      return data.data || [];
    },
  });

  // Get active license
  const activeLicense = licenses?.find(
    (license) =>
      license.status === 'active' && new Date(license.expiresAt) > new Date()
  );

  const vesselLimit = activeLicense?.usageLimits?.vessels || 0;
  const currentVessels = activeLicense?.currentUsage?.vessels || 0;
  const remainingVessels = vesselLimit > 0 ? vesselLimit - currentVessels : Infinity;
  const canAddVessel = vesselLimit === 0 || remainingVessels > 0;

  // Fetch vessels
  const { data: vessels, isLoading } = useQuery<Vessel[]>({
    queryKey: ['vessels'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/v1/customer/vessels`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch vessels');
      const data = await response.json();
      return data.data || [];
    },
  });

  // Create vessel mutation
  const createVesselMutation = useMutation({
    mutationFn: async (vesselData: VesselFormData) => {
      // Check license limit before attempting to create
      if (!canAddVessel) {
        throw new Error(
          `Vessel limit exceeded. You have reached your license limit of ${vesselLimit} vessels. Please contact support to upgrade your license.`
        );
      }

      const response = await fetch(`${API_URL}/api/v1/customer/vessels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          name: vesselData.name,
          type: vesselData.type,
          imoNumber: vesselData.imoNumber || undefined,
          exVesselName: vesselData.exVesselName || undefined,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create vessel');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vessels'] });
      queryClient.invalidateQueries({ queryKey: ['licenses'] });
      showToast('Vessel added successfully!', 'success');
      setShowAddModal(false);
      setFormData({ name: '', type: '', imoNumber: '', exVesselName: '' });
    },
    onError: (error: any) => {
      const errorMessage = error.message || 'Failed to add vessel';
      showToast(errorMessage, 'error');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.type) {
      showToast('Vessel name and type are required', 'error');
      return;
    }
    createVesselMutation.mutate(formData);
  };

  // Filter vessels based on search
  const filteredVessels = vessels?.filter((vessel) => {
    const query = searchQuery.toLowerCase();
    return (
      vessel.imoNumber?.toLowerCase().includes(query) ||
      vessel.name.toLowerCase().includes(query) ||
      vessel.type.toLowerCase().includes(query) ||
      vessel.exVesselName?.toLowerCase().includes(query)
    );
  }) || [];

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Vessel Management</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (!canAddVessel) {
                showToast(
                  `Vessel limit exceeded. You have reached your license limit of ${vesselLimit} vessels.`,
                  'error'
                );
                return;
              }
              setShowAddModal(true);
            }}
            disabled={!canAddVessel}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              canAddVessel
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-400 text-gray-200 cursor-not-allowed'
            }`}
          >
            <MdAdd className="w-5 h-5" />
            Add Vessel
          </button>
          <button
            onClick={() => setShowBulkModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-400 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
          >
            <MdFileUpload className="w-5 h-5" />
            Bulk Add (Excel)
          </button>
        </div>
      </div>

      {/* License Information */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">
              License Information
            </h3>
            {activeLicense ? (
              <div className="text-sm text-blue-800 dark:text-blue-400">
                <p>
                  Vessels: <span className="font-semibold">{currentVessels}</span>
                  {vesselLimit > 0 && (
                    <>
                      {' / '}
                      <span className="font-semibold">{vesselLimit}</span>
                      {' '}
                      <span className="text-blue-600 dark:text-blue-500">
                        ({remainingVessels} remaining)
                      </span>
                    </>
                  )}
                  {vesselLimit === 0 && <span className="text-blue-600 dark:text-blue-500"> (Unlimited)</span>}
                </p>
                <p className="text-xs mt-1">
                  License expires: {new Date(activeLicense.expiresAt).toLocaleDateString()}
                </p>
              </div>
            ) : (
              <p className="text-sm text-blue-800 dark:text-blue-400">
                No active license found. Please contact support.
              </p>
            )}
          </div>
          {!canAddVessel && (
            <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-3 py-2 rounded-lg text-sm font-medium">
              License Limit Reached
            </div>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search by IMO Number, Vessel Name, or Vessel Type"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            Loading vessels...
          </div>
        ) : filteredVessels.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            {searchQuery ? 'No vessels found matching your search' : 'No vessels found'}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                  IMO NUMBER
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                  VESSEL NAME
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                  EX VESSEL NAME
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                  VESSEL TYPE
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredVessels.map((vessel) => (
                <tr
                  key={vessel._id}
                  className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    {vessel.imoNumber || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{vessel.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    {vessel.exVesselName || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{vessel.type}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button className="p-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                        <MdEdit className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
                        <MdDelete className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Vessel Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add New Vessel</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Add a new vessel to your fleet.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setFormData({ name: '', type: '', imoNumber: '', exVesselName: '' });
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
                    IMO Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.imoNumber}
                    onChange={(e) => setFormData({ ...formData, imoNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
                    placeholder="Enter IMO Number"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
                    Vessel Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
                    placeholder="Enter Vessel Name"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
                    Ex Vessel Name (optional)
                  </label>
                  <input
                    type="text"
                    value={formData.exVesselName}
                    onChange={(e) => setFormData({ ...formData, exVesselName: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
                    placeholder="Enter Ex Vessel Name"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 dark:text-gray-400 mb-1 block">
                    Vessel Type <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
                    placeholder="Enter Vessel Type"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({ name: '', type: '', imoNumber: '', exVesselName: '' });
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createVesselMutation.isPending || !canAddVessel}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createVesselMutation.isPending
                    ? 'Adding...'
                    : !canAddVessel
                    ? 'License Limit Reached'
                    : 'Add Vessel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Add Vessels (Excel) Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg mx-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Bulk Add Vessels (Excel)</h2>
              <button
                onClick={() => setShowBulkModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Upload an Excel file (.xlsx or .csv) containing vessel details. The file should have columns
              named: IMO Number, Vessel Name, Ex Vessel Name (optional), Vessel Type (optional). The column
              names are case-insensitive.
            </p>

            <div className="space-y-3 mb-4">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block">
                Select Excel File
              </label>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  showToast('Bulk upload feature coming soon', 'info');
                  setShowBulkModal(false);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
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
