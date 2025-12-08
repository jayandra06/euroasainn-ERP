import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '../context/ThemeContext';
import { AuthProvider } from '../context/AuthContext';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { ToastProvider } from '../components/shared/Toast';
import Login from '../pages/Login';
import { Dashboard } from '../pages/Dashboard';
import { UsersPage } from '../pages/Users';
import { AnalyticsPage } from '../pages/Analytics/AnalyticsPage';
import { RFQsPage } from '../pages/RFQs/RFQsPage';
import { ClaimRequestsPage } from '../pages/ClaimRequests/ClaimRequestsPage';
import { CategoriesPage } from '../pages/Categories/CategoriesPage';
import { BrandsPage } from '../pages/Brands/BrandsPage';
import { ModelsPage } from '../pages/Models/ModelsPage';
import { OrdersPage } from '../pages/Orders/OrdersPage';
import { DetailsPage } from '../pages/Details/DetailsPage';
import { VesselManagementPage } from '../pages/VesselManagement/VesselManagementPage';
import { VesselDetailsPage } from '../pages/VesselDetails/VesselDetailsPage';
import { CatalogPage } from '../pages/Catalog/CatalogPage';
import { CatalogManagementPage } from '../pages/CatalogManagement/CatalogManagementPage';
import { SupportPage } from '../pages/Support/SupportPage';
import { TermsOfUsePage } from '../pages/TermsOfUse/TermsOfUsePage';
import { PrivacyPolicyPage } from '../pages/PrivacyPolicy/PrivacyPolicyPage';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { TemplateLayout } from '../components/template/Layout';
import { VendorOnboardingPage } from '../pages/Onboarding/VendorOnboardingPage';
import { LicensesPage } from '../pages/Licenses/LicensesPage';
import { PaymentPage } from '../pages/Payment/PaymentPage';
import RolesPage from '../pages/Roles/RolesPage'
import  AssignRolesPage  from '../pages/Roles/AssignRolesPage';

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
          <ToastProvider>
            <BrowserRouter>
              <AuthProvider>
                <Routes>
                <Route path="/login" element={<Login />} />
                {/* Public onboarding route (no auth required) */}
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
                  <Route path="rfqs" element={<RFQsPage />} />
                  <Route path="claim-requests" element={<ClaimRequestsPage />} />
                  <Route path="categories" element={<CategoriesPage />} />
                  <Route path="brands" element={<BrandsPage />} />
                  <Route path="models" element={<ModelsPage />} />
                  <Route path="orders" element={<OrdersPage />} />
                  <Route path="details" element={<DetailsPage />} />
                  <Route path="roles-permissions" element={<RolesPage/>}/>
                    <Route path="assign-roles" element={<AssignRolesPage />} />
                  <Route path="vessel-management" element={<VesselManagementPage />} />
                  <Route path="vessel-details" element={<VesselDetailsPage />} />
                  <Route path="catalog" element={<CatalogPage />} />
                  <Route path="catalog-management" element={<CatalogManagementPage />} />
                  <Route path="support" element={<SupportPage />} />
                  <Route path="terms-of-use" element={<TermsOfUsePage />} />
                  <Route path="privacy-policy" element={<PrivacyPolicyPage />} />
                  <Route path="users" element={<UsersPage />} />
                  <Route path="analytics" element={<AnalyticsPage />} />
                  <Route path="licenses" element={<LicensesPage />} />
                  <Route path="payment" element={<PaymentPage />} />
                </Route>
                </Routes>
              </AuthProvider>
            </BrowserRouter>
          </ToastProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;






