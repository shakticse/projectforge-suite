import api from "@/lib/api";

export interface GatePassApiItem {
  id?: number;
  itemId: number;
  returnOfGatePassItemId?: number | null;
  itemName?: string;
  unit?: string;
  qty: number;
  receivedQty?: number;
}

export interface GatePassAvailableItem {
  itemId: number;
  itemName: string;
  unit: string;
  qty: number;
}

export interface GatePassApiPhoto {
  fileName: string;
  contentType: string;
  dataBase64: string;
}

export interface GatePassApiRecord {
  id: number;
  projectId: number;
  projectName?: string;
  bomId: number;
  bomName?: string;
  storeId: number;
  storeName?: string;
  passType: "Outward" | "Return";
  projectLocation?: string;
  eWayBillNumber?: string;
  dcNumber?: string;
  dcDate?: string | null;
  totalGoodsValue?: number | null;
  remarks?: string;
  fromAddress?: string;
  fromCity?: string;
  fromState?: string;
  fromZipCode?: string;
  toAddress?: string;
  toCity?: string;
  toState?: string;
  toZipCode?: string;
  vehicleType: string;
  vehicleNumber: string;
  driverName: string;
  phoneNumber: string;
  createdBy?: string;
  createdAt: string;
  items: GatePassApiItem[];
  photos?: GatePassApiPhoto[];
}

export const gatePassService = {
  async getAll(): Promise<GatePassApiRecord[]> {
    const response = await api.get("/api/gatepass");
    return response.data;
  },

  async getById(id: string | number): Promise<GatePassApiRecord> {
    const response = await api.get(`/api/gatepass/${id}`);
    return response.data;
  },

  async getAvailableItems(bomId: string | number, storeId: string | number): Promise<GatePassAvailableItem[]> {
    const response = await api.get("/api/gatepass/available-items", { params: { bomId, storeId } });
    return response.data;
  },

  async create(data: Omit<GatePassApiRecord, "id" | "createdAt" | "storeName">): Promise<{ id: number }> {
    const response = await api.post("/api/gatepass", data);
    return response.data;
  },

  async update(id: string | number, data: Omit<GatePassApiRecord, "id" | "createdAt" | "storeName">): Promise<{ id: number }> {
    const response = await api.put(`/api/gatepass/${id}`, data);
    return response.data;
  },

  async delete(id: string | number): Promise<void> {
    await api.delete(`/api/gatepass/${id}`);
  },

  async receiveReturn(
    id: string | number,
    item: { gatePassItemId: number; quantity: number },
  ): Promise<{ receivedQty: number }> {
    const response = await api.post(`/api/gatepass/${id}/receive`, item);
    return response.data;
  },
};

export default gatePassService;
