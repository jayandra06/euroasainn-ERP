import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useQuery } from '@tanstack/react-query';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const [paymentChecked, setPaymentChecked] = useState(false);

  // Check payment status
  const { data: paymentStatus, isLoading: paymentLoading } = useQuery({
    queryKey: ['payment-status'],
    queryFn: async () => {
      try {
        const response = await fetch(`${API_URL}/api/v1/payments/status/check`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        });
        if (!response.ok) {
          // If 403, it means payment is required
          if (response.status === 403) {
            return { hasActivePayment: false };
          }
          // For connection errors, allow access (backend might be starting)
          if (response.status === 0 || response.type === 'error') {
            return { hasActivePayment: true }; // Assume payment is active to allow access
          }
          throw new Error('Failed to check payment status');
        }
        const data = await response.json();
        return data.data;
      } catch (error: any) {
        // On connection errors, allow access (don't block user if backend is down)
        if (error?.message?.includes('Failed to fetch') || error?.message?.includes('ERR_CONNECTION_REFUSED')) {
          return { hasActivePayment: true }; // Assume payment is active to allow access
        }
        throw error;
      }
    },
    enabled: isAuthenticated && !loading,
    retry: false,
    // Don't show errors for connection issues
    onError: (error: any) => {
      // Only log non-connection errors
      if (!error?.message?.includes('Failed to fetch') && !error?.message?.includes('ERR_CONNECTION_REFUSED')) {
        console.error('Payment status check error:', error);
      }
    },
  });

  useEffect(() => {
    if (isAuthenticated && !loading && paymentStatus !== undefined) {
      setPaymentChecked(true);
    }
  }, [isAuthenticated, loading, paymentStatus]);

  if (loading || (isAuthenticated && paymentLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Allow access to payment and licenses pages without payment
  const allowedPaths = ['/payment', '/licenses'];
  const isAllowedPath = allowedPaths.some(path => location.pathname.startsWith(path));

  // If payment is checked and not active, redirect to payment (except for allowed paths)
  if (paymentChecked && !paymentStatus?.hasActivePayment && !isAllowedPath) {
    return <Navigate to="/payment" replace />;
  }

  return <>{children}</>;
}






