/**
 * Platform Settings Page
 * Main settings page with navigation to all settings sections
 */
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BrandingSettingsPage } from './BrandingSettingsPage';
import { RegionalSettingsPage } from './RegionalSettingsPage';
import { EmailTemplatesPage } from './EmailTemplatesPage';
import { SMSTemplatesPage } from './SMSTemplatesPage';
import { MdPalette, MdTranslate, MdEmail, MdSms } from 'react-icons/md';
export function PlatformSettingsPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState('branding');
    // Sync active tab with URL
    useEffect(() => {
        if (location.pathname === '/settings' || location.pathname === '/settings/') {
            navigate('/settings/branding', { replace: true });
        }
        else if (location.pathname.includes('/settings/branding')) {
            setActiveTab('branding');
        }
        else if (location.pathname.includes('/settings/regional')) {
            setActiveTab('regional');
        }
        else if (location.pathname.includes('/settings/email-templates')) {
            setActiveTab('email');
        }
        else if (location.pathname.includes('/settings/sms-templates')) {
            setActiveTab('sms');
        }
    }, [location.pathname, navigate]);
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        const paths = {
            branding: '/settings/branding',
            regional: '/settings/regional',
            email: '/settings/email-templates',
            sms: '/settings/sms-templates',
        };
        navigate(paths[tab]);
    };
    const tabs = [
        { id: 'branding', label: 'Branding', icon: MdPalette },
        { id: 'regional', label: 'Regional Settings', icon: MdTranslate },
        { id: 'email', label: 'Email Templates', icon: MdEmail },
        { id: 'sms', label: 'SMS Templates', icon: MdSms },
    ];
    return (<div className="w-full space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-1">Platform Settings</h1>
        <p className="text-[hsl(var(--muted-foreground))]">Configure global platform settings</p>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-[hsl(var(--border))] mb-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (<button key={tab.id} onClick={() => handleTabChange(tab.id)} className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                    ? 'border-[hsl(var(--primary))] text-[hsl(var(--primary))]'
                    : 'border-transparent text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:border-[hsl(var(--border))]'}`}>
                <Icon className="w-5 h-5"/>
                <span>{tab.label}</span>
              </button>);
        })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'branding' && <BrandingSettingsPage />}
        {activeTab === 'regional' && <RegionalSettingsPage />}
        {activeTab === 'email' && <EmailTemplatesPage />}
        {activeTab === 'sms' && <SMSTemplatesPage />}
      </div>
    </div>);
}
//# sourceMappingURL=PlatformSettingsPage.js.map