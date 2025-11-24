/**
 * Regional Settings Page
 * Configure timezone and currency
 */

import { useState } from 'react';
import { useToast } from '../../components/shared/Toast';
import { MdKeyboardArrowDown } from 'react-icons/md';

const timezones = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Tokyo',
  'Australia/Sydney',
];

const currencies = [
  'USD',
  'EUR',
  'GBP',
  'INR',
  'JPY',
  'AUD',
  'CAD',
  'AED',
  'SGD',
  'CNY',
];

export function RegionalSettingsPage() {
  const { showToast } = useToast();
  const [defaultTimezone, setDefaultTimezone] = useState('UTC');
  const [defaultCurrency, setDefaultCurrency] = useState('USD');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // TODO: Implement API call to save regional settings
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
      showToast('Regional settings saved successfully', 'success');
    } catch (error) {
      showToast('Failed to save regional settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Regional Settings Section */}
      <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] shadow-sm p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-[hsl(var(--foreground))] mb-1">Regional Settings</h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Configure timezone and currency</p>
        </div>

        <div className="space-y-6">
          {/* Default Timezone */}
          <div>
            <label htmlFor="defaultTimezone" className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
              Default Timezone
            </label>
            <div className="relative">
              <select
                id="defaultTimezone"
                value={defaultTimezone}
                onChange={(e) => setDefaultTimezone(e.target.value)}
                className="w-full px-4 py-2.5 border border-[hsl(var(--border))] rounded-lg focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-colors text-[hsl(var(--foreground))] bg-[hsl(var(--card))] appearance-none cursor-pointer pr-10"
              >
                {timezones.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <MdKeyboardArrowDown className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
              </div>
            </div>
          </div>

          {/* Default Currency */}
          <div>
            <label htmlFor="defaultCurrency" className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
              Default Currency
            </label>
            <div className="relative">
              <select
                id="defaultCurrency"
                value={defaultCurrency}
                onChange={(e) => setDefaultCurrency(e.target.value)}
                className="w-full px-4 py-2.5 border border-[hsl(var(--border))] rounded-lg focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-colors text-[hsl(var(--foreground))] bg-[hsl(var(--card))] appearance-none cursor-pointer pr-10"
              >
                {currencies.map((curr) => (
                  <option key={curr} value={curr}>
                    {curr}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <MdKeyboardArrowDown className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8 pt-6 border-t border-[hsl(var(--border))]">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-semibold rounded-lg hover:bg-[hsl(var(--primary))]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Regional Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}

