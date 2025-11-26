/**
 * Branding Settings Page
 * Customize platform appearance
 */

import { useState } from 'react';
import { useToast } from '../../components/shared/Toast';

export function BrandingSettingsPage() {
  const { showToast } = useToast();
  const [platformName, setPlatformName] = useState('Enterprise ERP');
  const [logoUrl, setLogoUrl] = useState('https://example.com/logo.png');
  const [primaryColor, setPrimaryColor] = useState('#5C6268');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // TODO: Implement API call to save branding settings
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
      showToast('Branding settings saved successfully', 'success');
    } catch (error) {
      showToast('Failed to save branding settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Branding Section */}
      <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] shadow-sm p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-[hsl(var(--foreground))] mb-1">Branding</h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Customize your platform appearance</p>
        </div>

        <div className="space-y-6">
          {/* Platform Name */}
          <div>
            <label htmlFor="platformName" className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
              Platform Name
            </label>
            <input
              type="text"
              id="platformName"
              value={platformName}
              onChange={(e) => setPlatformName(e.target.value)}
              className="w-full px-4 py-2.5 border border-[hsl(var(--border))] rounded-lg focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-colors text-[hsl(var(--foreground))] bg-[hsl(var(--card))]"
              placeholder="Enter platform name"
            />
          </div>

          {/* Logo URL */}
          <div>
            <label htmlFor="logoUrl" className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
              Logo URL
            </label>
            <input
              type="url"
              id="logoUrl"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              className="w-full px-4 py-2.5 border border-[hsl(var(--border))] rounded-lg focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-colors text-[hsl(var(--foreground))] bg-[hsl(var(--card))]"
              placeholder="https://example.com/logo.png"
            />
          </div>

          {/* Primary Color */}
          <div>
            <label htmlFor="primaryColor" className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
              Primary Color
            </label>
            <div className="flex items-center gap-4">
              <input
                type="color"
                id="primaryColor"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="w-16 h-12 border border-gray-300 rounded-lg cursor-pointer"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="flex-1 px-4 py-2.5 border border-[hsl(var(--border))] rounded-lg focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-colors text-[hsl(var(--foreground))] bg-[hsl(var(--card))] font-mono"
                placeholder="#5C6268"
              />
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
            {isSaving ? 'Saving...' : 'Save Branding'}
          </button>
        </div>
      </div>
    </div>
  );
}

