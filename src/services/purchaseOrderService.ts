import api from "@/lib/api";

export interface PurchaseOrderCreationItem {
  requestItemId: number;
  itemId: number;
  allottedQty: number;
}

export interface PurchaseOrderCreationPayload {
  purchaseRequestId: number;
  name: string;
  items: PurchaseOrderCreationItem[];
}

export const purchaseOrderService = {
  async create(data: PurchaseOrderCreationPayload) {
    const response = await api.post("/api/PurchaseOrderCreation", data);
    return response.data;
  },
};
