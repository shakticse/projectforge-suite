import api from "@/lib/api";

export interface WorkOrderGenerationItem {
  workOrderItemId: number;
  itemId: number;
  allottedQty: number;
}

export interface WorkOrderGenerationPayload {
  workOrderId: number;
  description?: string;
  items: WorkOrderGenerationItem[];
}

export const workOrderGenerationService = {
  async create(data: WorkOrderGenerationPayload) {
    const response = await api.post("/api/WorkOrderGeneration", data);
    return response.data;
  },
};
