import api from '@/lib/api';

export interface InventoryMovement {
  id: number;
  transactionType: string;
  quantity: number;
  referenceType: string;
  referenceId?: number | null;
  performedBy?: string | null;
  transactionDate: string;
}

export interface StoreItemPayload {
  StoreId?: number;
  ItemId?: number | null;
  ItemName?: string | null;
  IsCustom?: boolean;
  Qty?: number;
  ItemPrice?: number | null;
  Source?: string;
  CreatedBy?: string | null;
  CreatedAt?: string;
  UpdatedBy?: string | null;
}

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

  async getByStoreId(storeId: string | number) {
    const response = await api.get('/api/StoreItems', { params: { storeId } });
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

  async getMovements(id: string | number): Promise<InventoryMovement[]> {
    const response = await api.get(`/api/StoreItems/${id}/movements`);
    return response.data;
  },

  async create(data: StoreItemPayload) {
    // data should include CreatedBy (Guid) and other DTO fields
    const response = await api.post('/api/StoreItems', data);
    return response.data;
  },

  async createBulk(data: StoreItemPayload[]) {
    const results: unknown[] = [];
    for (const item of data) {
      results.push(await this.create(item));
    }
    return results;
  },

  async update(id: string | number, data: StoreItemPayload) {
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