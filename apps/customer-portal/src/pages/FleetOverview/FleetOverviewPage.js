import React from 'react';
import { MdDownload, MdFilterList } from 'react-icons/md';
export function FleetOverviewPage() {
    return (<div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[hsl(var(--foreground))]">Fleet Overview</h1>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-[hsl(var(--primary-foreground))] rounded-lg font-medium transition-colors">
            <MdDownload className="w-5 h-5"/>
            Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-[hsl(var(--primary-foreground))] rounded-lg font-medium transition-colors">
            <MdFilterList className="w-5 h-5"/>
            Filter
          </button>
        </div>
      </div>

      {/* Fleet Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[hsl(var(--card))] rounded-lg p-4 border border-[hsl(var(--border))]">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Vessels</p>
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]">0</p>
        </div>
        <div className="bg-[hsl(var(--card))] rounded-lg p-4 border border-[hsl(var(--border))]">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Active Vessels</p>
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]">0</p>
        </div>
        <div className="bg-[hsl(var(--card))] rounded-lg p-4 border border-[hsl(var(--border))]">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">In Dry Dock</p>
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]">0</p>
        </div>
        <div className="bg-[hsl(var(--card))] rounded-lg p-4 border border-[hsl(var(--border))]">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Fleet Hours</p>
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]">00,000 h</p>
        </div>
      </div>

      {/* Critical Alerts */}
      <div className="bg-[hsl(var(--card))] rounded-lg p-6 border border-[hsl(var(--border))]">
        <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-4">Critical Alerts / Maintenance Due</h3>
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li>• Overdue maintenance components</li>
          <li>• Lube oil replacement due</li>
          <li>• Separator bowl cleaning</li>
          <li>• Running hour exceedances</li>
          <li>• Ballast pump inspections</li>
        </ul>
      </div>

      {/* Equipment Status */}
      <div className="bg-[hsl(var(--card))] rounded-lg p-6 border border-[hsl(var(--border))]">
        <div className="flex items-center gap-4 mb-4">
          <select className="px-3 py-2 bg-white dark:bg-gray-700 border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))]">
            <option>All Vessels</option>
          </select>
          <select className="px-3 py-2 bg-white dark:bg-gray-700 border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))]">
            <option>All Equipment</option>
          </select>
          <select className="px-3 py-2 bg-white dark:bg-gray-700 border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))]">
            <option>All Brands</option>
          </select>
          <select className="px-3 py-2 bg-white dark:bg-gray-700 border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))]">
            <option>All Statuses</option>
          </select>
        </div>
        <table className="w-full">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[hsl(var(--foreground))] uppercase">Equipment</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[hsl(var(--foreground))] uppercase">Online</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[hsl(var(--foreground))] uppercase">Maintenance Due</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-[hsl(var(--foreground))] uppercase">Last Update</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-4 py-3 text-sm text-[hsl(var(--foreground))]">Main Engines</td>
              <td className="px-4 py-3 text-sm text-[hsl(var(--foreground))]">0</td>
              <td className="px-4 py-3 text-sm text-[hsl(var(--foreground))]">0</td>
              <td className="px-4 py-3 text-sm text-[hsl(var(--foreground))]">28-Apr-2025</td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-sm text-[hsl(var(--foreground))]">Bilge Pumps</td>
              <td className="px-4 py-3 text-sm text-[hsl(var(--foreground))]">0</td>
              <td className="px-4 py-3 text-sm text-[hsl(var(--foreground))]">0</td>
              <td className="px-4 py-3 text-sm text-[hsl(var(--foreground))]">27-Apr-2025</td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-sm text-[hsl(var(--foreground))]">Purifiers</td>
              <td className="px-4 py-3 text-sm text-[hsl(var(--foreground))]">0</td>
              <td className="px-4 py-3 text-sm text-[hsl(var(--foreground))]">—</td>
              <td className="px-4 py-3 text-sm text-[hsl(var(--foreground))]">28-Apr-2025</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Document & Certification Tracker */}
      <div className="bg-[hsl(var(--card))] rounded-lg p-6 border border-[hsl(var(--border))]">
        <div className="flex items-center gap-4 mb-4">
          <select className="px-3 py-2 bg-white dark:bg-gray-700 border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))]">
            <option>All Vessels</option>
          </select>
          <select className="px-3 py-2 bg-white dark:bg-gray-700 border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))]">
            <option>All</option>
          </select>
        </div>
        <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-4">Document & Certification Tracker</h3>
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li>• Next Class survey due</li>
          <li>• Purifier / OWS certificates</li>
          <li>• Service records upload</li>
        </ul>
      </div>
    </div>);
}
//# sourceMappingURL=FleetOverviewPage.js.map