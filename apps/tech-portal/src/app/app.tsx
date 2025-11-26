import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '../context/ThemeContext';
import { AuthProvider } from '../context/AuthContext';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { ToastProvider } from '../components/shared/Toast';
import Login from '../pages/Login';
import { Dashboard } from '../pages/Dashboard';
import { UsersPage } from '../pages/Users/UsersPage';
import { OrganizationsPage } from '../pages/Organizations/OrganizationsPage';
import { OrganizationProfilePage } from '../pages/Organizations/OrganizationProfilePage';
import { LicensesPage } from '../pages/Licenses/LicensesPage';
import { CreateLicensePage } from '../pages/Licenses/CreateLicensePage';
import { OnboardingDataPage } from '../pages/Onboarding/OnboardingDataPage';
import { AdminUsersPage } from '../pages/AdminUsers/AdminUsersPage';
import { SettingsPage } from '../pages/Settings/SettingsPage';
import { AnalyticsPage } from '../pages/Analytics/AnalyticsPage';
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
            <ToastProvider>
              <AuthProvider>
                <Routes>
                <Route path="/login" element={<Login />} />
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
                  <Route path="users" element={<UsersPage />} />
                  <Route path="organizations" element={<OrganizationsPage />} />
                  <Route path="organizations/:id" element={<OrganizationProfilePage />} />
                  <Route path="licenses" element={<LicensesPage />} />
                  <Route path="licenses/create" element={<CreateLicensePage />} />
                  <Route path="onboarding-data" element={<OnboardingDataPage />} />
                  <Route path="admin-users" element={<AdminUsersPage />} />
                  <Route path="analytics" element={<AnalyticsPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="profile" element={<div className="p-8">Profile Page - Coming Soon</div>} />
                </Route>
                </Routes>
              </AuthProvider>
            </ToastProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
