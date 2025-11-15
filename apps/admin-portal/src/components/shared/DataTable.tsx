/**
 * Ultra-Modern DataTable Component
 * Professional Admin Portal Design
 */

import React from 'react';
import { MdEdit, MdDelete } from 'react-icons/md';
import { cn } from '../../lib/utils';

interface Column<T> {
  key: string;
  header: string | React.ReactNode;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  actionsLabel?: string;
}

export function DataTable<T extends { _id?: string }>({
  columns,
  data,
  onEdit,
  onDelete,
  onRowClick,
  emptyMessage = 'No data found',
  actionsLabel = 'Actions',
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="p-16 text-center rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <p className="text-lg font-semibold text-gray-500 dark:text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  'px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider',
                  column.className
                )}
              >
                {typeof column.header === 'string' ? column.header : column.header}
              </th>
            ))}
            {(onEdit || onDelete) && (
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-center w-32">
                {actionsLabel}
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {data.map((item, index) => (
            <tr
              key={item._id || index}
              onClick={() => onRowClick?.(item)}
              className={cn(
                'hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group',
                onRowClick && 'cursor-pointer'
              )}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn(
                    'px-6 py-4 text-sm text-gray-900 dark:text-gray-100',
                    column.className
                  )}
                >
                  {column.render ? column.render(item) : String((item as any)[column.key])}
                </td>
              ))}
              {(onEdit || onDelete) && (
                <td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(item)}
                        className="p-2 rounded-lg bg-blue-50 dark:bg-gray-800 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-gray-700 hover:bg-blue-100 dark:hover:bg-gray-700 transition-colors"
                        aria-label="Edit"
                      >
                        <MdEdit className="w-4 h-4" />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(item)}
                        className="p-2 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                        aria-label="Delete"
                      >
                        <MdDelete className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

