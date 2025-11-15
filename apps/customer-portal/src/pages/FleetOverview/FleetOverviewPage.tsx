import React from 'react';
import { MdDownload, MdFilterList } from 'react-icons/md';

export function FleetOverviewPage() {
  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Fleet Overview</h1>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
            <MdDownload className="w-5 h-5" />
            Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
            <MdFilterList className="w-5 h-5" />
            Filter
          </button>
        </div>
      </div>

      {/* Fleet Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Vessels</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Active Vessels</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">In Dry Dock</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Fleet Hours</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">00,000 h</p>
        </div>
      </div>

      {/* Critical Alerts */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Critical Alerts / Maintenance Due</h3>
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li>• Overdue maintenance components</li>
          <li>• Lube oil replacement due</li>
          <li>• Separator bowl cleaning</li>
          <li>• Running hour exceedances</li>
          <li>• Ballast pump inspections</li>
        </ul>
      </div>

      {/* Equipment Status */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4 mb-4">
          <select className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white">
            <option>All Vessels</option>
          </select>
          <select className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white">
            <option>All Equipment</option>
          </select>
          <select className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white">
            <option>All Brands</option>
          </select>
          <select className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white">
            <option>All Statuses</option>
          </select>
        </div>
        <table className="w-full">
          <thead className="bg-gray-100 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Equipment</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Online</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Maintenance Due</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Last Update</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Main Engines</td>
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">0</td>
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">0</td>
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">28-Apr-2025</td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Bilge Pumps</td>
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">0</td>
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">0</td>
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">27-Apr-2025</td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">Purifiers</td>
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">0</td>
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">—</td>
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">28-Apr-2025</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Document & Certification Tracker */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4 mb-4">
          <select className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white">
            <option>All Vessels</option>
          </select>
          <select className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white">
            <option>All</option>
          </select>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Document & Certification Tracker</h3>
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <li>• Next Class survey due</li>
          <li>• Purifier / OWS certificates</li>
          <li>• Service records upload</li>
        </ul>
      </div>
    </div>
  );
}




