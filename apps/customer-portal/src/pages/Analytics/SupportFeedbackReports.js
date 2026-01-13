/**
 * Support & Feedback Reports
 * Open/resolved/pending tickets, avg resolution time, ticket satisfaction rating, top issue categories, NPS chart
 */
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, } from 'recharts';
import { MdSupport, MdCheckCircle, MdSchedule, MdStar, } from 'react-icons/md';
// Mock data
const ticketStatusData = [
    { status: 'Open', count: 0, color: '#ef4444' },
    { status: 'Resolved', count: 0, color: '#10b981' },
    { status: 'Pending', count: 0, color: '#f59e0b' },
    { status: 'Closed', count: 0, color: '#6b7280' },
];
const resolutionTimeData = [
    { month: 'Jan', avgTime: 0, target: 0 },
    { month: 'Feb', avgTime: 0, target: 0 },
    { month: 'Mar', avgTime: 0, target: 0 },
    { month: 'Apr', avgTime: 0, target: 0 },
    { month: 'May', avgTime: 0, target: 0 },
    { month: 'Jun', avgTime: 0, target: 0 },
];
const satisfactionRatingData = [
    { month: 'Jan', rating: 0, responses: 0 },
    { month: 'Feb', rating: 0, responses: 0 },
    { month: 'Mar', rating: 0, responses: 0 },
    { month: 'Apr', rating: 0, responses: 0 },
    { month: 'May', rating: 0, responses: 0 },
    { month: 'Jun', rating: 0, responses: 0 },
];
const issueCategoriesData = [
    { category: 'Technical Issues', count: 0, percentage: 0, avgResolution: 0 },
    { category: 'Billing Questions', count: 0, percentage: 0, avgResolution: 0 },
    { category: 'Feature Requests', count: 0, percentage: 0, avgResolution: 0 },
    { category: 'Account Issues', count: 0, percentage: 0, avgResolution: 0 },
    { category: 'Other', count: 0, percentage: 0, avgResolution: 0 },
];
const npsData = [
    { month: 'Jan', promoters: 0, passives: 0, detractors: 0, nps: 0 },
    { month: 'Feb', promoters: 0, passives: 0, detractors: 0, nps: 0 },
    { month: 'Mar', promoters: 0, passives: 0, detractors: 0, nps: 0 },
    { month: 'Apr', promoters: 0, passives: 0, detractors: 0, nps: 0 },
    { month: 'May', promoters: 0, passives: 0, detractors: 0, nps: 0 },
    { month: 'Jun', promoters: 0, passives: 0, detractors: 0, nps: 0 },
];
const recentTickets = [
    { id: 'TKT-2024-001', subject: 'Payment processing issue', status: 'Resolved', resolutionTime: '0 hours', satisfaction: 0 },
    { id: 'TKT-2024-002', subject: 'Feature request: Export reports', status: 'Open', resolutionTime: '-', satisfaction: null },
    { id: 'TKT-2024-003', subject: 'Account access problem', status: 'Resolved', resolutionTime: '0 hours', satisfaction: 0 },
];
export function SupportFeedbackReports() {
    const totalTickets = ticketStatusData.reduce((sum, item) => sum + item.count, 0);
    const openTickets = ticketStatusData.find((t) => t.status === 'Open')?.count || 0;
    const resolvedTickets = ticketStatusData.find((t) => t.status === 'Resolved')?.count || 0;
    const avgResolutionTime = (resolutionTimeData.reduce((sum, item) => sum + item.avgTime, 0) / resolutionTimeData.length).toFixed(1);
    const currentSatisfaction = satisfactionRatingData[satisfactionRatingData.length - 1]?.rating || 0;
    const currentNPS = npsData[npsData.length - 1]?.nps || 0;
    return (<div className="w-full space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tickets</p>
            <MdSupport className="w-5 h-5 text-blue-600"/>
          </div>
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{totalTickets}</p>
          <p className="text-xs text-[hsl(var(--foreground))] font-semibold mt-1">All time</p>
        </div>

        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Open Tickets</p>
            <MdSchedule className="w-5 h-5 text-orange-600"/>
          </div>
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{openTickets}</p>
          <p className="text-xs text-[hsl(var(--foreground))] font-semibold mt-1">Requires attention</p>
        </div>

        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Resolution Time</p>
            <MdCheckCircle className="w-5 h-5 text-emerald-600"/>
          </div>
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{avgResolutionTime} hrs</p>
          <p className="text-xs text-emerald-600 mt-1">0% from last quarter</p>
        </div>

        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Satisfaction Rating</p>
            <MdStar className="w-5 h-5 text-yellow-600"/>
          </div>
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{currentSatisfaction.toFixed(1)}</p>
          <p className="text-xs text-emerald-600 mt-1">+12% from last quarter</p>
        </div>
      </div>

      {/* Ticket Status Distribution */}
      <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">Open, Resolved, Pending Tickets</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Ticket status breakdown</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie data={ticketStatusData} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="count" label={({ status, count, percent }) => `${status}: ${count} (${(percent * 100).toFixed(0)}%)`}>
              {ticketStatusData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color}/>))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Average Resolution Time per Issue */}
      <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">Average Resolution Time per Issue</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Resolution time trends vs target</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={resolutionTimeData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb"/>
            <XAxis dataKey="month" stroke="#6b7280"/>
            <YAxis stroke="#6b7280"/>
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="avgTime" stroke="#3b82f6" strokeWidth={2} name="Avg Time (hours)"/>
            <Line type="monotone" dataKey="target" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" name="Target (hours)"/>
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Ticket Satisfaction Rating */}
      <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">Ticket Satisfaction Rating</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Monthly satisfaction trends</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={satisfactionRatingData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb"/>
            <XAxis dataKey="month" stroke="#6b7280"/>
            <YAxis domain={[4, 5]} stroke="#6b7280"/>
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="rating" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} name="Rating (1-5)"/>
            <Line type="monotone" dataKey="responses" stroke="#3b82f6" strokeWidth={2} name="Responses"/>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Top Issue Categories */}
      <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">Top Issue Categories</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Most reported issue types</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={issueCategoriesData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb"/>
            <XAxis dataKey="category" stroke="#6b7280" angle={-45} textAnchor="end" height={100}/>
            <YAxis stroke="#6b7280"/>
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#3b82f6" name="Ticket Count"/>
            <Bar dataKey="avgResolution" fill="#8b5cf6" name="Avg Resolution (hrs)"/>
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 space-y-2">
          {issueCategoriesData.map((category, index) => (<div key={index} className="p-3 rounded-lg bg-[hsl(var(--secondary))]">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[hsl(var(--foreground))]">{category.category}</span>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    {category.count} tickets ({category.percentage}%)
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    Avg: {category.avgResolution} hrs
                  </span>
                </div>
              </div>
            </div>))}
        </div>
      </div>

      {/* Feedback Trends (Net Promoter Score Chart) */}
      <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">Feedback Trends (Net Promoter Score)</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">NPS trends over time</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{currentNPS}</p>
            <p className="text-xs text-emerald-600">Current NPS</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={npsData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb"/>
            <XAxis dataKey="month" stroke="#6b7280"/>
            <YAxis stroke="#6b7280"/>
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="promoters" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Promoters %"/>
            <Area type="monotone" dataKey="passives" stackId="2" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} name="Passives %"/>
            <Area type="monotone" dataKey="detractors" stackId="3" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} name="Detractors %"/>
            <Line type="monotone" dataKey="nps" stroke="#3b82f6" strokeWidth={3} name="NPS Score"/>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Tickets */}
      <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">Recent Tickets</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Latest support interactions</p>
          </div>
        </div>
        <div className="space-y-3">
          {recentTickets.map((ticket, index) => (<div key={index} className="p-4 rounded-lg bg-[hsl(var(--secondary))]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-[hsl(var(--foreground))]">{ticket.id}: {ticket.subject}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Status: {ticket.status} | Resolution: {ticket.resolutionTime}
                    {ticket.satisfaction && ` | Satisfaction: ${ticket.satisfaction}/5`}
                  </p>
                </div>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${ticket.status === 'Resolved'
                ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300'
                : ticket.status === 'Open'
                    ? 'bg-orange-100 dark:bg-orange-900 text-[hsl(var(--foreground))] font-semibold'
                    : 'bg-gray-100 dark:bg-gray-700 text-[hsl(var(--foreground))]'}`}>
                  {ticket.status}
                </span>
              </div>
            </div>))}
        </div>
      </div>
    </div>);
}
//# sourceMappingURL=SupportFeedbackReports.js.map