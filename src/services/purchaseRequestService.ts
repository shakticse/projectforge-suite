import api from '@/lib/api';

/** Line item for create / bulk save */
export type PurchaseRequestLineInput = {
  itemId: string | number;
  quantity: number;
};

export type PurchaseRequestCreatePayload = {
  name: string;
  description?: string;
  items: PurchaseRequestLineInput[];
};

export type PurchaseRequestUpdatePayload = Partial<PurchaseRequestCreatePayload> & {
  status?: string;
};

export const purchaseRequestService = {
  /** List all purchase requests */
  async getAll() {
    const response = await api.get('/api/purchaserequest');
    return response.data;
  },

  /** Get a single purchase request by id */
  async getById(id: string | number) {
    const response = await api.get(`/api/purchaserequest/${id}`);
    return response.data;
  },

  /** Create a new purchase request with line items (bulk save) */
  async create(data: PurchaseRequestCreatePayload) {
    const response = await api.post('/api/purchaserequest', data);
    return response.data;
  },

  /** Update an existing purchase request */
  async update(id: string | number, data: PurchaseRequestUpdatePayload) {
    const response = await api.put(`/api/purchaserequest/${id}`, data);
    return response.data;
  },

  /** Delete a purchase request */
  async delete(id: string | number) {
    const response = await api.delete(`/api/purchaserequest/${id}`);
    return response.data;
  },
};

export default purchaseRequestService;
