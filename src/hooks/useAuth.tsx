
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useToast } from './use-toast';
import { createErrorHandler, getErrorMessage } from '@/lib/error-utils';

// Types
interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'staff' | 'user';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role?: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isStaff: boolean;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// API helper
const API_BASE_URL = 'http://localhost:3000/api';

const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('access_token');

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      let errorMessage = 'Erro na requisição';

      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || `Erro ${response.status}: ${response.statusText}`;
      } catch {
        errorMessage = `Erro ${response.status}: ${response.statusText}`;
      }

      throw new Error(errorMessage);
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Erro de conexão com o servidor');
  }
};

// Auth Provider
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const handleError = createErrorHandler('Autenticação');

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const sessionToken = localStorage.getItem('session_token');

        if (!token || !sessionToken) {
          setLoading(false);
          return;
        }

        // Try to get current user
        try {
          const response = await apiCall('/auth/me');
          setUser(response.user);
        } catch (error) {
          // Token might be expired, try to refresh
          try {
            const refreshResponse = await apiCall('/auth/refresh', {
              method: 'POST',
              body: JSON.stringify({ session_token: sessionToken }),
            });

            localStorage.setItem('access_token', refreshResponse.access_token);
            setUser(refreshResponse.user);
          } catch (refreshError) {
            // Refresh failed, clear tokens
            localStorage.removeItem('access_token');
            localStorage.removeItem('session_token');
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);

      const response = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('session_token', response.session_token);
      setUser(response.user);

      toast({
        title: 'Sucesso',
        description: `Bem-vindo, ${response.user.name}!`,
      });
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      let specificMessage = errorMessage;

      // Mensagens específicas para login
      if (errorMessage.includes('Invalid email or password')) {
        specificMessage = 'Email ou senha incorretos';
      } else if (errorMessage.includes('User not found')) {
        specificMessage = 'Usuário não encontrado';
      } else if (errorMessage.includes('Too many requests')) {
        specificMessage = 'Muitas tentativas de login. Tente novamente em alguns minutos.';
      }

      toast({
        title: 'Erro de Login',
        description: specificMessage,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string, role: string = 'user') => {
    try {
      setLoading(true);

      const response = await apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, name, role }),
      });

      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('session_token', response.session_token);
      setUser(response.user);

      toast({
        title: 'Conta Criada',
        description: `Bem-vindo, ${response.user.name}!`,
      });
    } catch (error: any) {
      const errorMessage = getErrorMessage(error);
      let specificMessage = errorMessage;

      // Mensagens específicas para registro
      if (errorMessage.includes('already exists')) {
        specificMessage = 'Este email já está cadastrado';
      } else if (errorMessage.includes('weak password')) {
        specificMessage = 'Senha muito fraca. Use pelo menos 6 caracteres';
      } else if (errorMessage.includes('invalid email')) {
        specificMessage = 'Email inválido';
      }

      toast({
        title: 'Erro de Cadastro',
        description: specificMessage,
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiCall('/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('session_token');
      setUser(null);

      toast({
        title: 'Desconectado',
        description: 'Você foi desconectado com sucesso',
      });
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isStaff: user?.role === 'staff' || user?.role === 'admin',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// HOC for protected routes
export const withAuth = <P extends object>(Component: React.ComponentType<P>) => {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
      return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
    }

    if (!isAuthenticated) {
      return <div className="flex items-center justify-center min-h-screen">Acesso negado</div>;
    }

    return <Component {...props} />;
  };
};

// HOC for admin-only routes
export const withAdminAuth = <P extends object>(Component: React.ComponentType<P>) => {
  return function AdminComponent(props: P) {
    const { isAdmin, loading } = useAuth();

    if (loading) {
      return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
    }

    if (!isAdmin) {
      return <div className="flex items-center justify-center min-h-screen">Acesso restrito a administradores</div>;
    }

    return <Component {...props} />;
  };
};
