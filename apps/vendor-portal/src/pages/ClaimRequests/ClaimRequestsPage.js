import React, { useState } from 'react';
import { MdSearch } from 'react-icons/md';
export function ClaimRequestsPage() {
    const [searchQuery, setSearchQuery] = useState('');
    return (<div className="w-full min-h-screen p-8">
      <div className="mb-6">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Vendor &gt; Dashboard</p>
        <h1 className="text-3xl font-bold text-[hsl(var(--foreground))]">Claim Requests</h1>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5"/>
          <input type="text" placeholder="Search RFQs: Vessel Name, Supply Port, Brand, or Category" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-transparent"/>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[hsl(var(--card))] rounded-lg border border-[hsl(var(--border))] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[hsl(var(--secondary))]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">DATE</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">TIME</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">VESSEL NAME</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">CATEGORY</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">BRAND</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">MODEL</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">COMPANY NAME</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">STATUS</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wider">ACTION</th>
              </tr>
            </thead>
            <tbody className="bg-[hsl(var(--card))] divide-y divide-gray-200 dark:divide-gray-800">
              <tr>
                <td colSpan={9} className="px-6 py-12 text-center text-[hsl(var(--muted-foreground))]">
                  No claim requests found.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-[hsl(var(--border))] flex items-center justify-between">
          <button disabled className="px-4 py-2 text-sm font-medium text-[hsl(var(--muted-foreground))] bg-gray-100 dark:bg-gray-800 rounded-lg cursor-not-allowed">
            Previous
          </button>
          <span className="text-sm text-[hsl(var(--foreground))]">Page 1 of 0</span>
          <button className="px-4 py-2 text-sm font-medium text-white bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 rounded-lg transition-colors">
            Next
          </button>
        </div>
      </div>
    </div>);
}
//# sourceMappingURL=ClaimRequestsPage.js.map