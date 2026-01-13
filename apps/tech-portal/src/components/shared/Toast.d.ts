/**
 * Ultra-Modern Toast Component
 * World-Class SaaS ERP Platform Design
 */
import React from 'react';
export type ToastType = 'success' | 'error' | 'info' | 'warning';
interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
    success: (message: string) => void;
    error: (message: string) => void;
    info: (message: string) => void;
    warning: (message: string) => void;
}
export declare function useToast(): ToastContextType;
export declare function ToastProvider({ children }: {
    children: React.ReactNode;
}): React.JSX.Element;
export {};
//# sourceMappingURL=Toast.d.ts.map