
import { useCallback } from 'react';
import { usePlanLimitContext } from '../contexts/PlanLimitContext';
import { usePlanLimits } from './usePlanLimits';

export const useApiWithLimitCheck = () => {
  const { showPlanLimitModal } = usePlanLimitContext();
  const { handleApiError } = usePlanLimits();

  const apiCall = useCallback(async (
    apiFunction: Function,
    feature: string
  ) => {
    try {
      return await apiFunction();
    } catch (error: any) {
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
