import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { serviceFactory } from '../../services';

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Get service instances
  const authService = serviceFactory.getAuthService();
  const syncService = serviceFactory.getSyncService();
  
  const [currentUser, setCurrentUser] = useState<User | null>(authService.getCurrentUser());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = authService.onAuthChange((user: User | null) => {
      setCurrentUser(user);
      setIsLoading(false);
      
      // Initialize sync when user is authenticated
      if (user) {
        syncService.initSync().catch((err: Error) => {
          console.error('Error initializing sync:', err);
        });
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [authService, syncService]);

  const login = async (email: string, password: string): Promise<void> => {
    setError(null);
    setIsLoading(true);
    try {
      await authService.signIn(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during login');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setError(null);
    try {
      await authService.signOut();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during logout');
      throw err;
    }
  };

  const register = async (email: string, password: string): Promise<void> => {
    setError(null);
    setIsLoading(true);
    try {
      await authService.registerUser(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during registration');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    currentUser,
    isLoading,
    error,
    login,
    logout,
    register
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};