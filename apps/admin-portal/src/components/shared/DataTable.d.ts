/**
 * Ultra-Modern DataTable Component
 * Professional Admin Portal Design
 */
import React from 'react';
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
export declare function DataTable<T extends {
    _id?: string;
}>({ columns, data, onEdit, onDelete, onRowClick, emptyMessage, actionsLabel, }: DataTableProps<T>): React.JSX.Element;
export {};
//# sourceMappingURL=DataTable.d.ts.map