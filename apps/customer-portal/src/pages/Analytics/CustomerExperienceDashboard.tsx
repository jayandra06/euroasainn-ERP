/**
 * Customer Experience Dashboard
 * Engagement score, feature adoption score, last 12-month interaction heatmap, personalized recommendations (AI insights)
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
  MdLightbulb,
  MdCalendarToday,
  MdStar,
  MdPerson,
} from 'react-icons/md';

// Mock data
const engagementScoreData = [
  { month: 'Jan', score: 0, logins: 0, interactions: 0 },
  { month: 'Feb', score: 0, logins: 0, interactions: 0 },
  { month: 'Mar', score: 0, logins: 0, interactions: 0 },
  { month: 'Apr', score: 0, logins: 0, interactions: 0 },
  { month: 'May', score: 0, logins: 0, interactions: 0 },
  { month: 'Jun', score: 0, logins: 0, interactions: 0 },
];

const featureAdoptionData = [
  { feature: 'Dashboard', adoption: 0, users: 0, engagement: 0 },
  { feature: 'Reports', adoption: 0, users: 0, engagement: 0 },
  { feature: 'Analytics', adoption: 0, users: 0, engagement: 0 },
  { feature: 'API Access', adoption: 0, users: 0, engagement: 0 },
  { feature: 'Mobile App', adoption: 0, users: 0, engagement: 0 },
];

const interactionHeatmapData = [
  { month: 'Jan', week1: 0, week2: 0, week3: 0, week4: 0 },
  { month: 'Feb', week1: 0, week2: 0, week3: 0, week4: 0 },
  { month: 'Mar', week1: 0, week2: 0, week3: 0, week4: 0 },
  { month: 'Apr', week1: 0, week2: 0, week3: 0, week4: 0 },
  { month: 'May', week1: 0, week2: 0, week3: 0, week4: 0 },
  { month: 'Jun', week1: 0, week2: 0, week3: 0, week4: 0 },
];

const aiRecommendations = [
  { 
    type: 'Feature Suggestion', 
    title: 'Try Advanced Analytics', 
    description: 'Based on your usage patterns, you might benefit from our advanced analytics features',
    priority: 'high',
    impact: 'High engagement potential'
  },
  { 
    type: 'Optimization', 
    title: 'Optimize API Usage', 
    description: 'Your API calls are approaching limits. Consider upgrading or optimizing usage',
    priority: 'medium',
    impact: 'Cost savings'
  },
  { 
    type: 'Feature Suggestion', 
    title: 'Enable Auto-pay', 
    description: 'Set up auto-pay to avoid payment delays and get discounts',
    priority: 'low',
    impact: 'Convenience'
  },
];

const monthlyEngagement = [
  { month: 'Jan', logins: 0, sessions: 0, duration: 0 },
  { month: 'Feb', logins: 0, sessions: 0, duration: 0 },
  { month: 'Mar', logins: 0, sessions: 0, duration: 0 },
  { month: 'Apr', logins: 0, sessions: 0, duration: 0 },
  { month: 'May', logins: 0, sessions: 0, duration: 0 },
  { month: 'Jun', logins: 0, sessions: 0, duration: 0 },
];

export function CustomerExperienceDashboard() {
  const currentEngagementScore = engagementScoreData[engagementScoreData.length - 1]?.score || 0;
  const avgFeatureAdoption = (featureAdoptionData.reduce((sum, item) => sum + item.adoption, 0) / featureAdoptionData.length).toFixed(1);
  const totalInteractions = interactionHeatmapData.reduce((sum, month) => 
    sum + month.week1 + month.week2 + month.week3 + month.week4, 0
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300';
      case 'medium':
        return 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300';
      case 'low':
        return 'bg-gray-100 dark:bg-gray-800 text-[hsl(var(--foreground))]';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-[hsl(var(--foreground))]';
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Engagement Score</p>
            <MdTrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{currentEngagementScore}</p>
          <p className="text-xs text-emerald-600 mt-1">0% from last quarter</p>
        </div>

        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Feature Adoption</p>
            <MdCheckCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{avgFeatureAdoption}%</p>
          <p className="text-xs text-emerald-600 mt-1">+8% from last quarter</p>
        </div>

        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Interactions</p>
            <MdPerson className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{totalInteractions}</p>
          <p className="text-xs text-[hsl(var(--foreground))] font-semibold mt-1">Last 6 months</p>
        </div>

        <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Session Duration</p>
            <MdCalendarToday className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-[hsl(var(--foreground))]">
            {monthlyEngagement[monthlyEngagement.length - 1]?.duration || 0} min
          </p>
          <p className="text-xs text-emerald-600 mt-1">+52% from last quarter</p>
        </div>
      </div>

      {/* Engagement Score */}
      <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">Engagement Score (Based on Logins & Interactions)</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Monthly engagement trends</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={engagementScoreData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} name="Engagement Score" />
            <Line type="monotone" dataKey="logins" stroke="#8b5cf6" strokeWidth={2} name="Logins" />
            <Line type="monotone" dataKey="interactions" stroke="#10b981" strokeWidth={2} name="Interactions" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Feature Adoption Score */}
      <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">Feature Adoption Score</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Adoption rate and engagement by feature</p>
          </div>
          <MdStar className="w-6 h-6 text-yellow-600" />
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={featureAdoptionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="feature" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip />
            <Legend />
            <Bar dataKey="adoption" fill="#3b82f6" name="Adoption %" />
            <Bar dataKey="engagement" fill="#f59e0b" name="Engagement (1-5)" />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-4 space-y-3">
          {featureAdoptionData.map((feature, index) => (
            <div key={index} className="p-3 rounded-lg bg-[hsl(var(--secondary))]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-[hsl(var(--foreground))]">{feature.feature}</span>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    {feature.users} users | {feature.adoption}% adoption
                  </span>
                  <div className="flex items-center gap-1">
                    <MdStar className="w-4 h-4 text-yellow-600" />
                    <span className="font-medium text-[hsl(var(--foreground))]">{feature.engagement}</span>
                  </div>
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600"
                  style={{ width: `${feature.adoption}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Last 12-Month Interaction Heatmap */}
      <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">Last 12-Month Interaction Heatmap</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Weekly interaction patterns</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={interactionHeatmapData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip />
            <Legend />
            <Bar dataKey="week1" stackId="a" fill="#3b82f6" name="Week 1" />
            <Bar dataKey="week2" stackId="a" fill="#8b5cf6" name="Week 2" />
            <Bar dataKey="week3" stackId="a" fill="#10b981" name="Week 3" />
            <Bar dataKey="week4" stackId="a" fill="#f59e0b" name="Week 4" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly Engagement Breakdown */}
      <div className="p-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">Monthly Engagement Breakdown</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Logins, sessions, and duration trends</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyEngagement}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="logins" stroke="#3b82f6" strokeWidth={2} name="Logins" />
            <Line type="monotone" dataKey="sessions" stroke="#8b5cf6" strokeWidth={2} name="Sessions" />
            <Line type="monotone" dataKey="duration" stroke="#10b981" strokeWidth={2} name="Duration (min)" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Personalized Recommendations (AI Insights) */}
      <div className="p-6 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <MdLightbulb className="w-6 h-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">Personalized Recommendations (AI Insights)</h3>
        </div>
        <div className="space-y-3">
          {aiRecommendations.map((recommendation, index) => (
            <div key={index} className="p-4 rounded-lg bg-[hsl(var(--card))] border border-blue-200 dark:border-blue-800">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(recommendation.priority)}`}>
                      {recommendation.type}
                    </span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      recommendation.priority === 'high' ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300' :
                      recommendation.priority === 'medium' ? 'bg-orange-100 dark:bg-orange-900 text-[hsl(var(--foreground))] font-semibold' :
                      'bg-gray-100 dark:bg-gray-800 text-[hsl(var(--foreground))]'
                    }`}>
                      {recommendation.priority} priority
                    </span>
                  </div>
                  <h4 className="font-semibold text-[hsl(var(--foreground))] mb-1">{recommendation.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{recommendation.description}</p>
                  <p className="text-xs text-[hsl(var(--foreground))] font-semibold">
                    <span className="font-medium">Impact:</span> {recommendation.impact}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}



