
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
  ArrowDown
} from 'lucide-react';

interface AnalyticsData {
  revenue: {
    current_month: number;
    previous_month: number;
    growth_rate: number;
  };
  organizations: {
    total: number;
    new_this_month: number;
    churn_this_month: number;
  };
  subscriptions: {
    active: number;
    trial: number;
    cancelled: number;
  };
  usage_stats: {
    total_properties: number;
    total_tenants: number;
    avg_properties_per_org: number;
  };
  monthly_revenue: Array<{ month: string; amount: number }>;
  plan_distribution: Array<{ plan: string; count: number }>;
}

const Analytics: React.FC = () => {
  const { token } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('last_30_days');

  useEffect(() => {
    fetchAnalytics();
  }, [token, timeRange]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/analytics?range=${timeRange}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
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

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No data available</h3>
        <p className="mt-1 text-sm text-gray-500">Analytics data could not be loaded.</p>
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
          <option value="last_7_days">Last 7 days</option>
          <option value="last_30_days">Last 30 days</option>
          <option value="last_90_days">Last 90 days</option>
          <option value="last_year">Last year</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
              <p className="text-2xl font-bold text-gray-900">${analytics.revenue.current_month}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            {analytics.revenue.growth_rate >= 0 ? (
              <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
            ) : (
              <ArrowDown className="h-4 w-4 text-red-500 mr-1" />
            )}
            <span className={`text-sm font-medium ${
              analytics.revenue.growth_rate >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {Math.abs(analytics.revenue.growth_rate)}%
            </span>
            <span className="text-sm text-gray-500 ml-1">vs last month</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Organizations</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.organizations.total}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-500">
              +{analytics.organizations.new_this_month} new this month
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Subscriptions</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.subscriptions.active}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-500">
              {analytics.subscriptions.trial} in trial
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Properties</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.usage_stats.total_properties}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <BarChart3 className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-gray-500">
              Avg {analytics.usage_stats.avg_properties_per_org} per organization
            </span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue Trend</h3>
          <div className="h-64 flex items-end justify-between space-x-2">
            {analytics.monthly_revenue.map((item, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-blue-500 rounded-t"
                  style={{ 
                    height: `${(item.amount / Math.max(...analytics.monthly_revenue.map(i => i.amount))) * 200}px`,
                    minHeight: '10px'
                  }}
                ></div>
                <div className="text-xs text-gray-500 mt-2 transform -rotate-45">
                  {item.month}
                </div>
                <div className="text-xs font-medium text-gray-900">
                  ${item.amount}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Plan Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Plan Distribution</h3>
          <div className="space-y-4">
            {analytics.plan_distribution.map((plan, index) => {
              const total = analytics.plan_distribution.reduce((sum, p) => sum + p.count, 0);
              const percentage = (plan.count / total) * 100;
              const colors = ['bg-yellow-500', 'bg-purple-500', 'bg-indigo-500'];
              
              return (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 ${colors[index]} rounded mr-3`}></div>
                    <span className="text-sm font-medium text-gray-900 capitalize">{plan.plan}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">{plan.count}</div>
                    <div className="text-xs text-gray-500">{percentage.toFixed(1)}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Usage Statistics */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{analytics.usage_stats.total_properties}</div>
            <div className="text-sm text-gray-600">Total Properties Managed</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{analytics.usage_stats.total_tenants}</div>
            <div className="text-sm text-gray-600">Total Tenants</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">{analytics.usage_stats.avg_properties_per_org}</div>
            <div className="text-sm text-gray-600">Avg Properties per Organization</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
