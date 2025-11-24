/**
 * Bug & Issue Tracking
 * Total issues by status, MTTR, SLA compliance, module bugs, developer performance
 */

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  MdBugReport,
  MdCheckCircle,
  MdSchedule,
  MdWarning,
  MdTrendingUp,
  MdPerson,
} from 'react-icons/md';

// Mock data
const issueStatusData = [
  { status: 'Open', count: 0, color: '#ef4444' },
  { status: 'In Progress', count: 0, color: '#f59e0b' },
  { status: 'Closed', count: 0, color: '#10b981' },
  { status: 'On Hold', count: 0, color: '#6b7280' },
];

const mttrData = [
  { month: 'Jan', mttr: 0 },
  { month: 'Feb', mttr: 0 },
  { month: 'Mar', mttr: 0 },
  { month: 'Apr', mttr: 0 },
  { month: 'May', mttr: 0 },
  { month: 'Jun', mttr: 0 },
];

const slaComplianceData = [
  { month: 'Jan', compliance: 0 },
  { month: 'Feb', compliance: 0 },
  { month: 'Mar', compliance: 0 },
  { month: 'Apr', compliance: 0 },
  { month: 'May', compliance: 0 },
  { month: 'Jun', compliance: 0 },
];

const moduleBugsData = [
  { module: 'Authentication', bugs: 0, critical: 0, high: 0, medium: 0 },
  { module: 'Payment Gateway', bugs: 0, critical: 0, high: 0, medium: 0 },
  { module: 'User Management', bugs: 0, critical: 0, high: 0, medium: 0 },
  { module: 'Reporting', bugs: 0, critical: 0, high: 0, medium: 0 },
  { module: 'Notifications', bugs: 0, critical: 0, high: 0, medium: 0 },
];

const developerPerformance = [
  { developer: 'John Doe', issuesClosed: 0, avgResolutionTime: 0, criticalBugs: 0 },
  { developer: 'Jane Smith', issuesClosed: 0, avgResolutionTime: 0, criticalBugs: 0 },
  { developer: 'Mike Johnson', issuesClosed: 0, avgResolutionTime: 0, criticalBugs: 0 },
  { developer: 'Sarah Williams', issuesClosed: 0, avgResolutionTime: 0, criticalBugs: 0 },
  { developer: 'David Brown', issuesClosed: 0, avgResolutionTime: 0, criticalBugs: 0 },
];

export function BugIssueTracking() {
  const totalIssues = issueStatusData.reduce((sum, item) => sum + item.count, 0);
  const avgMTTR = (mttrData.reduce((sum, item) => sum + item.mttr, 0) / mttrData.length).toFixed(1);
  const currentSLA = slaComplianceData[slaComplianceData.length - 1]?.compliance || 0;

  return (
    <div className="w-full space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Issues</p>
            <MdBugReport className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{totalIssues}</p>
          <p className="text-xs text-[hsl(var(--foreground))] font-semibold mt-1">No data available</p>
        </div>

        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg MTTR</p>
            <MdSchedule className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{avgMTTR} days</p>
          <p className="text-xs text-[hsl(var(--foreground))] font-semibold mt-1">No data available</p>
        </div>

        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">SLA Compliance</p>
            <MdCheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{currentSLA}%</p>
          <p className="text-xs text-[hsl(var(--foreground))] font-semibold mt-1">No data available</p>
        </div>

        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Open Issues</p>
            <MdWarning className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]">
            {issueStatusData.find((s) => s.status === 'Open')?.count || 0}
          </p>
          <p className="text-xs text-[hsl(var(--foreground))] font-semibold mt-1">Requires attention</p>
        </div>
      </div>

      {/* Issues by Status */}
      <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">Total Issues by Status</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Current issue distribution</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={issueStatusData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={100}
              fill="#8884d8"
              dataKey="count"
              label={({ status, count, percent }) => `${status}: ${count} (${(percent * 100).toFixed(0)}%)`}
            >
              {issueStatusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* MTTR Trend */}
      <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">Mean Time to Resolve (MTTR)</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Average resolution time trend</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={mttrData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip />
            <Line type="monotone" dataKey="mttr" stroke="#3b82f6" strokeWidth={2} name="MTTR (days)" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* SLA Compliance */}
      <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">SLA Compliance Percentage</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Monthly compliance rate</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={slaComplianceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" stroke="#6b7280" />
            <YAxis domain={[90, 100]} stroke="#6b7280" />
            <Tooltip />
            <Area type="monotone" dataKey="compliance" stroke="#10b981" fill="#10b981" fillOpacity={0.3} name="Compliance %" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Module with Most Bugs */}
      <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">Bugs by Module</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Module-wise bug distribution</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={moduleBugsData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="module" stroke="#6b7280" angle={-45} textAnchor="end" height={100} />
            <YAxis stroke="#6b7280" />
            <Tooltip />
            <Legend />
            <Bar dataKey="critical" stackId="a" fill="#ef4444" name="Critical" />
            <Bar dataKey="high" stackId="a" fill="#f59e0b" name="High" />
            <Bar dataKey="medium" stackId="a" fill="#3b82f6" name="Medium" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Developer Performance */}
      <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">Developer Performance</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Issues closed per developer</p>
          </div>
          <MdPerson className="w-6 h-6 text-blue-600" />
        </div>
        <div className="space-y-3">
          {developerPerformance.map((dev, index) => (
            <div key={index} className="p-4 rounded-lg bg-[hsl(var(--secondary))]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-semibold">
                    {dev.developer.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div>
                    <h4 className="font-semibold text-[hsl(var(--foreground))]">{dev.developer}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {dev.issuesClosed} issues closed | Avg: {dev.avgResolutionTime} days | Critical: {dev.criticalBugs}
                    </p>
                  </div>
                </div>
                <MdTrendingUp className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600"
                  style={{ width: `${(dev.issuesClosed / 52) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}



