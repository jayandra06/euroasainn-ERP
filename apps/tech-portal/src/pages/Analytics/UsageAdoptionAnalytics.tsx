/**
 * Usage & Adoption Analytics
 * API request volume, active users, error heatmap, module adoption rate
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
  MdTrendingUp,
  MdPeople,
  MdApi,
  MdError,
  MdCheckCircle,
} from 'react-icons/md';

// Mock data
const apiRequestVolume = [
  { module: 'Authentication', requests: 0, errors: 0 },
  { module: 'User Management', requests: 0, errors: 0 },
  { module: 'Payment Gateway', requests: 0, errors: 0 },
  { module: 'Reporting', requests: 0, errors: 0 },
  { module: 'Notifications', requests: 0, errors: 0 },
];

const activeUsersData = [
  { hour: '00:00', users: 0 },
  { hour: '04:00', users: 0 },
  { hour: '08:00', users: 0 },
  { hour: '12:00', users: 0 },
  { hour: '16:00', users: 0 },
  { hour: '20:00', users: 0 },
];

const dailyActiveUsers = [
  { day: 'Mon', users: 0 },
  { day: 'Tue', users: 0 },
  { day: 'Wed', users: 0 },
  { day: 'Thu', users: 0 },
  { day: 'Fri', users: 0 },
  { day: 'Sat', users: 0 },
  { day: 'Sun', users: 0 },
];

const errorHeatmapData = [
  { endpoint: '/api/users', hour: '00:00', errors: 0 },
  { endpoint: '/api/users', hour: '08:00', errors: 0 },
  { endpoint: '/api/users', hour: '12:00', errors: 0 },
  { endpoint: '/api/users', hour: '16:00', errors: 0 },
  { endpoint: '/api/payments', hour: '00:00', errors: 0 },
  { endpoint: '/api/payments', hour: '08:00', errors: 0 },
  { endpoint: '/api/payments', hour: '12:00', errors: 0 },
  { endpoint: '/api/payments', hour: '16:00', errors: 0 },
  { endpoint: '/api/reports', hour: '00:00', errors: 0 },
  { endpoint: '/api/reports', hour: '08:00', errors: 0 },
  { endpoint: '/api/reports', hour: '12:00', errors: 0 },
  { endpoint: '/api/reports', hour: '16:00', errors: 0 },
];

const moduleAdoption = [
  { module: 'Dashboard', adoption: 0, users: 0, growth: 0 },
  { module: 'User Management', adoption: 0, users: 0, growth: 0 },
  { module: 'Reports', adoption: 0, users: 0, growth: 0 },
  { module: 'Analytics', adoption: 0, users: 0, growth: 0 },
  { module: 'Settings', adoption: 0, users: 0, growth: 0 },
];

export function UsageAdoptionAnalytics() {
  const totalRequests = apiRequestVolume.reduce((sum, item) => sum + item.requests, 0);
  const totalErrors = apiRequestVolume.reduce((sum, item) => sum + item.errors, 0);
  const errorRate = ((totalErrors / totalRequests) * 100).toFixed(2);
  const peakUsers = Math.max(...activeUsersData.map((d) => d.users));

  return (
    <div className="w-full space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total API Requests</p>
            <MdApi className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{totalRequests.toLocaleString()}</p>
          <p className="text-xs text-[hsl(var(--foreground))] font-semibold mt-1">Last 24 hours</p>
        </div>

        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Error Rate</p>
            <MdError className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{errorRate}%</p>
          <p className="text-xs text-[hsl(var(--foreground))] font-semibold mt-1">No data available</p>
        </div>

        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Peak Active Users</p>
            <MdPeople className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{peakUsers}</p>
          <p className="text-xs text-[hsl(var(--foreground))] font-semibold mt-1">No data available</p>
        </div>

        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Daily Users</p>
            <MdTrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]">
            {Math.round(dailyActiveUsers.reduce((sum, d) => sum + d.users, 0) / dailyActiveUsers.length)}
          </p>
          <p className="text-xs text-[hsl(var(--foreground))] font-semibold mt-1">No data available</p>
        </div>
      </div>

      {/* API Request Volume by Module */}
      <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">API Request Volume by Module</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Request and error counts per module</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={apiRequestVolume}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="module" stroke="#6b7280" angle={-45} textAnchor="end" height={100} />
            <YAxis stroke="#6b7280" />
            <Tooltip />
            <Legend />
            <Bar dataKey="requests" fill="#3b82f6" name="Requests" />
            <Bar dataKey="errors" fill="#ef4444" name="Errors" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Active Users per Hour */}
      <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">Active Users per Hour</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">24-hour user activity pattern</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={activeUsersData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="hour" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip />
            <Area type="monotone" dataKey="users" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} name="Active Users" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Daily Active Users */}
      <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">Daily Active Users</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Weekly user activity trend</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dailyActiveUsers}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="day" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip />
            <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} name="Active Users" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Endpoint Error Heatmap */}
      <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">Endpoint Error Heatmap</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Error distribution by endpoint and time</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['/api/users', '/api/payments', '/api/reports'].map((endpoint) => {
            const endpointData = errorHeatmapData.filter((d) => d.endpoint === endpoint);
            return (
              <div key={endpoint} className="p-4 rounded-lg bg-[hsl(var(--secondary))]">
                <h4 className="font-semibold text-[hsl(var(--foreground))] mb-3">{endpoint}</h4>
                <div className="space-y-2">
                  {endpointData.map((data, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">{data.hour}</span>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-4 rounded"
                          style={{
                            width: `${data.errors * 10}px`,
                            backgroundColor: data.errors > 15 ? '#ef4444' : data.errors > 8 ? '#f59e0b' : '#10b981',
                          }}
                        />
                        <span className="text-sm font-medium text-[hsl(var(--foreground))] w-8 text-right">{data.errors}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Module Adoption Rate */}
      <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">Module Adoption Rate</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Adoption percentage and growth by module</p>
          </div>
          <MdCheckCircle className="w-6 h-6 text-emerald-600" />
        </div>
        <div className="space-y-4">
          {moduleAdoption.map((module, index) => (
            <div key={index} className="p-4 rounded-lg bg-[hsl(var(--secondary))]">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-[hsl(var(--foreground))]">{module.module}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {module.users} users | Adoption: {module.adoption}%
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <MdTrendingUp className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-bold text-emerald-600">+{module.growth}%</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600"
                  style={{ width: `${module.adoption}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}



