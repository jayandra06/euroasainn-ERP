/**
 * Ultra-Modern DataTable Component
 * World-Class SaaS ERP Platform Design
 * Supports permission-based edit/delete actions
 */
import React from 'react';
import { MdEdit, MdDelete } from 'react-icons/md';
import { cn } from '../../lib/utils';
export function DataTable({ columns, data, onEdit, onDelete, canEdit = true, canDelete = true, emptyMessage = 'No data found', }) {
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
                {column.header}
              </th>))}
            {(onEdit || onDelete) && (<th className="px-6 py-4 text-center text-xs font-semibold text-[hsl(var(--foreground))] uppercase tracking-wider w-32">
                Actions
              </th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-[hsl(var(--border))]">
          {data.map((item, index) => (<tr key={item._id || index} className="hover:bg-[hsl(var(--muted))] transition-colors">
              {columns.map((column) => (<td key={column.key} className={cn('px-6 py-4 text-sm text-[hsl(var(--foreground))]', column.className)}>
                  {column.render ? column.render(item) : String(item[column.key])}
                </td>))}
              {(onEdit || onDelete) && (<td className="px-6 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    {onEdit && (<button onClick={() => onEdit(item)} disabled={!canEdit} className={cn('relative p-2 rounded-lg transition-all', canEdit
                        ? 'bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/20'
                        : 'bg-gray-200/50 text-gray-400 cursor-not-allowed hover:bg-gray-200/70')} aria-label="Edit">
                        <MdEdit className="w-4 h-4"/>
                        {!canEdit && (<span className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                            <span className="text-red-600 text-lg font-bold drop-shadow-md">⌀</span>
                          </span>)}
                      </button>)}

                    {onDelete && (<button onClick={() => onDelete(item)} disabled={!canDelete} className={cn('relative p-2 rounded-lg transition-all', canDelete
                        ? 'bg-[hsl(var(--destructive))]/10 text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive))]/20'
                        : 'bg-gray-200/50 text-gray-400 cursor-not-allowed hover:bg-gray-200/70')} aria-label="Delete">
                        <MdDelete className="w-4 h-4"/>
                        {!canDelete && (<span className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                            <span className="text-red-600 text-lg font-bold drop-shadow-md">⌀</span>
                          </span>)}
                      </button>)}
                  </div>
                </td>)}
            </tr>))}
        </tbody>
      </table>
    </div>);
}
//# sourceMappingURL=DataTable.js.map