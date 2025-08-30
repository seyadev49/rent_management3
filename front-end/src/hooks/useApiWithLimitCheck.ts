import { useCallback } from 'react';
import { usePlanLimitContext } from '../contexts/PlanLimitContext';
import { usePlanLimits } from './usePlanLimits';

export const useApiWithLimitCheck = () => {
  const { showPlanLimitModal } = usePlanLimitContext();
  const { handleApiError } = usePlanLimits();

  const apiCall = useCallback(async (
    apiFunction: () => Promise<any>,
    feature: string
  ) => {
    try {
      const result = await apiFunction();
      
      // If result is a Response object (from fetch), check its status
      if (result && typeof result.json === 'function') {
        // Handle fetch response
        if (!result.ok) {
          // Parse error response
          let errorData = {};
          try {
            errorData = await result.json();
          } catch (e) {
            errorData = { status: result.status, message: result.statusText };
          }
          
          const error = {
            response: {
              status: result.status,
              data: errorData
            }
          };
          
          const limitError = handleApiError(error, feature);
          if (limitError) {
            showPlanLimitModal({
              feature: limitError.feature,
              currentUsage: limitError.currentUsage,
              limit: limitError.limit,
              plan: limitError.plan
            });
            return null;
          }
          
          throw new Error(`HTTP ${result.status}: ${result.statusText}`);
        }
        
        // Return parsed JSON for successful responses
        return await result.json();
      }
      
      // If it's already a resolved value (like from axios), return it directly
      return result;
      
    } catch (error: any) {
      // Handle network errors or other exceptions
      console.error('API call failed:', error);
      
      // Try to handle limit error from network errors
      const limitError = handleApiError(error, feature);
      if (limitError) {
        showPlanLimitModal({
          feature: limitError.feature,
          currentUsage: limitError.currentUsage,
          limit: limitError.limit,
          plan: limitError.plan
        });
        return null;
      }
      
      throw error;
    }
  }, [handleApiError, showPlanLimitModal]);

  return { apiCall };
};