/**
 * Tech Portal - Reports & Analytics
 * System Performance, Bug Tracking, Deployment, Usage, Security
 */

import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../components/shared/Toast';
import { SystemPerformanceDashboard } from './SystemPerformanceDashboard';
import { BugIssueTracking } from './BugIssueTracking';
import { DeploymentAnalytics } from './DeploymentAnalytics';
import { UsageAdoptionAnalytics } from './UsageAdoptionAnalytics';
import { SecurityReports } from './SecurityReports';
import {
  MdSpeed,
  MdBugReport,
  MdRocketLaunch,
  MdTrendingUp,
  MdSecurity,
  MdRefresh,
  MdDownload,
} from 'react-icons/md';
import { cn } from '../../lib/utils';

const analyticsTabs = [
  { id: 'performance', label: 'System Performance', icon: MdSpeed },
  { id: 'bugs', label: 'Bug & Issue Tracking', icon: MdBugReport },
  { id: 'deployment', label: 'Deployment Analytics', icon: MdRocketLaunch },
  { id: 'usage', label: 'Usage & Adoption', icon: MdTrendingUp },
  { id: 'security', label: 'Security Reports', icon: MdSecurity },
];

export function AnalyticsPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('performance');
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
    // TODO: Implement export functionality
  };

  const activeTabData = analyticsTabs.find((tab) => tab.id === activeTab);
  const ActiveIcon = activeTabData?.icon || MdSpeed;

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-1">Reports & Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400">Infrastructure health, issue resolution, and performance metrics</p>
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
        {activeTab === 'performance' && <SystemPerformanceDashboard />}
        {activeTab === 'bugs' && <BugIssueTracking />}
        {activeTab === 'deployment' && <DeploymentAnalytics />}
        {activeTab === 'usage' && <UsageAdoptionAnalytics />}
        {activeTab === 'security' && <SecurityReports />}
      </div>
    </div>
  );
}




