import api from "@/lib/api";

export interface GatePassApiItem {
  id?: number;
  itemId: number;
  itemName?: string;
  unit?: string;
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

  async create(data: Omit<GatePassApiRecord, "id" | "createdAt">): Promise<{ id: number }> {
    const response = await api.post("/api/gatepass", data);
    return response.data;
  },

  async update(id: string | number, data: Omit<GatePassApiRecord, "id" | "createdAt">): Promise<{ id: number }> {
    const response = await api.put(`/api/gatepass/${id}`, data);
    return response.data;
  },

  async delete(id: string | number): Promise<void> {
    await api.delete(`/api/gatepass/${id}`);
  },
};

export default gatePassService;
