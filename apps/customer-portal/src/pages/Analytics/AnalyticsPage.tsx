/**
 * Customer Portal - Reports & Analytics
 * Order & Delivery, Billing & Payments, Service Usage, Support & Feedback, Customer Experience
 */

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../components/shared/Toast';
import { OrderDeliveryReports } from './OrderDeliveryReports';
import { BillingPaymentsReports } from './BillingPaymentsReports';
import { ServiceUsageReports } from './ServiceUsageReports';
import { SupportFeedbackReports } from './SupportFeedbackReports';
import { CustomerExperienceDashboard } from './CustomerExperienceDashboard';
import {
  MdShoppingCart,
  MdPayment,
  MdSubscriptions,
  MdSupport,
  MdTrendingUp,
  MdRefresh,
  MdDownload,
} from 'react-icons/md';
import { cn } from '../../lib/utils';

const analyticsTabs = [
  { id: 'orders', label: 'Order & Delivery', icon: MdShoppingCart },
  { id: 'billing', label: 'Billing & Payments', icon: MdPayment },
  { id: 'usage', label: 'Service Usage', icon: MdSubscriptions },
  { id: 'support', label: 'Support & Feedback', icon: MdSupport },
  { id: 'experience', label: 'Customer Experience', icon: MdTrendingUp },
];

export function AnalyticsPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('orders');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    queryClient.invalidateQueries({ queryKey: ['analytics'] });
    setTimeout(() => {
      setIsRefreshing(false);
      showToast('Analytics data refreshed', 'success');
    }, 1000);
  };

  const handleExport = () => {
    showToast('Export functionality will be implemented soon', 'info');
  };

  const activeTabData = analyticsTabs.find((tab) => tab.id === activeTab);
  const ActiveIcon = activeTabData?.icon || MdShoppingCart;

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-1">Reports & Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400">Transparency into your activities, payments, and service usage</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] transition-colors text-sm font-medium text-[hsl(var(--foreground))] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MdRefresh className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
            Refresh
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-colors font-semibold text-sm shadow-lg shadow-blue-500/30"
          >
            <MdDownload className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[hsl(var(--border))]">
        <nav className="flex space-x-8 overflow-x-auto" aria-label="Tabs">
          {analyticsTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors',
                  isActive
                    ? 'border-blue-600 text-[hsl(var(--foreground))] font-semibold'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                )}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'orders' && <OrderDeliveryReports />}
        {activeTab === 'billing' && <BillingPaymentsReports />}
        {activeTab === 'usage' && <ServiceUsageReports />}
        {activeTab === 'support' && <SupportFeedbackReports />}
        {activeTab === 'experience' && <CustomerExperienceDashboard />}
      </div>
    </div>
  );
}


















