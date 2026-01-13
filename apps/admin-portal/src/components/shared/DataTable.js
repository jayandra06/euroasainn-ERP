/**
 * Ultra-Modern DataTable Component
 * Professional Admin Portal Design
 */
import React from 'react';
import { MdEdit, MdDelete } from 'react-icons/md';
import { cn } from '../../lib/utils';
export function DataTable({ columns, data, onEdit, onDelete, onRowClick, emptyMessage = 'No data found', actionsLabel = 'Actions', }) {
    if (data.length === 0) {
        return (<div className="p-16 text-center rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
        <p className="text-lg font-semibold text-[hsl(var(--muted-foreground))]">{emptyMessage}</p>
      </div>);
    }
    return (<div className="overflow-x-auto rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-[hsl(var(--secondary))] border-b border-[hsl(var(--border))]">
            {columns.map((column) => (<th key={column.key} className={cn('px-6 py-4 text-left text-xs font-semibold text-[hsl(var(--foreground))] uppercase tracking-wider', column.className)}>
                {typeof column.header === 'string' ? column.header : column.header}
              </th>))}
            {(onEdit || onDelete) && (<th className="px-6 py-4 text-left text-xs font-semibold text-[hsl(var(--foreground))] uppercase tracking-wider text-center w-32">
                {actionsLabel}
              </th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-[hsl(var(--border))]">
          {data.map((item, index) => (<tr key={item._id || index} onClick={() => onRowClick?.(item)} className={cn('hover:bg-[hsl(var(--muted))] transition-colors group', onRowClick && 'cursor-pointer')}>
              {columns.map((column) => (<td key={column.key} className={cn('px-6 py-4 text-sm text-[hsl(var(--foreground))]', column.className)}>
                  {column.render ? column.render(item) : String(item[column.key])}
                </td>))}
              {(onEdit || onDelete) && (<td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    {onEdit && (<button onClick={() => onEdit(item)} className="p-2 rounded-lg bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] border border-[hsl(var(--primary))]/20 hover:bg-[hsl(var(--primary))]/20 transition-colors" aria-label="Edit">
                        <MdEdit className="w-4 h-4"/>
                      </button>)}
                    {onDelete && (<button onClick={() => onDelete(item)} className="p-2 rounded-lg bg-[hsl(var(--destructive))]/10 text-[hsl(var(--destructive))] border border-[hsl(var(--destructive))]/20 hover:bg-[hsl(var(--destructive))]/20 transition-colors" aria-label="Delete">
                        <MdDelete className="w-4 h-4"/>
                      </button>)}
                  </div>
                </td>)}
            </tr>))}
        </tbody>
      </table>
    </div>);
}
//# sourceMappingURL=DataTable.js.map