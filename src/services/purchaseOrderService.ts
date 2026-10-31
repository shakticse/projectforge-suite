import api from "@/lib/api";

export interface PurchaseOrderCreationItem {
  requestItemId: number;
  itemId: number;
  allottedQty: number;
  vendorPrice: number;
}

export interface PurchaseOrderCreationPayload {
  purchaseRequestId: number;
  vendorId: number;
  projectId: number;
  dueDate: string;
  description?: string;
  deliveryLocationType: "Project" | "Store";
  storeId?: number;
  name: string;
  items: PurchaseOrderCreationItem[];
}

export interface PurchaseOrderItemRecord {
  id: number;
  itemId: number;
  itemName: string;
  unit: string;
  quantity: number;
  vendorPrice: number;
  totalPrice: number;
}

export interface PurchaseOrderRecord {
  id: number;
  purchaseRequestId: number;
  name?: string | null;
  projectId?: number | null;
  projectName?: string | null;
  bomName?: string | null;
  vendorId?: number | null;
  vendorName?: string | null;
  vendorEmail?: string | null;
  vendorPhone?: string | null;
  vendorContactPerson?: string | null;
  vendorAddress?: string | null;
  vendorCity?: string | null;
  vendorState?: string | null;
  vendorZip?: string | null;
  vendorGstNumber?: string | null;
  status: string;
  orderDate?: string | null;
  dueDate?: string | null;
  deliveryLocationType?: string | null;
  deliveryAddress?: string | null;
  termsAndConditions?: string | null;
  itemCount: number;
  totalAmount: number;
  items: PurchaseOrderItemRecord[];
}

export const purchaseOrderService = {
  async getAll(): Promise<PurchaseOrderRecord[]> {
    const response = await api.get("/api/PurchaseOrderCreation");
    return response.data;
  },

  async getById(id: string | number): Promise<PurchaseOrderRecord> {
    const response = await api.get(`/api/PurchaseOrderCreation/${id}`);
    return response.data;
  },

  async create(data: PurchaseOrderCreationPayload) {
    const response = await api.post("/api/PurchaseOrderCreation", data);
    return response.data;
  },
};
