import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MdStore, MdInventory, MdDescription, MdShoppingCart, MdRequestQuote, MdPeople, MdEmojiEmotions } from 'react-icons/md';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const cards = [
    {
      title: 'Catalogue',
      description: 'Manage catalogue items',
      icon: MdStore,
      path: '/catalogue',
      color: 'from-blue-500 to-indigo-600',
    },
    {
      title: 'Inventory',
      description: 'Manage inventory stock',
      icon: MdInventory,
      path: '/inventory',
      color: 'from-purple-500 to-pink-600',
    },
    {
      title: 'Quotations',
      description: 'Manage quotations',
      icon: MdDescription,
      path: '/quotations',
      color: 'from-emerald-500 to-teal-600',
    },
    {
      title: 'Items',
      description: 'Manage items',
      icon: MdShoppingCart,
      path: '/items',
      color: 'from-orange-500 to-amber-600',
    },
  ];

  // Chart data
  const monthlyData = [
    { name: 'Jan', value: 0 },
    { name: 'Feb', value: 0 },
    { name: 'Mar', value: 0 },
    { name: 'Apr', value: 0 },
    { name: 'May', value: 0 },
    { name: 'Jun', value: 0 },
  ];

  const visitorData = [
    { name: 'Jan', visitors: 0 },
    { name: 'Feb', visitors: 0 },
    { name: 'Mar', visitors: 0 },
    { name: 'Apr', visitors: 0 },
    { name: 'May', visitors: 0 },
    { name: 'Jun', visitors: 0 },
  ];

  return (
    <div className="w-full min-h-screen p-8 space-y-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-[hsl(var(--foreground))] mb-2">
          Welcome back, {user?.firstName || 'Vendor'}! 👋
        </h1>
        <p className="text-lg text-[hsl(var(--muted-foreground))]">
          Vendor Portal Dashboard
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-1">Total RFQs Received</p>
              <p className="text-2xl font-bold text-[hsl(var(--foreground))]">0</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Updated Now</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
              <MdRequestQuote className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-1">Total Sub Merchants</p>
              <p className="text-2xl font-bold text-[hsl(var(--foreground))]">0</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Updated Now</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
              <MdPeople className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-1">Total Happy Employees</p>
              <p className="text-2xl font-bold text-[hsl(var(--foreground))]">0</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Updated Now</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-md">
              <MdEmojiEmotions className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-[hsl(var(--foreground))] mb-6">Dashboard</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart */}
          <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">Bar Chart - Multiple</h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">January - June 2024</p>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))',
                  }}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 text-sm text-[hsl(var(--muted-foreground))]">
              <p>Trending up by 5.2% this month</p>
              <p className="text-xs text-[hsl(var(--foreground))] font-semibold">Showing total visitors for the last 6 months</p>
            </div>
          </div>

          {/* Area Chart */}
          <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">Area Chart - Gradient</h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Showing total visitors for the last 6 months</p>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={visitorData}>
                <defs>
                  <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="visitors"
                  stroke="#6366f1"
                  fillOpacity={1}
                  fill="url(#colorVisitors)"
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className="mt-4 text-sm text-[hsl(var(--muted-foreground))]">
              <p>Trending up by 5.2% this month</p>
              <p className="text-xs text-[hsl(var(--foreground))] font-semibold">January - June 2024</p>
            </div>
          </div>
        </div>
      </div>

      {/* Existing Quick Access Cards */}
      <div>
        <h2 className="text-2xl font-bold text-[hsl(var(--foreground))] mb-6">Quick Access</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={index}
                onClick={() => navigate(card.path)}
                className="p-6 rounded-2xl bg-[hsl(var(--card))]/80 backdrop-blur-xl border border-[hsl(var(--border))]/50 shadow-lg hover:shadow-xl transition-all cursor-pointer"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-[hsl(var(--foreground))] mb-2">
                  {card.title}
                </h3>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  {card.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}






