import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  FileText, 
  Check, 
  X, 
  Eye, 
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Download,
  Search,
  Filter
} from 'lucide-react';

interface PendingSubscription {
  id: number;
  organization_id: number;
  organization_name: string;
  organization_email: string;
  plan_id: string;
  amount: number;
  billing_cycle: string;
  status: string;
  receipt_path: string;
  created_at: string;
  payment_method: string;
}

const SubscriptionVerification: React.FC = () => {
  const { token } = useAuth();
  const [pendingSubscriptions, setPendingSubscriptions] = useState<PendingSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState('');

  useEffect(() => {
    fetchPendingSubscriptions();
  }, [token]);

  const fetchPendingSubscriptions = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/billing/subscriptions?status=pending_verification', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPendingSubscriptions(data.subscriptions);
      }
    } catch (error) {
      console.error('Error fetching pending subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (subscriptionId: number, action: 'approve' | 'reject', reason?: string) => {
    setActionLoading(`${action}-${subscriptionId}`);
    try {
      const response = await fetch(`http://localhost:5000/api/admin/billing/verify-subscription/${subscriptionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action, reason }),
      });

      if (response.ok) {
        await fetchPendingSubscriptions();
        alert(`Subscription ${action}d successfully`);
      } else {
        const errorData = await response.json();
        alert(errorData.message || `Failed to ${action} subscription`);
      }
    } catch (error) {
      console.error(`Error ${action}ing subscription:`, error);
      alert(`Failed to ${action} subscription`);
    } finally {
      setActionLoading(null);
    }
  };

  const viewReceipt = (receiptPath: string) => {
    setSelectedReceipt(receiptPath);
    setShowReceiptModal(true);
  };

  const downloadReceipt = async (receiptPath: string, organizationName: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/billing/download-receipt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ receiptPath }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `receipt-${organizationName}-${Date.now()}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading receipt:', error);
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'basic': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'professional': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'enterprise': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const filteredSubscriptions = pendingSubscriptions.filter(sub =>
    (sub.organization_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     sub.organization_email?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterPlan === '' || sub.plan_id === filterPlan)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Subscription Verification</h1>
          <p className="text-gray-600 dark:text-gray-400">Review and verify pending subscription payments</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <Clock className="h-4 w-4" />
          <span>{filteredSubscriptions.length} pending verification</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search organizations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full dark:bg-gray-700 dark:text-white"
            />
          </div>
          <select
            value={filterPlan}
            onChange={(e) => setFilterPlan(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          >
            <option value="">All Plans</option>
            <option value="basic">Basic</option>
            <option value="professional">Professional</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>
      </div>

      {/* Pending Subscriptions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredSubscriptions.map((subscription) => (
          <div key={subscription.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {subscription.organization_name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{subscription.organization_email}</p>
              </div>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                <Clock className="h-3 w-3 mr-1" />
                Pending
              </span>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Plan:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPlanColor(subscription.plan_id)}`}>
                  {subscription.plan_id}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Amount:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">${subscription.amount}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Billing:</span>
                <span className="text-sm text-gray-900 dark:text-white capitalize">{subscription.billing_cycle}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Payment Method:</span>
                <span className="text-sm text-gray-900 dark:text-white capitalize">
                  {subscription.payment_method.replace('_', ' ')}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Submitted:</span>
                <span className="text-sm text-gray-900 dark:text-white">
                  {new Date(subscription.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Receipt Actions */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Payment Receipt</span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => viewReceipt(subscription.receipt_path)}
                    className="flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View
                  </button>
                  <button
                    onClick={() => downloadReceipt(subscription.receipt_path, subscription.organization_name)}
                    className="flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Download
                  </button>
                </div>
              </div>
            </div>

            {/* Verification Actions */}
            <div className="flex space-x-2">
              <button
                onClick={() => handleVerification(subscription.id, 'approve')}
                disabled={actionLoading === `approve-${subscription.id}`}
                className="flex-1 flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {actionLoading === `approve-${subscription.id}` ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Approve
              </button>
              <button
                onClick={() => {
                  const reason = prompt('Enter rejection reason:');
                  if (reason) {
                    handleVerification(subscription.id, 'reject', reason);
                  }
                }}
                disabled={actionLoading === `reject-${subscription.id}`}
                className="flex-1 flex items-center justify-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {actionLoading === `reject-${subscription.id}` ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <X className="h-4 w-4 mr-2" />
                )}
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredSubscriptions.length === 0 && (
        <div className="text-center py-12">
          <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">All caught up!</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {searchTerm || filterPlan ? 'No subscriptions match your filters.' : 'No pending subscription verifications.'}
          </p>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceiptModal && selectedReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Payment Receipt</h2>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-4 max-h-[80vh] overflow-auto">
              <div className="flex justify-center">
                <img
                  src={`http://localhost:5000/${selectedReceipt}`}
                  alt="Payment Receipt"
                  className="max-w-full h-auto rounded-lg shadow-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    const errorDiv = document.createElement('div');
                    errorDiv.className = 'text-center py-8';
                    errorDiv.innerHTML = `
                      <div class="text-gray-400 mb-2">
                        <svg class="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p class="text-gray-600">Receipt file cannot be displayed</p>
                      <p class="text-sm text-gray-500 mt-1">This might be a PDF or unsupported image format</p>
                    `;
                    (e.target as HTMLImageElement).parentNode?.appendChild(errorDiv);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionVerification;