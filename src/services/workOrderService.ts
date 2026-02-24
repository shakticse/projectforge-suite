import api from '@/lib/api';

export const workOrderService = {
  async getAll() {
    const response = await api.get('/api/WorkOrders');
    return response.data;
  },

  async getById(id: string) {
    const response = await api.get(`/api/WorkOrders/${id}`);
    return response.data;
  },

  async create(payload: any) {
    const response = await api.post('/api/WorkOrders', payload);
    return response.data;
  },

  async update(id: string, payload: any) {
    const response = await api.put(`/api/WorkOrders/${id}`, payload);
    return response.data;
  },

  async delete(id: string) {
    const response = await api.delete(`/api/WorkOrders/${id}`);
    return response.data;
  }
};
