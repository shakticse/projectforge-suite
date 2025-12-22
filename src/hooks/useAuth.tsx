import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/authService';
import { toast } from 'sonner';

export function useAuth() {
  const [user, setUser] = useState(authService.getCurrentUser());
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());
  const navigate = useNavigate();

  // Check authentication status
  const checkAuth = useCallback(() => {
    const currentUser = authService.getCurrentUser();
    const currentAuthStatus = authService.isAuthenticated();
    
    console.log('useAuth: checkAuth called', { currentUser, currentAuthStatus });
    
    setUser(currentUser);
    setIsAuthenticated(currentAuthStatus);
    
    return currentAuthStatus;
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    console.log('Logout initiated');
    try {
      await authService.logout();
      console.log('AuthService logout completed');
      
      setUser(null);
      setIsAuthenticated(false);
      
      console.log('Local state cleared, redirecting to login');
      toast.success("Logged out successfully");
      
      // Use replace to prevent back navigation
      navigate("/login", { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      toast.error("Logout failed");
      
      // Even if logout fails, clear local state and redirect
      console.log('Logout failed, but clearing local state and redirecting');
      setUser(null);
      setIsAuthenticated(false);
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  // Login function
  const login = useCallback(async (credentials: { email: string; password: string }) => {
    try {
      const result = await authService.login(credentials);
      setUser(result.user);
      setIsAuthenticated(true);
      return result;
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      console.error('Login error:', error);
      throw error;
    }
  }, []);

  // Listen for storage changes (logout from other tabs)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth_token' || e.key === 'user') {
        checkAuth();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [checkAuth]);

  // Initial auth check
  useEffect(() => {
    console.log('useAuth: Initial auth check');
    checkAuth();
  }, [checkAuth]);

  return {
    user,
    isAuthenticated,
    login,
    logout,
    checkAuth,
  };
}