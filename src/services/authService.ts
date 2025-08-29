import api from '@/lib/api';

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
          department: 'Operations',
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
        email: 'site@projecthub.com',
        password: 'password',
        user: {
          id: '3',
          name: 'Mike Wilson',
          email: 'site@projecthub.com',
          role: 'Site Supervisor',
          department: 'Inventory',
          avatar: 'MW'
        }
      }
    ];

    // Check for demo credentials
    const demoUser = demoUsers.find(
      demo => demo.email === credentials.email && demo.password === credentials.password
    );

    if (demoUser) {
      const token = `demo-jwt-token-${demoUser.user.id}`;
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user', JSON.stringify(demoUser.user));
      return { token, user: demoUser.user };
    }
    
    // For other credentials, make API call
    const response = await api.post('/auth/login', credentials);
    const { token, user } = response.data;
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user', JSON.stringify(user));
    return { token, user };
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