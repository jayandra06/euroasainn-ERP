import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '../context/ThemeContext';
import { AuthProvider } from '../context/AuthContext';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { ToastProvider } from '../components/shared/Toast';
import { useCrossTabSync } from '../hooks/useCrossTabSync';
import Login from '../pages/Login';
import { Dashboard } from '../pages/Dashboard';
import { AnalyticsPage } from '../pages/Analytics/AnalyticsPage';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { TemplateLayout } from '../components/template/Layout';
import { RFQsPage } from '../pages/RFQs/RFQsPage';
import { FleetOverviewPage } from '../pages/FleetOverview/FleetOverviewPage';
import { VesselManagementPage } from '../pages/VesselManagement/VesselManagementPage';
import { BranchPage } from '../pages/Branch/BranchPage';
import { BUProfilePage } from '../pages/Branch/BUProfilePage';
import { PortManagementPage } from '../pages/PortManagement/PortManagementPage';
import {RolesPage} from "../pages/Roles/RolesPage"
import { AssignRolesPage } from '../pages/Roles/AssignRolesPage';
import { CrewManagementPage } from '../pages/CrewManagement/CrewManagementPage';
import { RoleManagementPage } from '../pages/RoleManagement/RoleManagementPage';
import { PayrollManagementPage } from '../pages/PayrollManagement/PayrollManagementPage';
import { VendorManagementPage } from '../pages/VendorManagement/VendorManagementPage';
import { ClaimRaisedPage } from '../pages/ClaimRaised/ClaimRaisedPage';
import { CreateEnquiryPage } from '../pages/CreateEnquiry/CreateEnquiryPage';
import { BecomeAVendorPage } from '../pages/BecomeAVendor/BecomeAVendorPage';
import { OnboardingFormPage } from '../pages/Onboarding/OnboardingFormPage';
import { LicensesPage } from '../pages/Licenses/LicensesPage';
import { PaymentPage } from '../pages/Payment/PaymentPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      staleTime: 30 * 1000, // 30 seconds - data is considered fresh
      gcTime: 5 * 60 * 1000, // 5 minutes - cache time (formerly cacheTime)
      refetchInterval: 60 * 1000, // Refetch every 60 seconds for real-time updates
    },
  },
});

function AppContent() {
  useCrossTabSync();
  
  return (
    <ToastProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            {/* Public onboarding route (no auth required) */}
            <Route path="/onboarding/customer" element={<OnboardingFormPage />} />
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
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="fleet-overview" element={<FleetOverviewPage />} />
              <Route path="rfqs" element={<RFQsPage />} />
              <Route path="vendor-management" element={<VendorManagementPage />} />
              <Route path="claim-raised" element={<ClaimRaisedPage />} />
              <Route path="vessels" element={<VesselManagementPage />} />
              <Route path="vessel-management" element={<VesselManagementPage />} />
              <Route path="port" element={<PortManagementPage />} />
              <Route path="port-management" element={<PortManagementPage />} />
              <Route path="branch" element={<BranchPage />} />
              <Route path="branch/:buId" element={<BUProfilePage />} />
              <Route path="roles-permissions" element={<RolesPage />} />
              <Route path="assign-roles" element={<AssignRolesPage />} />
              <Route path="payroll-management" element={<PayrollManagementPage />} />
              <Route path="employee-management" element={<CrewManagementPage />} />
              <Route path="role-management" element={<RoleManagementPage />} />
              <Route path="crew-management" element={<CrewManagementPage />} />
              <Route path="create-enquiry" element={<CreateEnquiryPage />} />
              <Route path="become-a-seller" element={<BecomeAVendorPage />} />
              <Route path="licenses" element={<LicensesPage />} />
              <Route path="payment" element={<PaymentPage />} />
            </Route>
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ToastProvider>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AppContent />
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;






