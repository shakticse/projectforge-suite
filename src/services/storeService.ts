import api from '@/lib/api';

export const storeService = {
  async getAllStores() {
    const response = await api.get('/api/stores');
    return response.data;
  },

  async getStoreById(id: string | number) {
    const response = await api.get(`/api/stores/${id}`);
    return response.data;
  },

  async createStore(data: any) {
    const response = await api.post('/api/stores', data);
    return response.data;
  },

  async updateStore(id: string | number, data: any) {
    const response = await api.put(`/api/stores/${id}`, data);
    return response.data;
  },

  async deleteStore(id: string | number) {
    const response = await api.delete(`/api/stores/${id}`);
    return response.data;
  }
};
