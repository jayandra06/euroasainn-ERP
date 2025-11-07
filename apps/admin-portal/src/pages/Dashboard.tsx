/**
 * Ultra-Modern Admin Dashboard
 * World-Class SaaS ERP Platform Design
 * Enhanced with new widgets and improved organization
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  MdTrendingUp,
  MdBusinessCenter,
  MdPeople,
  MdVpnKey,
  MdArrowUpward,
  MdArrowDownward,
  MdNotifications,
  MdSchedule,
  MdCheckCircle,
  MdWarning,
  MdRefresh,
  MdAttachMoney,
  MdPersonAdd,
  MdBusiness,
  MdDescription,
  MdCardMembership,
} from 'react-icons/md';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { cn } from '../lib/utils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface DashboardStats {
  totalCustomerOrgs: number;
  totalVendorOrgs: number;
  totalLicenses: number;
  activeLicenses: number;
  totalUsers: number;
  customerOrgGrowth: number;
  vendorOrgGrowth: number;
  licenseGrowth: number;
  totalRevenue: number;
  monthlyRevenue: number;
  revenueGrowth: number;
}

const statCards = [
  {
    title: 'Customer Organizations',
    key: 'totalCustomerOrgs',
    changeKey: 'customerOrgGrowth',
    icon: MdBusinessCenter,
    gradient: 'from-blue-500 to-indigo-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    path: '/organizations',
  },
  {
    title: 'Vendor Organizations',
    key: 'totalVendorOrgs',
    changeKey: 'vendorOrgGrowth',
    icon: MdBusinessCenter,
    gradient: 'from-purple-500 to-pink-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950/20',
    path: '/organizations',
  },
  {
    title: 'Total Licenses',
    key: 'totalLicenses',
    changeKey: 'licenseGrowth',
    icon: MdVpnKey,
    gradient: 'from-emerald-500 to-teal-600',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/20',
    path: '/licenses',
  },
  {
    title: 'Active Users',
    key: 'totalUsers',
    changeKey: '0',
    icon: MdPeople,
    gradient: 'from-orange-500 to-amber-600',
    bgColor: 'bg-orange-50 dark:bg-orange-950/20',
    path: '/users',
  },
  {
    title: 'Total Revenue',
    key: 'totalRevenue',
    changeKey: 'revenueGrowth',
    icon: MdAttachMoney,
    gradient: 'from-green-500 to-emerald-600',
    bgColor: 'bg-green-50 dark:bg-green-950/20',
    format: (value: number) => `$${value.toLocaleString()}`,
  },
  {
    title: 'Monthly Revenue',
    key: 'monthlyRevenue',
    changeKey: 'revenueGrowth',
    icon: MdAttachMoney,
    gradient: 'from-teal-500 to-cyan-600',
    bgColor: 'bg-teal-50 dark:bg-teal-950/20',
    format: (value: number) => `$${value.toLocaleString()}`,
  },
];

const orgGrowthData = [
  { name: 'Jan', customer: 45, vendor: 32 },
  { name: 'Feb', customer: 52, vendor: 38 },
  { name: 'Mar', customer: 58, vendor: 42 },
  { name: 'Apr', customer: 65, vendor: 48 },
  { name: 'May', customer: 72, vendor: 55 },
  { name: 'Jun', customer: 80, vendor: 62 },
];

const licenseStatusData = [
  { name: 'Active', value: 65, color: '#10b981' },
  { name: 'Expired', value: 20, color: '#ef4444' },
  { name: 'Pending', value: 15, color: '#f59e0b' },
];

const monthlyActivityData = [
  { name: 'Mon', activities: 120 },
  { name: 'Tue', activities: 150 },
  { name: 'Wed', activities: 180 },
  { name: 'Thu', activities: 200 },
  { name: 'Fri', activities: 220 },
  { name: 'Sat', activities: 150 },
  { name: 'Sun', activities: 100 },
];

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomerOrgs: 0,
    totalVendorOrgs: 0,
    totalLicenses: 0,
    activeLicenses: 0,
    totalUsers: 0,
    customerOrgGrowth: 0,
    vendorOrgGrowth: 0,
    licenseGrowth: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    revenueGrowth: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRefreshed, setIsRefreshed] = useState(false);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      
      // Fetch customer organizations
      const customerRes = await fetch(`${API_URL}/api/v1/admin/customer-orgs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const customerData = await customerRes.json();
      const customerOrgs = customerData.success ? customerData.data?.length || 0 : 0;

      // Fetch vendor organizations
      const vendorRes = await fetch(`${API_URL}/api/v1/admin/vendor-orgs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const vendorData = await vendorRes.json();
      const vendorOrgs = vendorData.success ? vendorData.data?.length || 0 : 0;

      // Calculate growth (mock for now)
      setStats({
        totalCustomerOrgs: customerOrgs,
        totalVendorOrgs: vendorOrgs,
        totalLicenses: 85,
        activeLicenses: 65,
        totalUsers: 1234,
        customerOrgGrowth: 12.5,
        vendorOrgGrowth: 8.3,
        licenseGrowth: 15.2,
        totalRevenue: 2450000,
        monthlyRevenue: 185000,
        revenueGrowth: 18.5,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatChange = (change: number) => {
    const isPositive = change >= 0;
    const Icon = isPositive ? MdArrowUpward : MdArrowDownward;
    return (
      <div className={cn('flex items-center gap-1 text-sm font-semibold', 
        isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
      )}>
        <Icon className="w-4 h-4" />
        <span>{Math.abs(change)}%</span>
        <span className="text-gray-500 dark:text-gray-400 ml-1">vs last month</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
            Welcome back, {user?.firstName || 'User'}! 👋
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Here's what's happening with your platform today</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setIsRefreshing(true);
              setIsRefreshed(false);
              fetchDashboardStats();
              setTimeout(() => {
                setIsRefreshing(false);
                setIsRefreshed(true);
                // Hide tick mark after 2 seconds
                setTimeout(() => setIsRefreshed(false), 2000);
              }, 1000);
            }}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRefreshed ? (
              <MdCheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <MdRefresh className={cn('w-4 h-4', isRefreshing && 'animate-spin')} />
            )}
            {isRefreshed ? 'Up to date' : 'Refresh'}
          </button>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const value = stats[stat.key as keyof DashboardStats] as number;
          const change = stat.changeKey ? stats[stat.changeKey as keyof DashboardStats] as number : 0;
          const displayValue = stat.format ? stat.format(value) : value;
          
          return (
            <div
              key={index}
              onClick={() => stat.path && navigate(stat.path)}
              className={cn(
                'relative p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-all',
                stat.path && 'cursor-pointer',
                stat.bgColor
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{displayValue}</p>
                  {formatChange(change)}
                </div>
                <div className={cn('w-12 h-12 rounded-lg bg-gradient-to-br flex items-center justify-center shadow-md', stat.gradient)}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Quick Actions</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Common administrative tasks</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/users?create=true')}
            className="flex flex-col items-center gap-3 p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-950/30 dark:hover:to-indigo-950/30 transition-all group"
          >
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <MdPersonAdd className="w-6 h-6 text-white" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Add Admin User</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Create new admin user</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/organizations')}
            className="flex flex-col items-center gap-3 p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-950/30 dark:hover:to-pink-950/30 transition-all group"
          >
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <MdBusiness className="w-6 h-6 text-white" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Add Organization</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Create new organization</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/reports')}
            className="flex flex-col items-center gap-3 p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 hover:from-orange-100 hover:to-amber-100 dark:hover:from-orange-950/30 dark:hover:to-amber-950/30 transition-all group"
          >
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <MdDescription className="w-6 h-6 text-white" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Generate Report</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Create custom reports</p>
            </div>
          </button>

          <button
            onClick={() => navigate('/licenses')}
            className="flex flex-col items-center gap-3 p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 hover:from-emerald-100 hover:to-teal-100 dark:hover:from-emerald-950/30 dark:hover:to-teal-950/30 transition-all group"
          >
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <MdCardMembership className="w-6 h-6 text-white" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Manage Subscription</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">View and manage licenses</p>
            </div>
          </button>
        </div>
      </div>

      {/* Quick Actions & Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                <MdNotifications className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Pending Actions</h3>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-2">
                <MdWarning className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">License Expiring</span>
              </div>
              <span className="text-sm font-bold text-amber-600 dark:text-amber-400">5</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2">
                <MdSchedule className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">Onboarding Pending</span>
              </div>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">12</span>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
                <MdCheckCircle className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
            </div>
          </div>
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <p className="text-sm font-medium text-gray-900 dark:text-white">New organization added</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">2 hours ago</p>
            </div>
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <p className="text-sm font-medium text-gray-900 dark:text-white">License activated</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">5 hours ago</p>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-md">
                <MdTrendingUp className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Performance</h3>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">System Uptime</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">99.9%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '99.9%' }}></div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">API Response Time</span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">120ms</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '95%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Organization Growth */}
        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Organization Growth</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Customer vs Vendor organizations</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
              <MdTrendingUp className="w-5 h-5 text-white" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={orgGrowthData}>
              <defs>
                <linearGradient id="customerGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="vendorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Area type="monotone" dataKey="customer" stroke="#3b82f6" fill="url(#customerGradient)" strokeWidth={2} name="Customer Orgs" />
              <Area type="monotone" dataKey="vendor" stroke="#8b5cf6" fill="url(#vendorGradient)" strokeWidth={2} name="Vendor Orgs" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* License Status */}
        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">License Status</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Distribution of licenses</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
              <MdVpnKey className="w-5 h-5 text-white" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={licenseStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {licenseStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Activity Timeline */}
        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Weekly Activity</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Platform activity overview</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-md">
              <MdTrendingUp className="w-5 h-5 text-white" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthlyActivityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
              <XAxis dataKey="name" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                }}
              />
              <Line type="monotone" dataKey="activities" stroke="#f59e0b" strokeWidth={2} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}





