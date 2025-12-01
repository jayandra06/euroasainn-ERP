import React from 'react';
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
  emptyMessage?: string;
}

export function DataTable<T extends { _id?: string }>({
  columns,
  data,
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
          </tr>
        </thead>
        <tbody className="divide-y divide-[hsl(var(--border))]">
          {data.map((item, index) => (
            <tr
              key={item._id || index}
              className="hover:bg-[hsl(var(--muted))] transition-colors"
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn('px-6 py-4 whitespace-nowrap text-[hsl(var(--foreground))]', column.className)}
                >
                  {column.render ? column.render(item) : (item as any)[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}










