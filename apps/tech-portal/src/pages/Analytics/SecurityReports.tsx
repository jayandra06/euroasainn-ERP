/**
 * Security Reports
 * Failed logins, unauthorized access, token anomalies, vulnerability scans, 2FA logs
 */

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
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
  MdSecurity,
  MdLock,
  MdWarning,
  MdCheckCircle,
  MdError,
  MdLocationOn,
} from 'react-icons/md';

// Mock data
const failedLoginData = [
  { ip: '192.168.1.100', attempts: 0, location: 'US', status: 'blocked' },
  { ip: '10.0.0.50', attempts: 0, location: 'IN', status: 'monitored' },
  { ip: '172.16.0.25', attempts: 0, location: 'UK', status: 'blocked' },
  { ip: '203.0.113.10', attempts: 0, location: 'CN', status: 'monitored' },
];

const unauthorizedAccessData = [
  { date: '2024-02-01', attempts: 0 },
  { date: '2024-02-02', attempts: 0 },
  { date: '2024-02-03', attempts: 0 },
  { date: '2024-02-04', attempts: 0 },
  { date: '2024-02-05', attempts: 0 },
  { date: '2024-02-06', attempts: 0 },
  { date: '2024-02-07', attempts: 0 },
];

const tokenAnomalies = [
  { date: '2024-02-01', expired: 0, invalid: 0, suspicious: 0 },
  { date: '2024-02-02', expired: 0, invalid: 0, suspicious: 0 },
  { date: '2024-02-03', expired: 0, invalid: 0, suspicious: 0 },
  { date: '2024-02-04', expired: 0, invalid: 0, suspicious: 0 },
  { date: '2024-02-05', expired: 0, invalid: 0, suspicious: 0 },
];

const vulnerabilityScans = [
  { scan: 'OWASP Top 10', critical: 0, high: 0, medium: 0, low: 0, status: 'action_required' },
  { scan: 'Dependency Check', critical: 0, high: 0, medium: 0, low: 0, status: 'monitored' },
  { scan: 'Penetration Test', critical: 0, high: 0, medium: 0, low: 0, status: 'action_required' },
];

const twoFactorAuthLogs = [
  { date: '2024-02-10', enabled: 0, disabled: 0, failed: 0 },
  { date: '2024-02-09', enabled: 0, disabled: 0, failed: 0 },
  { date: '2024-02-08', enabled: 0, disabled: 0, failed: 0 },
];

const accessLogSummary = [
  { type: 'Successful Logins', count: 0, percentage: 0 },
  { type: 'Failed Logins', count: 0, percentage: 0 },
  { type: 'Blocked IPs', count: 0, percentage: 0 },
  { type: 'Suspicious Activity', count: 0, percentage: 0 },
];

export function SecurityReports() {
  const totalFailedLogins = failedLoginData.reduce((sum, item) => sum + item.attempts, 0);
  const totalUnauthorized = unauthorizedAccessData.reduce((sum, item) => sum + item.attempts, 0);
  const criticalVulnerabilities = vulnerabilityScans.reduce((sum, scan) => sum + scan.critical, 0);

  return (
    <div className="w-full space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Failed Login Attempts</p>
            <MdLock className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalFailedLogins}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Last 7 days</p>
        </div>

        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Unauthorized Access</p>
            <MdError className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalUnauthorized}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">No data available</p>
        </div>

        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Critical Vulnerabilities</p>
            <MdWarning className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{criticalVulnerabilities}</p>
          <p className="text-xs text-orange-600 mt-1">Action required</p>
        </div>

        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">2FA Enabled</p>
            <MdCheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {twoFactorAuthLogs[0]?.enabled || 0}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Active users</p>
        </div>
      </div>

      {/* Failed Login Attempts by IP */}
      <div className="p-6 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <MdWarning className="w-6 h-6 text-red-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Failed Login Attempts by IP</h3>
        </div>
        <div className="space-y-3">
          {failedLoginData.map((login, index) => (
            <div key={index} className="p-4 rounded-lg bg-white dark:bg-gray-900 border border-red-200 dark:border-red-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MdLocationOn className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{login.ip}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {login.attempts} attempts | Location: {login.location}
                    </p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    login.status === 'blocked'
                      ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                      : 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300'
                  }`}
                >
                  {login.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Unauthorized Access Attempts */}
      <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Unauthorized Access Attempts</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Daily unauthorized access trends</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={unauthorizedAccessData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip />
            <Line type="monotone" dataKey="attempts" stroke="#ef4444" strokeWidth={2} name="Attempts" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Token/Session Anomalies */}
      <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Token/Session Expiration Anomalies</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Token status breakdown</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={tokenAnomalies}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="expired" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} name="Expired" />
            <Area type="monotone" dataKey="invalid" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} name="Invalid" />
            <Area type="monotone" dataKey="suspicious" stackId="3" stroke="#dc2626" fill="#dc2626" fillOpacity={0.6} name="Suspicious" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Vulnerability Scan Reports */}
      <div className="p-6 rounded-xl border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <MdSecurity className="w-6 h-6 text-orange-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Vulnerability Scan Reports (OWASP Metrics)</h3>
        </div>
        <div className="space-y-3">
          {vulnerabilityScans.map((scan, index) => (
            <div key={index} className="p-4 rounded-lg bg-white dark:bg-gray-900 border border-orange-200 dark:border-orange-800">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900 dark:text-white">{scan.scan}</h4>
                <span
                  className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    scan.status === 'action_required'
                      ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                      : 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300'
                  }`}
                >
                  {scan.status.replace('_', ' ')}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Critical</p>
                  <p className="font-bold text-red-600">{scan.critical}</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">High</p>
                  <p className="font-bold text-orange-600">{scan.high}</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Medium</p>
                  <p className="font-bold text-yellow-600">{scan.medium}</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Low</p>
                  <p className="font-bold text-blue-600">{scan.low}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2FA and Access Log Summaries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">2FA Log Summary</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Two-factor authentication activity</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={twoFactorAuthLogs}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Legend />
              <Bar dataKey="enabled" fill="#10b981" name="Enabled" />
              <Bar dataKey="disabled" fill="#ef4444" name="Disabled" />
              <Bar dataKey="failed" fill="#f59e0b" name="Failed" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Access Log Summary</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Login activity breakdown</p>
            </div>
          </div>
          <div className="space-y-3">
            {accessLogSummary.map((log, index) => (
              <div key={index} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{log.type}</span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{log.count.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600"
                    style={{ width: `${log.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{log.percentage}%</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}



