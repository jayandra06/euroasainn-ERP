import React from 'react';
import { MdAdd } from 'react-icons/md';

export function CrewManagementPage() {
  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Add Employee</h1>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-5 gap-4 mb-4">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Employee ID</div>
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Employee Name</div>
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Mail ID</div>
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Contact No.</div>
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</div>
        </div>

        <div className="grid grid-cols-5 gap-4 mb-6">
          <input
            type="text"
            value="New"
            readOnly
            className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
          />
          <input
            type="text"
            placeholder="Enter a username"
            className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
          />
          <input
            type="email"
            placeholder="Enter an Email"
            className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
          />
          <input
            type="tel"
            placeholder="Enter a phone number"
            className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
          />
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm">
            Save
          </button>
        </div>

        <div className="flex justify-end">
          <button className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
            <MdAdd className="w-5 h-5" />
            Add Employee
          </button>
        </div>
      </div>
    </div>
  );
}




