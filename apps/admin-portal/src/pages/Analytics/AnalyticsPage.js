/**
 * Analytics Page
 * Professional Admin Portal Design
 */
import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../components/shared/Toast';
import { cn } from '../../lib/utils';
import { authenticatedFetch } from '../../lib/api';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, } from 'recharts';
import { MdTrendingUp, MdBusinessCenter, MdPeople, MdVpnKey, MdDownload, MdRefresh } from 'react-icons/md';
export function AnalyticsPage() {
    const queryClient = useQueryClient();
    const { showToast } = useToast();
    const [isRefreshing, setIsRefreshing] = useState(false);
    // Fetch customer organizations
    const { data: customerOrgs = [], isLoading: isLoadingCustomers } = useQuery({
        queryKey: ['analytics-customer-orgs'],
        queryFn: async () => {
            const response = await authenticatedFetch('/api/v1/admin/organizations?type=customer');
            if (!response.ok)
                throw new Error('Failed to fetch customer organizations');
            const data = await response.json();
            return data.data;
        },
    });
    // Fetch vendor organizations
    const { data: vendorOrgs = [], isLoading: isLoadingVendors } = useQuery({
        queryKey: ['analytics-vendor-orgs'],
        queryFn: async () => {
            const response = await authenticatedFetch('/api/v1/admin/organizations?type=vendor');
            if (!response.ok)
                throw new Error('Failed to fetch vendor organizations');
            const data = await response.json();
            return data.data;
        },
    });
    // Fetch licenses
    const { data: licenses = [], isLoading: isLoadingLicenses } = useQuery({
        queryKey: ['analytics-licenses'],
        queryFn: async () => {
            const response = await authenticatedFetch('/api/v1/admin/licenses');
            if (!response.ok)
                throw new Error('Failed to fetch licenses');
            const data = await response.json();
            return data.data;
        },
    });
    // Fetch all users (admin, customer, vendor)
    const { data: users = [], isLoading: isLoadingUsers } = useQuery({
        queryKey: ['analytics-users'],
        queryFn: async () => {
            // Fetch users from all portals
            const [adminUsersRes, loginsRes] = await Promise.all([
                authenticatedFetch('/api/v1/admin/users'),
                authenticatedFetch('/api/v1/admin/logins').catch(() => null), // This endpoint returns customer and vendor users with lastLogin
            ]);
            const allUsers = [];
            // Add admin users
            if (adminUsersRes.ok) {
                const adminData = await adminUsersRes.json();
                if (adminData.data) {
                    allUsers.push(...adminData.data);
                }
            }
            // Add customer and vendor users from logins endpoint
            if (loginsRes && loginsRes.ok) {
                const loginsData = await loginsRes.json();
                if (loginsData.data) {
                    // Convert login data to user format, using unique users by _id
                    const userMap = new Map();
                    loginsData.data.forEach((login) => {
                        if (!userMap.has(login._id)) {
                            userMap.set(login._id, {
                                _id: login._id,
                                email: login.email,
                                createdAt: login.createdAt || login.lastLogin,
                            });
                        }
                    });
                    allUsers.push(...Array.from(userMap.values()));
                }
            }
            return allUsers;
        },
    });
    // Calculate analytics from fetched data
    const analytics = useMemo(() => {
        const totalOrgs = customerOrgs.length + vendorOrgs.length;
        const totalLicenses = licenses.length;
        const activeLicenses = licenses.filter(l => l.status === 'active').length;
        const expiredLicenses = licenses.filter(l => l.status === 'expired').length;
        const suspendedLicenses = licenses.filter(l => l.status === 'suspended').length;
        const revokedLicenses = licenses.filter(l => l.status === 'revoked').length;
        const totalUsers = users.length;
        // Organization type distribution
        const orgTypeData = [
            { name: 'Customer', value: customerOrgs.length, color: '#3b82f6' },
            { name: 'Vendor', value: vendorOrgs.length, color: '#8b5cf6' },
        ];
        // License status distribution
        const licenseStatusData = [
            { name: 'Active', value: activeLicenses, color: '#10b981' },
            { name: 'Expired', value: expiredLicenses, color: '#ef4444' },
            { name: 'Suspended', value: suspendedLicenses, color: '#f59e0b' },
            { name: 'Revoked', value: revokedLicenses, color: '#6b7280' },
        ].filter(item => item.value > 0); // Only show statuses that have licenses
        // Monthly growth calculation (last 6 months)
        const monthlyGrowthData = (() => {
            const now = new Date();
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const data = [];
            for (let i = 5; i >= 0; i--) {
                const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
                const monthName = monthNames[monthDate.getMonth()];
                const customers = customerOrgs.filter(org => {
                    if (!org.createdAt)
                        return false;
                    const created = new Date(org.createdAt);
                    return created >= monthDate && created <= monthEnd;
                }).length;
                const vendors = vendorOrgs.filter(org => {
                    if (!org.createdAt)
                        return false;
                    const created = new Date(org.createdAt);
                    return created >= monthDate && created <= monthEnd;
                }).length;
                data.push({ name: `${monthName} ${monthDate.getFullYear().toString().slice(-2)}`, customers, vendors });
            }
            return data;
        })();
        // Weekly activity (last 7 days)
        const activityData = (() => {
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const now = new Date();
            const data = [];
            for (let i = 6; i >= 0; i--) {
                const dayDate = new Date(now);
                dayDate.setDate(dayDate.getDate() - i);
                dayDate.setHours(0, 0, 0, 0);
                const dayEnd = new Date(dayDate);
                dayEnd.setHours(23, 59, 59, 999);
                const dayName = dayNames[dayDate.getDay()];
                const dayNumber = dayDate.getDate();
                const activities = [...customerOrgs, ...vendorOrgs, ...licenses, ...users].filter(item => {
                    if (!item.createdAt)
                        return false;
                    const created = new Date(item.createdAt);
                    return created >= dayDate && created <= dayEnd;
                }).length;
                data.push({ name: `${dayName} ${dayNumber}`, activities });
            }
            return data;
        })();
        // Calculate growth rate based on last 30 days vs previous 30 days
        const now = new Date();
        const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const last60Days = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
        const recentOrgs = [...customerOrgs, ...vendorOrgs].filter(org => {
            if (!org.createdAt)
                return false;
            const created = new Date(org.createdAt);
            return created >= last30Days;
        }).length;
        const previousOrgs = [...customerOrgs, ...vendorOrgs].filter(org => {
            if (!org.createdAt)
                return false;
            const created = new Date(org.createdAt);
            return created >= last60Days && created < last30Days;
        }).length;
        const growthRate = previousOrgs > 0
            ? (((recentOrgs - previousOrgs) / previousOrgs) * 100).toFixed(1)
            : recentOrgs > 0 ? '100.0' : '0.0';
        return {
            totalOrgs,
            totalLicenses,
            activeLicenses,
            totalUsers,
            growthRate,
            orgTypeData,
            licenseStatusData,
            monthlyGrowthData,
            activityData,
        };
    }, [customerOrgs, vendorOrgs, licenses, users]);
    const isLoading = isLoadingCustomers || isLoadingVendors || isLoadingLicenses || isLoadingUsers;
    const handleRefresh = () => {
        setIsRefreshing(true);
        queryClient.invalidateQueries({ queryKey: ['analytics-customer-orgs'] });
        queryClient.invalidateQueries({ queryKey: ['analytics-vendor-orgs'] });
        queryClient.invalidateQueries({ queryKey: ['analytics-licenses'] });
        queryClient.invalidateQueries({ queryKey: ['analytics-users'] });
        setTimeout(() => {
            setIsRefreshing(false);
            showToast('Analytics data refreshed', 'success');
        }, 1000);
    };
    const handleExport = () => {
        showToast('Export functionality will be implemented soon', 'info');
        // TODO: Implement export functionality
    };
    return (<div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-1">Analytics & Insights</h1>
          <p className="text-[hsl(var(--muted-foreground))]">Platform analytics and performance metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleRefresh} disabled={isRefreshing} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] transition-colors text-sm font-medium text-[hsl(var(--foreground))] disabled:opacity-50 disabled:cursor-not-allowed">
            <MdRefresh className={cn('w-4 h-4', isRefreshing && 'animate-spin')}/>
            Refresh
          </button>
          <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-colors font-semibold text-sm shadow-lg shadow-blue-500/30">
            <MdDownload className="w-4 h-4"/>
            Export Report
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-1">Total Organizations</p>
              <p className="text-2xl font-bold text-[hsl(var(--foreground))]">
                {isLoading ? '...' : analytics.totalOrgs.toLocaleString()}
              </p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                {customerOrgs.length} customers, {vendorOrgs.length} vendors
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
              <MdBusinessCenter className="w-6 h-6 text-white"/>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-1">Active Licenses</p>
              <p className="text-2xl font-bold text-[hsl(var(--foreground))]">
                {isLoading ? '...' : analytics.activeLicenses.toLocaleString()}
              </p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                {analytics.totalLicenses} total licenses
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
              <MdVpnKey className="w-6 h-6 text-white"/>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-1">Total Users</p>
              <p className="text-2xl font-bold text-[hsl(var(--foreground))]">
                {isLoading ? '...' : analytics.totalUsers.toLocaleString()}
              </p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Platform users</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-md">
              <MdPeople className="w-6 h-6 text-white"/>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-1">Growth Rate</p>
              <p className="text-2xl font-bold text-[hsl(var(--foreground))]">
                {isLoading ? '...' : `${analytics.growthRate}%`}
              </p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Platform growth</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-md">
              <MdTrendingUp className="w-6 h-6 text-white"/>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Organization Type Distribution */}
        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">Organization Types</h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Distribution of organization types</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
              <MdBusinessCenter className="w-5 h-5 text-white"/>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            {isLoading ? (<div className="flex items-center justify-center h-full">
                <p className="text-[hsl(var(--muted-foreground))]">Loading...</p>
              </div>) : analytics.orgTypeData.some(d => d.value > 0) ? (<PieChart>
                <Pie data={analytics.orgTypeData} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {analytics.orgTypeData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color}/>))}
                </Pie>
                <Tooltip contentStyle={{
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
            }}/>
              </PieChart>) : (<div className="flex items-center justify-center h-full">
                <p className="text-[hsl(var(--muted-foreground))]">No data available</p>
              </div>)}
          </ResponsiveContainer>
        </div>

        {/* License Status */}
        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">License Status</h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">License status breakdown</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
              <MdVpnKey className="w-5 h-5 text-white"/>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            {isLoading ? (<div className="flex items-center justify-center h-full">
                <p className="text-[hsl(var(--muted-foreground))]">Loading...</p>
              </div>) : analytics.licenseStatusData.some(d => d.value > 0) ? (<PieChart>
                <Pie data={analytics.licenseStatusData} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {analytics.licenseStatusData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color}/>))}
                </Pie>
                <Tooltip contentStyle={{
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
            }}/>
              </PieChart>) : (<div className="flex items-center justify-center h-full">
                <p className="text-[hsl(var(--muted-foreground))]">No data available</p>
              </div>)}
          </ResponsiveContainer>
        </div>

        {/* Monthly Growth */}
        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">Monthly Growth</h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Organization growth over time</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-md">
              <MdTrendingUp className="w-5 h-5 text-white"/>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            {isLoading ? (<div className="flex items-center justify-center h-full">
                <p className="text-[hsl(var(--muted-foreground))]">Loading...</p>
              </div>) : (<BarChart data={analytics.monthlyGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700"/>
                <XAxis dataKey="name" stroke="#6b7280"/>
                <YAxis stroke="#6b7280"/>
                <Tooltip contentStyle={{
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
            }}/>
                <Legend />
                <Bar dataKey="customers" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Customers"/>
                <Bar dataKey="vendors" fill="#8b5cf6" radius={[8, 8, 0, 0]} name="Vendors"/>
              </BarChart>)}
          </ResponsiveContainer>
        </div>

        {/* Activity Timeline */}
        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">Weekly Activity</h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Platform activity overview</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-md">
              <MdTrendingUp className="w-5 h-5 text-white"/>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            {isLoading ? (<div className="flex items-center justify-center h-full">
                <p className="text-[hsl(var(--muted-foreground))]">Loading...</p>
              </div>) : (<LineChart data={analytics.activityData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700"/>
                <XAxis dataKey="name" stroke="#6b7280"/>
                <YAxis stroke="#6b7280"/>
                <Tooltip contentStyle={{
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
            }}/>
                <Line type="monotone" dataKey="activities" stroke="#f59e0b" strokeWidth={2} activeDot={{ r: 8 }}/>
              </LineChart>)}
          </ResponsiveContainer>
        </div>
      </div>
    </div>);
}
//# sourceMappingURL=AnalyticsPage.js.map