/**
 * Reports Page
 * Admin portal page to generate and export reports
 */

import React, { useState } from 'react';
import { useToast } from '../../components/shared/Toast';
import { MdDownload, MdDescription, MdBarChart, MdPeople, MdBusiness, MdVpnKey, MdTrendingUp } from 'react-icons/md';
import { cn } from '../../lib/utils';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: string;
}

const reportTemplates: ReportTemplate[] = [
  {
    id: 'org-summary',
    name: 'Organization Summary',
    description: 'Overview of all organizations with key metrics',
    icon: MdBusiness,
    category: 'Organizations',
  },
  {
    id: 'license-report',
    name: 'License Report',
    description: 'Detailed license status and expiration report',
    icon: MdVpnKey,
    category: 'Licenses',
  },
  {
    id: 'user-activity',
    name: 'User Activity Report',
    description: 'User login and activity statistics',
    icon: MdPeople,
    category: 'Users',
  },
  {
    id: 'analytics',
    name: 'Analytics Dashboard',
    description: 'Platform analytics and performance metrics',
    icon: MdTrendingUp,
    category: 'Analytics',
  },
];

export function ReportsPage() {
  const { showToast } = useToast();
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'csv' | 'excel'>('pdf');

  const handleGenerateReport = (reportId: string) => {
    setSelectedReport(reportId);
    showToast(`Generating ${reportId} report in ${exportFormat.toUpperCase()} format...`, 'info');
    // TODO: Implement report generation
  };

  const handleOpenReportBuilder = () => {
    showToast('Report builder will be implemented soon', 'info');
    // TODO: Implement report builder modal/page
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2 bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
            Reports
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">
            Generate and export reports from your platform data
          </p>
        </div>
      </div>

      {/* Export Format Selection */}
      <div className="p-6 rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 shadow-lg">
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Export Format:</span>
          <div className="flex gap-2">
            {(['pdf', 'csv', 'excel'] as const).map((format) => (
              <button
                key={format}
                onClick={() => setExportFormat(format)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  exportFormat === format
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                )}
              >
                {format.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Report Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportTemplates.map((template) => {
          const Icon = template.icon;
          return (
            <div
              key={template.id}
              className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-md">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                  {template.category}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {template.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {template.description}
              </p>
              <button
                onClick={() => handleGenerateReport(template.id)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-lg transition-colors font-semibold text-sm"
              >
                <MdDownload className="w-4 h-4" />
                Generate Report
              </button>
            </div>
          );
        })}
      </div>

      {/* Custom Report Builder */}
      <div className="p-6 rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-gray-800/50 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-md">
            <MdBarChart className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Custom Report Builder</h2>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Create custom reports by selecting specific data fields, filters, and date ranges.
        </p>
        <button
          onClick={handleOpenReportBuilder}
          className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors font-medium text-sm"
        >
          Open Report Builder
        </button>
      </div>
    </div>
  );
}

