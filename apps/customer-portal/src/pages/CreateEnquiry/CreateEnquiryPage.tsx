import React, { useState } from 'react';
import { MdAdd, MdDelete } from 'react-icons/md';

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

export function CreateEnquiryPage() {
  const [items, setItems] = useState([{ id: 1 }]);

  const addItem = () => {
    setItems([...items, { id: Date.now() }]);
  };

  const removeItem = (id: number) => {
    setItems(items.filter((item) => item.id !== id));
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <h1 className="text-3xl font-bold text-[hsl(var(--foreground))]">Create RFQ</h1>

      {/* Main Form Card */}
      <div className="bg-[hsl(var(--card))] rounded-lg p-8 border border-[hsl(var(--border))]">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-1">RFQ and Vessel Information</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Details for RFQ, Vessel, and Equipment</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-[hsl(var(--foreground))] mb-2 block">
              Vessel Name <span className="text-red-500">*</span>
            </label>
            <select className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))]">
              <option>Select Vessel</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-[hsl(var(--foreground))] mb-2 block">Vessel Ex Name</label>
            <input
              type="text"
              placeholder="Vessel Ex Name"
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))]"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[hsl(var(--foreground))] mb-2 block">
              IMO No. <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="IMO No."
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))]"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[hsl(var(--foreground))] mb-2 block">
              Supply Port <span className="text-red-500">*</span>
            </label>
            <select className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))]">
              <option value="">Select Supply Port</option>
              {SUPPLY_PORT_OPTIONS.map((port) => (
                <option key={port} value={port}>
                  {port}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-[hsl(var(--foreground))] mb-2 block">Equipment Tags</label>
            <input
              type="text"
              placeholder="Equipment Tag"
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))]"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[hsl(var(--foreground))] mb-2 block">
              Category <span className="text-red-500">*</span>
            </label>
            <select className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))]">
              <option value="">Select Category</option>
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-[hsl(var(--foreground))] mb-2 block">
              Sub Category <span className="text-red-500">*</span>
            </label>
            <select className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))]">
              <option>Select Category</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-[hsl(var(--foreground))] mb-2 block">
              Brand <span className="text-red-500">*</span>
            </label>
            <select className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))]">
              <option>Select Brand</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-[hsl(var(--foreground))] mb-2 block">
              Model <span className="text-red-500">*</span>
            </label>
            <select className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))]">
              <option>Select Model</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-[hsl(var(--foreground))] mb-2 block">
              HULL No. <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="HULL No."
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))]"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[hsl(var(--foreground))] mb-2 block">Serial Number</label>
            <input
              type="text"
              placeholder="Serial Number"
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))]"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[hsl(var(--foreground))] mb-2 block">Drawing Number</label>
            <input
              type="text"
              placeholder="Drawing Number"
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))]"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[hsl(var(--foreground))] mb-2 block">Remarks</label>
            <input
              type="text"
              placeholder="Remarks"
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))]"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[hsl(var(--foreground))] mb-2 block">
              Preferred Quality <span className="text-red-500">*</span>
            </label>
            <select className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))]">
              <option>Select Quality</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-[hsl(var(--foreground))] mb-2 block">
              Type of Incoterms <span className="text-red-500">*</span>
            </label>
            <select className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))]">
              <option value="">Select Incoterm</option>
              {INCOTERM_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-[hsl(var(--foreground))] mb-2 block">
              Type of Logistic Container <span className="text-red-500">*</span>
            </label>
            <select className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))]">
              <option value="">Select Container Type</option>
              {CONTAINER_TYPE_OPTIONS.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-[hsl(var(--foreground))] mb-2 block">Created Date</label>
            <input
              type="text"
              value="14-11-2025"
              readOnly
              className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))]"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[hsl(var(--foreground))] mb-2 block">
              Lead Date <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value="14-11-2025"
              readOnly
              className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))]"
            />
          </div>
        </div>
      </div>

      {/* Choose Vendors Section */}
      <div className="bg-[hsl(var(--card))] rounded-lg p-6 border border-[hsl(var(--border))]">
        <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-4">Choose vendors</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-[hsl(var(--foreground))] mb-2 block">
              Vendor 1 <span className="text-red-500">*</span>
            </label>
            <select className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))]">
              <option>Select Vendor</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-[hsl(var(--foreground))] mb-2 block">
              Vendor 2 <span className="text-red-500">*</span>
            </label>
            <select className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))]">
              <option>Select Vendor</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-[hsl(var(--foreground))] mb-2 block">
              Vendor 3 <span className="text-red-500">*</span>
            </label>
            <select className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))]">
              <option>Select Vendor</option>
            </select>
          </div>
        </div>
      </div>

      {/* Items Section */}
      <div className="bg-[hsl(var(--card))] rounded-lg p-6 border border-[hsl(var(--border))]">
        <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-4">Items</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[hsl(var(--foreground))] uppercase">No.</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[hsl(var(--foreground))] uppercase">Description *</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[hsl(var(--foreground))] uppercase">Required Quantity *</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[hsl(var(--foreground))] uppercase">UOM *</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[hsl(var(--foreground))] uppercase">General Remark *</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[hsl(var(--foreground))] uppercase">Action *</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 text-sm text-[hsl(var(--foreground))]">{index + 1}</td>
                  <td className="px-4 py-3">
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Impa No"
                        className="w-full px-3 py-1 bg-white dark:bg-gray-700 border border-[hsl(var(--border))] rounded text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Part No."
                        className="w-full px-3 py-1 bg-white dark:bg-gray-700 border border-[hsl(var(--border))] rounded text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Position No"
                        className="w-full px-3 py-1 bg-white dark:bg-gray-700 border border-[hsl(var(--border))] rounded text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Item Description.."
                        className="w-full px-3 py-1 bg-white dark:bg-gray-700 border border-[hsl(var(--border))] rounded text-sm"
                      />
                      <input
                        type="text"
                        placeholder="alt. Part No."
                        className="w-full px-3 py-1 bg-white dark:bg-gray-700 border border-[hsl(var(--border))] rounded text-sm"
                      />
                      <input
                        type="text"
                        placeholder="W x B x H"
                        className="w-full px-3 py-1 bg-white dark:bg-gray-700 border border-[hsl(var(--border))] rounded text-sm"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      placeholder="required quanitity"
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-[hsl(var(--border))] rounded text-sm"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <select className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-[hsl(var(--border))] rounded text-sm">
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
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-[hsl(var(--border))] rounded text-sm"
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
            className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--primary))]/80 hover:bg-[hsl(var(--primary))] text-white rounded-lg font-medium transition-colors"
          >
            <MdAdd className="w-5 h-5" />
            Add Item
          </button>
        </div>
      </div>

      {/* Add Attachments Section */}
      <div className="bg-[hsl(var(--card))] rounded-lg p-6 border border-[hsl(var(--border))]">
        <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-4">Add Attachments</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-[hsl(var(--foreground))] mb-2 block">Upload Files</label>
            <div className="border-2 border-dashed border-[hsl(var(--border))] rounded-lg p-8 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Drop files here or click to upload</p>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-[hsl(var(--foreground))] mb-2 block">Choose Files</label>
            <input
              type="file"
              className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-[hsl(var(--border))] rounded-lg text-sm"
            />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-center">
        <button className="px-8 py-3 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-[hsl(var(--primary-foreground))] rounded-lg font-medium transition-colors">
          Get Quote
        </button>
      </div>
    </div>
  );
}




