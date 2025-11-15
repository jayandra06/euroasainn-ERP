/**
 * Supply Chain Dashboard
 * Orders received, fulfilled, delayed, average delivery time, pending shipments, logistics partner performance, inventory restock prediction
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
  MdLocalShipping,
  MdCheckCircle,
  MdSchedule,
  MdWarning,
  MdTrendingUp,
  MdInventory,
} from 'react-icons/md';

// Mock data
const ordersData = [
  { month: 'Jan', received: 0, fulfilled: 0, delayed: 0 },
  { month: 'Feb', received: 0, fulfilled: 0, delayed: 0 },
  { month: 'Mar', received: 0, fulfilled: 0, delayed: 0 },
  { month: 'Apr', received: 0, fulfilled: 0, delayed: 0 },
  { month: 'May', received: 0, fulfilled: 0, delayed: 0 },
  { month: 'Jun', received: 0, fulfilled: 0, delayed: 0 },
];

const deliveryTimeData = [
  { month: 'Jan', avgDelivery: 0, target: 0 },
  { month: 'Feb', avgDelivery: 0, target: 0 },
  { month: 'Mar', avgDelivery: 0, target: 0 },
  { month: 'Apr', avgDelivery: 0, target: 0 },
  { month: 'May', avgDelivery: 0, target: 0 },
  { month: 'Jun', avgDelivery: 0, target: 0 },
];

const pendingShipments = [
  { orderId: 'ORD-2024-001', customer: 'Customer A', priority: 'High', expectedDate: '2024-02-15', status: 'Processing', items: 0 },
  { orderId: 'ORD-2024-002', customer: 'Customer B', priority: 'Medium', expectedDate: '2024-02-18', status: 'Ready to Ship', items: 0 },
  { orderId: 'ORD-2024-003', customer: 'Customer C', priority: 'High', expectedDate: '2024-02-12', status: 'In Transit', items: 0 },
  { orderId: 'ORD-2024-004', customer: 'Customer D', priority: 'Low', expectedDate: '2024-02-20', status: 'Processing', items: 0 },
];

const logisticsPartnerPerformance = [
  { partner: 'Logistics A', onTime: 0, totalShipments: 0, avgTime: 0, rating: 0 },
  { partner: 'Logistics B', onTime: 0, totalShipments: 0, avgTime: 0, rating: 0 },
  { partner: 'Logistics C', onTime: 0, totalShipments: 0, avgTime: 0, rating: 0 },
  { partner: 'Logistics D', onTime: 0, totalShipments: 0, avgTime: 0, rating: 0 },
];

const inventoryRestockPrediction = [
  { item: 'Product A', currentStock: 0, predictedDemand: 0, reorderPoint: 0, daysUntilReorder: 0 },
  { item: 'Product B', currentStock: 0, predictedDemand: 0, reorderPoint: 0, daysUntilReorder: 0 },
  { item: 'Product C', currentStock: 0, predictedDemand: 0, reorderPoint: 0, daysUntilReorder: 0 },
  { item: 'Product D', currentStock: 0, predictedDemand: 0, reorderPoint: 0, daysUntilReorder: 0 },
];

const orderStatusData = [
  { status: 'Fulfilled', count: 0, color: '#10b981' },
  { status: 'Pending', count: 0, color: '#f59e0b' },
  { status: 'Delayed', count: 0, color: '#ef4444' },
  { status: 'Cancelled', count: 0, color: '#6b7280' },
];

export function SupplyChainDashboard() {
  const totalOrders = ordersData.reduce((sum, item) => sum + item.received, 0);
  const totalFulfilled = ordersData.reduce((sum, item) => sum + item.fulfilled, 0);
  const fulfillmentRate = ((totalFulfilled / totalOrders) * 100).toFixed(1);
  const avgDeliveryTime = (deliveryTimeData.reduce((sum, item) => sum + item.avgDelivery, 0) / deliveryTimeData.length).toFixed(1);

  return (
    <div className="w-full space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Orders Received</p>
            <MdLocalShipping className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalOrders}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Last 6 months</p>
        </div>

        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Fulfillment Rate</p>
            <MdCheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{fulfillmentRate}%</p>
          <p className="text-xs text-emerald-600 mt-1">+5% from last quarter</p>
        </div>

        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Delivery Time</p>
            <MdSchedule className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{avgDeliveryTime} days</p>
          <p className="text-xs text-emerald-600 mt-1">-27% from last quarter</p>
        </div>

        <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Shipments</p>
            <MdWarning className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{pendingShipments.length}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Requires attention</p>
        </div>
      </div>

      {/* Orders Received, Fulfilled, Delayed */}
      <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Orders Received, Fulfilled, Delayed</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Monthly order statistics</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={ordersData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip />
            <Legend />
            <Bar dataKey="received" fill="#3b82f6" name="Received" />
            <Bar dataKey="fulfilled" fill="#10b981" name="Fulfilled" />
            <Bar dataKey="delayed" fill="#ef4444" name="Delayed" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Average Delivery Time */}
      <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Average Delivery Time</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Delivery time trends vs target</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={deliveryTimeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="avgDelivery" stroke="#3b82f6" strokeWidth={2} name="Avg Delivery (days)" />
            <Line type="monotone" dataKey="target" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" name="Target (days)" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Pending Shipment List with Priorities */}
      <div className="p-6 rounded-xl border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <MdWarning className="w-6 h-6 text-orange-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Pending Shipment List with Priorities</h3>
        </div>
        <div className="space-y-3">
          {pendingShipments.map((shipment, index) => (
            <div key={index} className="p-4 rounded-lg bg-white dark:bg-gray-900 border border-orange-200 dark:border-orange-800">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{shipment.orderId}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Customer: {shipment.customer} | Items: {shipment.items} | Expected: {shipment.expectedDate}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      shipment.priority === 'High'
                        ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                        : shipment.priority === 'Medium'
                        ? 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {shipment.priority}
                  </span>
                  <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                    {shipment.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Logistics Partner Performance */}
      <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Logistics Partner Performance</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Partner efficiency and reliability metrics</p>
          </div>
        </div>
        <div className="space-y-4">
          {logisticsPartnerPerformance.map((partner, index) => (
            <div key={index} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">{partner.partner}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {partner.totalShipments} shipments | Avg: {partner.avgTime} days | Rating: {partner.rating}/5
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-emerald-600">{partner.onTime}%</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">On-time</p>
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600"
                  style={{ width: `${partner.onTime}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Inventory Restock Prediction */}
      <div className="p-6 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <MdInventory className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Inventory Restock Prediction</h3>
        </div>
        <div className="space-y-3">
          {inventoryRestockPrediction.map((item, index) => {
            const stockPercent = (item.currentStock / item.reorderPoint) * 100;
            const needsReorder = item.currentStock <= item.reorderPoint;
            
            return (
              <div key={index} className="p-4 rounded-lg bg-white dark:bg-gray-900 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{item.item}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Current: {item.currentStock} | Predicted Demand: {item.predictedDemand} | Reorder Point: {item.reorderPoint}
                    </p>
                  </div>
                  {needsReorder ? (
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300">
                      Reorder Now
                    </span>
                  ) : (
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
                      {item.daysUntilReorder} days
                    </span>
                  )}
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      needsReorder ? 'bg-red-600' : stockPercent < 120 ? 'bg-orange-600' : 'bg-emerald-600'
                    }`}
                    style={{ width: `${Math.min(stockPercent, 100)}%` }}
                  />
                </div>
                {needsReorder && (
                  <p className="text-xs text-red-600 mt-2">
                    ⚠️ Stock below reorder point. Restock recommended immediately.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Order Status Distribution */}
      <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Order Status Distribution</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Overall order status breakdown</p>
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



