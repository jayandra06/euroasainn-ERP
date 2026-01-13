/**
 * SMS Templates Page
 * Configure SMS notifications
 */
import { useState, useEffect } from 'react';
import { useToast } from '../../components/shared/Toast';
import { authenticatedFetch } from '../../lib/api';
export function SMSTemplatesPage() {
    const { showToast } = useToast();
    const [verificationSMS, setVerificationSMS] = useState('Your verification code is {code}');
    const [alertSMS, setAlertSMS] = useState('Important alert: {message}');
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        fetchSettings();
    }, []);
    const fetchSettings = async () => {
        setIsLoading(true);
        try {
            const response = await authenticatedFetch('/api/v1/admin/settings/sms-templates');
            if (!response.ok) {
                throw new Error('Failed to fetch SMS templates');
            }
            const data = await response.json();
            if (data.success && data.data?.data) {
                setVerificationSMS(data.data.data.verificationSMS || 'Your verification code is {code}');
                setAlertSMS(data.data.data.alertSMS || 'Important alert: {message}');
            }
        }
        catch (error) {
            console.error('Failed to fetch SMS templates:', error);
            // Use defaults if fetch fails
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleSave = async () => {
        setIsSaving(true);
        try {
            const response = await authenticatedFetch('/api/v1/admin/settings/sms-templates', {
                method: 'PUT',
                body: JSON.stringify({
                    data: {
                        verificationSMS,
                        alertSMS,
                    },
                }),
            });
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to save SMS templates');
            }
            showToast('SMS templates saved successfully', 'success');
        }
        catch (error) {
            showToast(error.message || 'Failed to save SMS templates', 'error');
        }
        finally {
            setIsSaving(false);
        }
    };
    return (<div className="space-y-6">
      {/* SMS Templates Section */}
      <div className="bg-[hsl(var(--card))] rounded-xl border border-[hsl(var(--border))] shadow-sm p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-[hsl(var(--foreground))] mb-1">SMS Templates</h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">Configure SMS notifications</p>
        </div>

        <div className="space-y-6">
          {/* Verification SMS */}
          <div>
            <label htmlFor="verificationSMS" className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
              Verification SMS
            </label>
            <textarea id="verificationSMS" value={verificationSMS} onChange={(e) => setVerificationSMS(e.target.value)} rows={4} className="w-full px-4 py-3 border border-[hsl(var(--border))] rounded-lg focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-colors text-[hsl(var(--foreground))] bg-[hsl(var(--card))] resize-y" placeholder="Your verification code is {code}"/>
            <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">
              Use <code className="px-1.5 py-0.5 bg-[hsl(var(--secondary))] rounded">{'{code}'}</code> to insert the verification code
            </p>
          </div>

          {/* Alert SMS */}
          <div>
            <label htmlFor="alertSMS" className="block text-sm font-semibold text-[hsl(var(--foreground))] mb-2">
              Alert SMS
            </label>
            <textarea id="alertSMS" value={alertSMS} onChange={(e) => setAlertSMS(e.target.value)} rows={4} className="w-full px-4 py-3 border border-[hsl(var(--border))] rounded-lg focus:ring-2 focus:ring-[hsl(var(--primary))] focus:border-[hsl(var(--primary))] transition-colors text-[hsl(var(--foreground))] bg-[hsl(var(--card))] resize-y" placeholder="Important alert: {message}"/>
            <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">
              Use <code className="px-1.5 py-0.5 bg-[hsl(var(--secondary))] rounded">{'{message}'}</code> to insert the alert message
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-8 pt-6 border-t border-[hsl(var(--border))]">
          <button onClick={handleSave} disabled={isSaving} className="px-6 py-2.5 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-semibold rounded-lg hover:bg-[hsl(var(--primary))]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {isSaving ? 'Saving...' : 'Save SMS Templates'}
          </button>
        </div>
      </div>
    </div>);
}
//# sourceMappingURL=SMSTemplatesPage.js.map