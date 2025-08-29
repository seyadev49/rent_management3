import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  Building2,
  Users,

  AlertTriangle,
  Calendar,
  DollarSign,
  Wrench
} from 'lucide-react';

interface DashboardStats {
  properties: {
    total_properties: number;
    total_units: number;
  };
  tenants: {
    total_tenants: number;
  };
  contracts: {
    active_contracts: number;
  };
  payments: {
    collected_amount: number;
    pending_amount: number;
    overdue_amount: number;
    overdue_count: number;
  };
  maintenance: {
    total_requests: number;
    pending_requests: number;
    in_progress_requests: number;
    completed_requests: number;
  };
}

interface RecentPayment {
  id: number;
  amount: number;
  status: string;
  payment_date: string;
  tenant_name: string;
  property_name: string;
  unit_number: string;
  days_until_due?: number;
}

interface ExpiringContract {
  id: number;
  contract_end_date: string;
  tenant_name: string;
  property_name: string;
  unit_number: string;
  monthly_rent: number;
}

const Dashboard: React.FC = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);
  const [expiringContracts, setExpiringContracts] = useState<ExpiringContract[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/dashboard/stats', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setStats(data.stats);
          setRecentPayments(data.recentPayments);
          setExpiringContracts(data.expiringContracts);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchDashboardData();
    }
  }, [token]);

  const getPaymentStatusDisplay = (payment: RecentPayment) => {
    if (payment.status === 'paid') {
      return (
        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
          paid
        </span>
      );
    }
    
    if (payment.days_until_due !== undefined && payment.days_until_due !== null) {
      if (payment.days_until_due > 0) {
        return (
          <div>
            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
              {payment.status}
            </span>
            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              Due in {payment.days_until_due} day{payment.days_until_due !== 1 ? 's' : ''}
            </div>
          </div>
        );
      } else if (payment.days_until_due < 0) {
        return (
          <div>
            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
              overdue
            </span>
            <div className="text-xs text-red-600 dark:text-red-400 mt-1">
              {Math.abs(payment.days_until_due)} day{Math.abs(payment.days_until_due) !== 1 ? 's' : ''} overdue
            </div>
          </div>
        );
      } else {
        return (
          <div>
            <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
              {payment.status}
            </span>
            <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
              Due today
            </div>
          </div>
        );
      }
    }
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
        payment.status === 'pending'
          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
          : payment.status === 'overdue'
          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
      }`}>
        {payment.status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Properties',
      value: stats?.properties.total_properties || 0,
      subtitle: `${stats?.properties.total_units || 0} units`,
      icon: Building2,
      color: 'blue',
    },
    {
      title: 'Active Tenants',
      value: stats?.tenants.total_tenants || 0,
      subtitle: `${stats?.contracts.active_contracts || 0} contracts`,
      icon: Users,
      color: 'green',
    },
    {
      title: 'Monthly Revenue',
      value: `$${(stats?.payments.collected_amount || 0).toLocaleString()}`,
      subtitle: 'This month',
      icon: DollarSign,
      color: 'indigo',
    },
    {
      title: 'Overdue Payments',
      value: stats?.payments.overdue_count || 0,
      subtitle: `$${(stats?.payments.overdue_amount || 0).toLocaleString()}`,
      icon: AlertTriangle,
      color: 'red',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Welcome back! Here's what's happening with your properties.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div 
            key={index} 
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-all duration-200 hover:shadow-md"
          >
            <div className="flex items-center">
              <div className={`p-2 rounded-lg bg-${stat.color}-100 dark:bg-${stat.color}-900/30`}>
                <stat.icon className={`h-6 w-6 text-${stat.color}-600 dark:text-${stat.color}-400`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.subtitle}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Payments */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Payments</h2>
          </div>
          <div className="p-6">
            {recentPayments.length > 0 ? (
              <div className="space-y-4">
                {recentPayments.map((payment) => (
                  <div 
                    key={payment.id} 
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{payment.tenant_name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {payment.property_name} - Unit {payment.unit_number}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString() : 'Not paid yet'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">${payment.amount}</p>
                      {getPaymentStatusDisplay(payment)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No recent payments</p>
            )}
          </div>
        </div>

        {/* Expiring Contracts */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Expiring Contracts</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Next 30 days</p>
          </div>
          <div className="p-6">
            {expiringContracts.length > 0 ? (
              <div className="space-y-4">
                {expiringContracts.map((contract) => (
                  <div 
                    key={contract.id} 
                    className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{contract.tenant_name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {contract.property_name} - Unit {contract.unit_number}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Expires: {new Date(contract.contract_end_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">${contract.monthly_rent}/mo</p>
                      <Calendar className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No contracts expiring soon</p>
            )}
          </div>
        </div>
      </div>

      {/* Maintenance Summary */}
      {stats?.maintenance && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Maintenance Overview</h2>
            <Wrench className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-600">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.maintenance.total_requests}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Total Requests</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.maintenance.pending_requests}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Pending</p>
            </div>
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.maintenance.in_progress_requests}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">In Progress</p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.maintenance.completed_requests}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Completed</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;