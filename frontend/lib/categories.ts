import { api } from './api';

export interface Category {
  id: string;
  name: string;
  userId: string;
  parentId?: string | null;
  type?: string | null;
  createdAt: string;
  updatedAt: string;
  parent?: Category | null;
  children?: Category[];
}

export interface CreateCategoryDto {
  name: string;
  parentId?: string;
}

export interface UpdateCategoryDto {
  name?: string;
  parentId?: string | null;
}

export const categoriesApi = {
  getAll: async () => {
    const response = await api.get<{ message: string; data: Category[] }>('/categories');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<{ message: string; data: Category }>(`/categories/${id}`);
    return response.data;
  },

  create: async (data: CreateCategoryDto) => {
    const response = await api.post<{ message: string; data: Category }>('/categories', data);
    return response.data;
  },

  update: async (id: string, data: UpdateCategoryDto) => {
    const response = await api.patch<{ message: string; data: Category }>(
      `/categories/${id}`,
      data,
    );
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete<{ message: string }>(`/categories/${id}`);
    return response.data;
  },

  importDefault: async () => {
    const response = await api.post<{ message: string; count: number }>('/categories/import-default');
    return response.data;
  },
};

