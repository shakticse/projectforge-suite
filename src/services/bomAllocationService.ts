import api from '@/lib/api';

export type BomAllocationItem = {
  itemId: string | number;
  allottedQty: number;
};

export type BomAllocationRequest = {
  bomId: string | number;
  storeId: string | number;
  allottedByUserId: string | number;
  items: BomAllocationItem[];
};

export type BomPurchaseOrderRequest = Omit<BomAllocationRequest, "storeId">;
export type BomOutsourceRequest = Omit<BomAllocationRequest, "storeId">;

export const bomAllocationService = {
  async allocate(data: BomAllocationRequest) {
    const response = await api.post('/api/BomAllocation', data);
    return response.data;
  },

  async createPurchaseOrder(data: BomPurchaseOrderRequest) {
    const response = await api.post('/api/PurchaseRequest', data);
    return response.data;
  },

  async createOutsourceRequest(data: BomOutsourceRequest) {
    const response = await api.post('/api/OutsourcingRequest', data);
    return response.data;
  },
};

export default bomAllocationService;