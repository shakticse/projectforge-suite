import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { authService } from '@/services/authService';

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

  // Check permissions for this route (if user has allowed menus)
  try {
    const currentUser = authService.getCurrentUser();
    const allowedMenuNames: string[] = (currentUser as any)?.allowedMenuNames || [];

    // Map path prefixes to menu titles (should match sidebar titles)
    const PATH_MENU_MAP: Array<{ path: string; title: string }> = [
      { path: '/', title: 'Dashboard' },
      { path: '/projects', title: 'Projects' },
      { path: '/inventory', title: 'Inventory' },
      { path: '/vendors', title: 'Vendors' },
      { path: '/purchase-requests', title: 'Purchase Request' },
      { path: '/purchase-orders', title: 'Purchase Orders' },
      { path: '/bom', title: 'Bill of Materials' },
      { path: '/bom-action', title: 'BOM Allocation' },
      { path: '/material-request', title: 'Material Request' },
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
      // If already showing Access Denied, do nothing to avoid loop
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