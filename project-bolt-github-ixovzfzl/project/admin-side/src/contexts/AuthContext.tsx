
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Admin {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  admin: Admin | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
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
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('admin_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const savedToken = localStorage.getItem('admin_token');
    if (savedToken) {
      try {
        const response = await fetch('http://localhost:5000/api/admin/profile', {
          headers: {
            Authorization: `Bearer ${savedToken}`,
          },
        });

        if (response.ok) {
          const adminData = await response.json();
          setAdmin(adminData);
          setToken(savedToken);
        } else {
          localStorage.removeItem('admin_token');
          setToken(null);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('admin_token');
        setToken(null);
      }
    }
    setLoading(false);
  };

const login = async (email: string, password: string): Promise<boolean> => {
  try {
    const response = await fetch('http://localhost:5000/api/auth/login', {  // use 0.0.0.0 instead of localhost
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (response.ok) {
      const data = await response.json();
      
      // Check if user is super_admin
      if (data.user.role !== 'super_admin') {
        throw new Error('Access denied. Super admin privileges required.');
      }

      setAdmin(data.user);
      setToken(data.token);
      localStorage.setItem('admin_token', data.token);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Login failed:', error);
    return false;
  }
};
  const logout = () => {
    setAdmin(null);
    setToken(null);
    localStorage.removeItem('admin_token');
  };

  return (
    <AuthContext.Provider value={{ admin, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
