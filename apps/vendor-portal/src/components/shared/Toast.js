/**
 * Ultra-Modern Toast Component
 * Professional Vendor Portal Design
 */
import React, { createContext, useContext, useState, useCallback } from 'react';
import { MdCheckCircle, MdError, MdInfo, MdWarning, MdClose } from 'react-icons/md';
import { cn } from '../../lib/utils';
const ToastContext = createContext(undefined);
export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
}
export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const showToast = useCallback((message, type = 'info') => {
        const id = Math.random().toString(36).substring(7);
        setToasts((prev) => [...prev, { id, message, type }]);
    }, []);
    const success = useCallback((message) => {
        showToast(message, 'success');
    }, [showToast]);
    const error = useCallback((message) => {
        showToast(message, 'error');
    }, [showToast]);
    const info = useCallback((message) => {
        showToast(message, 'info');
    }, [showToast]);
    const warning = useCallback((message) => {
        showToast(message, 'warning');
    }, [showToast]);
    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);
    return (<ToastContext.Provider value={{ showToast, success, error, info, warning }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (<ToastItem key={toast.id} toast={toast} onRemove={removeToast}/>))}
      </div>
    </ToastContext.Provider>);
}
function ToastItem({ toast, onRemove }) {
    React.useEffect(() => {
        const timer = setTimeout(() => {
            onRemove(toast.id);
        }, 4000);
        return () => clearTimeout(timer);
    }, [toast.id, onRemove]);
    const icons = {
        success: MdCheckCircle,
        error: MdError,
        info: MdInfo,
        warning: MdWarning,
    };
    const styles = {
        success: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-[hsl(var(--foreground))] font-semibold',
        error: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-[hsl(var(--foreground))] font-semibold',
        info: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-[hsl(var(--foreground))] font-semibold',
        warning: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-[hsl(var(--foreground))] font-semibold',
    };
    const Icon = icons[toast.type];
    return (<div className={cn('flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border backdrop-blur-sm animate-slide-in-right max-w-md min-w-[300px] pointer-events-auto', styles[toast.type])}>
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5"/>
      <p className="flex-1 text-sm font-semibold">{toast.message}</p>
      <button onClick={() => onRemove(toast.id)} className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex-shrink-0" aria-label="Close">
        <MdClose className="w-4 h-4"/>
      </button>
    </div>);
}
//# sourceMappingURL=Toast.js.map