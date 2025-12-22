import api from '@/lib/api';
//import { apiService } from "@/lib/api"; 

export const roleService = {
  async getAllMenu() {
    // For other credentials, make API call
    const response = await api.get('/api/roles/GetAllMenu');
    console.log(response.data);
    return response.data;
  }
,
  async createRole(data: { Name: string; Description?: string | null; Permissions: Array<{ MenuId: number; CanCreate: boolean; CanView: boolean; CanUpdate: boolean; CanDelete: boolean; }>; }) {
    const response = await api.post('/api/roles', data);
    return response.data;
  },

  async updateRole(id: string | number, data: { Name: string; Description?: string | null; Permissions: Array<{ MenuId: number; CanCreate: boolean; CanView: boolean; CanUpdate: boolean; CanDelete: boolean; }>; }) {
    // Using a PUT to /api/role/update or /api/role/{id} depending on backend. Try standard update endpoint.
    const response = await api.put(`/api/roles/${id}`, data);
    return response.data;
  },

  async getRoleById(id: string | number) {
    // Fetch role details by id
    const response = await api.get(`/api/roles/${id}`);
    return response.data;
  }
,
  async getAllRoles() {
    // Fetch all roles - expected to return array with fields: RoleId, Name, Description, Users
    const response = await api.get('/api/roles');
    return response.data;
  },

  async deleteRole(id: string | number) {
    // Delete role by id
    const response = await api.delete(`/api/roles/${id}`);
    return response.data;
  }
};