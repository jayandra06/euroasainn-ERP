/**
 * Deployment Analytics
 * Build/release frequency, success/failure rate, rollbacks, environment stability, CI/CD pipeline analytics
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
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  MdRocketLaunch,
  MdCheckCircle,
  MdError,
  MdRefresh,
  MdCloud,
  MdTrendingUp,
} from 'react-icons/md';

// Mock data
const buildFrequencyData = [
  { week: 'Week 1', builds: 0, releases: 0 },
  { week: 'Week 2', builds: 0, releases: 0 },
  { week: 'Week 3', builds: 0, releases: 0 },
  { week: 'Week 4', builds: 0, releases: 0 },
  { week: 'Week 5', builds: 0, releases: 0 },
  { week: 'Week 6', builds: 0, releases: 0 },
];

const deploymentSuccessData = [
  { month: 'Jan', success: 0, failure: 0 },
  { month: 'Feb', success: 0, failure: 0 },
  { month: 'Mar', success: 0, failure: 0 },
  { month: 'Apr', success: 0, failure: 0 },
  { month: 'May', success: 0, failure: 0 },
  { month: 'Jun', success: 0, failure: 0 },
];

const rollbackData = [
  { month: 'Jan', rollbacks: 0 },
  { month: 'Feb', rollbacks: 0 },
  { month: 'Mar', rollbacks: 0 },
  { month: 'Apr', rollbacks: 0 },
  { month: 'May', rollbacks: 0 },
  { month: 'Jun', rollbacks: 0 },
];

const environmentStability = [
  { environment: 'Production', stability: 0, uptime: 0, deployments: 0 },
  { environment: 'UAT', stability: 0, uptime: 0, deployments: 0 },
  { environment: 'Test', stability: 0, uptime: 0, deployments: 0 },
  { environment: 'Dev', stability: 0, uptime: 0, deployments: 0 },
];

const cicdPipelineData = [
  { pipeline: 'Build Pipeline', success: 0, avgTime: 0, lastRun: '2024-02-10 14:30' },
  { pipeline: 'Test Pipeline', success: 0, avgTime: 0, lastRun: '2024-02-10 14:35' },
  { pipeline: 'Deploy Pipeline', success: 0, avgTime: 0, lastRun: '2024-02-10 14:40' },
  { pipeline: 'Integration Tests', success: 0, avgTime: 0, lastRun: '2024-02-10 14:45' },
];

const deploymentStatusData = [
  { status: 'Success', count: 0, color: '#10b981' },
  { status: 'Failed', count: 0, color: '#ef4444' },
  { status: 'Rolled Back', count: 0, color: '#f59e0b' },
];

export function DeploymentAnalytics() {
  const totalDeployments = deploymentStatusData.reduce((sum, item) => sum + item.count, 0);
  const successRate = ((deploymentStatusData.find((s) => s.status === 'Success')?.count || 0) / totalDeployments * 100).toFixed(1);
  const avgRollbacks = (rollbackData.reduce((sum, item) => sum + item.rollbacks, 0) / rollbackData.length).toFixed(1);

  return (
    <div className="w-full space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Deployment Success Rate</p>
            <MdCheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{successRate}%</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">No data available</p>
        </div>

        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Deployments</p>
            <MdRocketLaunch className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalDeployments}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Last 6 months</p>
        </div>

        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Rollbacks/Month</p>
            <MdRefresh className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{avgRollbacks}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">No data available</p>
        </div>

        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Builds This Week</p>
            <MdTrendingUp className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {buildFrequencyData[buildFrequencyData.length - 1]?.builds || 0}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">No data available</p>
        </div>
      </div>

      {/* Build & Release Frequency */}
      <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Build & Release Frequency</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Weekly build and release counts</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={buildFrequencyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="week" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip />
            <Legend />
            <Bar dataKey="builds" fill="#3b82f6" name="Builds" />
            <Bar dataKey="releases" fill="#10b981" name="Releases" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Deployment Success/Failure Rate */}
      <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Deployment Success/Failure Rate</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Monthly deployment outcomes</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={deploymentSuccessData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="success" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Success %" />
            <Area type="monotone" dataKey="failure" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} name="Failure %" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Rollback Count */}
      <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Rollback Count</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Monthly rollback trends</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={rollbackData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip />
            <Line type="monotone" dataKey="rollbacks" stroke="#f59e0b" strokeWidth={2} name="Rollbacks" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Environment Stability Score */}
      <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Environment Stability Score</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Stability metrics by environment</p>
          </div>
          <MdCloud className="w-6 h-6 text-blue-600" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {environmentStability.map((env, index) => (
            <div key={index} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900 dark:text-white">{env.environment}</h4>
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
                  {env.stability}%
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Uptime:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{env.uptime}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Deployments:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{env.deployments}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CI/CD Pipeline Analytics */}
      <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">CI/CD Pipeline Analytics</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Pipeline performance metrics</p>
          </div>
        </div>
        <div className="space-y-3">
          {cicdPipelineData.map((pipeline, index) => (
            <div key={index} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">{pipeline.pipeline}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Last run: {pipeline.lastRun}</p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="text-right">
                    <p className="text-gray-600 dark:text-gray-400">Success Rate</p>
                    <p className="font-bold text-emerald-600">{pipeline.success}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-600 dark:text-gray-400">Avg Time</p>
                    <p className="font-bold text-gray-900 dark:text-white">{pipeline.avgTime} min</p>
                  </div>
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600"
                  style={{ width: `${pipeline.success}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Deployment Status Distribution */}
      <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Deployment Status Distribution</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Overall deployment outcomes</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={deploymentStatusData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={100}
              fill="#8884d8"
              dataKey="count"
              label={({ status, count, percent }) => `${status}: ${count} (${(percent * 100).toFixed(0)}%)`}
            >
              {deploymentStatusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}



