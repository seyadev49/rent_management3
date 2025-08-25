
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface PlanLimitData {
  feature: string;
  currentUsage: number;
  limit: number | string;
  plan: string;
}

interface PlanLimitContextType {
  showPlanLimitModal: (data: PlanLimitData) => void;
  hidePlanLimitModal: () => void;
  planLimitData: PlanLimitData | null;
  isModalOpen: boolean;
}

const PlanLimitContext = createContext<PlanLimitContextType | undefined>(undefined);

export const usePlanLimitContext = () => {
  const context = useContext(PlanLimitContext);
  if (!context) {
    throw new Error('usePlanLimitContext must be used within a PlanLimitProvider');
  }
  return context;
};

interface PlanLimitProviderProps {
  children: ReactNode;
}

export const PlanLimitProvider: React.FC<PlanLimitProviderProps> = ({ children }) => {
  const [planLimitData, setPlanLimitData] = useState<PlanLimitData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const showPlanLimitModal = (data: PlanLimitData) => {
    setPlanLimitData(data);
    setIsModalOpen(true);
  };

  const hidePlanLimitModal = () => {
    setIsModalOpen(false);
    setPlanLimitData(null);
  };

  return (
    <PlanLimitContext.Provider value={{
      showPlanLimitModal,
      hidePlanLimitModal,
      planLimitData,
      isModalOpen
    }}>
      {children}
    </PlanLimitContext.Provider>
  );
};
