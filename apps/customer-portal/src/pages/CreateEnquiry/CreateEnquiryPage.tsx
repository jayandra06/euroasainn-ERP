import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/shared/Toast';
import { MdAdd, MdDelete } from 'react-icons/md';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const SUPPLY_PORT_OPTIONS = ['Bussan', 'Goa', 'Tamil Nadu', 'Kerala', 'Mumbai'];

const CATEGORY_OPTIONS = ['Genuine', 'OEM', 'Copy', 'Parts'];

const UOM_OPTIONS = ['Pieces', 'KiloGrams', 'Litres'];

const INCOTERM_OPTIONS = [
  'EXW (Ex Works)',
  'FCA (Free Carrier)',
  'CPT (Carriage Paid To)',
  'CIP (Carriage and Insurance Paid To)',
  'DAP (Delivered at Place)',
  'DPU (Delivered at Place Unloaded)',
  'DDP (Delivered Duty Paid)',
  'FAS (Free Alongside Ship)',
  'FOB (Free On Board)',
  'CFR (Cost and Freight)',
  'CIF (Cost, Insurance and Freight)',
];

const CONTAINER_TYPE_OPTIONS = [
  'Nest 50 (50L Crate)',
  'Nest 60 (60L Crate)',
  'Euro Crate (Standard Euro Crate)',
  'Foldable Crate (Collapsible Crate)',
  'Pallet Box (Heavy-Duty Pallet Box)',
  'IBC Tank (Intermediate Bulk Container)',
  'Plastic Drum (220L Sealed Drum)',
  'Wooden Crate (Custom Size Wooden Crate)',
];

interface Vessel {
  _id: string;
  name: string;
  imoNumber?: string;
  type?: string;
  exVesselName?: string;
}

interface Vendor {
  _id: string;
  name: string;
  isAdminInvited?: boolean;
}

