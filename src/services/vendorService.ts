import api from '@/lib/api';

export interface Vendor {
  id: number;
  name: string;
  email: string;
  phone: string;
  contactPerson: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  gstNumber?: string | null;
  status: 'Active' | 'Inactive';
  categories: string[];
  isPreferred: boolean;
  createdAt: string;
}

export interface VendorPayload {
  name: string;
  email: string;
  phone: string;
  contactPerson: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  gstNumber?: string;
  status: 'Active' | 'Inactive';
  categories: string[];
  isPreferred: boolean;
}

export const vendorService = {
  async getAll(): Promise<Vendor[]> {
    const response = await api.get<Vendor[]>('/api/vendors');
    return response.data;
  },

  async getById(id: number): Promise<Vendor> {
    const response = await api.get<Vendor>(`/api/vendors/${id}`);
    return response.data;
  },

  async create(payload: VendorPayload): Promise<Vendor> {
    const response = await api.post<Vendor>('/api/vendors', payload);
    return response.data;
  },

  async update(id: number, payload: VendorPayload): Promise<Vendor> {
    const response = await api.put<Vendor>(`/api/vendors/${id}`, payload);
    return response.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/api/vendors/${id}`);
  },
};
