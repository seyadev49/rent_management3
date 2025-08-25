import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { X, Check, CreditCard, Calendar, Upload, FileText, AlertCircle } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: string;
  features: string[];
}

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose }) => {
  const { token } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'plan' | 'payment' | 'receipt'>('plan');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchPlans();
      setStep('plan');
      setError('');
    }
  }, [isOpen]);

  const fetchPlans = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/subscription/plans', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPlans(data.plans);
        if (data.plans.length > 0) {
          setSelectedPlan(data.plans[1].id); // Default to professional plan
        }
      }
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    }
  };

  const handleUpgrade = async () => {
    if (!receiptFile) {
      setError('Please upload a payment receipt to confirm your upgrade');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('planId', selectedPlan);
      formData.append('paymentMethod', paymentMethod);
      formData.append('billingCycle', billingCycle);
      formData.append('receipt', receiptFile);

      const response = await fetch('http://localhost:5000/api/subscription/upgrade', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        alert('Subscription upgrade request submitted! We will verify your payment and activate your plan within 24 hours.');
        onClose();
        // Refresh the page to update subscription status
        window.location.reload();
      } else {
        const data = await response.json();
        setError(data.message || 'Upgrade failed');
      }
    } catch (error) {
      console.error('Failed to upgrade subscription:', error);
      setError('Upgrade failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (step === 'plan') {
      setStep('payment');
    } else if (step === 'payment') {
      setStep('receipt');
    }
  };

  const handleBack = () => {
    if (step === 'receipt') {
      setStep('payment');
    } else if (step === 'payment') {
      setStep('plan');
    }
  };

  if (!isOpen) return null;

  const selectedPlanData = plans.find(plan => plan.id === selectedPlan);
  const getPrice = () => {
    if (!selectedPlanData) return 0;
    return billingCycle === 'annual' ? selectedPlanData.price * 10 : selectedPlanData.price; // 2 months free for annual
  };

  const getSavings = () => {
    if (!selectedPlanData) return 0;
    return selectedPlanData.price * 2; // 2 months free
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Upgrade Your Plan</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center space-x-4">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  step === 'plan' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'
                }`}>
                  1
                </div>
                <div className="w-16 h-1 bg-gray-200">
                  <div className={`h-full bg-blue-600 transition-all duration-300 ${
                    step === 'payment' || step === 'receipt' ? 'w-full' : 'w-0'
                  }`}></div>
                </div>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  step === 'payment' ? 'bg-blue-600 text-white' : 
                  step === 'receipt' ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-400'
                }`}>
                  2
                </div>
                <div className="w-16 h-1 bg-gray-200">
                  <div className={`h-full bg-blue-600 transition-all duration-300 ${
                    step === 'receipt' ? 'w-full' : 'w-0'
                  }`}></div>
                </div>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  step === 'receipt' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
                }`}>
                  3
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-6 flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Step 1: Plan Selection */}
            {step === 'plan' && (
              <div className="space-y-6">
                {/* Billing Cycle Toggle */}
                <div className="flex justify-center">
                  <div className="bg-gray-100 p-1 rounded-lg">
                    <button
                      onClick={() => setBillingCycle('monthly')}
                      className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                        billingCycle === 'monthly'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      onClick={() => setBillingCycle('annual')}
                      className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                        billingCycle === 'annual'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Annual
                      <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        Save 17%
                      </span>
                    </button>
                  </div>
                </div>

                {/* Plan Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {plans.map((plan) => {
                    const price = billingCycle === 'annual' ? plan.price * 10 : plan.price;
                    const savings = billingCycle === 'annual' ? plan.price * 2 : 0;
                    
                    return (
                      <div
                        key={plan.id}
                        className={`border-2 rounded-lg p-6 cursor-pointer transition-all duration-200 relative ${
                          selectedPlan === plan.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedPlan(plan.id)}
                      >
                        {billingCycle === 'annual' && (
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                            <span className="bg-green-500 text-white text-xs px-3 py-1 rounded-full">
                              Save ${savings}
                            </span>
                          </div>
                        )}
                        
                        <div className="text-center">
                          <h4 className="text-xl font-semibold text-gray-900 mb-2">{plan.name}</h4>
                          <div className="mb-4">
                            <span className="text-3xl font-bold text-gray-900">${price}</span>
                            <span className="text-gray-600">/{billingCycle === 'annual' ? 'year' : 'month'}</span>
                            {billingCycle === 'annual' && (
                              <div className="text-sm text-green-600 font-medium">
                                ${plan.price}/month billed annually
                              </div>
                            )}
                          </div>
                          <ul className="space-y-2 text-sm text-gray-600">
                            {plan.features.map((feature, index) => (
                              <li key={index} className="flex items-center">
                                <Check className="h-4 w-4 text-green-500 mr-2" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 2: Payment Method */}
            {step === 'payment' && (
              <div className="space-y-6">
                <div className="text-center">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Choose Payment Method</h4>
                  <p className="text-gray-600">Select how you'd like to pay for your subscription</p>
                </div>

                <div className="space-y-4">
                  <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition-colors">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bank_transfer"
                      checked={paymentMethod === 'bank_transfer'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <div className="ml-4 flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg mr-3">
                        <span className="text-blue-600 text-lg">🏦</span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">Bank Transfer</div>
                        <div className="text-xs text-gray-500">Transfer to our bank account</div>
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition-colors">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="telebirr"
                      checked={paymentMethod === 'telebirr'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <div className="ml-4 flex items-center">
                      <div className="p-2 bg-green-100 rounded-lg mr-3">
                        <span className="text-green-600 text-lg">📱</span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">Telebirr</div>
                        <div className="text-xs text-gray-500">Mobile payment via Telebirr</div>
                      </div>
                    </div>
                  </label>
                </div>

                {/* Payment Instructions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h5 className="font-semibold text-blue-900 mb-2">Payment Instructions</h5>
                  {paymentMethod === 'bank_transfer' ? (
                    <div className="text-sm text-blue-800 space-y-1">
                      <p><strong>Bank:</strong> Commercial Bank of Ethiopia</p>
                      <p><strong>Account Number:</strong> 1000123456789</p>
                      <p><strong>Account Name:</strong> RentFlow Technologies</p>
                      <p><strong>Amount:</strong> ${getPrice()} USD</p>
                    </div>
                  ) : (
                    <div className="text-sm text-blue-800 space-y-1">
                      <p><strong>Telebirr Number:</strong> +251911123456</p>
                      <p><strong>Account Name:</strong> RentFlow Technologies</p>
                      <p><strong>Amount:</strong> ${getPrice()} USD equivalent in ETB</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Receipt Upload */}
            {step === 'receipt' && (
              <div className="space-y-6">
                <div className="text-center">
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">Upload Payment Receipt</h4>
                  <p className="text-gray-600">Please upload your payment receipt to confirm the upgrade</p>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    id="receipt-upload"
                    accept="image/*,.pdf"
                    onChange={(e) => setReceiptFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <label htmlFor="receipt-upload" className="cursor-pointer">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-900 mb-2">
                      {receiptFile ? receiptFile.name : 'Click to upload receipt'}
                    </p>
                    <p className="text-sm text-gray-500">
                      Supported formats: JPG, PNG, PDF (Max 10MB)
                    </p>
                  </label>
                </div>

                {receiptFile && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <FileText className="h-5 w-5 text-green-600 mr-2" />
                      <div>
                        <p className="text-sm font-medium text-green-800">{receiptFile.name}</p>
                        <p className="text-xs text-green-600">
                          {(receiptFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Order Summary */}
                {selectedPlanData && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="font-semibold text-gray-900 mb-3">Order Summary</h5>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">{selectedPlanData.name}</span>
                        <span className="font-semibold text-gray-900">
                          ${selectedPlanData.price}/{billingCycle === 'annual' ? 'month' : 'month'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Billing Cycle</span>
                        <span className="text-gray-900 capitalize">{billingCycle}</span>
                      </div>
                      {billingCycle === 'annual' && (
                        <div className="flex justify-between items-center text-green-600">
                          <span>Annual Discount (2 months free)</span>
                          <span>-${getSavings()}</span>
                        </div>
                      )}
                      <hr className="my-2" />
                      <div className="flex justify-between items-center font-semibold">
                        <span className="text-gray-900">Total</span>
                        <span className="text-gray-900">
                          ${getPrice()}/{billingCycle === 'annual' ? 'year' : 'month'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            {step === 'plan' && (
              <button
                onClick={handleNext}
                disabled={!selectedPlan}
                className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed sm:ml-3 sm:w-auto sm:text-sm"
              >
                Continue
              </button>
            )}

            {step === 'payment' && (
              <>
                <button
                  onClick={handleNext}
                  className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Continue to Receipt Upload
                </button>
                <button
                  onClick={handleBack}
                  className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Back
                </button>
              </>
            )}

            {step === 'receipt' && (
              <>
                <button
                  onClick={handleUpgrade}
                  disabled={loading || !receiptFile}
                  className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed sm:ml-3 sm:w-auto sm:text-sm"
                >
                  {loading ? 'Processing...' : 'Complete Upgrade'}
                </button>
                <button
                  onClick={handleBack}
                  disabled={loading}
                  className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Back
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;