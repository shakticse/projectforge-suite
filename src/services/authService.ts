import api from '@/lib/api';
//import { apiService } from "@/lib/api"; 
import { roleService } from '@/services/roleService';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
  role: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  avatar?: string;
}

export const authService = {
  async login(credentials: LoginCredentials) {
    // Demo credentials for different user roles
    const demoUsers = [
      {
        email: 'pm@projecthub.com',
        password: 'password',
        user: {
          id: '1',
          name: 'John Doe',
          email: 'pm@projecthub.com',
          role: 'Project Manager',
          department: 'Admin',
          avatar: 'JD'
        }
      },
      {
        email: 'supervisor@projecthub.com',
        password: 'password',
        user: {
          id: '2',
          name: 'Jane Smith',
          email: 'supervisor@projecthub.com',
          role: 'Project Supervisor',
          department: 'Operations',
          avatar: 'JS'
        }
      },
      {
        email: 'store@projecthub.com',
        password: 'password',
        user: {
          id: '3',
          name: 'Mike Wilson',
          email: 'store@projecthub.com',
          role: 'Store Supervisor',
          department: 'Store',
          avatar: 'MW'
        }
      },
      {
        email: 'purchase@projecthub.com',
        password: 'password',
        user: {
          id: '4',
          name: 'Dave',
          email: 'purchase@projecthub.com',
          role: 'Purchase',
          department: 'Store',
          avatar: 'DS'
        }
      }
    ];

    // // Check for demo credentials
    // const demoUser = demoUsers.find(
    //   demo => demo.email === credentials.email && demo.password === credentials.password
    // );

    // if (demoUser) {
    //   const token = `demo-jwt-token-${demoUser.user.id}`;
    //   localStorage.setItem('auth_token', token);
    //   localStorage.setItem('user', JSON.stringify(demoUser.user));
    //   return { token, user: demoUser.user };
    // }
    
    // For other credentials, make API call
    const response = await api.post('/api/auth/login', credentials);
    console.log(response);
    const { token, name, email, role, department, avatar, message } = response.data;
    if(token) {
      const user = {
        name: name,
        email: email,
        role: role,
        department: department,
        avatar: avatar
      };
      // Fetch role permissions and menus to build allowed paths (best-effort)
      try {
        const menus: any = await roleService.getAllMenu();

        // Determine role id when available
        let roleId: string | number | undefined = undefined;
        if (typeof role === 'number' || /^[0-9]+$/.test(String(role))) roleId = role;
        // If role appears to be a name, try to find it in roles list
        if (!roleId) {
          try {
            const allRoles: any = await roleService.getAllRoles();
            const found = (allRoles || []).find((r: any) => (r.Name ?? r.name ?? '').toLowerCase() === String(role).toLowerCase());
            if (found) roleId = found.RoleId ?? found.id ?? found.roleId;
          } catch (e) {
            // ignore
          }
        }

        let permissions: any[] = [];
        if (roleId) {
          try {
            const roleDetails: any = await roleService.getRoleById(roleId);
            permissions = roleDetails?.Permissions || roleDetails?.permissions || [];
          } catch (e) {
            // ignore
          }
        }

        // Build allowed menu names and attach
        const allowedMenus = (permissions || []).filter(p => p.CanView || p.canView || p.can_view).map((p: any) => Number(p.MenuId ?? p.menuId ?? p.menu_id));
        const allowedMenuNames = (menus || []).filter((m: any) => allowedMenus.includes(Number(m.id))).map((m: any) => m.menuName);
        (user as any).allowedMenuNames = allowedMenuNames;
        // Also attach raw permissions for later checks
        (user as any).permissions = permissions;
      } catch (e) {
        // best-effort: if fetching menu/permissions fails, don't block login
        console.warn('Failed to fetch role permissions on login', e);
      }
      console.log(token);
      console.log(user);
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user', JSON.stringify(user));
      return { token, user };
    }
    else {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      throw(message);
    }
  },

  async signup(data: SignupData) {
    const response = await api.post('/auth/signup', data);
    return response.data;
  },

  async logout() {
    try {
      // Try to call the logout API, but don't fail if it doesn't work
      await api.post('/auth/logout');
    } catch (error) {
      // Log the error but don't throw - we still want to clear local storage
      console.warn('Logout API call failed, but continuing with local cleanup:', error);
    } finally {
      // Always clear local storage regardless of API call success/failure
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    }
  },

  getCurrentUser(): User | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
};