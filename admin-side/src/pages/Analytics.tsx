
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Calendar,
  BarChart3,
  PieChart,
  ArrowUp,
  ArrowDown,
  Activity
} from 'lucide-react';

interface PlatformOverview {
  totalOrganizations: number;
  activeOrganizations: number;
  trialOrganizations: number;
  totalUsers: number;
  totalProperties: number;
  totalTenants: number;
  totalTransactions: number;
  totalTransactionAmount: number;
  monthlyRecurringRevenue: number;
  growthRate: number;
}

interface UserEngagement {
  dailyActiveUsers: Array<{ date: string; active_users: number }>;
  mostActiveOrganizations: Array<{ name: string; id: number; activity_count: number; last_activity: string }>;
  featureUsage: Array<{ action: string; usage_count: number }>;
}

interface RevenueAnalytics {
  dailyRevenue: Array<{ date: string; revenue: number; transactions: number }>;
  revenueByPlan: Array<{ plan_id: string; total_revenue: number; subscribers: number; avg_revenue: number }>;
  averageCustomerLifetimeValue: number;
}

interface GeographicData {
  geographicDistribution: Array<{ region: string; organization_count: number }>;
}

const Analytics: React.FC = () => {
  const { token } = useAuth();
  const [overview, setOverview] = useState<PlatformOverview | null>(null);
  const [engagement, setEngagement] = useState<UserEngagement | null>(null);
  const [revenue, setRevenue] = useState<RevenueAnalytics | null>(null);
  const [geographic, setGeographic] = useState<GeographicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');

  useEffect(() => {
    fetchAllAnalytics();
  }, [token, timeRange]);

  const fetchAllAnalytics = async () => {
    try {
      const [overviewRes, engagementRes, revenueRes, geoRes] = await Promise.all([
        fetch('http://localhost:5000/api/admin/analytics/overview', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('http://localhost:5000/api/admin/analytics/engagement', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`http://localhost:5000/api/admin/analytics/revenue?period=${timeRange}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('http://localhost:5000/api/admin/analytics/geographic', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (overviewRes.ok) {
        const data = await overviewRes.json();
        setOverview(data.overview);
      }

      if (engagementRes.ok) {
        const data = await engagementRes.json();
        setEngagement(data);
      }

      if (revenueRes.ok) {
        const data = await revenueRes.json();
        setRevenue(data);
      }

      if (geoRes.ok) {
        const data = await geoRes.json();
        setGeographic(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Track business performance and metrics</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="365">Last year</option>
        </select>
      </div>

      {/* Key Metrics */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${overview.monthlyRecurringRevenue}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              {overview.growthRate >= 0 ? (
                <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <ArrowDown className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm font-medium ${
                overview.growthRate >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {Math.abs(overview.growthRate)}%
              </span>
              <span className="text-sm text-gray-500 ml-1">growth rate</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Organizations</p>
                <p className="text-2xl font-bold text-gray-900">{overview.totalOrganizations}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-gray-500">
                {overview.activeOrganizations} active, {overview.trialOrganizations} trial
              </span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Properties</p>
                <p className="text-2xl font-bold text-gray-900">{overview.totalProperties}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-gray-500">
                {overview.totalTenants} total tenants
              </span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                <p className="text-2xl font-bold text-gray-900">{overview.totalTransactions}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <BarChart3 className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-gray-500">
                ${overview.totalTransactionAmount} total value
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Revenue Analytics */}
      {revenue && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Revenue</h3>
            <div className="space-y-3">
              {revenue.dailyRevenue.slice(0, 10).map((item, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    {new Date(item.date).toLocaleDateString()}
                  </span>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">${item.revenue}</div>
                    <div className="text-xs text-gray-500">{item.transactions} transactions</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Plan</h3>
            <div className="space-y-4">
              {revenue.revenueByPlan.map((plan, index) => {
                const colors = ['bg-yellow-500', 'bg-purple-500', 'bg-indigo-500'];
                return (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 ${colors[index % colors.length]} rounded mr-3`}></div>
                      <span className="text-sm font-medium text-gray-900 capitalize">{plan.plan_id}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">${plan.total_revenue}</div>
                      <div className="text-xs text-gray-500">{plan.subscribers} subscribers</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* User Engagement */}
      {engagement && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Active Organizations</h3>
            <div className="space-y-3">
              {engagement.mostActiveOrganizations.slice(0, 5).map((org, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{org.name}</div>
                    <div className="text-xs text-gray-500">
                      Last activity: {new Date(org.last_activity).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-sm font-medium text-blue-600">
                    {org.activity_count} actions
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Feature Usage</h3>
            <div className="space-y-3">
              {engagement.featureUsage.slice(0, 5).map((feature, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {feature.action.replace(/_/g, ' ')}
                  </span>
                  <span className="text-sm text-gray-600">{feature.usage_count} times</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Geographic Distribution */}
      {geographic && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Geographic Distribution</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {geographic.geographicDistribution.slice(0, 6).map((region, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl font-bold text-blue-600">{region.organization_count}</div>
                <div className="text-sm text-gray-600">{region.region}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Customer Lifetime Value */}
      {revenue && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Metrics</h3>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">${revenue.averageCustomerLifetimeValue}</div>
            <div className="text-sm text-gray-600">Average Customer Lifetime Value</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
