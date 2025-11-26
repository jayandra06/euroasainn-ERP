/**
 * Transaction & Operations Reports Page
 * Sales vs Purchase, Order lifecycle, Refunds/Cancellations, Department costs
 */

import { useState } from 'react';
import { useToast } from '../../components/shared/Toast';
import {
  MdShoppingCart,
  MdTrendingUp,
  MdTrendingDown,
  MdCancel,
  MdReceipt,
  MdBusiness,
  MdDownload,
} from 'react-icons/md';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

// Mock data
const salesVsPurchaseData = [
  { month: 'Jan', sales: 125000, purchases: 95000, net: 30000 },
  { month: 'Feb', sales: 135000, purchases: 98000, net: 37000 },
  { month: 'Mar', sales: 145000, purchases: 102000, net: 43000 },
  { month: 'Apr', sales: 155000, purchases: 105000, net: 50000 },
  { month: 'May', sales: 165000, purchases: 108000, net: 57000 },
  { month: 'Jun', sales: 175000, purchases: 110000, net: 65000 },
];

const orderLifecycleData = [
  { stage: 'Created', count: 1250, percentage: 100 },
  { stage: 'Confirmed', count: 1180, percentage: 94.4 },
  { stage: 'Processing', count: 1050, percentage: 84 },
  { stage: 'Shipped', count: 980, percentage: 78.4 },
  { stage: 'Delivered', count: 920, percentage: 73.6 },
  { stage: 'Invoiced', count: 900, percentage: 72 },
];

const refundCancellationData = [
  { type: 'Refunds', count: 45, amount: 12500, trend: -5.2 },
  { type: 'Cancellations', count: 32, amount: 8900, trend: -8.1 },
  { type: 'Discounts', count: 120, amount: 15600, trend: +12.3 },
];

const departmentCostsData = [
  { department: 'Sales', cost: 45000, budget: 50000, variance: -10 },
  { department: 'Operations', cost: 38000, budget: 40000, variance: -5 },
  { department: 'IT', cost: 32000, budget: 30000, variance: +6.7 },
  { department: 'HR', cost: 28000, budget: 30000, variance: -6.7 },
  { department: 'Finance', cost: 25000, budget: 25000, variance: 0 },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function TransactionReportsPage() {
  const { showToast } = useToast();
  const [dateRange, setDateRange] = useState<'month' | 'quarter' | 'year'>('month');

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    showToast(`Exporting transaction report as ${format.toUpperCase()}...`, 'info');
    // TODO: Implement export functionality
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[hsl(var(--foreground))] mb-1">Transaction & Operations Reports</h1>
          <p className="text-[hsl(var(--muted-foreground))]">Sales, purchases, order lifecycle, and operational analytics</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as 'month' | 'quarter' | 'year')}
            className="px-4 py-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] text-sm"
          >
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <button
            onClick={() => handleExport('pdf')}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-colors font-semibold text-sm"
          >
            <MdDownload className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Total Sales</p>
            <MdTrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]">$895,000</p>
          <p className="text-xs text-emerald-600 mt-1">+15.2% from last period</p>
        </div>

        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Total Purchases</p>
            <MdShoppingCart className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]">$620,000</p>
          <p className="text-xs text-emerald-600 mt-1">+8.3% from last period</p>
        </div>

        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Net Revenue</p>
            <MdReceipt className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]">$275,000</p>
          <p className="text-xs text-emerald-600 mt-1">+22.5% from last period</p>
        </div>

        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Order Completion Rate</p>
            <MdTrendingUp className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]">72.0%</p>
          <p className="text-xs text-emerald-600 mt-1">+3.2% from last period</p>
        </div>
      </div>

      {/* Sales vs Purchase Comparison */}
      <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">Sales vs Purchase Comparison</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Monthly sales and purchase trends</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={salesVsPurchaseData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip />
            <Legend />
            <Bar dataKey="sales" fill="#10b981" name="Sales" />
            <Bar dataKey="purchases" fill="#ef4444" name="Purchases" />
            <Bar dataKey="net" fill="#3b82f6" name="Net Revenue" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Order Lifecycle Analytics */}
      <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">Order Lifecycle Analytics</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">From creation → invoice → delivery</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={orderLifecycleData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="stage" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} name="Orders" />
            <Line type="monotone" dataKey="percentage" stroke="#10b981" strokeWidth={2} name="Completion %" />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {orderLifecycleData.map((stage, index) => (
            <div key={index} className="p-3 rounded-lg bg-[hsl(var(--secondary))] text-center">
              <p className="text-xs font-medium text-[hsl(var(--muted-foreground))] mb-1">{stage.stage}</p>
              <p className="text-lg font-bold text-[hsl(var(--foreground))]">{stage.count}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">{stage.percentage}%</p>
            </div>
          ))}
        </div>
      </div>

      {/* Refunds, Cancellations, and Discounts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {refundCancellationData.map((item, index) => (
          <div key={index} className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-[hsl(var(--foreground))]">{item.type}</h4>
              {item.trend > 0 ? (
                <MdTrendingUp className="w-5 h-5 text-emerald-600" />
              ) : (
                <MdTrendingDown className="w-5 h-5 text-red-600" />
              )}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-[hsl(var(--muted-foreground))]">Count:</span>
                <span className="text-sm font-semibold text-[hsl(var(--foreground))]">{item.count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[hsl(var(--muted-foreground))]">Amount:</span>
                <span className="text-sm font-semibold text-[hsl(var(--foreground))]">${item.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[hsl(var(--muted-foreground))]">Trend:</span>
                <span className={`text-sm font-semibold ${item.trend > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {item.trend > 0 ? '+' : ''}{item.trend}%
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Department-wise Operational Costs */}
      <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">Department-wise Operational Costs</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Budget vs actual comparison</p>
          </div>
        </div>
        <div className="space-y-4">
          {departmentCostsData.map((dept, index) => (
            <div key={index} className="p-4 rounded-lg bg-[hsl(var(--secondary))]">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-[hsl(var(--foreground))]">{dept.department}</h4>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-[hsl(var(--muted-foreground))]">
                    Budget: <span className="font-medium text-[hsl(var(--foreground))]">${dept.budget.toLocaleString()}</span>
                  </span>
                  <span className="text-[hsl(var(--muted-foreground))]">
                    Actual: <span className="font-medium text-[hsl(var(--foreground))]">${dept.cost.toLocaleString()}</span>
                  </span>
                  <span className={`font-semibold ${dept.variance >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {dept.variance >= 0 ? '+' : ''}{dept.variance}%
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${dept.variance >= 0 ? 'bg-red-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.abs(dept.variance) + 50}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}











