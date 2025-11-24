/**
 * Order & Delivery Reports
 * Order history, fulfillment rate, pending/delayed orders, cancellation trends, delivery tracking
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
  MdShoppingCart,
  MdCheckCircle,
  MdSchedule,
  MdWarning,
  MdCancel,
  MdLocalShipping,
} from 'react-icons/md';

// Mock data
const orderHistoryData = [
  { date: '2024-01-15', orders: 0, completed: 0, pending: 0 },
  { date: '2024-01-22', orders: 0, completed: 0, pending: 0 },
  { date: '2024-01-29', orders: 0, completed: 0, pending: 0 },
  { date: '2024-02-05', orders: 0, completed: 0, pending: 0 },
  { date: '2024-02-12', orders: 0, completed: 0, pending: 0 },
];

const fulfillmentRateData = [
  { month: 'Jan', onTime: 0, delayed: 0 },
  { month: 'Feb', onTime: 0, delayed: 0 },
  { month: 'Mar', onTime: 0, delayed: 0 },
  { month: 'Apr', onTime: 0, delayed: 0 },
  { month: 'May', onTime: 0, delayed: 0 },
  { month: 'Jun', onTime: 0, delayed: 0 },
];

const pendingOrders = [
  { orderId: 'ORD-2024-001', date: '2024-02-08', status: 'Processing', expectedDelivery: '2024-02-15', amount: 0 },
  { orderId: 'ORD-2024-002', date: '2024-02-09', status: 'Shipped', expectedDelivery: '2024-02-12', amount: 0 },
  { orderId: 'ORD-2024-003', date: '2024-02-10', status: 'In Transit', expectedDelivery: '2024-02-14', amount: 0 },
];

const delayedOrders = [
  { orderId: 'ORD-2024-004', date: '2024-01-25', status: 'Delayed', originalDelivery: '2024-02-05', newDelivery: '2024-02-08', reason: 'Weather conditions' },
  { orderId: 'ORD-2024-005', date: '2024-01-28', status: 'Delayed', originalDelivery: '2024-02-06', newDelivery: '2024-02-10', reason: 'Logistics delay' },
];

const cancellationTrendData = [
  { month: 'Jan', cancelled: 0, total: 0, rate: 0 },
  { month: 'Feb', cancelled: 0, total: 0, rate: 0 },
  { month: 'Mar', cancelled: 0, total: 0, rate: 0 },
  { month: 'Apr', cancelled: 0, total: 0, rate: 0 },
  { month: 'May', cancelled: 0, total: 0, rate: 0 },
  { month: 'Jun', cancelled: 0, total: 0, rate: 0 },
];

const deliveryTrackingData = [
  { orderId: 'ORD-2024-001', status: 'Shipped', currentLocation: 'Distribution Center', eta: '2024-02-15', progress: 0 },
  { orderId: 'ORD-2024-002', status: 'In Transit', currentLocation: 'In Route', eta: '2024-02-12', progress: 0 },
  { orderId: 'ORD-2024-003', status: 'Out for Delivery', currentLocation: 'Local Facility', eta: '2024-02-14', progress: 0 },
];

const orderStatusData = [
  { status: 'Completed', count: 0, color: '#10b981' },
  { status: 'Pending', count: 0, color: '#f59e0b' },
  { status: 'Delayed', count: 0, color: '#ef4444' },
  { status: 'Cancelled', count: 0, color: '#6b7280' },
];

export function OrderDeliveryReports() {
  const totalOrders = orderHistoryData.reduce((sum, item) => sum + item.orders, 0);
  const totalCompleted = orderHistoryData.reduce((sum, item) => sum + item.completed, 0);
  const fulfillmentRate = ((totalCompleted / totalOrders) * 100).toFixed(1);
  const currentFulfillmentRate = fulfillmentRateData[fulfillmentRateData.length - 1]?.onTime || 0;

  return (
    <div className="w-full space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Orders</p>
            <MdShoppingCart className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{totalOrders}</p>
          <p className="text-xs text-[hsl(var(--foreground))] font-semibold mt-1">Last 5 weeks</p>
        </div>

        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Fulfillment Rate</p>
            <MdCheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{fulfillmentRate}%</p>
          <p className="text-xs text-emerald-600 mt-1">0% from last quarter</p>
        </div>

        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Orders</p>
            <MdSchedule className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{pendingOrders.length}</p>
          <p className="text-xs text-[hsl(var(--foreground))] font-semibold mt-1">Requires attention</p>
        </div>

        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Delayed Orders</p>
            <MdWarning className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{delayedOrders.length}</p>
          <p className="text-xs text-emerald-600 mt-1">-40% from last month</p>
        </div>
      </div>

      {/* Order History */}
      <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">Order History</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Orders with date filters</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={orderHistoryData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="date" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip />
            <Legend />
            <Bar dataKey="orders" fill="#3b82f6" name="Total Orders" />
            <Bar dataKey="completed" fill="#10b981" name="Completed" />
            <Bar dataKey="pending" fill="#f59e0b" name="Pending" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Fulfillment Rate */}
      <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">Order Fulfillment Rate</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">% Completed on time</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={fulfillmentRateData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" stroke="#6b7280" />
            <YAxis domain={[90, 100]} stroke="#6b7280" />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="onTime" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="On Time %" />
            <Area type="monotone" dataKey="delayed" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} name="Delayed %" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Pending Orders */}
      <div className="p-6 rounded-xl border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <MdSchedule className="w-6 h-6 text-orange-600" />
          <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">Pending Orders</h3>
        </div>
        <div className="space-y-3">
          {pendingOrders.map((order, index) => (
            <div key={index} className="p-4 rounded-lg bg-[hsl(var(--card))] border border-orange-200 dark:border-orange-800">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold text-[hsl(var(--foreground))]">{order.orderId}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Date: {order.date} | Status: {order.status} | Expected: {order.expectedDelivery}
                  </p>
                </div>
                <span className="text-lg font-bold text-[hsl(var(--foreground))]">${order.amount.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Delayed Orders */}
      <div className="p-6 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <MdWarning className="w-6 h-6 text-red-600" />
          <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">Delayed Orders</h3>
        </div>
        <div className="space-y-3">
          {delayedOrders.map((order, index) => (
            <div key={index} className="p-4 rounded-lg bg-[hsl(var(--card))] border border-red-200 dark:border-red-800">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold text-[hsl(var(--foreground))]">{order.orderId}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Original: {order.originalDelivery} → New: {order.newDelivery}
                  </p>
                  <p className="text-sm text-[hsl(var(--foreground))] mt-1">
                    <span className="font-medium">Reason:</span> {order.reason}
                  </p>
                </div>
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 dark:bg-red-900 text-[hsl(var(--foreground))] font-semibold">
                  {order.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cancellation Trend */}
      <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">Order Cancellation Trend</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Monthly cancellation rate</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={cancellationTrendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="rate" stroke="#ef4444" strokeWidth={2} name="Cancellation Rate %" />
            <Line type="monotone" dataKey="cancelled" stroke="#6b7280" strokeWidth={2} name="Cancelled Orders" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Delivery Tracking Report */}
      <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">Delivery Tracking Report with ETA</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Real-time order tracking</p>
          </div>
          <MdLocalShipping className="w-6 h-6 text-blue-600" />
        </div>
        <div className="space-y-4">
          {deliveryTrackingData.map((tracking, index) => (
            <div key={index} className="p-4 rounded-lg bg-[hsl(var(--secondary))]">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-[hsl(var(--foreground))]">{tracking.orderId}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Status: {tracking.status} | Location: {tracking.currentLocation} | ETA: {tracking.eta}
                  </p>
                </div>
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900 text-[hsl(var(--foreground))] font-semibold">
                  {tracking.progress}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600"
                  style={{ width: `${tracking.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Order Status Distribution */}
      <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">Order Status Distribution</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Overall order status breakdown</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={orderStatusData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={100}
              fill="#8884d8"
              dataKey="count"
              label={({ status, count, percent }) => `${status}: ${count} (${(percent * 100).toFixed(0)}%)`}
            >
              {orderStatusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}



