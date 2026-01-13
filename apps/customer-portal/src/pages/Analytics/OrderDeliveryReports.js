/**
 * Order & Delivery Reports
 * Order history, fulfillment rate, pending/delayed orders, cancellation trends, delivery tracking
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authenticatedFetch } from '../../lib/api';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, } from 'recharts';
import { MdShoppingCart, MdCheckCircle, MdSchedule, MdWarning, MdLocalShipping, } from 'react-icons/md';
export function OrderDeliveryReports() {
    // Fetch RFQs
    const { data: rfqs = [], isLoading } = useQuery({
        queryKey: ['analytics-rfqs'],
        queryFn: async () => {
            const response = await authenticatedFetch('/api/v1/customer/rfq');
            if (!response.ok)
                throw new Error('Failed to fetch RFQs');
            const data = await response.json();
            return (data.data || []);
        },
    });
    // Calculate analytics from RFQ data
    const analytics = useMemo(() => {
        const now = new Date();
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        // Order history (last 5 weeks)
        const orderHistoryData = [];
        for (let i = 4; i >= 0; i--) {
            const weekStart = new Date(now);
            weekStart.setDate(weekStart.getDate() - (i * 7));
            weekStart.setHours(0, 0, 0, 0);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekEnd.getDate() + 6);
            weekEnd.setHours(23, 59, 59, 999);
            const weekRFQs = rfqs.filter(rfq => {
                if (!rfq.createdAt)
                    return false;
                const created = new Date(rfq.createdAt);
                return created >= weekStart && created <= weekEnd;
            });
            const completed = weekRFQs.filter(rfq => rfq.status === 'completed' || rfq.status === 'closed').length;
            const pending = weekRFQs.filter(rfq => rfq.status === 'pending' || rfq.status === 'draft' || rfq.status === 'sent').length;
            orderHistoryData.push({
                date: weekStart.toISOString().split('T')[0],
                orders: weekRFQs.length,
                completed,
                pending,
            });
        }
        // Fulfillment rate (last 6 months)
        const fulfillmentRateData = [];
        for (let i = 5; i >= 0; i--) {
            const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
            const monthName = monthNames[monthDate.getMonth()];
            const monthRFQs = rfqs.filter(rfq => {
                if (!rfq.createdAt)
                    return false;
                const created = new Date(rfq.createdAt);
                return created >= monthDate && created <= monthEnd;
            });
            const onTime = monthRFQs.filter(rfq => {
                if (!rfq.dueDate)
                    return false;
                const due = new Date(rfq.dueDate);
                return (rfq.status === 'completed' || rfq.status === 'closed') && new Date(rfq.updatedAt || rfq.createdAt) <= due;
            }).length;
            const delayed = monthRFQs.filter(rfq => {
                if (!rfq.dueDate)
                    return false;
                const due = new Date(rfq.dueDate);
                return (rfq.status === 'completed' || rfq.status === 'closed') && new Date(rfq.updatedAt || rfq.createdAt) > due;
            }).length;
            fulfillmentRateData.push({
                month: monthName,
                onTime: monthRFQs.length > 0 ? (onTime / monthRFQs.length) * 100 : 0,
                delayed: monthRFQs.length > 0 ? (delayed / monthRFQs.length) * 100 : 0,
            });
        }
        // Pending orders
        const pendingOrders = rfqs
            .filter(rfq => rfq.status === 'pending' || rfq.status === 'draft' || rfq.status === 'sent')
            .slice(0, 5)
            .map(rfq => ({
            orderId: rfq.rfqNumber,
            date: rfq.createdAt ? new Date(rfq.createdAt).toISOString().split('T')[0] : 'N/A',
            status: rfq.status.charAt(0).toUpperCase() + rfq.status.slice(1),
            expectedDelivery: rfq.dueDate ? new Date(rfq.dueDate).toISOString().split('T')[0] : 'N/A',
            amount: 0,
        }));
        // Delayed orders
        const delayedOrders = rfqs
            .filter(rfq => {
            if (!rfq.dueDate || rfq.status === 'completed' || rfq.status === 'closed')
                return false;
            const due = new Date(rfq.dueDate);
            return now > due;
        })
            .slice(0, 5)
            .map(rfq => ({
            orderId: rfq.rfqNumber,
            date: rfq.createdAt ? new Date(rfq.createdAt).toISOString().split('T')[0] : 'N/A',
            status: 'Delayed',
            originalDelivery: rfq.dueDate ? new Date(rfq.dueDate).toISOString().split('T')[0] : 'N/A',
            newDelivery: rfq.dueDate ? new Date(new Date(rfq.dueDate).getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : 'N/A',
            reason: 'Pending response',
        }));
        // Cancellation trend
        const cancellationTrendData = [];
        for (let i = 5; i >= 0; i--) {
            const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
            const monthName = monthNames[monthDate.getMonth()];
            const monthRFQs = rfqs.filter(rfq => {
                if (!rfq.createdAt)
                    return false;
                const created = new Date(rfq.createdAt);
                return created >= monthDate && created <= monthEnd;
            });
            const cancelled = monthRFQs.filter(rfq => rfq.status === 'cancelled').length;
            const rate = monthRFQs.length > 0 ? (cancelled / monthRFQs.length) * 100 : 0;
            cancellationTrendData.push({
                month: monthName,
                cancelled,
                total: monthRFQs.length,
                rate,
            });
        }
        // Delivery tracking (using pending RFQs)
        const deliveryTrackingData = rfqs
            .filter(rfq => rfq.status === 'pending' || rfq.status === 'sent')
            .slice(0, 3)
            .map(rfq => ({
            orderId: rfq.rfqNumber,
            status: rfq.status.charAt(0).toUpperCase() + rfq.status.slice(1),
            currentLocation: 'Awaiting Response',
            eta: rfq.dueDate ? new Date(rfq.dueDate).toISOString().split('T')[0] : 'N/A',
            progress: 30,
        }));
        // Order status distribution
        const statusCounts = {
            completed: rfqs.filter(rfq => rfq.status === 'completed' || rfq.status === 'closed').length,
            pending: rfqs.filter(rfq => rfq.status === 'pending' || rfq.status === 'draft' || rfq.status === 'sent').length,
            delayed: rfqs.filter(rfq => {
                if (!rfq.dueDate || rfq.status === 'completed' || rfq.status === 'closed')
                    return false;
                return now > new Date(rfq.dueDate);
            }).length,
            cancelled: rfqs.filter(rfq => rfq.status === 'cancelled').length,
        };
        const orderStatusData = [
            { status: 'Completed', count: statusCounts.completed, color: '#10b981' },
            { status: 'Pending', count: statusCounts.pending, color: '#f59e0b' },
            { status: 'Delayed', count: statusCounts.delayed, color: '#ef4444' },
            { status: 'Cancelled', count: statusCounts.cancelled, color: '#6b7280' },
        ].filter(item => item.count > 0);
        const totalOrders = rfqs.length;
        const totalCompleted = statusCounts.completed;
        const fulfillmentRate = totalOrders > 0 ? ((totalCompleted / totalOrders) * 100).toFixed(1) : '0.0';
        const currentFulfillmentRate = fulfillmentRateData[fulfillmentRateData.length - 1]?.onTime || 0;
        return {
            orderHistoryData,
            fulfillmentRateData,
            pendingOrders,
            delayedOrders,
            cancellationTrendData,
            deliveryTrackingData,
            orderStatusData,
            totalOrders,
            totalCompleted,
            fulfillmentRate,
            currentFulfillmentRate,
        };
    }, [rfqs]);
    if (isLoading) {
        return (<div className="w-full space-y-6">
        <div className="p-12 text-center rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[hsl(var(--border))] border-t-[hsl(var(--primary))]"></div>
          <p className="mt-4 text-[hsl(var(--muted-foreground))]">Loading analytics data...</p>
        </div>
      </div>);
    }
    return (<div className="w-full space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Orders</p>
            <MdShoppingCart className="w-5 h-5 text-blue-600"/>
          </div>
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{analytics.totalOrders}</p>
          <p className="text-xs text-[hsl(var(--foreground))] font-semibold mt-1">Last 5 weeks</p>
        </div>

        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Fulfillment Rate</p>
            <MdCheckCircle className="w-5 h-5 text-emerald-600"/>
          </div>
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{analytics.fulfillmentRate}%</p>
          <p className="text-xs text-emerald-600 mt-1">{analytics.currentFulfillmentRate.toFixed(1)}% on-time rate</p>
        </div>

        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Orders</p>
            <MdSchedule className="w-5 h-5 text-orange-600"/>
          </div>
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{analytics.pendingOrders.length}</p>
          <p className="text-xs text-[hsl(var(--foreground))] font-semibold mt-1">Requires attention</p>
        </div>

        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Delayed Orders</p>
            <MdWarning className="w-5 h-5 text-red-600"/>
          </div>
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{analytics.delayedOrders.length}</p>
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
          <BarChart data={analytics.orderHistoryData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb"/>
            <XAxis dataKey="date" stroke="#6b7280"/>
            <YAxis stroke="#6b7280"/>
            <Tooltip />
            <Legend />
            <Bar dataKey="orders" fill="#3b82f6" name="Total Orders"/>
            <Bar dataKey="completed" fill="#10b981" name="Completed"/>
            <Bar dataKey="pending" fill="#f59e0b" name="Pending"/>
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
          <AreaChart data={analytics.fulfillmentRateData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb"/>
            <XAxis dataKey="month" stroke="#6b7280"/>
            <YAxis domain={[90, 100]} stroke="#6b7280"/>
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="onTime" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="On Time %"/>
            <Area type="monotone" dataKey="delayed" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} name="Delayed %"/>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Pending Orders */}
      <div className="p-6 rounded-xl border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <MdSchedule className="w-6 h-6 text-orange-600"/>
          <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">Pending Orders</h3>
        </div>
        <div className="space-y-3">
          {analytics.pendingOrders.length === 0 ? (<p className="text-sm text-[hsl(var(--muted-foreground))]">No pending orders</p>) : (analytics.pendingOrders.map((order, index) => (<div key={index} className="p-4 rounded-lg bg-[hsl(var(--card))] border border-orange-200 dark:border-orange-800">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold text-[hsl(var(--foreground))]">{order.orderId}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Date: {order.date} | Status: {order.status} | Expected: {order.expectedDelivery}
                  </p>
                </div>
                <span className="text-lg font-bold text-[hsl(var(--foreground))]">${order.amount.toLocaleString()}</span>
              </div>
            </div>)))}
        </div>
      </div>

      {/* Delayed Orders */}
      <div className="p-6 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <MdWarning className="w-6 h-6 text-red-600"/>
          <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">Delayed Orders</h3>
        </div>
        <div className="space-y-3">
          {analytics.delayedOrders.length === 0 ? (<p className="text-sm text-[hsl(var(--muted-foreground))]">No delayed orders</p>) : (analytics.delayedOrders.map((order, index) => (<div key={index} className="p-4 rounded-lg bg-[hsl(var(--card))] border border-red-200 dark:border-red-800">
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
            </div>)))}
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
          <LineChart data={analytics.cancellationTrendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb"/>
            <XAxis dataKey="month" stroke="#6b7280"/>
            <YAxis stroke="#6b7280"/>
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="rate" stroke="#ef4444" strokeWidth={2} name="Cancellation Rate %"/>
            <Line type="monotone" dataKey="cancelled" stroke="#6b7280" strokeWidth={2} name="Cancelled Orders"/>
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
          <MdLocalShipping className="w-6 h-6 text-blue-600"/>
        </div>
        <div className="space-y-4">
          {analytics.deliveryTrackingData.length === 0 ? (<p className="text-sm text-[hsl(var(--muted-foreground))]">No active deliveries</p>) : (analytics.deliveryTrackingData.map((tracking, index) => (<div key={index} className="p-4 rounded-lg bg-[hsl(var(--secondary))]">
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
                <div className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600" style={{ width: `${tracking.progress}%` }}/>
              </div>
            </div>)))}
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
          {analytics.orderStatusData.length === 0 ? (<div className="flex items-center justify-center h-full">
              <p className="text-[hsl(var(--muted-foreground))]">No order data available</p>
            </div>) : (<PieChart>
              <Pie data={analytics.orderStatusData} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="count" label={({ status, count, percent }) => `${status}: ${count} (${(percent * 100).toFixed(0)}%)`}>
                {analytics.orderStatusData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color}/>))}
              </Pie>
              <Tooltip />
            </PieChart>)}
        </ResponsiveContainer>
      </div>
    </div>);
}
//# sourceMappingURL=OrderDeliveryReports.js.map