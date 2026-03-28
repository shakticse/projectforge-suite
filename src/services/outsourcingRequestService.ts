import api from '@/lib/api';

/** Line item for create / bulk save */
export type OutsourcingRequestLineInput = {
  itemId: string | number;
  quantity: number;
};

export type OutsourcingRequestCreatePayload = {
  name: string;
  description?: string;
  items: OutsourcingRequestLineInput[];
};

export type OutsourcingRequestUpdatePayload = Partial<OutsourcingRequestCreatePayload> & {
  status?: string;
};

export const outsourcingRequestService = {
  async getAll() {
    const response = await api.get('/api/outsourcingrequest');
    return response.data;
  },

  async getById(id: string | number) {
    const response = await api.get(`/api/outsourcingrequest/${id}`);
    return response.data;
  },

  async create(data: OutsourcingRequestCreatePayload) {
    const response = await api.post('/api/outsourcingrequest', data);
    return response.data;
  },

  async update(id: string | number, data: OutsourcingRequestUpdatePayload) {
    const response = await api.put(`/api/outsourcingrequest/${id}`, data);
    return response.data;
  },

  async delete(id: string | number) {
    const response = await api.delete(`/api/outsourcingrequest/${id}`);
    return response.data;
  },
};

export default outsourcingRequestService;
