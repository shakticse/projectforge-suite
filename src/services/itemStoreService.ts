import api from '@/lib/api';

export const itemStoreService = {
  async getAll(storeName?: string) {
    // If no storeName provided, fall back to GET list endpoint
    if (!storeName) {
      const response = await api.get('/api/StoreItems');
      return response.data;
    }

    // When filtering by store, send storeName in the request body
    const response = await api.get(`/api/StoreItems/${storeName}`);
    return response.data;
  },

  // Get items optimized for building a BOM (materials + optional child items)
  async getBomItems() {
    const response = await api.get('/api/StoreItems/bomitems');
    return response.data;
  },

  async getById(id: string | number) {
    const response = await api.get(`/api/StoreItems/${id}`);
    return response.data;
  },

  async create(data: any) {
    // data should include CreatedBy (Guid) and other DTO fields
    const response = await api.post('/api/StoreItems', data);
    return response.data;
  },

  async createBulk(data: any[]) {
    // try bulk endpoint first; fallback to creating one-by-one
    try {
      const response = await api.post('/api/StoreItems/bulk', data);
      return response.data;
    } catch (err) {
      // fallback: create individually
      const results: any[] = [];
      for (const item of data) {
        const res = await api.post('/api/StoreItems', item);
        results.push(res.data);
      }
      return results;
    }
  },

  async update(id: string | number, data: any) {
    // data should include UpdatedBy (Guid) and other updatable fields
    const response = await api.put(`/api/StoreItems/${id}`, data);
    return response.data;
  },

  async delete(id: string | number, updatedBy?: string | null) {
    // include UpdatedBy in the request body for audit
    const config = updatedBy ? { data: { UpdatedBy: updatedBy } } : undefined;
    const response = await api.delete(`/api/StoreItems/${id}`, config);
    return response.data;
  }
};

export default itemStoreService;