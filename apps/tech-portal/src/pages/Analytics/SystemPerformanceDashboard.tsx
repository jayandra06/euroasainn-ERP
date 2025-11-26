/**
 * System Performance Dashboard
 * CPU/Memory/Disk usage, API/DB response times, downtime incidents, latency, microservice health
 */

import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  MdMemory,
  MdStorage,
  MdSpeed,
  MdWarning,
  MdCheckCircle,
  MdError,
  MdCloud,
} from 'react-icons/md';

// Mock data
const resourceUsageData = [
  { time: '00:00', cpu: 0, memory: 0, disk: 0 },
  { time: '04:00', cpu: 0, memory: 0, disk: 0 },
  { time: '08:00', cpu: 0, memory: 0, disk: 0 },
  { time: '12:00', cpu: 0, memory: 0, disk: 0 },
  { time: '16:00', cpu: 0, memory: 0, disk: 0 },
  { time: '20:00', cpu: 0, memory: 0, disk: 0 },
];

const responseTimeData = [
  { endpoint: '/api/users', avgTime: 0, p95: 0, p99: 0 },
  { endpoint: '/api/organizations', avgTime: 0, p95: 0, p99: 0 },
  { endpoint: '/api/licenses', avgTime: 0, p95: 0, p99: 0 },
  { endpoint: '/api/reports', avgTime: 0, p95: 0, p99: 0 },
  { endpoint: '/api/analytics', avgTime: 0, p95: 0, p99: 0 },
];

const downtimeIncidents = [
  { date: '2024-01-15', duration: '0 minutes', service: 'Database', rootCause: 'Connection pool exhaustion', status: 'resolved' },
  { date: '2024-01-20', duration: '0 minutes', service: 'API Gateway', rootCause: 'Network connectivity issue', status: 'resolved' },
  { date: '2024-02-01', duration: '0 minutes', service: 'Cache Service', rootCause: 'Scheduled maintenance', status: 'resolved' },
  { date: '2024-02-10', duration: '0 minutes', service: 'Payment Service', rootCause: 'Third-party API timeout', status: 'resolved' },
];

const latencyData = [
  { endpoint: '/api/auth/login', avgLatency: 0, maxLatency: 0 },
  { endpoint: '/api/users', avgLatency: 0, maxLatency: 0 },
  { endpoint: '/api/organizations', avgLatency: 0, maxLatency: 0 },
  { endpoint: '/api/reports', avgLatency: 0, maxLatency: 0 },
  { endpoint: '/api/analytics', avgLatency: 0, maxLatency: 0 },
];

const microserviceHealth = [
  { service: 'User Service', status: 'healthy', uptime: 0, responseTime: 0, lastCheck: '2024-02-10 15:00' },
  { service: 'Organization Service', status: 'healthy', uptime: 0, responseTime: 0, lastCheck: '2024-02-10 15:00' },
  { service: 'License Service', status: 'healthy', uptime: 0, responseTime: 0, lastCheck: '2024-02-10 15:00' },
  { service: 'Payment Service', status: 'degraded', uptime: 0, responseTime: 0, lastCheck: '2024-02-10 14:45' },
  { service: 'Notification Service', status: 'healthy', uptime: 0, responseTime: 0, lastCheck: '2024-02-10 15:00' },
];

export function SystemPerformanceDashboard() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20';
      case 'degraded':
        return 'text-orange-600 bg-orange-50 dark:bg-orange-950/20';
      case 'down':
        return 'text-red-600 bg-red-50 dark:bg-red-950/20';
      default:
        return 'text-gray-600 bg-[hsl(var(--secondary))]';
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">CPU Usage</p>
            <MdSpeed className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]">0%</p>
          <p className="text-xs text-[hsl(var(--foreground))] font-semibold mt-1">No data available</p>
        </div>

        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Memory Usage</p>
            <MdMemory className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]">0%</p>
          <p className="text-xs text-[hsl(var(--foreground))] font-semibold mt-1">No data available</p>
        </div>

        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Disk Usage</p>
            <MdStorage className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]">0%</p>
          <p className="text-xs text-[hsl(var(--foreground))] font-semibold mt-1">Stable</p>
        </div>

        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Response Time</p>
            <MdSpeed className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]">0ms</p>
          <p className="text-xs text-[hsl(var(--foreground))] font-semibold mt-1">No data available</p>
        </div>
      </div>

      {/* Resource Usage Trends */}
      <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">Resource Usage Trends</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">CPU, Memory, and Disk usage over 24 hours</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={resourceUsageData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="time" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="cpu" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} name="CPU %" />
            <Area type="monotone" dataKey="memory" stackId="2" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} name="Memory %" />
            <Area type="monotone" dataKey="disk" stackId="3" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} name="Disk %" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* API & DB Response Times */}
      <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">API Response Times</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Average, P95, and P99 response times by endpoint</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={responseTimeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="endpoint" stroke="#6b7280" angle={-45} textAnchor="end" height={100} />
            <YAxis stroke="#6b7280" />
            <Tooltip />
            <Legend />
            <Bar dataKey="avgTime" fill="#3b82f6" name="Avg (ms)" />
            <Bar dataKey="p95" fill="#8b5cf6" name="P95 (ms)" />
            <Bar dataKey="p99" fill="#ef4444" name="P99 (ms)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Downtime Incidents */}
      <div className="p-6 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <MdWarning className="w-6 h-6 text-red-600" />
          <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">Downtime Incidents & Root Cause Logs</h3>
        </div>
        <div className="space-y-3">
          {downtimeIncidents.map((incident, index) => (
            <div key={index} className="p-4 rounded-lg bg-[hsl(var(--card))] border border-red-200 dark:border-red-800">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <MdError className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="font-semibold text-[hsl(var(--foreground))]">{incident.service}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {incident.date} | Duration: {incident.duration}
                    </p>
                  </div>
                </div>
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 dark:bg-emerald-900 text-[hsl(var(--foreground))] font-semibold">
                  {incident.status}
                </span>
              </div>
              <p className="text-sm text-[hsl(var(--foreground))] mt-2">
                <span className="font-medium">Root Cause:</span> {incident.rootCause}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Average Latency per Endpoint */}
      <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">Average Latency per Endpoint</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Endpoint performance metrics</p>
          </div>
        </div>
        <div className="space-y-3">
          {latencyData.map((endpoint, index) => (
            <div key={index} className="p-4 rounded-lg bg-[hsl(var(--secondary))]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-[hsl(var(--foreground))]">{endpoint.endpoint}</span>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Avg: <span className="font-medium text-[hsl(var(--foreground))]">{endpoint.avgLatency}ms</span>
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    Max: <span className="font-medium text-[hsl(var(--foreground))]">{endpoint.maxLatency}ms</span>
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600"
                  style={{ width: `${(endpoint.avgLatency / 450) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Microservice Health Check Reports */}
      <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">Microservice Health Check Reports</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Service status and performance metrics</p>
          </div>
          <MdCloud className="w-6 h-6 text-blue-600" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {microserviceHealth.map((service, index) => (
            <div key={index} className="p-4 rounded-lg bg-[hsl(var(--secondary))]">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-[hsl(var(--foreground))]">{service.service}</h4>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(service.status)}`}>
                  {service.status}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Uptime:</span>
                  <span className="font-medium text-[hsl(var(--foreground))]">{service.uptime}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Response Time:</span>
                  <span className="font-medium text-[hsl(var(--foreground))]">{service.responseTime}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Last Check:</span>
                  <span className="font-medium text-[hsl(var(--foreground))] text-xs">{service.lastCheck}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}



