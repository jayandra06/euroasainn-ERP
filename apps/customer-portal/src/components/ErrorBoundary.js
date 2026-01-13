import React, { Component } from 'react';
import { MdError } from 'react-icons/md';
export class ErrorBoundary extends Component {
    constructor() {
        super(...arguments);
        this.state = {
            hasError: false,
        };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            return (<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-6">
          <div className="max-w-md w-full bg-[hsl(var(--card))] rounded-2xl shadow-lg border border-[hsl(var(--border))] p-8">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 mx-auto mb-4">
              <MdError className="w-8 h-8 text-red-600 dark:text-red-400"/>
            </div>
            <h1 className="text-2xl font-bold text-[hsl(var(--foreground))] text-center mb-2">
              Something went wrong
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button onClick={() => window.location.reload()} className="w-full px-4 py-2 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-lg hover:bg-blue-700 transition-colors font-semibold">
              Reload Page
            </button>
          </div>
        </div>);
        }
        return this.props.children;
    }
}
//# sourceMappingURL=ErrorBoundary.js.map