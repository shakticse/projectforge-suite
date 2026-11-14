import api from '@/lib/api';

export interface ItemCategory {
  id?: number | string;
  categoryId?: number | string;
  CategoryId?: number | string;
  categoryName?: string;
  CategoryName?: string;
  name?: string;
  Name?: string;
}

export const categoryService = {
  async getAllCategories(): Promise<ItemCategory[]> {
    const response = await api.get<ItemCategory[]>('/api/Categories');
    return response.data;
  }
};
