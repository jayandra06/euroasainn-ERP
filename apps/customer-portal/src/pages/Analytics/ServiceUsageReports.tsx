/**
 * Service/Subscription Usage Reports
 * Current plan vs actual usage, consumption by feature/module, plan upgrade/downgrade history, usage limits notifications
 */

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
  MdSubscriptions,
  MdTrendingUp,
  MdTrendingDown,
  MdWarning,
  MdCheckCircle,
  MdStorage,
} from 'react-icons/md';

// Mock data
const planVsUsageData = [
  { feature: 'Storage', planLimit: 0, actualUsage: 0, unit: 'GB' },
  { feature: 'API Calls', planLimit: 0, actualUsage: 0, unit: 'calls' },
  { feature: 'Users', planLimit: 0, actualUsage: 0, unit: 'users' },
  { feature: 'Projects', planLimit: 0, actualUsage: 0, unit: 'projects' },
];

const consumptionByFeature = [
  { feature: 'Dashboard', usage: 0, requests: 0, growth: 0 },
  { feature: 'Reports', usage: 0, requests: 0, growth: 0 },
  { feature: 'Analytics', usage: 0, requests: 0, growth: 0 },
  { feature: 'API Access', usage: 0, requests: 0, growth: 0 },
  { feature: 'Storage', usage: 0, requests: 0, growth: 0 },
];

const planHistoryData = [
  { date: '2024-01-01', plan: 'Basic', action: 'Downgrade', reason: 'Cost optimization' },
  { date: '2024-02-01', plan: 'Premium', action: 'Upgrade', reason: 'Increased usage needs' },
  { date: '2024-03-01', plan: 'Premium', action: 'Maintained', reason: 'Current plan sufficient' },
];

const usageLimitsData = [
  { feature: 'Storage', current: 0, limit: 0, threshold: 0, status: 'safe' },
  { feature: 'API Calls', current: 0, limit: 0, threshold: 0, status: 'warning' },
  { feature: 'Users', current: 0, limit: 0, threshold: 0, status: 'safe' },
  { feature: 'Projects', current: 0, limit: 0, threshold: 0, status: 'safe' },
];

const monthlyUsageTrend = [
  { month: 'Jan', usage: 0, limit: 0 },
  { month: 'Feb', usage: 0, limit: 0 },
  { month: 'Mar', usage: 0, limit: 0 },
  { month: 'Apr', usage: 0, limit: 0 },
  { month: 'May', usage: 0, limit: 0 },
  { month: 'Jun', usage: 0, limit: 0 },
];

export function ServiceUsageReports() {
  const currentPlan = 'Premium';
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'safe':
        return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20';
      case 'warning':
        return 'text-orange-600 bg-orange-50 dark:bg-orange-950/20';
      case 'critical':
        return 'text-red-600 bg-red-50 dark:bg-red-950/20';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-800';
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Plan</p>
            <MdSubscriptions className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{currentPlan}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Active subscription</p>
        </div>

        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Storage Usage</p>
            <MdStorage className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">68 GB</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">of 100 GB (68%)</p>
        </div>

        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">API Calls</p>
            <MdTrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">7,200</p>
          <p className="text-xs text-orange-600 mt-1">of 10,000 (72%)</p>
        </div>

        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Users</p>
            <MdCheckCircle className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">42</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">of 50 (84%)</p>
        </div>
      </div>

      {/* Current Plan vs Actual Usage */}
      <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Current Plan vs Actual Usage</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Feature usage compared to plan limits</p>
          </div>
        </div>
        <div className="space-y-4">
          {planVsUsageData.map((item, index) => {
            const usagePercent = (item.actualUsage / item.planLimit) * 100;
            return (
              <div key={index} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{item.feature}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {item.actualUsage} {item.unit} / {item.planLimit} {item.unit}
                    </p>
                  </div>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">{usagePercent.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      usagePercent > 80 ? 'bg-red-600' : usagePercent > 60 ? 'bg-orange-600' : 'bg-emerald-600'
                    }`}
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Consumption by Feature/Module */}
      <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Consumption by Feature/Module</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Usage and growth by feature</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={consumptionByFeature}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="feature" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip />
            <Legend />
            <Bar dataKey="usage" fill="#3b82f6" name="Usage %" />
            <Bar dataKey="requests" fill="#8b5cf6" name="Requests" />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 space-y-3">
          {consumptionByFeature.map((feature, index) => (
            <div key={index} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{feature.feature}</span>
                <div className="flex items-center gap-2">
                  {feature.growth > 0 ? (
                    <MdTrendingUp className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <MdTrendingDown className="w-4 h-4 text-red-600" />
                  )}
                  <span className={`text-sm font-medium ${feature.growth > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {feature.growth > 0 ? '+' : ''}{feature.growth}%
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Plan Upgrade/Downgrade History */}
      <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Plan Upgrade/Downgrade History</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Subscription plan changes over time</p>
          </div>
        </div>
        <div className="space-y-3">
          {planHistoryData.map((history, index) => (
            <div key={index} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    {history.action === 'Upgrade' ? (
                      <MdTrendingUp className="w-5 h-5 text-emerald-600" />
                    ) : history.action === 'Downgrade' ? (
                      <MdTrendingDown className="w-5 h-5 text-red-600" />
                    ) : (
                      <MdCheckCircle className="w-5 h-5 text-blue-600" />
                    )}
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {history.action}: {history.plan}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {history.date} | {history.reason}
                      </p>
                    </div>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    history.action === 'Upgrade'
                      ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300'
                      : history.action === 'Downgrade'
                      ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                      : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                  }`}
                >
                  {history.action}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notifications for Nearing Usage Limits */}
      <div className="p-6 rounded-xl border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <MdWarning className="w-6 h-6 text-orange-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications for Nearing Usage Limits</h3>
        </div>
        <div className="space-y-3">
          {usageLimitsData.map((limit, index) => {
            const usagePercent = (limit.current / limit.limit) * 100;
            const thresholdPercent = (limit.threshold / limit.limit) * 100;
            const isNearLimit = usagePercent >= thresholdPercent;
            
            if (!isNearLimit && limit.status === 'safe') return null;
            
            return (
              <div key={index} className="p-4 rounded-lg bg-white dark:bg-gray-900 border border-orange-200 dark:border-orange-800">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{limit.feature}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {limit.current} / {limit.limit} ({usagePercent.toFixed(0)}%)
                    </p>
                  </div>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(limit.status)}`}>
                    {limit.status === 'warning' ? 'Near Limit' : 'Safe'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      usagePercent > 80 ? 'bg-red-600' : usagePercent > 60 ? 'bg-orange-600' : 'bg-emerald-600'
                    }`}
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
                {isNearLimit && (
                  <p className="text-xs text-orange-600 mt-2">
                    ⚠️ You're approaching your limit. Consider upgrading your plan.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly Usage Trend */}
      <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Monthly Usage Trend</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">API calls usage over time</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={monthlyUsageTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="usage" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} name="Usage" />
            <Area type="monotone" dataKey="limit" stroke="#e5e7eb" fill="#e5e7eb" fillOpacity={0.1} name="Limit" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}



