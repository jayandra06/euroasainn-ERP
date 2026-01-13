/**
 * User & Access Reports Page
 * Login activity, session duration, inactive users, role-based access usage, portal usage heatmap
 */
import { useState } from 'react';
import { useToast } from '../../components/shared/Toast';
import { MdPeople, MdAccessTime, MdDownload, MdWarning, MdCheckCircle, } from 'react-icons/md';
import { ResponsiveContainer, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, } from 'recharts';
// Mock data
const loginActivityData = [
    { day: 'Mon', logins: 245, sessions: 320 },
    { day: 'Tue', logins: 280, sessions: 350 },
    { day: 'Wed', logins: 310, sessions: 380 },
    { day: 'Thu', logins: 295, sessions: 365 },
    { day: 'Fri', logins: 270, sessions: 340 },
    { day: 'Sat', logins: 150, sessions: 180 },
    { day: 'Sun', logins: 120, sessions: 150 },
];
const sessionDurationData = [
    { hour: '00:00', avgDuration: 15 },
    { hour: '04:00', avgDuration: 12 },
    { hour: '08:00', avgDuration: 45 },
    { hour: '12:00', avgDuration: 60 },
    { hour: '16:00', avgDuration: 55 },
    { hour: '20:00', avgDuration: 40 },
];
const roleUsageData = [
    { role: 'Admin', logins: 450, avgSession: 120, modules: ['Dashboard', 'Users', 'Reports', 'Settings'] },
    { role: 'Manager', logins: 320, avgSession: 90, modules: ['Dashboard', 'Reports', 'Analytics'] },
    { role: 'User', logins: 1250, avgSession: 45, modules: ['Dashboard', 'Profile'] },
];
const inactiveUsers = [
    { name: 'John Doe', email: 'john@example.com', lastLogin: '2024-01-15', daysInactive: 45 },
    { name: 'Jane Smith', email: 'jane@example.com', lastLogin: '2024-01-20', daysInactive: 40 },
    { name: 'Bob Wilson', email: 'bob@example.com', lastLogin: '2024-02-01', daysInactive: 28 },
];
const portalUsageData = [
    { portal: 'Admin Portal', users: 45, sessions: 1200, avgDuration: 95 },
    { portal: 'Customer Portal', users: 320, sessions: 8500, avgDuration: 35 },
    { portal: 'Vendor Portal', users: 180, sessions: 4200, avgDuration: 50 },
    { portal: 'Tech Portal', users: 25, sessions: 600, avgDuration: 110 },
];
export function UserAccessReportsPage() {
    const { showToast } = useToast();
    const [timeRange, setTimeRange] = useState('month');
    const handleExport = (format) => {
        showToast(`Exporting user access report as ${format.toUpperCase()}...`, 'info');
        // TODO: Implement export functionality
    };
    return (<div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-1">User & Access Reports</h1>
          <p className="text-[hsl(var(--muted-foreground))]">Login activity, session analysis, and access patterns</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} className="px-4 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] text-sm">
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
          </select>
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
            <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Total Logins (This Month)</p>
            <MdPeople className="w-5 h-5 text-blue-600"/>
          </div>
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]">12,450</p>
          <p className="text-xs text-emerald-600 mt-1">+8.5% from last month</p>
        </div>

        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Avg Session Duration</p>
            <MdAccessTime className="w-5 h-5 text-purple-600"/>
          </div>
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]">52 min</p>
          <p className="text-xs text-emerald-600 mt-1">+5.2% from last month</p>
        </div>

        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Active Users</p>
            <MdCheckCircle className="w-5 h-5 text-emerald-600"/>
          </div>
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]">570</p>
          <p className="text-xs text-emerald-600 mt-1">+12.3% from last month</p>
        </div>

        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Inactive Users</p>
            <MdWarning className="w-5 h-5 text-orange-600"/>
          </div>
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]">23</p>
          <p className="text-xs text-orange-600 mt-1">30+ days inactive</p>
        </div>
      </div>

      {/* Login Activity Chart */}
      <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">Daily Login Activity</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Login counts and active sessions</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={loginActivityData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb"/>
            <XAxis dataKey="day" stroke="#6b7280"/>
            <YAxis stroke="#6b7280"/>
            <Tooltip />
            <Legend />
            <Bar dataKey="logins" fill="#3b82f6" name="Logins"/>
            <Bar dataKey="sessions" fill="#8b5cf6" name="Active Sessions"/>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Session Duration Analysis */}
      <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">Average Session Duration by Hour</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Peak usage times analysis</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={sessionDurationData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb"/>
            <XAxis dataKey="hour" stroke="#6b7280"/>
            <YAxis stroke="#6b7280"/>
            <Tooltip />
            <Area type="monotone" dataKey="avgDuration" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} name="Avg Duration (min)"/>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Portal Usage Comparison */}
      <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">Portal Usage Heatmap</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Usage across different portals</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {portalUsageData.map((portal, index) => (<div key={index} className="p-4 rounded-lg bg-[hsl(var(--secondary))]">
              <h4 className="font-semibold text-[hsl(var(--foreground))] mb-3">{portal.portal}</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[hsl(var(--muted-foreground))]">Users:</span>
                  <span className="font-medium text-[hsl(var(--foreground))]">{portal.users}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[hsl(var(--muted-foreground))]">Sessions:</span>
                  <span className="font-medium text-[hsl(var(--foreground))]">{portal.sessions.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[hsl(var(--muted-foreground))]">Avg Duration:</span>
                  <span className="font-medium text-[hsl(var(--foreground))]">{portal.avgDuration} min</span>
                </div>
              </div>
            </div>))}
        </div>
      </div>

      {/* Role-Based Access Usage */}
      <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">Role-Based Access Usage</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Module access by role</p>
          </div>
        </div>
        <div className="space-y-4">
          {roleUsageData.map((role, index) => (<div key={index} className="p-4 rounded-lg bg-[hsl(var(--secondary))]">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-[hsl(var(--foreground))]">{role.role}</h4>
                <div className="flex gap-4 text-sm">
                  <span className="text-[hsl(var(--muted-foreground))]">
                    Logins: <span className="font-medium text-[hsl(var(--foreground))]">{role.logins}</span>
                  </span>
                  <span className="text-[hsl(var(--muted-foreground))]">
                    Avg Session: <span className="font-medium text-[hsl(var(--foreground))]">{role.avgSession} min</span>
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {role.modules.map((module, modIndex) => (<span key={modIndex} className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900 text-[hsl(var(--foreground))] font-semibold">
                    {module}
                  </span>))}
              </div>
            </div>))}
        </div>
      </div>

      {/* Inactive Users Alert */}
      <div className="p-6 rounded-xl border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <MdWarning className="w-6 h-6 text-orange-600"/>
          <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">Inactive Users Alert</h3>
        </div>
        <div className="space-y-3">
          {inactiveUsers.map((user, index) => (<div key={index} className="p-4 rounded-lg bg-[hsl(var(--card))] border border-orange-200 dark:border-orange-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-[hsl(var(--foreground))]">{user.name}</p>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">{user.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-[hsl(var(--foreground))]">{user.daysInactive} days inactive</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">Last login: {user.lastLogin}</p>
                </div>
              </div>
            </div>))}
        </div>
      </div>
    </div>);
}
//# sourceMappingURL=UserAccessReportsPage.js.map