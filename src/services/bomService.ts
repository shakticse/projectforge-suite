import api from '@/lib/api';

export const bomService = {
  async getAll() {
    const response = await api.get('/api/bom');
    return response.data;
  },

  async getById(id: string | number) {
    const response = await api.get(`/api/bom/${id}`);
    return response.data;
  },

  async create(data: any) {
    const response = await api.post('/api/bom', data);
    return response.data;
  },

  async update(id: string | number, data: any) {
    const response = await api.put(`/api/bom/${id}`, data);
    return response.data;
  },

  async delete(id: string | number) {
    const response = await api.delete(`/api/bom/${id}`);
    return response.data;
  }
};

export default bomService;
