import React, { useState } from 'react';
import { MdAdd } from 'react-icons/md';

export function CrewManagementPage() {
  const [rows, setRows] = useState<{ id: number }[]>([{ id: 1 }]);

  const handleAddRow = () => {
    setRows((prev) => [...prev, { id: Date.now() }]);
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[hsl(var(--foreground))]">Add Employee</h1>
      </div>

      {/* Form */}
      <div className="bg-[hsl(var(--card))] rounded-lg p-6 border border-[hsl(var(--border))]">
        <div className="grid grid-cols-5 gap-4 mb-4">
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Employee ID</div>
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Employee Name</div>
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Mail ID</div>
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Contact No.</div>
          <div className="text-sm font-medium text-gray-600 dark:text-gray-400">Status</div>
        </div>

        <div className="space-y-4 mb-6">
          {rows.map((row) => (
            <div key={row.id} className="grid grid-cols-5 gap-4">
              <input
                type="text"
                value="New"
                readOnly
                className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))]"
              />
              <input
                type="text"
                placeholder="Enter a username"
                className="px-3 py-2 bg-white dark:bg-gray-700 border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))]"
              />
              <input
                type="email"
                placeholder="Enter an Email"
                className="px-3 py-2 bg-white dark:bg-gray-700 border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))]"
              />
              <input
                type="tel"
                placeholder="Enter a phone number"
                className="px-3 py-2 bg-white dark:bg-gray-700 border border-[hsl(var(--border))] rounded-lg text-sm text-[hsl(var(--foreground))]"
              />
              <button className="px-4 py-2 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-[hsl(var(--primary-foreground))] rounded-lg font-medium transition-colors text-sm">
                Save
              </button>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleAddRow}
            className="flex items-center gap-2 px-6 py-2 bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-[hsl(var(--primary-foreground))] rounded-lg font-medium transition-colors"
          >
            <MdAdd className="w-5 h-5" />
            Add Employee
          </button>
        </div>
      </div>
    </div>
  );
}




