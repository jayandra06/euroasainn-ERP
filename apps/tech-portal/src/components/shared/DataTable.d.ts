/**
 * Ultra-Modern DataTable Component
 * World-Class SaaS ERP Platform Design
 * Supports permission-based edit/delete actions
 */
import React from 'react';
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
    canEdit?: boolean;
    canDelete?: boolean;
    emptyMessage?: string;
}
export declare function DataTable<T extends {
    _id?: string;
}>({ columns, data, onEdit, onDelete, canEdit, canDelete, emptyMessage, }: DataTableProps<T>): React.JSX.Element;
export {};
//# sourceMappingURL=DataTable.d.ts.map