/**
 * Ultra-Modern Toast Component
 * Professional Admin Portal Design
 */
import React from 'react';
export type ToastType = 'success' | 'error' | 'info' | 'warning';
interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}
export declare function useToast(): ToastContextType;
export declare function ToastProvider({ children }: {
    children: React.ReactNode;
}): React.JSX.Element;
export {};
//# sourceMappingURL=Toast.d.ts.map