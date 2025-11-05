/**
 * Ultra-Modern Admin Dashboard
 * World-Class SaaS ERP Platform Design
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
}

const statCards = [
  {
    title: 'Customer Organizations',
    key: 'totalCustomerOrgs',
    changeKey: 'customerOrgGrowth',
    icon: MdBusinessCenter,
    gradient: 'from-blue-500 to-indigo-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    path: '/customer-organizations',
  },
  {
    title: 'Vendor Organizations',
    key: 'totalVendorOrgs',
    changeKey: 'vendorOrgGrowth',
    icon: MdBusinessCenter,
    gradient: 'from-purple-500 to-pink-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950/20',
    path: '/vendor-organizations',
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
  });
  const [loading, setLoading] = useState(true);

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
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          const value = stats[stat.key as keyof DashboardStats] as number;
          const change = stat.changeKey ? stats[stat.changeKey as keyof DashboardStats] as number : 0;
          
          return (
            <div
              key={index}
              onClick={() => stat.path && navigate(stat.path)}
              className={cn(
                'relative p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-all cursor-pointer',
                stat.bgColor,
                stat.path && 'cursor-pointer'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{value}</p>
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
