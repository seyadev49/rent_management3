import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Users, 
  Building, 
  DollarSign, 
  TrendingUp, 
  Activity,
  AlertCircle,
  CheckCircle,
  Clock
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

const Dashboard: React.FC = () => {
  const { token } = useAuth();
  const [overview, setOverview] = useState<PlatformOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPlatformOverview();
  }, [token]);

  const fetchPlatformOverview = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/analytics/overview', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOverview(data.overview);
      } else {
        setError('Failed to fetch platform overview');
      }
    } catch (error) {
      console.error('Error fetching platform overview:', error);
      setError('Failed to fetch platform overview');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Error</h3>
          <p className="mt-1 text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Welcome to the admin dashboard</p>
      </div>

      {overview && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Total Organizations</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{overview.totalOrganizations}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Building className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className="text-xs sm:text-sm text-gray-500">
                  {overview.activeOrganizations} active, {overview.trialOrganizations} trial
                </span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{overview.totalUsers}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Monthly Recurring Revenue</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">${overview.monthlyRecurringRevenue}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                {overview.growthRate >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                ) : (
                  <TrendingUp className="h-4 w-4 text-red-500 mr-1 transform rotate-180" />
                )}
                <span className={`text-xs sm:text-sm font-medium ${
                  overview.growthRate >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {Math.abs(overview.growthRate)}% growth
                </span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Total Properties</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{overview.totalProperties}</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <Activity className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-xs sm:text-sm text-gray-500">
                  {overview.totalTenants} tenants managed
                </span>
              </div>
            </div>
          </div>

          {/* Transaction Summary */}
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Transaction Summary</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-blue-600">{overview.totalTransactions}</div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Transactions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-green-600">${overview.totalTransactionAmount}</div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Transaction Amount</div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md text-center">
              <CheckCircle className="mx-auto h-8 w-8 text-green-500 mb-2" />
              <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{overview.activeOrganizations}</div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Active Organizations</div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md text-center">
              <Clock className="mx-auto h-8 w-8 text-blue-500 mb-2" />
              <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{overview.trialOrganizations}</div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Trial Organizations</div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md text-center">
              <Activity className="mx-auto h-8 w-8 text-purple-500 mb-2" />
              <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {overview.totalOrganizations - overview.activeOrganizations - overview.trialOrganizations}
              </div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Inactive Organizations</div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;