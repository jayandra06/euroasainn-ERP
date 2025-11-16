/**
 * Ultra-Modern Dashboard
 * World-Class SaaS ERP Platform Design
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  MdTrendingUp,
  MdAttachMoney,
  MdPeople,
  MdBusinessCenter,
  MdSpeed,
  MdArrowUpward,
  MdVpnKey,
  MdAdminPanelSettings,
  MdSettings,
} from 'react-icons/md';
import { HiOutlineDocumentText, HiOutlineUsers } from 'react-icons/hi';
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
} from 'recharts';
import { cn } from '../lib/utils';

const statCards = [
  {
    title: 'Total Revenue',
    value: '$0',
    change: '0%',
    icon: MdAttachMoney,
    gradient: 'from-emerald-500 to-teal-600',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/20',
  },
  {
    title: 'Active Users',
    value: '0',
    change: '0%',
    icon: MdPeople,
    gradient: 'from-blue-500 to-indigo-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/20',
  },
  {
    title: 'Performance',
    value: '0%',
    change: '0%',
    icon: MdSpeed,
    gradient: 'from-purple-500 to-pink-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950/20',
  },
  {
    title: 'Organizations',
    value: '0',
    change: '0%',
    icon: MdBusinessCenter,
    gradient: 'from-orange-500 to-amber-600',
    bgColor: 'bg-orange-50 dark:bg-orange-950/20',
  },
];

const quickAccessCards = [
  {
    title: 'Business Rules',
    description: 'Create and manage business logic workflows',
    icon: HiOutlineDocumentText,
    path: '/business-rules',
    gradient: 'from-blue-500 to-indigo-600',
    value: '0',
    trend: '0%',
  },
  {
    title: 'Users',
    description: 'Manage users and permissions',
    icon: HiOutlineUsers,
    path: '/users',
    gradient: 'from-emerald-500 to-teal-600',
    value: '0',
    trend: '0%',
  },
  {
    title: 'Organizations',
    description: 'Manage organizations and licenses',
    icon: MdBusinessCenter,
    path: '/organizations',
    gradient: 'from-purple-500 to-pink-600',
    value: '0',
    trend: '0%',
  },
  {
    title: 'Licenses',
    description: 'Manage license keys and permissions',
    icon: MdVpnKey,
    path: '/licenses',
    gradient: 'from-orange-500 to-amber-600',
    value: '0',
    trend: '0%',
  },
  {
    title: 'Admin Users',
    description: 'Manage admin user accounts',
    icon: MdAdminPanelSettings,
    path: '/admin-users',
    gradient: 'from-rose-500 to-red-600',
    value: '0',
    trend: '0%',
  },
  {
    title: 'Settings',
    description: 'Configure platform settings',
    icon: MdSettings,
    path: '/settings',
    gradient: 'from-gray-500 to-slate-600',
    value: '0',
    trend: '0%',
  },
];

const userGrowthData = [
  { name: 'Jan', users: 0 },
  { name: 'Feb', users: 0 },
  { name: 'Mar', users: 0 },
  { name: 'Apr', users: 0 },
  { name: 'May', users: 0 },
  { name: 'Jun', users: 0 },
];

const revenueData = [
  { name: 'Q1', revenue: 0 },
  { name: 'Q2', revenue: 0 },
  { name: 'Q3', revenue: 0 },
  { name: 'Q4', revenue: 0 },
];

const orgDistributionData = [
  { name: 'Tech', value: 0, color: '#3b82f6' },
  { name: 'Finance', value: 0, color: '#10b981' },
  { name: 'Healthcare', value: 0, color: '#8b5cf6' },
  { name: 'Education', value: 0, color: '#f59e0b' },
];

const activityData = [
  { name: 'Mon', activity: 0 },
  { name: 'Tue', activity: 0 },
  { name: 'Wed', activity: 0 },
  { name: 'Thu', activity: 0 },
  { name: 'Fri', activity: 0 },
  { name: 'Sat', activity: 0 },
  { name: 'Sun', activity: 0 },
];

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

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
          return (
            <div
              key={index}
              className={cn(
                'relative p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow',
                stat.bgColor
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{stat.value}</p>
                  <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-semibold">{stat.change}</span>
                    <span className="text-gray-500 dark:text-gray-400 ml-1">No data available</span>
                  </div>
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
        {/* User Growth */}
        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">User Growth</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Monthly user registration</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
              <MdTrendingUp className="w-5 h-5 text-white" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={userGrowthData}>
              <defs>
                <linearGradient id="userGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
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
              <Area
                type="monotone"
                dataKey="users"
                stroke="#3b82f6"
                fill="url(#userGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Overview */}
        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Revenue Overview</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Quarterly revenue analysis</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
              <MdAttachMoney className="w-5 h-5 text-white" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={revenueData}>
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
              <Bar dataKey="revenue" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Organization Distribution */}
        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Organization Distribution</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Industry sector breakdown</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-md">
              <MdBusinessCenter className="w-5 h-5 text-white" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={orgDistributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {orgDistributionData.map((entry, index) => (
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
        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Activity Timeline</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Weekly activity overview</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-md">
              <MdSpeed className="w-5 h-5 text-white" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={activityData}>
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
              <Line type="monotone" dataKey="activity" stroke="#f59e0b" strokeWidth={2} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Access */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Access</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickAccessCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={index}
                onClick={() => navigate(card.path)}
                className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={cn('w-12 h-12 rounded-lg bg-gradient-to-br flex items-center justify-center shadow-md group-hover:scale-110 transition-transform', card.gradient)}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 px-2 py-1 rounded">
                    {card.value} {card.title}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{card.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{card.description}</p>
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-800">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</span>
                  <div className="flex items-center gap-1 text-xs font-semibold text-gray-600 dark:text-gray-400">
                    <span>{card.trend}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
