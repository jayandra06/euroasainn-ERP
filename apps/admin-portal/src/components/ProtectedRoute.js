import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
export function ProtectedRoute({ children }) {
    const { isAuthenticated, loading, user } = useAuth();
    // Show loading state while checking authentication
    if (loading) {
        return (<div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"/>
          <p className="text-gray-600 text-sm">Loading...</p>
        </div>
      </div>);
    }
    // Only redirect if we've finished loading and user is not authenticated
    // Check both isAuthenticated and user to be sure
    if (!loading && !isAuthenticated && !user) {
        return <Navigate to="/login" replace/>;
    }
    return <>{children}</>;
}
//# sourceMappingURL=ProtectedRoute.js.map