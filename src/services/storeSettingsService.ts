import api from "@/lib/api";

export interface StoreSettingsRecord {
  id?: number;
  storeId?: number;
  storeName: string;
  contactPersonName: string;
  contactAddress: string;
  gstNumber: string;
  emailAddress: string;
  phoneNumber1: string;
  phoneNumber2: string;
  logoUrl?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  ifscCode?: string | null;
  panNumber?: string | null;
}

export const storeSettingsService = {
  async get(): Promise<StoreSettingsRecord | null> {
    try {
      const response = await api.get("/api/store-settings");
      return response.data;
    } catch (error: unknown) {
      if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof error.response === "object" &&
        error.response !== null &&
        "status" in error.response &&
        error.response.status === 404
      ) {
        return null;
      }
      throw error;
    }
  },

  async upsert(data: StoreSettingsRecord): Promise<StoreSettingsRecord> {
    const response = await api.put("/api/store-settings", data);
    return response.data;
  },
};
