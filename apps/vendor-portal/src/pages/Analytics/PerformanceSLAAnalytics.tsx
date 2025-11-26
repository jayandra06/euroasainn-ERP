/**
 * Performance & SLA Analytics
 * On-time delivery %, defect rate %, complaint rate and resolution time, quality audit score trends, vendor ranking comparison
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
  MdTrendingUp,
  MdCheckCircle,
  MdError,
  MdWarning,
  MdStar,
  MdPerson,
} from 'react-icons/md';

// Mock data
const onTimeDeliveryData = [
  { month: 'Jan', onTime: 0, delayed: 0 },
  { month: 'Feb', onTime: 0, delayed: 0 },
  { month: 'Mar', onTime: 0, delayed: 0 },
  { month: 'Apr', onTime: 0, delayed: 0 },
  { month: 'May', onTime: 0, delayed: 0 },
  { month: 'Jun', onTime: 0, delayed: 0 },
];

const defectRateData = [
  { month: 'Jan', rate: 0, defects: 0, total: 0 },
  { month: 'Feb', rate: 0, defects: 0, total: 0 },
  { month: 'Mar', rate: 0, defects: 0, total: 0 },
  { month: 'Apr', rate: 0, defects: 0, total: 0 },
  { month: 'May', rate: 0, defects: 0, total: 0 },
  { month: 'Jun', rate: 0, defects: 0, total: 0 },
];

const complaintRateData = [
  { month: 'Jan', complaints: 0, resolutionTime: 0 },
  { month: 'Feb', complaints: 0, resolutionTime: 0 },
  { month: 'Mar', complaints: 0, resolutionTime: 0 },
  { month: 'Apr', complaints: 0, resolutionTime: 0 },
  { month: 'May', complaints: 0, resolutionTime: 0 },
  { month: 'Jun', complaints: 0, resolutionTime: 0 },
];

const qualityAuditScoreData = [
  { month: 'Jan', score: 0, target: 0 },
  { month: 'Feb', score: 0, target: 0 },
  { month: 'Mar', score: 0, target: 0 },
  { month: 'Apr', score: 0, target: 0 },
  { month: 'May', score: 0, target: 0 },
  { month: 'Jun', score: 0, target: 0 },
];

const vendorRankingData = [
  { vendor: 'Vendor A (You)', score: 0, onTime: 0, quality: 0, complaints: 0 },
  { vendor: 'Vendor B', score: 0, onTime: 0, quality: 0, complaints: 0 },
  { vendor: 'Vendor C', score: 0, onTime: 0, quality: 0, complaints: 0 },
  { vendor: 'Vendor D', score: 0, onTime: 0, quality: 0, complaints: 0 },
  { vendor: 'Vendor E', score: 0, onTime: 0, quality: 0, complaints: 0 },
];

const recentComplaints = [
  { id: 'COMP-001', customer: 'Customer A', issue: 'Late delivery', status: 'Resolved', resolutionTime: '0 hours', date: '2024-02-08' },
  { id: 'COMP-002', customer: 'Customer B', issue: 'Quality issue', status: 'In Progress', resolutionTime: '-', date: '2024-02-10' },
  { id: 'COMP-003', customer: 'Customer C', issue: 'Wrong item', status: 'Resolved', resolutionTime: '0 hours', date: '2024-02-09' },
];

export function PerformanceSLAAnalytics() {
  const currentOnTime = onTimeDeliveryData[onTimeDeliveryData.length - 1]?.onTime || 0;
  const currentDefectRate = defectRateData[defectRateData.length - 1]?.rate || 0;
  const currentComplaintRate = complaintRateData[defectRateData.length - 1]?.complaints || 0;
  const currentQualityScore = qualityAuditScoreData[qualityAuditScoreData.length - 1]?.score || 0;
  const avgResolutionTime = (complaintRateData.reduce((sum, item) => sum + item.resolutionTime, 0) / complaintRateData.length).toFixed(1);

  return (
    <div className="w-full space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">On-time Delivery %</p>
            <MdCheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{currentOnTime}%</p>
          <p className="text-xs text-emerald-600 mt-1">+7% from last quarter</p>
        </div>

        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Defect Rate %</p>
            <MdError className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{currentDefectRate}%</p>
          <p className="text-xs text-emerald-600 mt-1">-60% from last quarter</p>
        </div>

        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Complaint Rate</p>
            <MdWarning className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{currentComplaintRate}</p>
          <p className="text-xs text-emerald-600 mt-1">-67% from last quarter</p>
        </div>

        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Quality Audit Score</p>
            <MdStar className="w-5 h-5 text-yellow-600" />
          </div>
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{currentQualityScore}</p>
          <p className="text-xs text-emerald-600 mt-1">+12% from last quarter</p>
        </div>
      </div>

      {/* On-time Delivery % */}
      <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">On-time Delivery %</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Monthly on-time delivery performance</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={onTimeDeliveryData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" stroke="#6b7280" />
            <YAxis domain={[85, 100]} stroke="#6b7280" />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="onTime" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="On-time %" />
            <Area type="monotone" dataKey="delayed" stackId="2" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} name="Delayed %" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Defect Rate % */}
      <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">Defect Rate %</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Monthly defect rate trends</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={defectRateData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="rate" stroke="#ef4444" strokeWidth={2} name="Defect Rate %" />
            <Line type="monotone" dataKey="defects" stroke="#f59e0b" strokeWidth={2} name="Defects Count" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Complaint Rate and Resolution Time */}
      <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">Complaint Rate and Resolution Time</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Monthly complaints and average resolution time</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={complaintRateData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" stroke="#6b7280" />
            <YAxis yAxisId="left" stroke="#6b7280" />
            <YAxis yAxisId="right" orientation="right" stroke="#6b7280" />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="complaints" fill="#ef4444" name="Complaints" />
            <Line yAxisId="right" type="monotone" dataKey="resolutionTime" stroke="#3b82f6" strokeWidth={2} name="Resolution Time (hrs)" />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 p-4 rounded-lg bg-[hsl(var(--secondary))]">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[hsl(var(--foreground))]">Average Resolution Time</span>
            <span className="text-lg font-bold text-[hsl(var(--foreground))]">{avgResolutionTime} hours</span>
          </div>
        </div>
      </div>

      {/* Quality Audit Score Trends */}
      <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">Quality Audit Score Trends</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Monthly quality audit performance</p>
          </div>
          <MdStar className="w-6 h-6 text-yellow-600" />
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={qualityAuditScoreData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" stroke="#6b7280" />
            <YAxis domain={[80, 100]} stroke="#6b7280" />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} name="Audit Score" />
            <Line type="monotone" dataKey="target" stroke="#10b981" strokeWidth={2} strokeDasharray="5 5" name="Target Score" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Vendor Ranking Comparison */}
      <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">Vendor Ranking Comparison</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Performance comparison with other vendors</p>
          </div>
          <MdPerson className="w-6 h-6 text-blue-600" />
        </div>
        <div className="space-y-3">
          {vendorRankingData.map((vendor, index) => {
            const isYou = vendor.vendor.includes('You');
            return (
              <div
                key={index}
                className={`p-4 rounded-lg ${isYou ? 'bg-blue-50 dark:bg-blue-950/20 border-2 border-blue-300 dark:border-blue-700' : 'bg-[hsl(var(--secondary))]'}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' :
                      index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white' :
                      index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white' :
                      'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold text-[hsl(var(--foreground))]">{vendor.vendor}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        On-time: {vendor.onTime}% | Quality: {vendor.quality} | Complaints: {vendor.complaints}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{vendor.score}</p>
                    <p className="text-xs text-[hsl(var(--foreground))] font-semibold">Score</p>
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600"
                    style={{ width: `${vendor.score}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Complaints */}
      <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">Recent Complaints</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Latest customer complaints and resolutions</p>
          </div>
        </div>
        <div className="space-y-3">
          {recentComplaints.map((complaint, index) => (
            <div key={index} className="p-4 rounded-lg bg-[hsl(var(--secondary))]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-[hsl(var(--foreground))]">{complaint.id}: {complaint.issue}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Customer: {complaint.customer} | Date: {complaint.date} | Resolution: {complaint.resolutionTime}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    complaint.status === 'Resolved'
                      ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300'
                      : 'bg-orange-100 dark:bg-orange-900 text-[hsl(var(--foreground))] font-semibold'
                  }`}
                >
                  {complaint.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}



