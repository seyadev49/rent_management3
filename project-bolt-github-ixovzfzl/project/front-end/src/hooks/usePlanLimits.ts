
import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface PlanLimitResponse {
  canAccess: boolean;
  currentUsage: number;
  limit: number | string;
  plan: string;
  reason?: string;
  feature?: string;
}

interface PlanLimitError {
  canAccess: false;
  currentUsage: number;
  limit: number | string;
  plan: string;
  reason: string;
  feature: string;
}

export const usePlanLimits = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);

  const checkPlanLimit = useCallback(async (feature: string): Promise<PlanLimitResponse | null> => {
    if (!token) return null;

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5000/api/subscription/check-limits/${feature}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      } else {
        const errorData = await response.json();
        if (errorData.code === 'PLAN_LIMIT_EXCEEDED') {
          return {
            canAccess: false,
            currentUsage: errorData.currentUsage,
            limit: errorData.limit,
            plan: errorData.plan,
            reason: errorData.code,
            feature: errorData.feature
          };
        }
      }
    } catch (error) {
      console.error('Failed to check plan limits:', error);
    } finally {
      setLoading(false);
    }

    return null;
  }, [token]);

  const handleApiError = useCallback((error: any, feature: string): PlanLimitError | null => {
    if (error.response?.status === 403 && error.response?.data?.code === 'PLAN_LIMIT_EXCEEDED') {
      return {
        canAccess: false,
        currentUsage: error.response.data.currentUsage,
        limit: error.response.data.limit,
        plan: error.response.data.plan,
        reason: error.response.data.code,
        feature: error.response.data.feature
      };
    }
    return null;
  }, []);

  const createLimitCheckWrapper = useCallback((apiCall: Function, feature: string, onLimitReached?: (limitData: PlanLimitError) => void) => {
    return async (...args: any[]) => {
      try {
        return await apiCall(...args);
      } catch (error: any) {
        const limitError = handleApiError(error, feature);
        if (limitError && onLimitReached) {
          onLimitReached(limitError);
          return null;
        }
        throw error;
      }
    };
  }, [handleApiError]);

  return {
    checkPlanLimit,
    handleApiError,
    createLimitCheckWrapper,
    loading
  };
};
