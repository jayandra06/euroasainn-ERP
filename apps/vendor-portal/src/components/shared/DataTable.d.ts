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
    emptyMessage?: string;
}
export declare function DataTable<T extends {
    _id?: string;
}>({ columns, data, emptyMessage, }: DataTableProps<T>): React.JSX.Element;
export {};
//# sourceMappingURL=DataTable.d.ts.map