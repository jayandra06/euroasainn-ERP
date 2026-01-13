/**
 * Branding Settings Page
 * Customize platform appearance
 */
import { useState, useEffect } from 'react';
import { useToast } from '../../components/shared/Toast';
import { authenticatedFetch } from '../../lib/api';
export function BrandingSettingsPage() {
    const { showToast } = useToast();
    const [platformName, setPlatformName] = useState('Enterprise ERP');
    const [logoUrl, setLogoUrl] = useState('');
    const [primaryColor, setPrimaryColor] = useState('#5C6268');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        fetchSettings();
    }, []);
    const fetchSettings = async () => {
        setIsLoading(true);
        try {
            const response = await authenticatedFetch('/api/v1/admin/settings/branding');
            if (!response.ok) {
                throw new Error('Failed to fetch branding settings');
            }
            const data = await response.json();
            if (data.success && data.data?.data) {
                setPlatformName(data.data.data.platformName || 'Enterprise ERP');
                setLogoUrl(data.data.data.logoUrl || '');
                setPrimaryColor(data.data.data.primaryColor || '#5C6268');
            }
        }
        catch (error) {
            console.error('Failed to fetch branding settings:', error);
            // Use defaults if fetch fails
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleSave = async () => {
        setIsSaving(true);
        try {
            const response = await authenticatedFetch('/api/v1/admin/settings/branding', {
                method: 'PUT',
                body: JSON.stringify({
                    data: {
                        platformName,
                        logoUrl,
                        primaryColor,
                    },
                }),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to save branding settings');
            }
            showToast('Branding settings saved successfully', 'success');
        }
        catch (error) {
            showToast(error.message || 'Failed to save branding settings', 'error');
        }
        finally {
            setIsSaving(false);
        }
    };
    return (<div className="space-y-6">
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
            <input type="text" id="platformName" value={platformName} onChange={(e) => setPlatformName(e.target.value)} className="w-full px-4 py-2.5 border border-[hsl(var(--border))] rounded-lg focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-colors text-[hsl(var(--foreground))] bg-[hsl(var(--card))]" placeholder="Enter platform name"/>
          </div>

          {/* Logo URL */}
          <div>
            <label htmlFor="logoUrl" className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
              Logo URL
            </label>
            <input type="url" id="logoUrl" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} className="w-full px-4 py-2.5 border border-[hsl(var(--border))] rounded-lg focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-colors text-[hsl(var(--foreground))] bg-[hsl(var(--card))]" placeholder="https://example.com/logo.png"/>
          </div>

          {/* Primary Color */}
          <div>
            <label htmlFor="primaryColor" className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
              Primary Color
            </label>
            <div className="flex items-center gap-4">
              <input type="color" id="primaryColor" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-16 h-12 border border-gray-300 rounded-lg cursor-pointer"/>
              <input type="text" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="flex-1 px-4 py-2.5 border border-[hsl(var(--border))] rounded-lg focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-colors text-[hsl(var(--foreground))] bg-[hsl(var(--card))] font-mono" placeholder="#5C6268"/>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8 pt-6 border-t border-[hsl(var(--border))]">
          <button onClick={handleSave} disabled={isSaving} className="px-6 py-2.5 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-semibold rounded-lg hover:bg-[hsl(var(--primary))]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {isSaving ? 'Saving...' : 'Save Branding'}
          </button>
        </div>
      </div>
    </div>);
}
//# sourceMappingURL=BrandingSettingsPage.js.map