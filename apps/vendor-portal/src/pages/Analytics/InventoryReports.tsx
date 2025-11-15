/**
 * Inventory Reports
 * Current stock levels by category, reorder alerts, stock aging report, forecast demand chart
 */

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  MdInventory,
  MdWarning,
  MdTrendingUp,
  MdTrendingDown,
  MdCategory,
  MdSchedule,
} from 'react-icons/md';

// Mock data
const stockLevelsByCategory = [
  { category: 'Electronics', current: 0, min: 0, max: 0, reorder: 0 },
  { category: 'Furniture', current: 0, min: 0, max: 0, reorder: 0 },
  { category: 'Office Supplies', current: 0, min: 0, max: 0, reorder: 0 },
  { category: 'Raw Materials', current: 0, min: 0, max: 0, reorder: 0 },
  { category: 'Packaging', current: 0, min: 0, max: 0, reorder: 0 },
];

const reorderAlerts = [
  { item: 'Product A', category: 'Electronics', current: 0, reorderPoint: 0, daysUntilReorder: 0, priority: 'critical' },
  { item: 'Product B', category: 'Raw Materials', current: 0, reorderPoint: 0, daysUntilReorder: 0, priority: 'warning' },
  { item: 'Product C', category: 'Furniture', current: 0, reorderPoint: 0, daysUntilReorder: 0, priority: 'critical' },
];

const stockAgingData = [
  { item: 'Item A', category: 'Electronics', age: 0, quantity: 0, status: 'Fast-moving' },
  { item: 'Item B', category: 'Furniture', age: 0, quantity: 0, status: 'Slow-moving' },
  { item: 'Item C', category: 'Office Supplies', age: 0, quantity: 0, status: 'Fast-moving' },
  { item: 'Item D', category: 'Raw Materials', age: 0, quantity: 0, status: 'Slow-moving' },
  { item: 'Item E', category: 'Packaging', age: 0, quantity: 0, status: 'Fast-moving' },
];

const demandForecastData = [
  { month: 'Jan', forecast: 0, actual: 0, variance: 0 },
  { month: 'Feb', forecast: 0, actual: 0, variance: 0 },
  { month: 'Mar', forecast: 0, actual: 0, variance: 0 },
  { month: 'Apr', forecast: 0, actual: 0, variance: 0 },
  { month: 'May', forecast: 0, actual: 0, variance: 0 },
  { month: 'Jun', forecast: 0, actual: 0, variance: 0 },
];

const inventoryTrendData = [
  { month: 'Jan', stock: 0, turnover: 0 },
  { month: 'Feb', stock: 0, turnover: 0 },
  { month: 'Mar', stock: 0, turnover: 0 },
  { month: 'Apr', stock: 0, turnover: 0 },
  { month: 'May', stock: 0, turnover: 0 },
  { month: 'Jun', stock: 0, turnover: 0 },
];

export function InventoryReports() {
  const totalStock = stockLevelsByCategory.reduce((sum, item) => sum + item.current, 0);
  const criticalAlerts = reorderAlerts.filter((alert) => alert.priority === 'critical').length;
  const slowMovingItems = stockAgingData.filter((item) => item.status === 'Slow-moving').length;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300';
      case 'warning':
        return 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Stock</p>
            <MdInventory className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalStock.toLocaleString()}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Across all categories</p>
        </div>

        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Critical Alerts</p>
            <MdWarning className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{criticalAlerts}</p>
          <p className="text-xs text-red-600 mt-1">Requires immediate action</p>
        </div>

        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Slow-moving Items</p>
            <MdTrendingDown className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{slowMovingItems}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">May need promotion</p>
        </div>

        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Turnover</p>
            <MdTrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {inventoryTrendData[inventoryTrendData.length - 1]?.turnover.toFixed(1) || 0}
          </p>
          <p className="text-xs text-emerald-600 mt-1">+31% from last quarter</p>
        </div>
      </div>

      {/* Current Stock Levels by Category */}
      <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Current Stock Levels by Category</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Inventory levels and reorder points</p>
          </div>
          <MdCategory className="w-6 h-6 text-blue-600" />
        </div>
        <div className="space-y-4">
          {stockLevelsByCategory.map((category, index) => {
            const stockPercent = (category.current / category.max) * 100;
            const isLowStock = category.current <= category.reorder;
            
            return (
              <div key={index} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{category.category}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Current: {category.current} | Min: {category.min} | Max: {category.max} | Reorder: {category.reorder}
                    </p>
                  </div>
                  {isLowStock ? (
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300">
                      Low Stock
                    </span>
                  ) : (
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
                      In Stock
                    </span>
                  )}
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      isLowStock ? 'bg-red-600' : stockPercent > 80 ? 'bg-orange-600' : 'bg-emerald-600'
                    }`}
                    style={{ width: `${stockPercent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reorder Alerts (Below Threshold) */}
      <div className="p-6 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <MdWarning className="w-6 h-6 text-red-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Reorder Alerts (Below Threshold)</h3>
        </div>
        <div className="space-y-3">
          {reorderAlerts.map((alert, index) => (
            <div key={index} className="p-4 rounded-lg bg-white dark:bg-gray-900 border border-red-200 dark:border-red-800">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{alert.item}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Category: {alert.category} | Current: {alert.current} | Reorder Point: {alert.reorderPoint}
                  </p>
                </div>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getPriorityColor(alert.priority)}`}>
                  {alert.priority}
                </span>
              </div>
              <p className="text-xs text-red-600 mt-2">
                ⚠️ {alert.daysUntilReorder} day(s) until reorder point. Restock recommended.
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Stock Aging Report */}
      <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Stock Aging Report</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Slow vs fast-moving items</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stockAgingData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="item" stroke="#6b7280" angle={-45} textAnchor="end" height={100} />
            <YAxis stroke="#6b7280" />
            <Tooltip />
            <Legend />
            <Bar dataKey="quantity" fill="#3b82f6" name="Quantity" />
            <Bar dataKey="age" fill="#f59e0b" name="Age (days)" />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 space-y-2">
          {stockAgingData.map((item, index) => (
            <div key={index} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{item.item}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">({item.category})</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    Age: <span className="font-medium text-gray-900 dark:text-white">{item.age} days</span>
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    Qty: <span className="font-medium text-gray-900 dark:text-white">{item.quantity}</span>
                  </span>
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      item.status === 'Fast-moving'
                        ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300'
                        : 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Forecast Demand Chart */}
      <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Forecast Demand Chart</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Demand forecasting vs actual sales</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={demandForecastData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="forecast" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} name="Forecast" />
            <Area type="monotone" dataKey="actual" stroke="#10b981" fill="#10b981" fillOpacity={0.3} name="Actual" />
            <Line type="monotone" dataKey="variance" stroke="#f59e0b" strokeWidth={2} name="Variance" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Inventory Trend */}
      <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Inventory Trend</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Stock levels and turnover rate</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={inventoryTrendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" stroke="#6b7280" />
            <YAxis yAxisId="left" stroke="#6b7280" />
            <YAxis yAxisId="right" orientation="right" stroke="#6b7280" />
            <Tooltip />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="stock" stroke="#3b82f6" strokeWidth={2} name="Stock Level" />
            <Line yAxisId="right" type="monotone" dataKey="turnover" stroke="#10b981" strokeWidth={2} name="Turnover Rate" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}



