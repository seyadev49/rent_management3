import React, { useState } from 'react';
import { AlertTriangle, CreditCard, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SubscriptionOverdueModalProps {
  isOpen: boolean;
  subscriptionData: {
    plan: string;
    amount: number;
    daysOverdue: number;
    nextRenewalDate: string;
  };
}

const SubscriptionOverdueModal: React.FC<SubscriptionOverdueModalProps> = ({
  isOpen,
  subscriptionData
}) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('credit_card');

  if (!isOpen) return null;

  const handleRenewSubscription = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/subscription/renew', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ paymentMethod }),
      });

      if (response.ok) {
        // Refresh the page to update subscription status
        window.location.reload();
      } else {
        const data = await response.json();
        alert(data.message || 'Renewal failed');
      }
    } catch (error) {
      console.error('Failed to renew subscription:', error);
      alert('Renewal failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Subscription Payment Overdue
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Your subscription payment is {subscriptionData.daysOverdue} day(s) overdue. 
                    Please renew your subscription to regain access to your account.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Subscription Details</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Plan:</span>
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {subscriptionData.plan}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Amount Due:</span>
                  <span className="text-sm font-medium text-gray-900">
                    ${subscriptionData.amount}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Days Overdue:</span>
                  <span className="text-sm font-medium text-red-600">
                    {subscriptionData.daysOverdue} days
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Payment Method</h4>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="credit_card"
                    checked={paymentMethod === 'credit_card'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <CreditCard className="h-5 w-5 ml-3 mr-2 text-gray-600" />
                  <span className="text-sm text-gray-900">Credit Card</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="bank_transfer"
                    checked={paymentMethod === 'bank_transfer'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="h-5 w-5 ml-3 mr-2 text-gray-600">🏦</span>
                  <span className="text-sm text-gray-900">Bank Transfer</span>
                </label>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleRenewSubscription}
              disabled={loading}
              className="w-full inline-flex justify-center items-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed sm:ml-3 sm:w-auto sm:text-sm"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  Renew Subscription (${subscriptionData.amount})
                </>
              )}
            </button>
          </div>

          <div className="bg-yellow-50 border-t border-yellow-200 px-4 py-3">
            <p className="text-xs text-yellow-800">
              <strong>Note:</strong> You cannot access any part of the system until your subscription is renewed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionOverdueModal;