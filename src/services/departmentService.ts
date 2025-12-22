import api from '@/lib/api';

export const departmentService = {
  async getAllDepartments() {
    // Endpoint may vary based on backend; adjust if different
    const response = await api.get('/api/roles/GetAllDepartment');
    return response.data;
  }
};
