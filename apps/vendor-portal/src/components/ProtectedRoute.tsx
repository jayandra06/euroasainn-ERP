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
        throw new Error('Failed to check payment status');
      }
      const data = await response.json();
      return data.data;
    },
    enabled: isAuthenticated && !loading,
    retry: false,
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
    // Preserve the intended destination when redirecting to login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Allow access to payment, licenses, and RFQ pages without payment
  const allowedPaths = ['/payment', '/licenses', '/rfqs'];
  const isAllowedPath = allowedPaths.some(path => location.pathname.startsWith(path));

  // If payment is checked and not active, redirect to payment (except for allowed paths)
  if (paymentChecked && !paymentStatus?.hasActivePayment && !isAllowedPath) {
    return <Navigate to="/payment" replace />;
  }

  return <>{children}</>;
}






