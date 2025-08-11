import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import SubscriptionOverdueModal from '../components/SubscriptionOverdueModal';

interface User {
  id: number;
  email: string;
  fullName: string;
  role: string;
  organizationId: number;
  organizationName: string;
  subscriptionStatus: string;
  trialEndDate: string;
  subscriptionPlan?: string;
  subscriptionPrice?: number;
  nextRenewalDate?: string;
  daysUntilRenewal?: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  loading: boolean;
  isSubscriptionOverdue: boolean;
}

interface RegisterData {
  organizationName: string;
  email: string;
  password: string;
  fullName: string;
  phone: string;
  address: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [isSubscriptionOverdue, setIsSubscriptionOverdue] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);

  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = localStorage.getItem('token');
      if (savedToken) {
        try {
          const response = await fetch('http://localhost:5000/api/auth/profile', {
            headers: {
              Authorization: `Bearer ${savedToken}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
            setToken(savedToken);
            
            // Check subscription status
            await checkSubscriptionStatus(savedToken);
          } else {
            const errorData = await response.json();
            if (errorData.code === 'SUBSCRIPTION_OVERDUE') {
              setIsSubscriptionOverdue(true);
              // Get subscription details for the modal
              await getSubscriptionDetails(savedToken);
            } else {
              localStorage.removeItem('token');
              setToken(null);
            }
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const checkSubscriptionStatus = async (authToken: string) => {
    try {
      const response = await fetch('http://localhost:5000/api/subscription/status', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const subscription = data.subscription;
        
        // Check if subscription is overdue
        if (subscription.subscription_status === 'overdue' || 
            (subscription.next_renewal_date && subscription.daysUntilRenewal < 0)) {
          setIsSubscriptionOverdue(true);
          setSubscriptionData({
            plan: subscription.subscription_plan,
            amount: subscription.subscription_price,
            daysOverdue: Math.abs(subscription.daysUntilRenewal || 0),
            nextRenewalDate: subscription.next_renewal_date
          });
        }
      }
    } catch (error) {
      console.error('Failed to check subscription status:', error);
    }
  };

  const getSubscriptionDetails = async (authToken: string) => {
    try {
      const response = await fetch('http://localhost:5000/api/subscription/status', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const subscription = data.subscription;
        setSubscriptionData({
          plan: subscription.subscription_plan,
          amount: subscription.subscription_price,
          daysOverdue: Math.abs(subscription.daysUntilRenewal || 0),
          nextRenewalDate: subscription.next_renewal_date
        });
      }
    } catch (error) {
      console.error('Failed to get subscription details:', error);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (data.code === 'SUBSCRIPTION_OVERDUE') {
        setIsSubscriptionOverdue(true);
        // You might want to get subscription details here too
        throw new Error('Your subscription is overdue. Please renew to continue.');
      }
      throw new Error(data.message || 'Login failed');
    }

    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('token', data.token);
  };

  const register = async (registerData: RegisterData) => {
    const response = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registerData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('token', data.token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setIsSubscriptionOverdue(false);
    setSubscriptionData(null);
    localStorage.removeItem('token');
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    loading,
    isSubscriptionOverdue,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      {isSubscriptionOverdue && subscriptionData && (
        <SubscriptionOverdueModal
          isOpen={isSubscriptionOverdue}
          subscriptionData={subscriptionData}
        />
      )}
    </AuthContext.Provider>
  );
};