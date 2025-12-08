
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
import { CreateLicensePage } from '../pages/Licenses/CreateLicensePage';
import { AnalyticsPage } from '../pages/Analytics/AnalyticsPage';
import { CustomerOnboardingPage } from '../pages/Onboarding/CustomerOnboardingPage';
import { VendorOnboardingPage } from '../pages/Onboarding/VendorOnboardingPage';
import { OnboardingDataPage } from '../pages/Onboarding/OnboardingDataPage';
import { UsersPage } from '../pages/Users/UsersPage';
import { UserCreatePage } from '../pages/Users/UserCreatePage';
import { AdminUsersPage } from '../pages/AdminUsers/AdminUsersPage';
import { SettingsPage } from '../pages/Settings/SettingsPage';
import { ActivityLogPage } from '../pages/ActivityLog/ActivityLogPage';
import { ReportsPage } from '../pages/Reports/ReportsPage';
import { NotificationsPage } from '../pages/Notifications/NotificationsPage';
import { SupportPage } from '../pages/Support/SupportPage';
import { SubscriptionPage } from '../pages/Subscription/SubscriptionPage';
import { LoginsPage } from '../pages/Logins/LoginsPage';
import { RFQsPage } from '../pages/RFQs/RFQsPage';
import { CreateEnquiryPage } from '../pages/RFQs/CreateEnquiryPage';
import { InventoryPage } from '../pages/Inventory/InventoryPage';
import { VendorsPage } from '../pages/Vendors/VendorsPage';
import { BrandsPage } from '../pages/Brands/BrandsPage';
import { CategoriesPage } from '../pages/Categories/CategoriesPage';
import { ModelsPage } from '../pages/Models/ModelsPage';
import { CustomersPage } from '../pages/Customers/CustomersPage';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { TemplateLayout } from '../components/template/Layout';
import  {RolesPage } from '../pages/Roles/RolesPage';
import { AssignRolesPage } from '../pages/Roles/AssignRolesPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 300000, // 5 minutes - data is considered fresh
      gcTime: 600000, // 10 minutes - cache time (formerly cacheTime)
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
                    {/* Admin Dashboard Routes */}
                    <Route path="dashboard/admin" element={<Dashboard />} />
                    <Route path="dashboard/admin/rfqs" element={<RFQsPage />} />
                    <Route path="dashboard/admin/create-enquiry" element={<CreateEnquiryPage />} />
                    <Route path="dashboard/admin/inventory" element={<InventoryPage />} />
                    {/* Role Management Routes */}
                    <Route path="dashboard/admin/roles" element={<RolesPage />} />
                    <Route path="dashboard/admin/assign-roles" element={<AssignRolesPage />} />

                    {/* Vendors Routes */}
                    <Route path="dashboard/admin/vendors" element={<VendorsPage />} />
                    <Route path="dashboard/admin/brands" element={<BrandsPage />} />
                    <Route path="dashboard/admin/categories" element={<CategoriesPage />} />
                    <Route path="dashboard/admin/models" element={<ModelsPage />} />
                    {/* Customers Routes */}
                    <Route path="dashboard/admin/customers" element={<CustomersPage />} />
                    <Route path="dashboard/admin/customers/support" element={<SupportPage />} />
                    {/* Legacy Routes */}
                    <Route path="organizations" element={<OrganizationsPage />} />
                    <Route path="organizations/:id" element={<OrganizationProfilePage />} />
                    <Route path="licenses" element={<LicensesPage />} />
                    <Route path="licenses/create" element={<CreateLicensePage />} />
                    <Route path="onboarding-data" element={<OnboardingDataPage />} />
                    <Route path="analytics" element={<AnalyticsPage />} />
                    <Route path="users" element={<UsersPage />} />
                    <Route path="users/new" element={<UserCreatePage />} />
                    <Route path="admin-users" element={<AdminUsersPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                    <Route path="activity-log" element={<ActivityLogPage />} />
                    <Route path="reports" element={<ReportsPage />} />
                    <Route path="notifications" element={<NotificationsPage />} />
                    <Route path="support" element={<SupportPage />} />
                    <Route path="subscription" element={<SubscriptionPage />} />
                    <Route path="logins" element={<LoginsPage />} />
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



