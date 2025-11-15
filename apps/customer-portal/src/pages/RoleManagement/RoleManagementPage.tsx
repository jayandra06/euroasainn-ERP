import React from 'react';

export function RoleManagementPage() {
  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Manage Your Role</h1>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-blue-400 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors">
            Manage Roles
          </button>
          <button className="px-4 py-2 bg-blue-400 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors">
            Manage Permission
          </button>
        </div>
      </div>

      {/* Search */}
      <div>
        <input
          type="text"
          placeholder="EMAIL ID"
          className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
        />
      </div>

      {/* Empty State */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">No Record Found</p>
      </div>
    </div>
  );
}




