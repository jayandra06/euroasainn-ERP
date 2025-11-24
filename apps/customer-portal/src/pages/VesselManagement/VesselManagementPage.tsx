import React, { useState } from 'react';
import { MdAdd, MdFileUpload } from 'react-icons/md';

export function VesselManagementPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);

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

      <p className="text-sm text-gray-600 dark:text-gray-400">Allowed Vessels:/</p>

      {/* Search */}
      <div>
        <input
          type="text"
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
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
                No vessels found
              </td>
            </tr>
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
                <label className="text-sm font-medium text-[hsl(var(--foreground))] mb-2 block">Vessel 1</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-[hsl(var(--foreground))] font-semibold mb-1 block">IMO Number</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))]"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[hsl(var(--foreground))] font-semibold mb-1 block">Vessel Name</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))]"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[hsl(var(--foreground))] font-semibold mb-1 block">Ex Vessel Name (optional)</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))]"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[hsl(var(--foreground))] font-semibold mb-1 block">Vessel Type</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))]"
                    />
                  </div>
                </div>
              </div>

              <button className="w-full py-2 text-sm text-[hsl(var(--foreground))] font-semibold hover:underline">
                Add Item
              </button>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-[hsl(var(--primary-foreground))] rounded-lg font-medium transition-colors"
              >
                Add Vessels
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




