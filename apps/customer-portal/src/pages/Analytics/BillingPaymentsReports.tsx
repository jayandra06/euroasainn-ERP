/**
 * Billing & Payments Reports
 * Invoice summary, payment methods, delay days, auto-pay, credit utilization
 */

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
  MdPayment,
  MdReceipt,
  MdCreditCard,
  MdAccountBalance,
  MdSchedule,
  MdCheckCircle,
} from 'react-icons/md';

// Mock data
const invoiceSummaryData = [
  { status: 'Paid', count: 0, amount: 0, color: '#10b981' },
  { status: 'Unpaid', count: 0, amount: 0, color: '#f59e0b' },
  { status: 'Overdue', count: 0, amount: 0, color: '#ef4444' },
];

const paymentMethodsData = [
  { method: 'Credit Card', usage: 0, amount: 0, transactions: 0 },
  { method: 'UPI', usage: 0, amount: 0, transactions: 0 },
  { method: 'Bank Transfer', usage: 0, amount: 0, transactions: 0 },
];

const paymentDelayData = [
  { month: 'Jan', avgDelay: 0, maxDelay: 0 },
  { month: 'Feb', avgDelay: 0, maxDelay: 0 },
  { month: 'Mar', avgDelay: 0, maxDelay: 0 },
  { month: 'Apr', avgDelay: 0, maxDelay: 0 },
  { month: 'May', avgDelay: 0, maxDelay: 0 },
  { month: 'Jun', avgDelay: 0, maxDelay: 0 },
];

const autoPayData = [
  { month: 'Jan', enabled: 0, active: 0 },
  { month: 'Feb', enabled: 0, active: 0 },
  { month: 'Mar', enabled: 0, active: 0 },
  { month: 'Apr', enabled: 0, active: 0 },
  { month: 'May', enabled: 0, active: 0 },
  { month: 'Jun', enabled: 0, active: 0 },
];

const creditUtilizationData = [
  { month: 'Jan', used: 0, limit: 0, utilization: 0 },
  { month: 'Feb', used: 0, limit: 0, utilization: 0 },
  { month: 'Mar', used: 0, limit: 0, utilization: 0 },
  { month: 'Apr', used: 0, limit: 0, utilization: 0 },
  { month: 'May', used: 0, limit: 0, utilization: 0 },
  { month: 'Jun', used: 0, limit: 0, utilization: 0 },
];

const subscriptionDetails = [
  { plan: 'Premium Plan', amount: 0, frequency: 'Monthly', nextBilling: '2024-03-01', status: 'Active' },
  { plan: 'Add-on Service', amount: 0, frequency: 'Monthly', nextBilling: '2024-03-01', status: 'Active' },
];

export function BillingPaymentsReports() {
  const totalInvoices = invoiceSummaryData.reduce((sum, item) => sum + item.count, 0);
  const totalAmount = invoiceSummaryData.reduce((sum, item) => sum + item.amount, 0);
  const unpaidAmount = invoiceSummaryData.find((i) => i.status === 'Unpaid')?.amount || 0;
  const overdueAmount = invoiceSummaryData.find((i) => i.status === 'Overdue')?.amount || 0;
  const avgDelayDays = (paymentDelayData.reduce((sum, item) => sum + item.avgDelay, 0) / paymentDelayData.length).toFixed(1);
  const currentUtilization = creditUtilizationData[creditUtilizationData.length - 1]?.utilization || 0;

  return (
    <div className="w-full space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Invoices</p>
            <MdReceipt className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalInvoices}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">${totalAmount.toLocaleString()} total</p>
        </div>

        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Unpaid Amount</p>
            <MdSchedule className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">${unpaidAmount.toLocaleString()}</p>
          <p className="text-xs text-orange-600 mt-1">Requires payment</p>
        </div>

        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Overdue Amount</p>
            <MdPayment className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">${overdueAmount.toLocaleString()}</p>
          <p className="text-xs text-red-600 mt-1">Immediate attention</p>
        </div>

        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Payment Delay</p>
            <MdSchedule className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{avgDelayDays} days</p>
          <p className="text-xs text-emerald-600 mt-1">0% from last quarter</p>
        </div>
      </div>

      {/* Invoice Summary */}
      <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Invoice Summary</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Paid, unpaid, and overdue invoices</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={invoiceSummaryData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={100}
              fill="#8884d8"
              dataKey="count"
              label={({ status, count, amount, percent }) => 
                `${status}: ${count} ($${amount.toLocaleString()}, ${(percent * 100).toFixed(0)}%)`
              }
            >
              {invoiceSummaryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Payment Methods Usage */}
      <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Payment Methods Usage</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Card, UPI, and bank transfer usage</p>
          </div>
          <MdCreditCard className="w-6 h-6 text-blue-600" />
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={paymentMethodsData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="method" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip />
            <Legend />
            <Bar dataKey="usage" fill="#3b82f6" name="Usage %" />
            <Bar dataKey="amount" fill="#10b981" name="Amount ($)" />
            <Bar dataKey="transactions" fill="#8b5cf6" name="Transactions" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Average Payment Delay Days */}
      <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Average Payment Delay Days</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Payment delay trends over time</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={paymentDelayData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="avgDelay" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} name="Avg Delay (days)" />
            <Area type="monotone" dataKey="maxDelay" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} name="Max Delay (days)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Auto-pay / Subscription Details */}
      <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Auto-pay / Subscription Details</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Active subscriptions and auto-pay status</p>
          </div>
          <MdCheckCircle className="w-6 h-6 text-emerald-600" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Active Subscriptions</h4>
            <div className="space-y-3">
              {subscriptionDetails.map((sub, index) => (
                <div key={index} className="p-3 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900 dark:text-white">{sub.plan}</span>
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
                      {sub.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    ${sub.amount}/{sub.frequency} | Next billing: {sub.nextBilling}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Auto-pay Trends</h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={autoPayData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="enabled" stroke="#3b82f6" strokeWidth={2} name="Enabled" />
                <Line type="monotone" dataKey="active" stroke="#10b981" strokeWidth={2} name="Active" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Credit Utilization Reports */}
      <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Credit Utilization Reports</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Monthly credit usage and limits</p>
          </div>
          <MdAccountBalance className="w-6 h-6 text-purple-600" />
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={creditUtilizationData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip />
            <Legend />
            <Bar dataKey="used" fill="#3b82f6" name="Used ($)" />
            <Bar dataKey="limit" fill="#e5e7eb" name="Limit ($)" />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900 dark:text-white">Current Utilization</span>
            <span className={`text-lg font-bold ${currentUtilization > 80 ? 'text-red-600' : currentUtilization > 60 ? 'text-orange-600' : 'text-emerald-600'}`}>
              {currentUtilization}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
            <div
              className={`h-2 rounded-full ${
                currentUtilization > 80 ? 'bg-red-600' : currentUtilization > 60 ? 'bg-orange-600' : 'bg-emerald-600'
              }`}
              style={{ width: `${currentUtilization}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}



