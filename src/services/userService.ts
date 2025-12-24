import api from '@/lib/api';

export const userService = {
  async getAllUsers() {
    const response = await api.get('/api/users');
    return response.data;
  },

  // Retrieve only managers for dropdowns
  async getAllManagers() {
    const response = await api.get('/api/Users/GetAllManagers');
    return response.data;
  },

  async getUserById(id: string | number) {
    const response = await api.get(`/api/users/${id}`);
    return response.data;
  },

  async createUser(data: any) {
    const response = await api.post('/api/users', data);
    return response.data;
  },

  async updateUser(id: string | number, data: any) {
    const response = await api.put(`/api/users/${id}`, data);
    return response.data;
  },

  async deleteUser(id: string | number) {
    const response = await api.delete(`/api/users/${id}`);
    return response.data;
  }
};
