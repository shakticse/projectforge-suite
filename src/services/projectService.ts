import api from '@/lib/api';

export const projectService = {
  async getAllProjects() {
    const response = await api.get('/api/project');
    return response.data;
  },

  async getProjectById(id: string | number) {
    const response = await api.get(`/api/project/${id}`);
    return response.data;
  },

  async createProject(data: FormData) {
    const response = await api.post('/api/project', data);
    return response.data;
  },

  async updateProject(id: string | number, data: any) {
    // If updating files, caller should send FormData; otherwise JSON is ok
    const isForm = data instanceof FormData;
    const response = await api.put(`/api/project/${id}`, data);
    return response.data;
  },

  async deleteProject(id: string | number) {
    const response = await api.delete(`/api/project/${id}`);
    return response.data;
  }
};
