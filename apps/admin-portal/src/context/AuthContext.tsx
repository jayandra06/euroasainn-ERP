import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  portalType: string;
  role: string;
  organizationId?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Use env var if set, otherwise use empty string in dev (Vite proxy) or localhost:3000 in production
// In dev mode, empty string means use Vite proxy which forwards /api/* to http://localhost:3000
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : 'http://localhost:3000');

// Debug: Log API URL in development
if (import.meta.env.DEV) {
  console.log('API_URL:', API_URL || '(empty - using Vite proxy)');
  console.log('import.meta.env.DEV:', import.meta.env.DEV);
  console.log('import.meta.env.VITE_API_URL:', import.meta.env.VITE_API_URL);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }

      // In dev mode with Vite proxy, use relative path (starts with /)
      // In production or when VITE_API_URL is set, use full URL
      let url: string;
      if (import.meta.env.DEV && !import.meta.env.VITE_API_URL) {
        url = '/api/v1/auth/me';
      } else {
        url = API_URL ? `${API_URL}/api/v1/auth/me` : 'http://localhost:3000/api/v1/auth/me';
      }
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.data);
      } else {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      // In dev mode with Vite proxy, use relative path (starts with /)
      // In production or when VITE_API_URL is set, use full URL
      let url: string;
      if (import.meta.env.DEV && !import.meta.env.VITE_API_URL) {
        // Dev mode: use relative path for Vite proxy
        url = '/api/v1/auth/login';
      } else {
        // Production or explicit API URL: use full URL
        url = API_URL ? `${API_URL}/api/v1/auth/login` : 'http://localhost:3000/api/v1/auth/login';
      }
      console.log('🔐 Login attempt:', { url, email, portalType: 'admin' });
      console.log('API_URL:', API_URL);
      console.log('import.meta.env.DEV:', import.meta.env.DEV);
      console.log('import.meta.env.VITE_API_URL:', import.meta.env.VITE_API_URL);
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          portalType: 'admin',
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Login failed';
        try {
          const error = await response.json();
          errorMessage = error.error || error.message || errorMessage;
          console.error('Login API error:', error);
        } catch (parseError) {
          // If response is not JSON, use status text
          errorMessage = response.statusText || `HTTP ${response.status}: Login failed`;
          console.error('Login failed - Status:', response.status, 'StatusText:', response.statusText, 'URL:', url);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      if (!data.success || !data.data) {
        throw new Error('Invalid response from server');
      }

      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken);
      setUser(data.data.user);
    } catch (error: any) {
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check if the API is running.');
      }
      // Re-throw other errors as-is
      throw error;
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');

      if (token && refreshToken) {
        // In dev mode with Vite proxy, use relative path (starts with /)
        // In production or when VITE_API_URL is set, use full URL
        let url: string;
        if (import.meta.env.DEV && !import.meta.env.VITE_API_URL) {
          url = '/api/v1/auth/logout';
        } else {
          url = API_URL ? `${API_URL}/api/v1/auth/logout` : 'http://localhost:3000/api/v1/auth/logout';
        }
        await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
      navigate('/login');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}



