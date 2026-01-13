/**
 * Reports Page
 * Admin portal page to generate and export reports
 */
import React, { useState } from 'react';
import { useToast } from '../../components/shared/Toast';
import { MdDownload, MdBarChart, MdPeople, MdBusiness, MdVpnKey, MdTrendingUp } from 'react-icons/md';
import { cn } from '../../lib/utils';
const reportTemplates = [
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
    const [selectedReport, setSelectedReport] = useState(null);
    const [exportFormat, setExportFormat] = useState('pdf');
    const handleGenerateReport = (reportId) => {
        setSelectedReport(reportId);
        showToast(`Generating ${reportId} report in ${exportFormat.toUpperCase()} format...`, 'info');
        // TODO: Implement report generation
    };
    const handleOpenReportBuilder = () => {
        showToast('Report builder will be implemented soon', 'info');
        // TODO: Implement report builder modal/page
    };
    return (<div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-4xl font-bold text-[hsl(var(--foreground))] mb-2 bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
            Reports
          </h1>
          <p className="text-lg text-[hsl(var(--muted-foreground))] font-medium">
            Generate and export reports from your platform data
          </p>
        </div>
      </div>

      {/* Export Format Selection */}
      <div className="p-6 rounded-2xl bg-[hsl(var(--card))]/80 backdrop-blur-xl border border-[hsl(var(--border))]/50 shadow-lg">
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-[hsl(var(--foreground))]">Export Format:</span>
          <div className="flex gap-2">
            {['pdf', 'csv', 'excel'].map((format) => (<button key={format} onClick={() => setExportFormat(format)} className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-colors', exportFormat === format
                ? 'bg-orange-600 text-white'
                : 'bg-[hsl(var(--secondary))] text-[hsl(var(--foreground))] hover:bg-gray-200 dark:hover:bg-gray-700')}>
                {format.toUpperCase()}
              </button>))}
          </div>
        </div>
      </div>

      {/* Report Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportTemplates.map((template) => {
            const Icon = template.icon;
            return (<div key={template.id} className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-md">
                  <Icon className="w-6 h-6 text-white"/>
                </div>
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-[hsl(var(--secondary))] text-[hsl(var(--muted-foreground))]">
                  {template.category}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-2">
                {template.name}
              </h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mb-4">
                {template.description}
              </p>
              <button onClick={() => handleGenerateReport(template.id)} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-lg transition-colors font-semibold text-sm">
                <MdDownload className="w-4 h-4"/>
                Generate Report
              </button>
            </div>);
        })}
      </div>

      {/* Custom Report Builder */}
      <div className="p-6 rounded-2xl bg-[hsl(var(--card))]/80 backdrop-blur-xl border border-[hsl(var(--border))]/50 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-md">
            <MdBarChart className="w-5 h-5 text-white"/>
          </div>
          <h2 className="text-xl font-semibold text-[hsl(var(--foreground))]">Custom Report Builder</h2>
        </div>
        <p className="text-[hsl(var(--muted-foreground))] mb-4">
          Create custom reports by selecting specific data fields, filters, and date ranges.
        </p>
        <button onClick={handleOpenReportBuilder} className="px-4 py-2 bg-[hsl(var(--secondary))] hover:bg-gray-200 dark:hover:bg-gray-700 text-[hsl(var(--foreground))] rounded-lg transition-colors font-medium text-sm">
          Open Report Builder
        </button>
      </div>
    </div>);
}
//# sourceMappingURL=ReportsPage.js.map