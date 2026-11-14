import api from "@/lib/api";

export interface ReceiptPurchaseOrderItem {
  purchaseOrderItemId: number;
  itemId: number;
  itemName: string;
  unit: string;
  requestedQty: number;
  receivedQty: number;
  remainingQty: number;
}

export interface ReceiptPurchaseOrder {
  id: number;
  purchaseOrderNumber: string;
  vendorId: number;
  vendorName: string;
  projectId?: number | null;
  projectName?: string | null;
  storeId: number;
  storeName: string;
  deliveryLocationType?: string | null;
  items: ReceiptPurchaseOrderItem[];
}

export interface MaterialReceiptNoteItem {
  id: number;
  purchaseOrderItemId: number;
  itemId: number;
  itemName: string;
  unit: string;
  receivedQty: number;
}

export interface MaterialReceiptNote {
  id: number;
  mrnNumber: string;
  purchaseOrderId: number;
  purchaseOrderNumber: string;
  vendorId: number;
  vendorName: string;
  projectId?: number | null;
  projectName?: string | null;
  storeId: number;
  storeName: string;
  receiptDate: string;
  status: "Partial" | "Completed" | string;
  remarks?: string | null;
  createdAt: string;
  items: MaterialReceiptNoteItem[];
}

export interface MaterialReceiptNotePayload {
  purchaseOrderId: number;
  receiptDate: string;
  remarks?: string;
  items: Array<{
    purchaseOrderItemId: number;
    receivedQty: number;
  }>;
}

export const materialReceiptNoteService = {
  async getAll(): Promise<MaterialReceiptNote[]> {
    const response = await api.get<MaterialReceiptNote[]>("/api/MaterialReceiptNotes");
    return response.data;
  },

  async getById(id: number): Promise<MaterialReceiptNote> {
    const response = await api.get<MaterialReceiptNote>(`/api/MaterialReceiptNotes/${id}`);
    return response.data;
  },

  async getPurchaseOrdersByVendor(vendorId: number): Promise<ReceiptPurchaseOrder[]> {
    const response = await api.get<ReceiptPurchaseOrder[]>(
      `/api/MaterialReceiptNotes/purchase-orders?vendorId=${vendorId}`,
    );
    return response.data;
  },

  async create(payload: MaterialReceiptNotePayload): Promise<MaterialReceiptNote> {
    const response = await api.post<MaterialReceiptNote>("/api/MaterialReceiptNotes", payload);
    return response.data;
  },

  async update(id: number, payload: MaterialReceiptNotePayload): Promise<MaterialReceiptNote> {
    const response = await api.put<MaterialReceiptNote>(`/api/MaterialReceiptNotes/${id}`, payload);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/api/MaterialReceiptNotes/${id}`);
  },
};
