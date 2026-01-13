/**
 * Financial Reports
 * Invoices (paid, pending, overdue), payment trend analysis, commission breakdown, tax & TDS summaries, credit/debit note summary
 */
import { ResponsiveContainer, BarChart, Bar, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, } from 'recharts';
import { MdReceipt, MdSchedule, MdAttachMoney, MdCheckCircle, } from 'react-icons/md';
// Mock data
const invoiceStatusData = [
    { status: 'Paid', count: 0, amount: 0, color: '#10b981' },
    { status: 'Pending', count: 0, amount: 0, color: '#f59e0b' },
    { status: 'Overdue', count: 0, amount: 0, color: '#ef4444' },
];
const paymentTrendData = [
    { month: 'Jan', avgDays: 0, totalReceived: 0 },
    { month: 'Feb', avgDays: 0, totalReceived: 0 },
    { month: 'Mar', avgDays: 0, totalReceived: 0 },
    { month: 'Apr', avgDays: 0, totalReceived: 0 },
    { month: 'May', avgDays: 0, totalReceived: 0 },
    { month: 'Jun', avgDays: 0, totalReceived: 0 },
];
const commissionBreakdown = [
    { month: 'Jan', commission: 0, sales: 0, rate: 0 },
    { month: 'Feb', commission: 0, sales: 0, rate: 0 },
    { month: 'Mar', commission: 0, sales: 0, rate: 0 },
    { month: 'Apr', commission: 0, sales: 0, rate: 0 },
    { month: 'May', commission: 0, sales: 0, rate: 0 },
    { month: 'Jun', commission: 0, sales: 0, rate: 0 },
];
const taxTDSSummary = [
    { type: 'GST', amount: 0, tds: 0, net: 0 },
    { type: 'Income Tax', amount: 0, tds: 0, net: 0 },
    { type: 'Service Tax', amount: 0, tds: 0, net: 0 },
];
const creditDebitNotes = [
    { type: 'Credit Note', count: 0, amount: 0, reason: 'Returns/Refunds' },
    { type: 'Debit Note', count: 0, amount: 0, reason: 'Additional Charges' },
];
const recentInvoices = [
    { invoiceId: 'INV-2024-001', customer: 'Customer A', amount: 0, status: 'Paid', paymentDate: '2024-02-05' },
    { invoiceId: 'INV-2024-002', customer: 'Customer B', amount: 0, status: 'Pending', paymentDate: '-' },
    { invoiceId: 'INV-2024-003', customer: 'Customer C', amount: 0, status: 'Overdue', paymentDate: '-' },
];
export function FinancialReports() {
    const totalInvoices = invoiceStatusData.reduce((sum, item) => sum + item.count, 0);
    const totalAmount = invoiceStatusData.reduce((sum, item) => sum + item.amount, 0);
    const paidAmount = invoiceStatusData.find((i) => i.status === 'Paid')?.amount || 0;
    const pendingAmount = invoiceStatusData.find((i) => i.status === 'Pending')?.amount || 0;
    const overdueAmount = invoiceStatusData.find((i) => i.status === 'Overdue')?.amount || 0;
    const avgPaymentDays = (paymentTrendData.reduce((sum, item) => sum + item.avgDays, 0) / paymentTrendData.length).toFixed(1);
    const totalCommission = commissionBreakdown.reduce((sum, item) => sum + item.commission, 0);
    return (<div className="w-full space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Invoices</p>
            <MdReceipt className="w-5 h-5 text-blue-600"/>
          </div>
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{totalInvoices}</p>
          <p className="text-xs text-[hsl(var(--foreground))] font-semibold mt-1">${totalAmount.toLocaleString()} total</p>
        </div>

        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Paid Amount</p>
            <MdCheckCircle className="w-5 h-5 text-emerald-600"/>
          </div>
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]">${paidAmount.toLocaleString()}</p>
          <p className="text-xs text-emerald-600 mt-1">{(paidAmount / totalAmount * 100).toFixed(1)}% of total</p>
        </div>

        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Payment Days</p>
            <MdSchedule className="w-5 h-5 text-purple-600"/>
          </div>
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{avgPaymentDays} days</p>
          <p className="text-xs text-emerald-600 mt-1">-39% from last quarter</p>
        </div>

        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Commission</p>
            <MdAttachMoney className="w-5 h-5 text-orange-600"/>
          </div>
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]">${totalCommission.toLocaleString()}</p>
          <p className="text-xs text-[hsl(var(--foreground))] font-semibold mt-1">Last 6 months</p>
        </div>
      </div>

      {/* Invoice Summary */}
      <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">Invoices: Paid, Pending, Overdue</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Invoice status breakdown</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={invoiceStatusData} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="count" label={({ status, count, amount, percent }) => `${status}: ${count} ($${amount.toLocaleString()}, ${(percent * 100).toFixed(0)}%)`}>
              {invoiceStatusData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color}/>))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Payment Trend Analysis */}
      <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">Payment Trend Analysis</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Average days to receive payment</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={paymentTrendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb"/>
            <XAxis dataKey="month" stroke="#6b7280"/>
            <YAxis stroke="#6b7280"/>
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="avgDays" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} name="Avg Days"/>
            <Line type="monotone" dataKey="totalReceived" stroke="#10b981" strokeWidth={2} name="Total Received ($)"/>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Commission Breakdown */}
      <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">Commission Breakdown</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Monthly commission and sales</p>
          </div>
          <MdAttachMoney className="w-6 h-6 text-orange-600"/>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={commissionBreakdown}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb"/>
            <XAxis dataKey="month" stroke="#6b7280"/>
            <YAxis stroke="#6b7280"/>
            <Tooltip />
            <Legend />
            <Bar dataKey="sales" fill="#3b82f6" name="Sales ($)"/>
            <Bar dataKey="commission" fill="#f59e0b" name="Commission ($)"/>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 p-4 rounded-lg bg-[hsl(var(--secondary))]">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[hsl(var(--foreground))]">Commission Rate</span>
            <span className="text-lg font-bold text-[hsl(var(--foreground))]">
              {commissionBreakdown[0]?.rate || 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Tax & TDS Summaries */}
      <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">Tax & TDS Summaries</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Tax breakdown and TDS deductions</p>
          </div>
        </div>
        <div className="space-y-3">
          {taxTDSSummary.map((tax, index) => (<div key={index} className="p-4 rounded-lg bg-[hsl(var(--secondary))]">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-[hsl(var(--foreground))]">{tax.type}</h4>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-right">
                    <p className="text-gray-600 dark:text-gray-400">Amount</p>
                    <p className="font-medium text-[hsl(var(--foreground))]">${tax.amount.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-600 dark:text-gray-400">TDS</p>
                    <p className="font-medium text-[hsl(var(--foreground))]">${tax.tds.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-600 dark:text-gray-400">Net</p>
                    <p className="font-medium text-[hsl(var(--foreground))]">${tax.net.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>))}
        </div>
        <div className="mt-4 p-4 rounded-lg bg-[hsl(var(--secondary))]">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[hsl(var(--foreground))]">Total Tax Amount</span>
            <span className="text-lg font-bold text-[hsl(var(--foreground))]">
              ${taxTDSSummary.reduce((sum, tax) => sum + tax.amount, 0).toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm font-medium text-[hsl(var(--foreground))]">Total TDS</span>
            <span className="text-lg font-bold text-[hsl(var(--foreground))]">
              ${taxTDSSummary.reduce((sum, tax) => sum + tax.tds, 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Credit/Debit Note Summary */}
      <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">Credit/Debit Note Summary</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Adjustments and corrections</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {creditDebitNotes.map((note, index) => (<div key={index} className="p-4 rounded-lg bg-[hsl(var(--secondary))]">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-[hsl(var(--foreground))]">{note.type}</h4>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${note.type === 'Credit Note'
                ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300'
                : 'bg-orange-100 dark:bg-orange-900 text-[hsl(var(--foreground))] font-semibold'}`}>
                  {note.count} notes
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Amount: ${note.amount.toLocaleString()}
              </p>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                Reason: {note.reason}
              </p>
            </div>))}
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">Recent Invoices</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Latest invoice transactions</p>
          </div>
        </div>
        <div className="space-y-3">
          {recentInvoices.map((invoice, index) => (<div key={index} className="p-4 rounded-lg bg-[hsl(var(--secondary))]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-[hsl(var(--foreground))]">{invoice.invoiceId}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {invoice.customer} | Payment: {invoice.paymentDate}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-lg font-bold text-[hsl(var(--foreground))]">
                    ${invoice.amount.toLocaleString()}
                  </span>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${invoice.status === 'Paid'
                ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300'
                : invoice.status === 'Pending'
                    ? 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300'
                    : 'bg-red-100 dark:bg-red-900 text-[hsl(var(--foreground))] font-semibold'}`}>
                    {invoice.status}
                  </span>
                </div>
              </div>
            </div>))}
        </div>
      </div>
    </div>);
}
//# sourceMappingURL=FinancialReports.js.map