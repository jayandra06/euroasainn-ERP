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
import { RFQDetailsPage } from '../pages/RFQs/RFQDetailsPage';
import { FleetOverviewPage } from '../pages/FleetOverview/FleetOverviewPage';
import { VesselManagementPage } from '../pages/VesselManagement/VesselManagementPage';
import { BranchPage } from '../pages/Branch/BranchPage';
import { BUProfilePage } from '../pages/Branch/BUProfilePage';
import { PortManagementPage } from '../pages/PortManagement/PortManagementPage';
import { CrewManagementPage } from '../pages/CrewManagement/CrewManagementPage';
import { VendorManagementPage } from '../pages/VendorManagement/VendorManagementPage';
import { ClaimRaisedPage } from '../pages/ClaimRaised/ClaimRaisedPage';
import { CreateEnquiryPage } from '../pages/CreateEnquiry/CreateEnquiryPage';
import { BecomeAVendorPage } from '../pages/BecomeAVendor/BecomeAVendorPage';
import { OnboardingFormPage } from '../pages/Onboarding/OnboardingFormPage';
import { EmployeeOnboardingFormPage } from '../pages/Onboarding/EmployeeOnboardingFormPage';
import { LicensesPage } from '../pages/Licenses/LicensesPage';
import { PaymentPage } from '../pages/Payment/PaymentPage';
import { PayrollManagementPage } from '../pages/PayrollManagement/PayrollManagementPage';
import { EmployeeOnboardingReviewPage } from '../pages/EmployeeOnboarding/EmployeeOnboardingReviewPage';

/* ✅ Role Management Imports */
import { RolesPage } from '../pages/Roles/RolesPage';
import { AssignRolesPage } from '../pages/Roles/AssignRolesPage';
<<<<<<< HEAD
import { CustomerProfilePage } from '../pages/CustomerProfilePage/CustomerProfilePage';
=======

/* ✅ Coming Soon Pages */
import { FleetPerformancePage } from '../pages/FleetPerformance/FleetPerformancePage';
import { CompliancePage } from '../pages/Compliance/CompliancePage';
import { RiskManagementPage } from '../pages/RiskManagement/RiskManagementPage';
import { SustainabilityPage } from '../pages/Sustainability/SustainabilityPage';
>>>>>>> main
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      refetchInterval: 60 * 1000,
    },
  },
});

function AppContent() {
  useCrossTabSync();
  
  return (
    <ToastProvider>
      <BrowserRouter
        future={{
          v7_relativeSplatPath: true,
        }}
      >
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* Public routes */}
            <Route path="/onboarding/customer" element={<OnboardingFormPage />} />
            <Route path="/onboarding/employee" element={<EmployeeOnboardingFormPage />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <TemplateLayout />
                </ProtectedRoute>
              }
            >

              {/* Default redirect */}
              <Route index element={<Navigate to="/dashboard" replace />} />

              {/* Normal Routes */}
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="analytics" element={<AnalyticsPage />} />
              <Route path="fleet-overview" element={<FleetOverviewPage />} />
              <Route path="rfqs" element={<RFQsPage />} />
              <Route path="rfqs/:id" element={<RFQDetailsPage />} />
              <Route path="vendor-management" element={<VendorManagementPage />} />
              <Route path="claim-raised" element={<ClaimRaisedPage />} />
              <Route path="vessels" element={<VesselManagementPage />} />
              <Route path="vessel-management" element={<VesselManagementPage />} />
              <Route path="port" element={<PortManagementPage />} />
              <Route path="port-management" element={<PortManagementPage />} />
              <Route path="branch" element={<BranchPage />} />
              <Route path="dashboard/branch/:buId" element={<BUProfilePage />} />
              <Route path="payroll-management" element={<PayrollManagementPage />} />
              <Route path="employee-management" element={<CrewManagementPage />} />
              <Route path="crew-management" element={<CrewManagementPage />} />
              <Route path="employee-onboarding-review" element={<EmployeeOnboardingReviewPage />} />
              <Route path="create-enquiry" element={<CreateEnquiryPage />} />
              <Route path="become-a-seller" element={<BecomeAVendorPage />} />
              <Route path="licenses" element={<LicensesPage />} />
              <Route path="payment" element={<PaymentPage />} />

              {/* ✅ Role Management Routes Added */}
              <Route path="roles-permissions" element={<RolesPage />} />
              <Route path="assign-roles" element={<AssignRolesPage />} />

<<<<<<< HEAD
              {/* ✅ Profile Route */}
              <Route path="profile" element={<CustomerProfilePage />} />
=======
              {/* ✅ Coming Soon Pages */}
              <Route path="fleet-performance" element={<FleetPerformancePage />} />
              <Route path="compliance" element={<CompliancePage />} />
              <Route path="risk-management" element={<RiskManagementPage />} />
              <Route path="sustainability" element={<SustainabilityPage />} />
>>>>>>> main

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
