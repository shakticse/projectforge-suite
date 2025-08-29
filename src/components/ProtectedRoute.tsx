import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    console.log('ProtectedRoute: isAuthenticated =', isAuthenticated);
    if (!isAuthenticated) {
      console.log('ProtectedRoute: Redirecting to login');
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Only render children if authenticated
  if (!isAuthenticated) {
    console.log('ProtectedRoute: Not authenticated, returning null');
    return null;
  }

  console.log('ProtectedRoute: Authenticated, rendering children');
  return <>{children}</>;
}