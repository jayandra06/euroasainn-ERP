import React, { useState } from 'react';
import { MdAdd } from 'react-icons/md';

const VENDOR_STATUS_OPTIONS = ['All Statuses', 'Approved', 'Pending', 'Rejected'];
const VENDOR_TYPE_OPTIONS = ['All Vendor Types', 'Internal Vendor', 'External Vendor'];

export function VendorManagementPage() {
  const [showInviteModal, setShowInviteModal] = useState(false);

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[hsl(var(--foreground))]">Manage Your Vendors</h1>
        <button
          onClick={() => setShowInviteModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
        >
          <MdAdd className="w-5 h-5" />
          Invite Vendor
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-[hsl(var(--foreground))]">Filter by Status</label>
          <select className="px-3 py-2 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))]">
            {VENDOR_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-[hsl(var(--foreground))]">Filter by Vendor Type</label>
          <select className="px-3 py-2 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))]">
            {VENDOR_TYPE_OPTIONS.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 flex-1">
          <label className="text-sm font-medium text-[hsl(var(--foreground))]">Search Vendors</label>
          <input
            type="text"
            placeholder="Search by vendor name, email, status, phone..."
            className="flex-1 px-4 py-2 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[hsl(var(--card))] rounded-lg border border-[hsl(var(--border))] overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[hsl(var(--foreground))] uppercase">VENDOR NAME</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[hsl(var(--foreground))] uppercase">EMAIL ID</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[hsl(var(--foreground))] uppercase">CONTACT NO.</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[hsl(var(--foreground))] uppercase">VENDOR TYPE</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[hsl(var(--foreground))] uppercase">STATUS</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
                No Vendors Found
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

      {/* Invite Vendor Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[hsl(var(--card))] rounded-lg p-6 w-full max-w-md mx-4 border border-[hsl(var(--border))]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-[hsl(var(--foreground))]">Invite New Vendor</h2>
              <button
                onClick={() => setShowInviteModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Enter the email address of the vendor you wish to invite.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-[hsl(var(--foreground))] mb-2 block">Email Address</label>
                <input
                  type="email"
                  placeholder="vendor@example.com"
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-[hsl(var(--primary-foreground))] rounded-lg font-medium transition-colors"
              >
                Send Invitation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




