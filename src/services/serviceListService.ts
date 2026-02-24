import api from '@/lib/api';

export const serviceListService = {
  async getAllServices() {
    const response = await api.get('/api/ProjectServices');
    return response.data;
  }
};
