/**
 * Tech Portal Settings Page
 * Professional settings management for tech portal users
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/shared/Toast';
import {
  MdSettings,
  MdSecurity,
  MdNotifications,
  MdKey,
  MdSave,
  MdPerson,
  MdLanguage,
  MdPalette,
  MdAccessTime,
  MdLock,
  MdEmail,
  MdPhone,
  MdInfo,
  MdCheckCircle,
  MdError,
} from 'react-icons/md';
import { cn } from '../../lib/utils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface UserPreferences {
  timezone?: string;
  language?: string;
  theme?: 'light' | 'dark' | 'system';
  emailNotifications?: boolean;
  systemAlerts?: boolean;
  licenseExpiryAlerts?: boolean;
  userActivityAlerts?: boolean;
  onboardingAlerts?: boolean;
}

interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export function SettingsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'account' | 'security' | 'notifications' | 'api'>('account');

  // Account settings
  const [accountSettings, setAccountSettings] = useState({
    timezone: 'UTC',
    language: 'en',
    theme: 'system' as 'light' | 'dark' | 'system',
  });

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    systemAlerts: true,
    licenseExpiryAlerts: true,
    userActivityAlerts: false,
    onboardingAlerts: true,
  });

  // Password change
  const [passwordData, setPasswordData] = useState<PasswordChangeData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  // Load preferences from localStorage or fetch from API
  const loadPreferences = (): UserPreferences => {
    try {
      const stored = localStorage.getItem('user-preferences');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {}
    return {};
  };

  // Fetch user preferences (try API first, fallback to localStorage)
  const { data: preferences, isLoading: preferencesLoading } = useQuery<UserPreferences>({
    queryKey: ['user-preferences', user?.userId],
    queryFn: async () => {
      try {
        const response = await fetch(`${API_URL}/api/v1/auth/preferences`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          const prefs = data.data || {};
          localStorage.setItem('user-preferences', JSON.stringify(prefs));
          return prefs;
        }
      } catch {}
      // Fallback to localStorage
      return loadPreferences();
    },
    enabled: !!user?.userId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Initialize settings from preferences
  useEffect(() => {
    if (preferences) {
      setAccountSettings({
        timezone: preferences.timezone || 'UTC',
        language: preferences.language || 'en',
        theme: preferences.theme || 'system',
      });
      setNotificationSettings({
        emailNotifications: preferences.emailNotifications ?? true,
        systemAlerts: preferences.systemAlerts ?? true,
        licenseExpiryAlerts: preferences.licenseExpiryAlerts ?? true,
        userActivityAlerts: preferences.userActivityAlerts ?? false,
        onboardingAlerts: preferences.onboardingAlerts ?? true,
      });
    }
  }, [preferences]);

  // Save preferences mutation
  const savePreferencesMutation = useMutation({
    mutationFn: async (prefs: UserPreferences) => {
      // Save to localStorage immediately
      localStorage.setItem('user-preferences', JSON.stringify(prefs));
      
      // Try to save to backend
      try {
        const response = await fetch(`${API_URL}/api/v1/auth/preferences`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
          },
          body: JSON.stringify(prefs),
        });
        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: 'Failed to save preferences' }));
          // Still return success since localStorage was saved
          console.warn('Backend save failed, but preferences saved locally:', error);
        }
        return { success: true, data: prefs };
      } catch (error) {
        // Still return success since localStorage was saved
        console.warn('Backend save failed, but preferences saved locally:', error);
        return { success: true, data: prefs };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-preferences', user?.userId] });
      toast.success('Preferences saved successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to save preferences: ${error.message}`);
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const response = await fetch(`${API_URL}/api/v1/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to change password');
      }
      return response.json();
    },
    onSuccess: () => {
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordErrors({});
      toast.success('Password changed successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to change password: ${error.message}`);
    },
  });

  const handleSaveAccount = () => {
    const prefs: UserPreferences = {
      timezone: accountSettings.timezone,
      language: accountSettings.language,
      theme: accountSettings.theme,
    };
    savePreferencesMutation.mutate(prefs);
  };

  const handleSaveNotifications = () => {
    const prefs: UserPreferences = {
      emailNotifications: notificationSettings.emailNotifications,
      systemAlerts: notificationSettings.systemAlerts,
      licenseExpiryAlerts: notificationSettings.licenseExpiryAlerts,
      userActivityAlerts: notificationSettings.userActivityAlerts,
      onboardingAlerts: notificationSettings.onboardingAlerts,
    };
    savePreferencesMutation.mutate(prefs);
  };

  const handleChangePassword = () => {
    setPasswordErrors({});

    // Validation
    if (!passwordData.currentPassword) {
      setPasswordErrors({ currentPassword: 'Current password is required' });
      return;
    }
    if (!passwordData.newPassword) {
      setPasswordErrors({ newPassword: 'New password is required' });
      return;
    }
    if (passwordData.newPassword.length < 8) {
      setPasswordErrors({ newPassword: 'Password must be at least 8 characters' });
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordErrors({ confirmPassword: 'Passwords do not match' });
      return;
    }

    changePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    });
  };

  const tabs = [
    { id: 'account' as const, label: 'Account', icon: MdPerson },
    { id: 'security' as const, label: 'Security', icon: MdSecurity },
    { id: 'notifications' as const, label: 'Notifications', icon: MdNotifications },
    { id: 'api' as const, label: 'API & Integration', icon: MdKey },
  ];

  if (preferencesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-[hsl(var(--border))] border-t-[hsl(var(--primary))] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen p-8 space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-[hsl(var(--foreground))] mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">
          Manage your account preferences and system settings
        </p>
      </div>

      {/* Settings Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="p-4 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left',
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-semibold">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="p-6 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
            {/* Account Settings */}
            {activeTab === 'account' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Account Settings</h2>
                  <p className="text-gray-600 dark:text-gray-400">Manage your account preferences</p>
                </div>

                <div className="space-y-6">
                  {/* Timezone */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <MdAccessTime className="w-4 h-4" /> Timezone
                    </label>
                    <select
                      value={accountSettings.timezone}
                      onChange={(e) => setAccountSettings({ ...accountSettings, timezone: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    >
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">Eastern Time (ET)</option>
                      <option value="America/Chicago">Central Time (CT)</option>
                      <option value="America/Denver">Mountain Time (MT)</option>
                      <option value="America/Los_Angeles">Pacific Time (PT)</option>
                      <option value="Europe/London">London (GMT)</option>
                      <option value="Europe/Paris">Paris (CET)</option>
                      <option value="Asia/Dubai">Dubai (GST)</option>
                      <option value="Asia/Singapore">Singapore (SGT)</option>
                      <option value="Asia/Kolkata">India (IST)</option>
                    </select>
                  </div>

                  {/* Language */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <MdLanguage className="w-4 h-4" /> Language
                    </label>
                    <select
                      value={accountSettings.language}
                      onChange={(e) => setAccountSettings({ ...accountSettings, language: e.target.value })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                      <option value="ar">Arabic</option>
                      <option value="hi">Hindi</option>
                    </select>
                  </div>

                  {/* Theme */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                      <MdPalette className="w-4 h-4" /> Theme
                    </label>
                    <select
                      value={accountSettings.theme}
                      onChange={(e) => setAccountSettings({ ...accountSettings, theme: e.target.value as any })}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="system">System Default</option>
                    </select>
                  </div>

                  <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
                    <button
                      onClick={handleSaveAccount}
                      disabled={savePreferencesMutation.isPending}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-semibold rounded-lg shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all flex items-center gap-2"
                    >
                      <MdSave className="w-5 h-5" />
                      {savePreferencesMutation.isPending ? 'Saving...' : 'Save Account Settings'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Security Settings</h2>
                  <p className="text-gray-600 dark:text-gray-400">Manage your password and security preferences</p>
                </div>

                <div className="space-y-6">
                  {/* Change Password */}
                  <div className="p-6 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <MdLock className="w-5 h-5" /> Change Password
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Current Password
                        </label>
                        <input
                          type="password"
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          className={cn(
                            'w-full px-4 py-3 rounded-lg border bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all',
                            passwordErrors.currentPassword
                              ? 'border-red-500 dark:border-red-500'
                              : 'border-gray-300 dark:border-slate-600'
                          )}
                          placeholder="Enter current password"
                        />
                        {passwordErrors.currentPassword && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                            <MdError className="w-4 h-4" /> {passwordErrors.currentPassword}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          New Password
                        </label>
                        <input
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          className={cn(
                            'w-full px-4 py-3 rounded-lg border bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all',
                            passwordErrors.newPassword
                              ? 'border-red-500 dark:border-red-500'
                              : 'border-gray-300 dark:border-slate-600'
                          )}
                          placeholder="Enter new password (min 8 characters)"
                        />
                        {passwordErrors.newPassword && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                            <MdError className="w-4 h-4" /> {passwordErrors.newPassword}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          className={cn(
                            'w-full px-4 py-3 rounded-lg border bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all',
                            passwordErrors.confirmPassword
                              ? 'border-red-500 dark:border-red-500'
                              : 'border-gray-300 dark:border-slate-600'
                          )}
                          placeholder="Confirm new password"
                        />
                        {passwordErrors.confirmPassword && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                            <MdError className="w-4 h-4" /> {passwordErrors.confirmPassword}
                          </p>
                        )}
                      </div>
                      <div className="pt-2">
                        <button
                          onClick={handleChangePassword}
                          disabled={changePasswordMutation.isPending}
                          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-semibold rounded-lg shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all flex items-center gap-2"
                        >
                          <MdLock className="w-5 h-5" />
                          {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Security Info */}
                  <div className="p-4 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30">
                    <div className="flex items-start gap-3">
                      <MdInfo className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                      <div className="text-sm text-blue-800 dark:text-blue-300">
                        <p className="font-semibold mb-1">Password Requirements:</p>
                        <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-400">
                          <li>Minimum 8 characters</li>
                          <li>Use a combination of letters, numbers, and special characters</li>
                          <li>Do not reuse your last 3 passwords</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Notification Settings</h2>
                  <p className="text-gray-600 dark:text-gray-400">Manage your notification preferences</p>
                </div>
                <div className="space-y-4">
                  {[
                    { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive notifications via email' },
                    { key: 'systemAlerts', label: 'System Alerts', description: 'Important system-wide alerts and updates' },
                    { key: 'licenseExpiryAlerts', label: 'License Expiry Alerts', description: 'Get notified when licenses are about to expire' },
                    { key: 'userActivityAlerts', label: 'User Activity Alerts', description: 'Notifications about user activities and changes' },
                    { key: 'onboardingAlerts', label: 'Onboarding Alerts', description: 'Notifications about new onboarding submissions' },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-start justify-between p-4 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50"
                    >
                      <div className="flex-1">
                        <label className="text-sm font-semibold text-gray-900 dark:text-white block mb-1">
                          {item.label}
                        </label>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{item.description}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer ml-4">
                        <input
                          type="checkbox"
                          checked={notificationSettings[item.key as keyof typeof notificationSettings]}
                          onChange={(e) =>
                            setNotificationSettings({
                              ...notificationSettings,
                              [item.key]: e.target.checked,
                            })
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  ))}
                  <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
                    <button
                      onClick={handleSaveNotifications}
                      disabled={savePreferencesMutation.isPending}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-semibold rounded-lg shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all flex items-center gap-2"
                    >
                      <MdSave className="w-5 h-5" />
                      {savePreferencesMutation.isPending ? 'Saving...' : 'Save Notification Settings'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* API & Integration */}
            {activeTab === 'api' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">API & Integration</h2>
                  <p className="text-gray-600 dark:text-gray-400">API documentation and integration information</p>
                </div>
                <div className="space-y-6">
                  <div className="p-6 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <MdKey className="w-5 h-5" /> API Information
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Base API URL
                        </label>
                        <div className="p-3 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800">
                          <code className="text-sm font-mono text-gray-900 dark:text-white">
                            {API_URL}/api/v1
                          </code>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Authentication
                        </label>
                        <div className="p-3 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800">
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            All API requests require a Bearer token in the Authorization header:
                          </p>
                          <code className="text-xs font-mono text-gray-600 dark:text-gray-400 block mt-2">
                            Authorization: Bearer {'<your-access-token>'}
                          </code>
                        </div>
                      </div>
                      <div className="pt-2">
                        <a
                          href="/api-docs"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                        >
                          <MdInfo className="w-4 h-4" />
                          View API Documentation →
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30">
                    <div className="flex items-start gap-3">
                      <MdInfo className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                      <div className="text-sm text-blue-800 dark:text-blue-300">
                        <p className="font-semibold mb-1">API Access:</p>
                        <p className="text-blue-700 dark:text-blue-400">
                          Your access token is automatically included in API requests. For programmatic access,
                          use the token from your browser's localStorage or generate a new one through the authentication endpoint.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