export function CreateEnquiryPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [items, setItems] = useState([{ id: 1 }]);
  const [formData, setFormData] = useState({
    vesselId: '',
    supplyPort: '',
    category: '',
    brand: '',
    model: '',
    title: '',
    description: '',
    vendor1: '',
    vendor2: '',
    vendor3: '',
  });

  // Fetch vessels
  const { data: vessels, isLoading: vesselsLoading } = useQuery<Vessel[]>({
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

  // Fetch available vendors (customer-invited only)
  const { data: vendors, isLoading: vendorsLoading } = useQuery<Vendor[]>({
    queryKey: ['rfq-vendors'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/v1/customer/rfq/vendors`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch vendors');
      const data = await response.json();
      return data.data || [];
    },
  });

  // Create RFQ mutation
  const createRFQMutation = useMutation({
    mutationFn: async (rfqData: any) => {
      const response = await fetch(`${API_URL}/api/v1/customer/rfq`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(rfqData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create RFQ');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rfqs'] });
      showToast('RFQ created successfully!', 'success');
      navigate('/rfqs');
    },
    onError: (error: any) => {
      showToast(error.message || 'Failed to create RFQ', 'error');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.vesselId) {
      showToast('Please select a vessel', 'error');
      return;
    }
    if (!formData.supplyPort || !formData.category || !formData.brand) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    // Collect selected vendors (at least one required)
    const selectedVendors = [
      formData.vendor1,
      formData.vendor2,
      formData.vendor3,
    ].filter((v) => v && v.trim() !== '');

    if (selectedVendors.length === 0) {
      showToast('Please select at least one vendor', 'error');
      return;
    }

    const selectedVessel = vessels?.find((v) => v._id === formData.vesselId);
    createRFQMutation.mutate({
      vesselId: formData.vesselId,
      title: formData.title || `RFQ for ${selectedVessel?.name || 'Vessel'}`,
      description: formData.description,
      supplyPort: formData.supplyPort,
      category: formData.category,
      brand: formData.brand,
      model: formData.model,
      status: 'draft',
      recipientVendorIds: selectedVendors, // Send to selected vendors
    });
  };

  const addItem = () => {
    setItems([...items, { id: Date.now() }]);
  };

  const removeItem = (id: number) => {
    setItems(items.filter((item) => item.id !== id));
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create RFQ</h1>

      {/* Main Form Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 border border-gray-200 dark:border-gray-700">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">RFQ and Vessel Information</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Details for RFQ, Vessel, and Equipment</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Vessel Name <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.vesselId}
              onChange={(e) => setFormData({ ...formData, vesselId: e.target.value })}
              required
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
            >
              <option value="">Select Vessel</option>
              {vesselsLoading ? (
                <option>Loading vessels...</option>
              ) : vessels && vessels.length > 0 ? (
                vessels.map((vessel) => (
                  <option key={vessel._id} value={vessel._id}>
                    {vessel.name} {vessel.imoNumber ? `(IMO: ${vessel.imoNumber})` : ''}
                  </option>
                ))
              ) : (
                <option disabled>No vessels available. Please add a vessel first.</option>
              )}
            </select>
            {vessels && vessels.length === 0 && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                No vessels found. Please add a vessel in Vessel Management first.
              </p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Vessel Ex Name</label>
            <input
              type="text"
              placeholder="Vessel Ex Name"
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              IMO No. <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="IMO No."
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Supply Port <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.supplyPort}
              onChange={(e) => setFormData({ ...formData, supplyPort: e.target.value })}
              required
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
            >
              <option value="">Select Supply Port</option>
              {SUPPLY_PORT_OPTIONS.map((port) => (
                <option key={port} value={port}>
                  {port}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Equipment Tags</label>
            <input
              type="text"
              placeholder="Equipment Tag"
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
            >
              <option value="">Select Category</option>
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Sub Category <span className="text-red-500">*</span>
            </label>
            <select className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white">
              <option>Select Category</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Brand <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              required
              placeholder="Enter Brand"
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Model <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              required
              placeholder="Enter Model"
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              HULL No. <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="HULL No."
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Serial Number</label>
            <input
              type="text"
              placeholder="Serial Number"
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Drawing Number</label>
            <input
              type="text"
              placeholder="Drawing Number"
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Remarks</label>
            <input
              type="text"
              placeholder="Remarks"
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Preferred Quality <span className="text-red-500">*</span>
            </label>
            <select className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white">
              <option>Select Quality</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Type of Incoterms <span className="text-red-500">*</span>
            </label>
            <select className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white">
              <option value="">Select Incoterm</option>
              {INCOTERM_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Type of Logistic Container <span className="text-red-500">*</span>
            </label>
            <select className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white">
              <option value="">Select Container Type</option>
              {CONTAINER_TYPE_OPTIONS.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Created Date</label>
            <input
              type="text"
              value="14-11-2025"
              readOnly
              className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Lead Date <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value="14-11-2025"
              readOnly
              className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Choose Vendors Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Choose vendors</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Select vendors you have invited. At least one vendor is required.
        </p>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Vendor 1 <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.vendor1}
              onChange={(e) => setFormData({ ...formData, vendor1: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
            >
              <option value="">Select Vendor</option>
              {vendorsLoading ? (
                <option>Loading vendors...</option>
              ) : vendors && vendors.length > 0 ? (
                vendors.map((vendor) => (
                  <option key={vendor._id} value={vendor._id}>
                    {vendor.name}
                  </option>
                ))
              ) : (
                <option disabled>No vendors available. Please invite a vendor first.</option>
              )}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Vendor 2
            </label>
            <select
              value={formData.vendor2}
              onChange={(e) => setFormData({ ...formData, vendor2: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
            >
              <option value="">Select Vendor</option>
              {vendors && vendors.length > 0 && vendors.map((vendor) => (
                <option key={vendor._id} value={vendor._id}>
                  {vendor.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Vendor 3
            </label>
            <select
              value={formData.vendor3}
              onChange={(e) => setFormData({ ...formData, vendor3: e.target.value })}
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
            >
              <option value="">Select Vendor</option>
              {vendors && vendors.length > 0 && vendors.map((vendor) => (
                <option key={vendor._id} value={vendor._id}>
                  {vendor.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        {vendors && vendors.length === 0 && (
          <p className="text-xs text-red-600 dark:text-red-400 mt-2">
            No vendors found. Please invite a vendor in Vendor Management first.
          </p>
        )}
      </div>

      {/* Items Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Items</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">No.</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Description *</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Required Quantity *</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">UOM *</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">General Remark *</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Action *</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{index + 1}</td>
                  <td className="px-4 py-3">
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Impa No"
                        className="w-full px-3 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Part No."
                        className="w-full px-3 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Position No"
                        className="w-full px-3 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Item Description.."
                        className="w-full px-3 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm"
                      />
                      <input
                        type="text"
                        placeholder="alt. Part No."
                        className="w-full px-3 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm"
                      />
                      <input
                        type="text"
                        placeholder="W x B x H"
                        className="w-full px-3 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      placeholder="required quanitity"
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <select className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm">
                      <option value="">Select UOM</option>
                      {UOM_OPTIONS.map((uom) => (
                        <option key={uom} value={uom}>
                          {uom}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      placeholder="General Remarks"
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-sm"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-2 text-red-600 hover:text-red-700"
                    >
                      <MdDelete className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-600 dark:text-gray-400">List Of Items.</p>
          <button
            onClick={addItem}
            className="flex items-center gap-2 px-4 py-2 bg-blue-400 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
          >
            <MdAdd className="w-5 h-5" />
            Add Item
          </button>
        </div>
      </div>

      {/* Add Attachments Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add Attachments</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Upload Files</label>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Drop files here or click to upload</p>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Choose Files</label>
            <input
              type="file"
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
            />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-center">
        <button
          onClick={handleSubmit}
          disabled={createRFQMutation.isPending || !formData.vesselId}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {createRFQMutation.isPending ? 'Creating RFQ...' : 'Get Quote'}
        </button>
      </div>
    </div>
  );
}




