/**
 * System & Application Analytics Page
 * Server uptime, API metrics, feature usage, failed jobs, integrations health
 */
import { useState } from 'react';
import { useToast } from '../../components/shared/Toast';
import { MdServer, MdSpeed, MdError, MdCheckCircle, MdWarning, MdCloud, MdRefresh, MdDownload, } from 'react-icons/md';
import { ResponsiveContainer, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, } from 'recharts';
// Mock data
const uptimeData = [
    { date: 'Jan 1', uptime: 99.8, downtime: 0.2 },
    { date: 'Jan 8', uptime: 99.9, downtime: 0.1 },
    { date: 'Jan 15', uptime: 99.7, downtime: 0.3 },
    { date: 'Jan 22', uptime: 100, downtime: 0 },
    { date: 'Jan 29', uptime: 99.9, downtime: 0.1 },
    { date: 'Feb 5', uptime: 99.8, downtime: 0.2 },
];
const downtimeAlerts = [
    { date: '2024-01-15', duration: '18 minutes', reason: 'Database maintenance', status: 'resolved' },
    { date: '2024-01-20', duration: '5 minutes', reason: 'Network connectivity issue', status: 'resolved' },
    { date: '2024-02-01', duration: '2 minutes', reason: 'Scheduled update', status: 'resolved' },
];
const apiResponseTimeData = [
    { endpoint: '/api/users', avgTime: 45, p95: 120, errors: 2 },
    { endpoint: '/api/organizations', avgTime: 65, p95: 180, errors: 1 },
    { endpoint: '/api/licenses', avgTime: 55, p95: 150, errors: 0 },
    { endpoint: '/api/reports', avgTime: 120, p95: 300, errors: 3 },
    { endpoint: '/api/analytics', avgTime: 85, p95: 200, errors: 1 },
];
const errorCodesData = [
    { code: '200', count: 12500, percentage: 98.5 },
    { code: '400', count: 120, percentage: 0.9 },
    { code: '401', count: 45, percentage: 0.4 },
    { code: '404', count: 30, percentage: 0.2 },
    { code: '500', count: 5, percentage: 0.04 },
];
const featureUsageData = [
    { feature: 'Dashboard', usage: 95, users: 450 },
    { feature: 'Organizations', usage: 78, users: 320 },
    { feature: 'Reports', usage: 65, users: 280 },
    { feature: 'Analytics', usage: 55, users: 250 },
    { feature: 'Settings', usage: 45, users: 180 },
];
const failedJobsData = [
    { job: 'Email Sending', failures: 5, lastFailure: '2024-02-10 14:30', status: 'warning' },
    { job: 'Data Backup', failures: 0, lastFailure: 'N/A', status: 'success' },
    { job: 'Report Generation', failures: 2, lastFailure: '2024-02-09 10:15', status: 'warning' },
    { job: 'Cache Refresh', failures: 0, lastFailure: 'N/A', status: 'success' },
];
const integrationsHealth = [
    { service: 'Email Service', status: 'healthy', uptime: 99.9, lastCheck: '2024-02-10 15:00' },
    { service: 'Redis Cache', status: 'healthy', uptime: 100, lastCheck: '2024-02-10 15:00' },
    { service: 'Database', status: 'healthy', uptime: 99.95, lastCheck: '2024-02-10 15:00' },
    { service: 'Payment Gateway', status: 'degraded', uptime: 98.5, lastCheck: '2024-02-10 14:45' },
    { service: 'SMS Service', status: 'healthy', uptime: 99.8, lastCheck: '2024-02-10 15:00' },
];
export function SystemAnalyticsPage() {
    const { showToast } = useToast();
    const [timeRange, setTimeRange] = useState('week');
    const handleRefresh = () => {
        showToast('Refreshing system analytics...', 'info');
        // TODO: Implement refresh functionality
    };
    const handleExport = (format) => {
        showToast(`Exporting system analytics as ${format.toUpperCase()}...`, 'info');
        // TODO: Implement export functionality
    };
    const getStatusColor = (status) => {
        switch (status) {
            case 'healthy':
                return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20';
            case 'degraded':
                return 'text-orange-600 bg-orange-50 dark:bg-orange-950/20';
            case 'down':
                return 'text-red-600 bg-[hsl(var(--destructive))]/10';
            default:
                return 'text-gray-600 bg-[hsl(var(--secondary))]';
        }
    };
    return (<div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-1">System & Application Analytics</h1>
          <p className="text-[hsl(var(--muted-foreground))]">Server performance, API metrics, and system health</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} className="px-4 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] text-sm">
            <option value="day">Last 24 Hours</option>
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
          </select>
          <button onClick={handleRefresh} className="flex items-center gap-2 px-4 py-2 bg-[hsl(var(--secondary))] hover:bg-gray-200 dark:hover:bg-gray-700 text-[hsl(var(--foreground))] rounded-lg transition-colors font-medium text-sm">
            <MdRefresh className="w-4 h-4"/>
            Refresh
          </button>
          <button onClick={() => handleExport('pdf')} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-colors font-semibold text-sm">
            <MdDownload className="w-4 h-4"/>
            Export
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Server Uptime</p>
            <MdServer className="w-5 h-5 text-emerald-600"/>
          </div>
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]">99.87%</p>
          <p className="text-xs text-emerald-600 mt-1">Last 30 days</p>
        </div>

        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Avg API Response Time</p>
            <MdSpeed className="w-5 h-5 text-blue-600"/>
          </div>
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]">68ms</p>
          <p className="text-xs text-emerald-600 mt-1">-12% from last week</p>
        </div>

        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Error Rate</p>
            <MdError className="w-5 h-5 text-red-600"/>
          </div>
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]">0.15%</p>
          <p className="text-xs text-emerald-600 mt-1">-0.05% from last week</p>
        </div>

        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Active Integrations</p>
            <MdCloud className="w-5 h-5 text-purple-600"/>
          </div>
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]">5/5</p>
          <p className="text-xs text-emerald-600 mt-1">All operational</p>
        </div>
      </div>

      {/* Server Uptime Chart */}
      <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">Server Uptime %</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Uptime tracking over time with downtime alerts</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={uptimeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb"/>
            <XAxis dataKey="date" stroke="#6b7280"/>
            <YAxis domain={[99, 100.5]} stroke="#6b7280"/>
            <Tooltip />
            <Area type="monotone" dataKey="uptime" stroke="#10b981" fill="#10b981" fillOpacity={0.3} name="Uptime %"/>
            <Area type="monotone" dataKey="downtime" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} name="Downtime %"/>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Downtime Alerts */}
      <div className="p-6 rounded-xl border border-red-200 dark:border-red-800 bg-[hsl(var(--destructive))]/10 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <MdWarning className="w-6 h-6 text-red-600"/>
          <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">Downtime Alerts & Incidents</h3>
        </div>
        <div className="space-y-3">
          {downtimeAlerts.map((alert, index) => (<div key={index} className="p-4 rounded-lg bg-[hsl(var(--card))] border border-red-200 dark:border-red-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-[hsl(var(--foreground))]">{alert.date}</p>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    Duration: {alert.duration} | Reason: {alert.reason}
                  </p>
                </div>
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 dark:bg-emerald-900 text-[hsl(var(--foreground))] font-semibold">
                  {alert.status}
                </span>
              </div>
            </div>))}
        </div>
      </div>

      {/* API Response Times */}
      <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">API Response Times</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Average and P95 response times by endpoint</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={apiResponseTimeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb"/>
            <XAxis dataKey="endpoint" stroke="#6b7280" angle={-45} textAnchor="end" height={100}/>
            <YAxis stroke="#6b7280"/>
            <Tooltip />
            <Legend />
            <Bar dataKey="avgTime" fill="#3b82f6" name="Avg Time (ms)"/>
            <Bar dataKey="p95" fill="#8b5cf6" name="P95 (ms)"/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Error Codes Distribution */}
      <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">HTTP Error Codes Distribution</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Response code breakdown</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {errorCodesData.map((error, index) => (<div key={index} className="p-4 rounded-lg bg-[hsl(var(--secondary))] text-center">
              <p className="text-2xl font-bold text-[hsl(var(--foreground))] mb-1">{error.code}</p>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mb-2">{error.count.toLocaleString()}</p>
              <p className="text-xs font-medium text-[hsl(var(--muted-foreground))]">{error.percentage}%</p>
            </div>))}
        </div>
      </div>

      {/* Feature Usage Metrics */}
      <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">Feature Usage Metrics</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Most used features and modules</p>
          </div>
        </div>
        <div className="space-y-4">
          {featureUsageData.map((feature, index) => (<div key={index} className="p-4 rounded-lg bg-[hsl(var(--secondary))]">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-[hsl(var(--foreground))]">{feature.feature}</h4>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-[hsl(var(--muted-foreground))]">
                    Usage: <span className="font-medium text-[hsl(var(--foreground))]">{feature.usage}%</span>
                  </span>
                  <span className="text-[hsl(var(--muted-foreground))]">
                    Users: <span className="font-medium text-[hsl(var(--foreground))]">{feature.users}</span>
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600" style={{ width: `${feature.usage}%` }}/>
              </div>
            </div>))}
        </div>
      </div>

      {/* Failed Jobs Summary */}
      <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">Background Jobs Summary</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Failed jobs and background tasks</p>
          </div>
        </div>
        <div className="space-y-3">
          {failedJobsData.map((job, index) => (<div key={index} className="p-4 rounded-lg bg-[hsl(var(--secondary))]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {job.status === 'success' ? (<MdCheckCircle className="w-5 h-5 text-emerald-600"/>) : (<MdWarning className="w-5 h-5 text-orange-600"/>)}
                  <div>
                    <p className="font-semibold text-[hsl(var(--foreground))]">{job.job}</p>
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">
                      Failures: {job.failures} | Last: {job.lastFailure}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${job.status === 'success'
                ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300'
                : 'bg-orange-100 dark:bg-orange-900 text-[hsl(var(--foreground))] font-semibold'}`}>
                  {job.status === 'success' ? 'Healthy' : 'Warning'}
                </span>
              </div>
            </div>))}
        </div>
      </div>

      {/* Integrations Health */}
      <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">Integrations Health</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Third-party services and integrations status</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {integrationsHealth.map((integration, index) => (<div key={index} className="p-4 rounded-lg bg-[hsl(var(--secondary))]">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-[hsl(var(--foreground))]">{integration.service}</h4>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(integration.status)}`}>
                  {integration.status}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[hsl(var(--muted-foreground))]">Uptime:</span>
                  <span className="font-medium text-[hsl(var(--foreground))]">{integration.uptime}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[hsl(var(--muted-foreground))]">Last Check:</span>
                  <span className="font-medium text-[hsl(var(--foreground))]">{integration.lastCheck}</span>
                </div>
              </div>
            </div>))}
        </div>
      </div>
    </div>);
}
//# sourceMappingURL=SystemAnalyticsPage.js.map