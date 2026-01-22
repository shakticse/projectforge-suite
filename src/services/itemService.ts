import api from '@/lib/api';

export const itemService = {
  async getAllItems() {
    const response = await api.get('/api/items');
    return response.data;
  },

  async getAllBomItems() {
    const response = await api.get('/api/items/bomitems');
    return response.data;
  }
};
