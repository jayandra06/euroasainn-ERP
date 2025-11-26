/**
 * Ultra-Modern DataTable Component
 * World-Class SaaS ERP Platform Design
 */

import React from 'react';
import { MdEdit, MdDelete } from 'react-icons/md';
import { cn } from '../../lib/utils';

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  emptyMessage?: string;
}

export function DataTable<T extends { _id?: string }>({
  columns,
  data,
  onEdit,
  onDelete,
  emptyMessage = 'No data found',
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="p-16 text-center rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
        <p className="text-lg font-semibold text-[hsl(var(--muted-foreground))]">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-[hsl(var(--secondary))] border-b border-[hsl(var(--border))]">
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  'px-6 py-4 text-left text-xs font-semibold text-[hsl(var(--foreground))] uppercase tracking-wider',
                  column.className
                )}
              >
                {column.header}
              </th>
            ))}
            {(onEdit || onDelete) && (
              <th className="px-6 py-4 text-left text-xs font-semibold text-[hsl(var(--foreground))] uppercase tracking-wider text-center w-32">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-[hsl(var(--border))]">
          {data.map((item, index) => (
            <tr
              key={item._id || index}
              className="hover:bg-[hsl(var(--muted))] transition-colors group"
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn(
                    'px-6 py-4 text-sm text-[hsl(var(--foreground))]',
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
                        className="p-2 rounded-lg bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/20 transition-colors"
                        aria-label="Edit"
                      >
                        <MdEdit className="w-4 h-4" />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(item)}
                        className="p-2 rounded-lg bg-[hsl(var(--destructive))]/10 text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive))]/20 transition-colors"
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
