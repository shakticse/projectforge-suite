import api from '@/lib/api';

export const categoryService = {
  async getAllCategories() {
    const response = await api.get('/api/Categories');
    return response.data;
  }
};
