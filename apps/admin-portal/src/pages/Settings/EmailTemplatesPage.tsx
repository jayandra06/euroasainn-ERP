/**
 * Email Templates Page
 * Customize automated emails
 */

import { useState, useEffect } from 'react';
import { useToast } from '../../components/shared/Toast';
import { authenticatedFetch } from '../../lib/api';

export function EmailTemplatesPage() {
  const { showToast } = useToast();
  const [welcomeEmail, setWelcomeEmail] = useState('Welcome to {platform_name}...');
  const [invoiceEmail, setInvoiceEmail] = useState('Your invoice for {month}...');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const response = await authenticatedFetch('/api/v1/admin/settings/email-templates');
      if (!response.ok) {
        throw new Error('Failed to fetch email templates');
      }
      const data = await response.json();
      if (data.success && data.data?.data) {
        setWelcomeEmail(data.data.data.welcomeEmail || 'Welcome to {platform_name}...');
        setInvoiceEmail(data.data.data.invoiceEmail || 'Your invoice for {month}...');
      }
    } catch (error: any) {
      console.error('Failed to fetch email templates:', error);
      // Use defaults if fetch fails
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await authenticatedFetch('/api/v1/admin/settings/email-templates', {
        method: 'PUT',
        body: JSON.stringify({
          data: {
            welcomeEmail,
            invoiceEmail,
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save email templates');
      }

      showToast('Email templates saved successfully', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to save email templates', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Email Templates Section */}
      <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] shadow-sm p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-[hsl(var(--foreground))] mb-1">Email Templates</h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Customize automated emails</p>
        </div>

        <div className="space-y-6">
          {/* Welcome Email Template */}
          <div>
            <label htmlFor="welcomeEmail" className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
              Welcome Email Template
            </label>
            <textarea
              id="welcomeEmail"
              value={welcomeEmail}
              onChange={(e) => setWelcomeEmail(e.target.value)}
              rows={8}
              className="w-full px-4 py-3 border border-[hsl(var(--border))] rounded-lg focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-colors text-[hsl(var(--foreground))] bg-[hsl(var(--card))] resize-y"
              placeholder="Welcome to {platform_name}..."
            />
            <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">
              Use <code className="px-1.5 py-0.5 bg-[hsl(var(--secondary))] rounded">{'{platform_name}'}</code> to insert the platform name
            </p>
          </div>

          {/* Invoice Email Template */}
          <div>
            <label htmlFor="invoiceEmail" className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
              Invoice Email Template
            </label>
            <textarea
              id="invoiceEmail"
              value={invoiceEmail}
              onChange={(e) => setInvoiceEmail(e.target.value)}
              rows={8}
              className="w-full px-4 py-3 border border-[hsl(var(--border))] rounded-lg focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-colors text-[hsl(var(--foreground))] bg-[hsl(var(--card))] resize-y"
              placeholder="Your invoice for {month}..."
            />
            <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">
              Use <code className="px-1.5 py-0.5 bg-[hsl(var(--secondary))] rounded">{'{month}'}</code> to insert the month
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8 pt-6 border-t border-[hsl(var(--border))]">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-semibold rounded-lg hover:bg-[hsl(var(--primary))]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Templates'}
          </button>
        </div>
      </div>
    </div>
  );
}

