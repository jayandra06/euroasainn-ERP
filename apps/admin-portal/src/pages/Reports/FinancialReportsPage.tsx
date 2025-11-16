/**
 * Financial Reports Page
 * Profit & Loss, Balance Sheet, Cash Flow, Budget vs Actual, AR/AP Aging, Tax Reports
 */

import { useState } from 'react';
import { useToast } from '../../components/shared/Toast';
import {
  MdDescription,
  MdDownload,
  MdTrendingUp,
  MdTrendingDown,
  MdAccountBalance,
  MdPayment,
  MdReceipt,
  MdAssessment,
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

interface FinancialReport {
  id: string;
  name: string;
  description: string;
  icon: typeof MdDescription;
  category: 'income' | 'balance' | 'cashflow' | 'aging' | 'tax';
}

const financialReports: FinancialReport[] = [
  {
    id: 'profit-loss',
    name: 'Profit & Loss Statement',
    description: 'Income statement showing revenue, expenses, and net profit',
    icon: MdTrendingUp,
    category: 'income',
  },
  {
    id: 'balance-sheet',
    name: 'Balance Sheet',
    description: 'Assets, liabilities, and equity snapshot',
    icon: MdAccountBalance,
    category: 'balance',
  },
  {
    id: 'cash-flow',
    name: 'Cash Flow Analysis',
    description: 'Operating, investing, and financing cash flows',
    icon: MdPayment,
    category: 'cashflow',
  },
  {
    id: 'budget-actual',
    name: 'Budget vs Actual',
    description: 'Compare budgeted vs actual performance',
    icon: MdAssessment,
    category: 'income',
  },
  {
    id: 'ar-aging',
    name: 'Accounts Receivable Aging',
    description: 'Outstanding receivables by aging period',
    icon: MdReceipt,
    category: 'aging',
  },
  {
    id: 'ap-aging',
    name: 'Accounts Payable Aging',
    description: 'Outstanding payables by aging period',
    icon: MdPayment,
    category: 'aging',
  },
  {
    id: 'tax-summary',
    name: 'Tax & GST/VAT Summary',
    description: 'Tax obligations and compliance reports',
    icon: MdDescription,
    category: 'tax',
  },
  {
    id: 'forecast',
    name: 'Financial Forecasts',
    description: 'AI-based financial projections',
    icon: MdTrendingUp,
    category: 'income',
  },
];

// Mock data for demonstration
const profitLossData = [
  { period: 'Jan', revenue: 125000, expenses: 95000, profit: 30000 },
  { period: 'Feb', revenue: 135000, expenses: 98000, profit: 37000 },
  { period: 'Mar', revenue: 145000, expenses: 102000, profit: 43000 },
  { period: 'Apr', revenue: 155000, expenses: 105000, profit: 50000 },
  { period: 'May', revenue: 165000, expenses: 108000, profit: 57000 },
  { period: 'Jun', revenue: 175000, expenses: 110000, profit: 65000 },
];

const arAgingData = [
  { period: '0-30 days', amount: 45000, percentage: 45 },
  { period: '31-60 days', amount: 30000, percentage: 30 },
  { period: '61-90 days', amount: 15000, percentage: 15 },
  { period: '90+ days', amount: 10000, percentage: 10 },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function FinancialReportsPage() {
  const { showToast } = useToast();
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'month' | 'quarter' | 'year'>('month');

  const handleGenerateReport = (reportId: string) => {
    setSelectedReport(reportId);
    showToast(`Generating ${reportId} report...`, 'info');
    // TODO: Implement actual report generation
  };

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    showToast(`Exporting report as ${format.toUpperCase()}...`, 'info');
    // TODO: Implement export functionality
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Financial Reports</h1>
          <p className="text-gray-600 dark:text-gray-400">Comprehensive financial analysis and reporting</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as 'month' | 'quarter' | 'year')}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
          >
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      {/* Key Financial Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue (YTD)</p>
            <MdTrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">$1,050,000</p>
          <p className="text-xs text-emerald-600 mt-1">+12.5% from last year</p>
        </div>

        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Operating Expenses</p>
            <MdTrendingDown className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">$620,000</p>
          <p className="text-xs text-red-600 mt-1">+8.3% from last year</p>
        </div>

        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Profit Margin</p>
            <MdTrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">41.0%</p>
          <p className="text-xs text-emerald-600 mt-1">+2.1% from last year</p>
        </div>

        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Net Profit (YTD)</p>
            <MdTrendingUp className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">$430,000</p>
          <p className="text-xs text-emerald-600 mt-1">+15.2% from last year</p>
        </div>
      </div>

      {/* Report Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {financialReports.map((report) => {
          const Icon = report.icon;
          return (
            <div
              key={report.id}
              className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                  {report.category}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{report.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{report.description}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleGenerateReport(report.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg transition-colors font-semibold text-sm"
                >
                  <MdDescription className="w-4 h-4" />
                  Generate
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                >
                  <MdDownload className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Report Preview Section */}
      {selectedReport === 'profit-loss' && (
        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Profit & Loss Statement</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={profitLossData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="period" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" fill="#10b981" name="Revenue" />
              <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
              <Bar dataKey="profit" fill="#3b82f6" name="Profit" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {selectedReport === 'ar-aging' && (
        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Accounts Receivable Aging</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={arAgingData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="percentage"
                >
                  {arAgingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3">
              {arAgingData.map((item, index) => (
                <div key={index} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{item.period}</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">${item.amount.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: COLORS[index % COLORS.length],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}






