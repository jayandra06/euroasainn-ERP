/**
 * Polished Modern Settings Page
 * Professional Enterprise Dashboard - Fixed Layout & Spacing
 */

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  MdSettings,
  MdSecurity,
  MdNotifications,
  MdKey,
  MdSave,
} from 'react-icons/md';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/button';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'notifications' | 'api'>('general');

  // General settings form
  const [generalSettings, setGeneralSettings] = useState({
    platformName: 'Euroasiann ERP',
    timezone: 'UTC',
    dateFormat: 'YYYY-MM-DD',
    language: 'en',
    theme: 'light',
  });

  // Security settings form
  const [securitySettings, setSecuritySettings] = useState({
    passwordMinLength: 8,
    requireTwoFactor: false,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    lockoutDuration: 15,
  });

  // Notification settings form
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    systemAlerts: true,
    licenseExpiryAlerts: true,
    userActivityAlerts: false,
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async (settings: any) => {
      // In a real app, this would save to backend
      console.log('Saving settings:', settings);
      return new Promise((resolve) => setTimeout(resolve, 1000));
    },
    onSuccess: () => {
      alert('Settings saved successfully!');
    },
    onError: (error: Error) => {
      alert(`Failed to save settings: ${error.message}`);
    },
  });

  const handleSave = (type: string) => {
    let settings: any = {};
    switch (type) {
      case 'general':
        settings = generalSettings;
        break;
      case 'security':
        settings = securitySettings;
        break;
      case 'notifications':
        settings = notificationSettings;
        break;
    }
    saveSettingsMutation.mutate({ type, ...settings });
  };

  const tabs = [
    { id: 'general' as const, label: 'General', icon: MdSettings },
    { id: 'security' as const, label: 'Security', icon: MdSecurity },
    { id: 'notifications' as const, label: 'Notifications', icon: MdNotifications },
    { id: 'api' as const, label: 'API Keys', icon: MdKey },
  ];

  return (
    <div className="w-full min-h-screen p-8 space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-[hsl(var(--foreground))] mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">
          Manage platform and system settings
        </p>
      </div>

      {/* Settings Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="p-4 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-left',
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/30'
                      : 'text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]/50'
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
          <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
            {/* General Settings */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-[hsl(var(--foreground))] mb-1">General Settings</h2>
                  <p className="text-gray-600 dark:text-gray-400">Configure platform-wide settings</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
                      Platform Name
                    </label>
                    <input
                      type="text"
                      value={generalSettings.platformName}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, platformName: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-sm focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-all duration-200"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
                        Timezone
                      </label>
                      <select
                        value={generalSettings.timezone}
                        onChange={(e) => setGeneralSettings({ ...generalSettings, timezone: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-sm focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-all duration-200"
                      >
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">Eastern Time</option>
                        <option value="America/Chicago">Central Time</option>
                        <option value="America/Denver">Mountain Time</option>
                        <option value="America/Los_Angeles">Pacific Time</option>
                        <option value="Europe/London">London</option>
                        <option value="Asia/Dubai">Dubai</option>
                        <option value="Asia/Singapore">Singapore</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
                        Date Format
                      </label>
                      <select
                        value={generalSettings.dateFormat}
                        onChange={(e) => setGeneralSettings({ ...generalSettings, dateFormat: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-sm focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-all duration-200"
                      >
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="DD-MM-YYYY">DD-MM-YYYY</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
                        Language
                      </label>
                      <select
                        value={generalSettings.language}
                        onChange={(e) => setGeneralSettings({ ...generalSettings, language: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-sm focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-all duration-200"
                      >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                        <option value="ar">Arabic</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
                        Theme
                      </label>
                      <select
                        value={generalSettings.theme}
                        onChange={(e) => setGeneralSettings({ ...generalSettings, theme: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-sm focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-all duration-200"
                      >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="auto">Auto</option>
                      </select>
                    </div>
                  </div>
                  <div className="pt-4">
                    <Button
                      onClick={() => handleSave('general')}
                      disabled={saveSettingsMutation.isPending}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40"
                    >
                      <MdSave className="w-5 h-5" /> {saveSettingsMutation.isPending ? 'Saving...' : 'Save General Settings'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Security Settings */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-[hsl(var(--foreground))] mb-1">Security Settings</h2>
                  <p className="text-gray-600 dark:text-gray-400">Configure security and authentication settings</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
                      Minimum Password Length
                    </label>
                    <input
                      type="number"
                      min="6"
                      max="32"
                      value={securitySettings.passwordMinLength}
                      onChange={(e) =>
                        setSecuritySettings({
                          ...securitySettings,
                          passwordMinLength: parseInt(e.target.value) || 8,
                        })
                      }
                      className="w-full px-4 py-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-sm focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-all duration-200"
                    />
                  </div>
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-[hsl(var(--secondary))]/50 border border-[hsl(var(--border))]">
                    <input
                      type="checkbox"
                      checked={securitySettings.requireTwoFactor}
                      onChange={(e) =>
                        setSecuritySettings({
                          ...securitySettings,
                          requireTwoFactor: e.target.checked,
                        })
                      }
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-[hsl(var(--primary))]"
                    />
                    <label className="text-sm font-semibold text-[hsl(var(--foreground))]">
                      Require Two-Factor Authentication
                    </label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
                        Session Timeout (minutes)
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="480"
                        value={securitySettings.sessionTimeout}
                        onChange={(e) =>
                          setSecuritySettings({
                            ...securitySettings,
                            sessionTimeout: parseInt(e.target.value) || 30,
                          })
                        }
                        className="w-full px-4 py-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-sm focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-all duration-200"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
                        Max Login Attempts
                      </label>
                      <input
                        type="number"
                        min="3"
                        max="10"
                        value={securitySettings.maxLoginAttempts}
                        onChange={(e) =>
                          setSecuritySettings({
                            ...securitySettings,
                            maxLoginAttempts: parseInt(e.target.value) || 5,
                          })
                        }
                        className="w-full px-4 py-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-sm focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-all duration-200"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
                      Account Lockout Duration (minutes)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="60"
                      value={securitySettings.lockoutDuration}
                      onChange={(e) =>
                        setSecuritySettings({
                          ...securitySettings,
                          lockoutDuration: parseInt(e.target.value) || 15,
                        })
                      }
                      className="w-full px-4 py-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-sm focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-all duration-200"
                    />
                  </div>
                  <div className="pt-4">
                    <Button
                      onClick={() => handleSave('security')}
                      disabled={saveSettingsMutation.isPending}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40"
                    >
                      <MdSave className="w-5 h-5" /> {saveSettingsMutation.isPending ? 'Saving...' : 'Save Security Settings'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Notification Settings */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-[hsl(var(--foreground))] mb-1">Notification Settings</h2>
                  <p className="text-gray-600 dark:text-gray-400">Manage notification preferences</p>
                </div>
                <div className="space-y-4">
                  {[
                    { key: 'emailNotifications', label: 'Enable Email Notifications' },
                    { key: 'systemAlerts', label: 'System Alerts' },
                    { key: 'licenseExpiryAlerts', label: 'License Expiry Alerts' },
                    { key: 'userActivityAlerts', label: 'User Activity Alerts' },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center gap-3 p-4 rounded-xl bg-[hsl(var(--secondary))]/50 border border-[hsl(var(--border))]"
                    >
                      <input
                        type="checkbox"
                        checked={notificationSettings[item.key as keyof typeof notificationSettings]}
                        onChange={(e) =>
                          setNotificationSettings({
                            ...notificationSettings,
                            [item.key]: e.target.checked,
                          })
                        }
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-[hsl(var(--primary))]"
                      />
                      <label className="text-sm font-semibold text-[hsl(var(--foreground))]">
                        {item.label}
                      </label>
                    </div>
                  ))}
                  <div className="pt-4">
                    <Button
                      onClick={() => handleSave('notifications')}
                      disabled={saveSettingsMutation.isPending}
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40"
                    >
                      <MdSave className="w-5 h-5" /> {saveSettingsMutation.isPending ? 'Saving...' : 'Save Notification Settings'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* API Keys */}
            {activeTab === 'api' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-[hsl(var(--foreground))] mb-1">API Keys</h2>
                  <p className="text-gray-600 dark:text-gray-400">Manage API keys for programmatic access</p>
                </div>
                <div className="p-6 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200/50 dark:border-blue-800/50 space-y-4">
                  <p className="text-sm text-[hsl(var(--foreground))]">
                    API keys allow external systems to interact with the platform programmatically.
                  </p>
                  <div className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
                    <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))] mb-2">Base API URL</p>
                    <code className="text-sm font-mono text-[hsl(var(--foreground))]">{API_URL}/api/v1</code>
                  </div>
                  <div className="pt-2">
                    <a
                      href="/api-docs"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-semibold text-[hsl(var(--foreground))] font-semibold hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                    >
                      View API Documentation →
                    </a>
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
