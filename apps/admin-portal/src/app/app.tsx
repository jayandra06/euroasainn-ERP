import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '../context/ThemeContext';
import { AuthProvider } from '../context/AuthContext';
import { ToastProvider } from '../components/shared/Toast';
import { ErrorBoundary } from '../components/ErrorBoundary';
import Login from '../pages/Login';
import { Dashboard } from '../pages/Dashboard';
import { OrganizationsPage } from '../pages/Organizations/OrganizationsPage';
import { OrganizationProfilePage } from '../pages/Organizations/OrganizationProfilePage';
import { LicensesPage } from '../pages/Licenses/LicensesPage';
import { AnalyticsPage } from '../pages/Analytics/AnalyticsPage';
import { CustomerOnboardingPage } from '../pages/Onboarding/CustomerOnboardingPage';
import { VendorOnboardingPage } from '../pages/Onboarding/VendorOnboardingPage';
import { OnboardingDataPage } from '../pages/Onboarding/OnboardingDataPage';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { TemplateLayout } from '../components/template/Layout';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AuthProvider>
              <ToastProvider>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  {/* Public onboarding routes (no auth required) */}
                  <Route path="/onboarding/customer" element={<CustomerOnboardingPage />} />
                  <Route path="/onboarding/vendor" element={<VendorOnboardingPage />} />
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <TemplateLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="organizations" element={<OrganizationsPage />} />
                    <Route path="organizations/:id" element={<OrganizationProfilePage />} />
                    <Route path="licenses" element={<LicensesPage />} />
                    <Route path="onboarding-data" element={<OnboardingDataPage />} />
                    <Route path="analytics" element={<AnalyticsPage />} />
                  </Route>
                </Routes>
              </ToastProvider>
            </AuthProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;



