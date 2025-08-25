import React from 'react';
import { X, Crown, ArrowRight } from 'lucide-react';

interface PlanLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  feature: string;
  currentPlan: string;
  currentUsage: number;
  limit: number | string;
}

const PlanLimitModal: React.FC<PlanLimitModalProps> = ({
  isOpen,
  onClose,
  onUpgrade,
  feature,
  currentPlan,
  currentUsage,
  limit
}) => {
  if (!isOpen) return null;

  const getFeatureDisplayName = (feature: string) => {
    switch (feature) {
      case 'properties': return 'properties';
      case 'tenants': return 'tenants';
      case 'documents': return 'documents';
      case 'maintenance_requests': return 'maintenance requests';
      default: return feature;
    }
  };

  const getRecommendedPlan = (currentPlan: string) => {
    switch (currentPlan) {
      case 'basic': return 'Professional';
      case 'professional': return 'Enterprise';
      default: return 'Professional';
    }
  };

  const getUpgradeMessage = (feature: string, currentPlan: string) => {
    const featureName = getFeatureDisplayName(feature);
    return `You need more ${featureName} to continue growing your business. Upgrade to ${getRecommendedPlan(currentPlan)} plan to unlock higher limits and additional features.`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 sm:mx-0 sm:h-10 sm:w-10">
                  <Crown className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Plan Limit Reached
                  </h3>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="mt-3 text-center sm:mt-0 sm:text-left">
              <div className="mt-2">
                <p className="text-sm text-gray-500 mb-4">
                  {getUpgradeMessage(feature, currentPlan)}
                </p>
                
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Current Usage:</span>
                    <span className="text-sm text-gray-900">{currentUsage} / {limit}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full" 
                      style={{ width: '100%' }}
                    ></div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">
                    🚀 Upgrade to {getRecommendedPlan(currentPlan)} Plan Today
                  </h4>
                  <p className="text-sm text-blue-700 mb-3">
                    Don't let limits slow you down! Get more {getFeatureDisplayName(feature)} and unlock powerful features to scale your property management business.
                  </p>
                  <ul className="text-sm text-blue-700 space-y-1">
                    {currentPlan === 'basic' && (
                      <>
                        <li>• Up to 20 properties</li>
                        <li>• Up to 200 tenants</li>
                        <li>• 500 document storage</li>
                        <li>• Advanced reporting</li>
                      </>
                    )}
                    {currentPlan === 'professional' && (
                      <>
                        <li>• Unlimited properties</li>
                        <li>• Unlimited tenants</li>
                        <li>• Unlimited document storage</li>
                        <li>• 24/7 phone support</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={onUpgrade}
              className="w-full inline-flex justify-center items-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Upgrade Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlanLimitModal;