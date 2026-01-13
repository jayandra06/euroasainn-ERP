/**
 * Contract & Compliance Reports
 * Active vs expired contracts, renewal due dates with alerts, compliance checklist completion, penalty tracking, digital signature status
 */
import { ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, } from 'recharts';
import { MdCheckCircle, MdWarning, MdSchedule, MdError, MdEdit, } from 'react-icons/md';
// Mock data
const contractStatusData = [
    { status: 'Active', count: 0, color: '#10b981' },
    { status: 'Expired', count: 0, color: '#ef4444' },
    { status: 'Pending Renewal', count: 0, color: '#f59e0b' },
    { status: 'Draft', count: 0, color: '#6b7280' },
];
const renewalAlerts = [
    { contractId: 'CNT-2024-001', customer: 'Customer A', expiryDate: '2024-03-15', daysLeft: 0, status: 'upcoming', value: 0 },
    { contractId: 'CNT-2024-002', customer: 'Customer B', expiryDate: '2024-02-20', daysLeft: 0, status: 'urgent', value: 0 },
    { contractId: 'CNT-2024-003', customer: 'Customer C', expiryDate: '2024-02-17', daysLeft: 0, status: 'critical', value: 0 },
    { contractId: 'CNT-2024-004', customer: 'Customer D', expiryDate: '2024-04-01', daysLeft: 0, status: 'upcoming', value: 0 },
];
const complianceChecklist = [
    { item: 'Quality Standards Compliance', status: 'completed', lastCheck: '2024-02-10', nextDue: '2024-03-10' },
    { item: 'Safety Regulations', status: 'completed', lastCheck: '2024-02-08', nextDue: '2024-03-08' },
    { item: 'Environmental Compliance', status: 'pending', lastCheck: '2024-01-15', nextDue: '2024-02-15' },
    { item: 'Labor Standards', status: 'completed', lastCheck: '2024-02-05', nextDue: '2024-03-05' },
    { item: 'Data Privacy Compliance', status: 'completed', lastCheck: '2024-02-12', nextDue: '2024-03-12' },
];
const penaltyTracking = [
    { month: 'Jan', penalties: 0, amount: 0 },
    { month: 'Feb', penalties: 0, amount: 0 },
    { month: 'Mar', penalties: 0, amount: 0 },
    { month: 'Apr', penalties: 0, amount: 0 },
    { month: 'May', penalties: 0, amount: 0 },
    { month: 'Jun', penalties: 0, amount: 0 },
];
const digitalSignatureStatus = [
    { contractId: 'CNT-2024-001', customer: 'Customer A', status: 'signed', signedDate: '2024-01-15', signedBy: 'John Doe' },
    { contractId: 'CNT-2024-002', customer: 'Customer B', status: 'pending', signedDate: '-', signedBy: '-' },
    { contractId: 'CNT-2024-003', customer: 'Customer C', status: 'signed', signedDate: '2024-01-20', signedBy: 'Jane Smith' },
    { contractId: 'CNT-2024-004', customer: 'Customer D', status: 'signed', signedDate: '2024-02-01', signedBy: 'Mike Johnson' },
];
const contractValueData = [
    { month: 'Jan', active: 0, expired: 0 },
    { month: 'Feb', active: 0, expired: 0 },
    { month: 'Mar', active: 0, expired: 0 },
    { month: 'Apr', active: 0, expired: 0 },
    { month: 'May', active: 0, expired: 0 },
    { month: 'Jun', active: 0, expired: 0 },
];
export function ContractComplianceReports() {
    const totalContracts = contractStatusData.reduce((sum, item) => sum + item.count, 0);
    const activeContracts = contractStatusData.find((c) => c.status === 'Active')?.count || 0;
    const expiredContracts = contractStatusData.find((c) => c.status === 'Expired')?.count || 0;
    const pendingRenewals = contractStatusData.find((c) => c.status === 'Pending Renewal')?.count || 0;
    const totalPenalties = penaltyTracking.reduce((sum, item) => sum + item.amount, 0);
    const complianceRate = ((complianceChecklist.filter((item) => item.status === 'completed').length / complianceChecklist.length) * 100).toFixed(0);
    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300';
            case 'pending':
                return 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300';
            case 'overdue':
                return 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300';
            default:
                return 'bg-gray-100 dark:bg-gray-800 text-[hsl(var(--foreground))]';
        }
    };
    const getRenewalStatusColor = (status) => {
        switch (status) {
            case 'critical':
                return 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300';
            case 'urgent':
                return 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300';
            case 'upcoming':
                return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300';
            default:
                return 'bg-gray-100 dark:bg-gray-800 text-[hsl(var(--foreground))]';
        }
    };
    return (<div className="w-full space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Contracts</p>
            <MdCheckCircle className="w-5 h-5 text-emerald-600"/>
          </div>
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{activeContracts}</p>
          <p className="text-xs text-[hsl(var(--foreground))] font-semibold mt-1">of {totalContracts} total</p>
        </div>

        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Expired Contracts</p>
            <MdError className="w-5 h-5 text-red-600"/>
          </div>
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{expiredContracts}</p>
          <p className="text-xs text-[hsl(var(--foreground))] font-semibold mt-1">Requires attention</p>
        </div>

        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Renewals</p>
            <MdSchedule className="w-5 h-5 text-orange-600"/>
          </div>
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{pendingRenewals}</p>
          <p className="text-xs text-orange-600 mt-1">Action required</p>
        </div>

        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Compliance Rate</p>
            <MdCheckCircle className="w-5 h-5 text-blue-600"/>
          </div>
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{complianceRate}%</p>
          <p className="text-xs text-emerald-600 mt-1">+5% from last month</p>
        </div>
      </div>

      {/* Active vs Expired Contracts */}
      <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">Active vs Expired Contracts</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Contract status distribution</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={contractStatusData} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="count" label={({ status, count, percent }) => `${status}: ${count} (${(percent * 100).toFixed(0)}%)`}>
              {contractStatusData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color}/>))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Renewal Due Dates with Alerts */}
      <div className="p-6 rounded-xl border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <MdWarning className="w-6 h-6 text-orange-600"/>
          <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">Renewal Due Dates with Alerts</h3>
        </div>
        <div className="space-y-3">
          {renewalAlerts.map((alert, index) => (<div key={index} className="p-4 rounded-lg bg-[hsl(var(--card))] border border-orange-200 dark:border-orange-800">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-semibold text-[hsl(var(--foreground))]">{alert.contractId}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Customer: {alert.customer} | Expiry: {alert.expiryDate} | Value: ${alert.value.toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getRenewalStatusColor(alert.status)}`}>
                    {alert.status}
                  </span>
                  <span className="text-sm font-bold text-[hsl(var(--foreground))]">{alert.daysLeft} days</span>
                </div>
              </div>
              {alert.daysLeft <= 15 && (<p className="text-xs text-orange-600 mt-2">
                  ⚠️ Contract expires in {alert.daysLeft} days. Renewal action required.
                </p>)}
            </div>))}
        </div>
      </div>

      {/* Compliance Checklist Completion */}
      <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">Compliance Checklist Completion</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Compliance items status and due dates</p>
          </div>
        </div>
        <div className="space-y-3">
          {complianceChecklist.map((item, index) => (<div key={index} className="p-4 rounded-lg bg-[hsl(var(--secondary))]">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="font-semibold text-[hsl(var(--foreground))]">{item.item}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Last Check: {item.lastCheck} | Next Due: {item.nextDue}
                  </p>
                </div>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                  {item.status}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className={`h-2 rounded-full ${item.status === 'completed' ? 'bg-emerald-600' : 'bg-orange-600'}`} style={{ width: item.status === 'completed' ? '100%' : '0%' }}/>
              </div>
            </div>))}
        </div>
      </div>

      {/* Penalty Tracking */}
      <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">Penalty Tracking</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Monthly penalties and amounts</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={penaltyTracking}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb"/>
            <XAxis dataKey="month" stroke="#6b7280"/>
            <YAxis stroke="#6b7280"/>
            <Tooltip />
            <Legend />
            <Bar dataKey="penalties" fill="#ef4444" name="Penalties"/>
            <Bar dataKey="amount" fill="#f59e0b" name="Amount ($)"/>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 p-4 rounded-lg bg-[hsl(var(--secondary))]">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[hsl(var(--foreground))]">Total Penalties</span>
            <span className="text-lg font-bold text-[hsl(var(--foreground))]">${totalPenalties.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Digital Signature Status */}
      <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">Digital Signature Status (for Agreements)</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Contract signature tracking</p>
          </div>
          <MdEdit className="w-6 h-6 text-blue-600"/>
        </div>
        <div className="space-y-3">
          {digitalSignatureStatus.map((contract, index) => (<div key={index} className="p-4 rounded-lg bg-[hsl(var(--secondary))]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-[hsl(var(--foreground))]">{contract.contractId}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Customer: {contract.customer} | Signed: {contract.signedDate} | By: {contract.signedBy}
                  </p>
                </div>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${contract.status === 'signed'
                ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300'
                : 'bg-orange-100 dark:bg-orange-900 text-[hsl(var(--foreground))] font-semibold'}`}>
                  {contract.status}
                </span>
              </div>
            </div>))}
        </div>
      </div>

      {/* Contract Value Trends */}
      <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">Contract Value Trends</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Active vs expired contract values</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={contractValueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb"/>
            <XAxis dataKey="month" stroke="#6b7280"/>
            <YAxis stroke="#6b7280"/>
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="active" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Active ($)"/>
            <Area type="monotone" dataKey="expired" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} name="Expired ($)"/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>);
}
//# sourceMappingURL=ContractComplianceReports.js.map