/**
 * Ultra-Modern Admin Dashboard
 * World-Class SaaS ERP Platform Design
 * Enhanced with new widgets and improved organization
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  MdBusinessCenter,
  MdPeople,
  MdVpnKey,
  MdRefresh,
  MdCheckCircle,
  MdPersonAdd,
  MdBusiness,
  MdDescription,
  MdCardMembership,
  MdTrendingUp,
  MdTimeline,
  MdInfo,
} from 'react-icons/md';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  LineChart,
  Line,
} from 'recharts';
import { cn } from '../lib/utils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface DashboardStats {
  totalCustomerOrgs: number;
  totalVendorOrgs: number;
  totalLicenses: number;
  activeLicenses: number;
  totalUsers: number;
}

interface TrendDataPoint {
  name: string;
  customers: number;
  vendors: number;
}

interface LicenseDataPoint {
  name: string;
  active: number;
  inactive: number;
}

interface UserActivityPoint {
  name: string;
  admins: number;
  invites: number;
}

const statCards: Array<{
  title: string;
  key: keyof DashboardStats;
  icon: typeof MdBusinessCenter;
  gradient: string;
  bgColor: string;
  path?: string;
  format?: (value: number) => string;
}> = [
  {
    title: 'Customer Organizations',
    key: 'totalCustomerOrgs',
    icon: MdBusinessCenter,
    gradient: 'from-blue-500 to-indigo-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    path: '/organizations',
  },
  {
    title: 'Vendor Organizations',
    key: 'totalVendorOrgs',
    icon: MdBusinessCenter,
    gradient: 'from-purple-500 to-pink-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950/20',
    path: '/organizations',
  },
  {
    title: 'Total Licenses',
    key: 'totalLicenses',
    icon: MdVpnKey,
    gradient: 'from-emerald-500 to-teal-600',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/20',
    path: '/licenses',
  },
  {
    title: 'Active Licenses',
    key: 'activeLicenses',
    icon: MdVpnKey,
    gradient: 'from-emerald-500 to-teal-600',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/20',
    path: '/licenses',
  },
  {
    title: 'Admin Users',
    key: 'totalUsers',
    icon: MdPeople,
    gradient: 'from-orange-500 to-amber-600',
    bgColor: 'bg-orange-50 dark:bg-orange-950/20',
    path: '/users',
  },
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
  });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRefreshed, setIsRefreshed] = useState(false);
  const [orgTrend, setOrgTrend] = useState<TrendDataPoint[]>([]);
  const [licenseTrend, setLicenseTrend] = useState<LicenseDataPoint[]>([]);
  const [userTrend, setUserTrend] = useState<UserActivityPoint[]>([]);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setStats({
          totalCustomerOrgs: 0,
          totalVendorOrgs: 0,
          totalLicenses: 0,
          activeLicenses: 0,
          totalUsers: 0,
        });
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      const [customerRes, vendorRes, licenseRes, userRes] = await Promise.all([
        fetch(`${API_URL}/api/v1/admin/customer-orgs`, { headers }),
        fetch(`${API_URL}/api/v1/admin/vendor-orgs`, { headers }),
        fetch(`${API_URL}/api/v1/admin/licenses`, { headers }),
        fetch(`${API_URL}/api/v1/admin/users`, { headers }),
      ]);

      const [customerData, vendorData, licenseData, userData] = await Promise.all([
        customerRes.json().catch(() => null),
        vendorRes.json().catch(() => null),
        licenseRes.json().catch(() => null),
        userRes.json().catch(() => null),
      ]);

      const customerOrgs = customerRes.ok && customerData?.success && Array.isArray(customerData.data)
        ? customerData.data.length
        : 0;

      const vendorOrgs = vendorRes.ok && vendorData?.success && Array.isArray(vendorData.data)
        ? vendorData.data.length
        : 0;

      const licenses = licenseRes.ok && licenseData?.success && Array.isArray(licenseData.data)
        ? licenseData.data
        : [];

      const users = userRes.ok && userData?.success && Array.isArray(userData.data)
        ? userData.data
        : [];

      setStats({
        totalCustomerOrgs: customerOrgs,
        totalVendorOrgs: vendorOrgs,
        totalLicenses: licenses.length,
        activeLicenses: licenses.filter((license: any) => license.status === 'ACTIVE').length,
        totalUsers: users.length,
      });

      const buildMonthlyBuckets = () => {
        const months = Array.from({ length: 6 }).map((_, idx) => {
          const date = new Date();
          date.setMonth(date.getMonth() - (5 - idx));
          return {
            key: `${date.getFullYear()}-${date.getMonth() + 1}`,
            label: date.toLocaleDateString('en-US', { month: 'short' }),
          };
        });

        const bucketOrgs = (items: any[]) =>
          months.map((month) => (
            items.filter((item) => {
              const createdAt = item.createdAt ? new Date(item.createdAt) : null;
              if (!createdAt) return false;
              return (
                createdAt.getFullYear() === Number(month.key.split('-')[0]) &&
                createdAt.getMonth() + 1 === Number(month.key.split('-')[1])
              );
            }).length
          ));

        const customerBuckets = bucketOrgs(customerData?.data || []);
        const vendorBuckets = bucketOrgs(vendorData?.data || []);

        setOrgTrend(
          months.map((month, idx) => ({
            name: month.label,
            customers: customerBuckets[idx] ?? 0,
            vendors: vendorBuckets[idx] ?? 0,
          }))
        );

        const licenseBucketsActive = months.map((month) =>
          licenses.filter((license: any) => {
            const issued = license.issuedAt || license.createdAt;
            const createdAt = issued ? new Date(issued) : null;
            if (!createdAt) return false;
            const [year, monthIdx] = month.key.split('-');
            return (
              createdAt.getFullYear() === Number(year) &&
              createdAt.getMonth() + 1 === Number(monthIdx) &&
              license.status === 'ACTIVE'
            );
          }).length
        );

        const licenseBucketsInactive = months.map((month) =>
          licenses.filter((license: any) => {
            const issued = license.issuedAt || license.createdAt;
            const createdAt = issued ? new Date(issued) : null;
            if (!createdAt) return false;
            const [year, monthIdx] = month.key.split('-');
            return (
              createdAt.getFullYear() === Number(year) &&
              createdAt.getMonth() + 1 === Number(monthIdx) &&
              license.status !== 'ACTIVE'
            );
          }).length
        );

        setLicenseTrend(
          months.map((month, idx) => ({
            name: month.label,
            active: licenseBucketsActive[idx] ?? 0,
            inactive: licenseBucketsInactive[idx] ?? 0,
          }))
        );

        const userBuckets = months.map((month) =>
          users.filter((user: any) => {
            const createdAt = user.createdAt ? new Date(user.createdAt) : null;
            if (!createdAt) return false;
            const [year, monthIdx] = month.key.split('-');
            return (
              createdAt.getFullYear() === Number(year) &&
              createdAt.getMonth() + 1 === Number(monthIdx)
            );
          }).length
        );

        const inviteBuckets = months.map((month) =>
          users.filter((user: any) => {
            const invitedAt = user.invitedAt ? new Date(user.invitedAt) : null;
            if (!invitedAt) return false;
            const [year, monthIdx] = month.key.split('-');
            return (
              invitedAt.getFullYear() === Number(year) &&
              invitedAt.getMonth() + 1 === Number(monthIdx)
            );
          }).length
        );

        setUserTrend(
          months.map((month, idx) => ({
            name: month.label,
            admins: userBuckets[idx] ?? 0,
            invites: inviteBuckets[idx] ?? 0,
          }))
        );
      };

      buildMonthlyBuckets();
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
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
            onClick={() => navigate('/users/new')}
            className="flex flex-col items-center gap-3 p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-950/30 dark:hover:to-indigo-950/30 transition-all group"
          >
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <MdPersonAdd className="w-6 h-6 text-white" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Add User</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Invite a new admin user</p>
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

    {/* Charts Grid */}
    <div className="grid grid-cols-1 2xl:grid-cols-3 gap-4">
      <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Organization Trend</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">New orgs created by portal (last 6 months)</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
            <MdTrendingUp className="w-5 h-5 text-white" />
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={orgTrend}>
            <defs>
              <linearGradient id="orgCustomers" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="orgVendors" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="dark:stroke-gray-700" />
            <XAxis dataKey="name" stroke="#6b7280" />
            <YAxis stroke="#6b7280" allowDecimals={false} />
            <Tooltip contentStyle={{ borderRadius: 8 }} />
            <Legend />
            <Area type="monotone" dataKey="customers" stroke="#3b82f6" fill="url(#orgCustomers)" strokeWidth={2} name="Customers" />
            <Area type="monotone" dataKey="vendors" stroke="#8b5cf6" fill="url(#orgVendors)" strokeWidth={2} name="Vendors" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">License Activity</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Active vs inactive licenses issued (last 6 months)</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
            <MdCardMembership className="w-5 h-5 text-white" />
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={licenseTrend}>
            <CartesianGrid strokeDasharray="3 3" className="dark:stroke-gray-700" />
            <XAxis dataKey="name" stroke="#6b7280" />
            <YAxis stroke="#6b7280" allowDecimals={false} />
            <Tooltip contentStyle={{ borderRadius: 8 }} />
            <Legend />
            <Bar dataKey="active" stackId="a" fill="#10b981" name="Active" radius={[6, 6, 0, 0]} />
            <Bar dataKey="inactive" stackId="a" fill="#f97316" name="Inactive" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">User Timeline</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Admins created vs invitations sent (last 6 months)</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-md">
            <MdTimeline className="w-5 h-5 text-white" />
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={userTrend}>
            <CartesianGrid strokeDasharray="3 3" className="dark:stroke-gray-700" />
            <XAxis dataKey="name" stroke="#6b7280" />
            <YAxis stroke="#6b7280" allowDecimals={false} />
            <Tooltip contentStyle={{ borderRadius: 8 }} />
            <Legend />
            <Line type="monotone" dataKey="admins" stroke="#3b82f6" strokeWidth={2} dot radius={4} name="Admins" />
            <Line type="monotone" dataKey="invites" stroke="#facc15" strokeWidth={2} dot radius={4} name="Invites" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
);
}



