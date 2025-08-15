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
}

export const authService = {
  async login(credentials: LoginCredentials) {
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
    await api.post('/auth/logout');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
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