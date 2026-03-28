import { ReactNode } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/services/authService';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  // While auth state is being determined, render nothing (avoid flash)
  if (isLoading) {
    return null;
  }

  // Not authenticated — redirect synchronously during render (no useEffect delay)
  if (!isAuthenticated) {
    console.log('ProtectedRoute: Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // Check permissions for this route (if user has allowed menus)
  try {
    const currentUser = authService.getCurrentUser();
    const allowedMenuNames: string[] = (currentUser as any)?.allowedMenuNames || [];

    // Map path prefixes to menu titles (should match sidebar titles)
    const PATH_MENU_MAP: Array<{ path: string; title: string }> = [
      { path: '/', title: 'Dashboard' },
      { path: '/projects', title: 'Projects' },
      { path: '/store', title: 'Store' },
      { path: '/inventory', title: 'Inventory' },
      { path: '/vendors', title: 'Vendors' },
      { path: '/purchase-requests', title: 'Purchase Request' },
      { path: '/outsourcing-requests', title: 'Outsourcing Request' },
      { path: '/purchase-orders', title: 'Purchase Orders' },
      { path: '/bom', title: 'Bill of Materials' },
      { path: '/bom-action', title: 'BOM Allocation' },
      { path: '/material-request', title: 'Intra-Store Allocation' },
      { path: '/work-requests', title: 'Work Request' },
      { path: '/work-orders', title: 'Work Order' },
      { path: '/mrn-list', title: 'MRN List/Challan' },
      { path: '/gate-pass', title: 'Gate Pass' },
      { path: '/vehicle-request', title: 'Vehicle Request' },
      { path: '/users', title: 'Users' },
      { path: '/role-management', title: 'Role Management' },
      { path: '/query-issue-log', title: 'Query/Issue Log' },
      { path: '/reports', title: 'Reports' },
      { path: '/settings', title: 'Settings' },
    ];

    const pathname = window.location.pathname;
    const matched = PATH_MENU_MAP.find(m => pathname === '/' ? m.path === '/' : pathname.startsWith(m.path));

    if (matched && allowedMenuNames.length > 0 && !allowedMenuNames.includes(matched.title)) {
      // User doesn't have permission for this route
      console.warn('ProtectedRoute: Access denied to', pathname, 'for user', currentUser?.email);
      if (pathname !== '/access-denied') {
        navigate('/access-denied', { replace: true });
      }
      return null;
    }
  } catch (e) {
    console.warn('ProtectedRoute: permission check failed', e);
  }

  console.log('ProtectedRoute: Authenticated, rendering children');
  return <>{children}</>;
}