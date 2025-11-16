import { api } from './api';

export interface Income {
  id: string;
  userId: string;
  categoryId: string;
  walletId?: string;
  amount: string;
  description?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
  category: {
    id: string;
    name: string;
  };
  wallet?: {
    id: string;
    name: string;
  };
}

export interface CreateIncomeDto {
  amount: number;
  categoryId: string;
  description?: string;
  date: string;
  walletId?: string;
}

export interface UpdateIncomeDto {
  amount?: number;
  categoryId?: string;
  description?: string;
  date?: string;
  walletId?: string;
}

export interface IncomeQuery {
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  walletId?: string;
}

export interface IncomeAnalytics {
  total: number;
  count: number;
  categoryBreakdown: Array<{
    categoryId: string;
    categoryName: string;
    totalAmount: number;
    count: number;
  }>;
  walletBreakdown: Array<{
    walletId: string | null;
    walletName: string;
    totalAmount: number;
    count: number;
  }>;
  dailyStats: Array<{
    date: string;
    total: number;
  }>;
}

export const incomesApi = {
  create: async (data: CreateIncomeDto) => {
    return api.post<{ message: string; data: Income }>('/incomes', data);
  },

  getAll: async (query?: IncomeQuery) => {
    const params = new URLSearchParams();
    if (query?.startDate) params.append('startDate', query.startDate);
    if (query?.endDate) params.append('endDate', query.endDate);
    if (query?.categoryId) params.append('categoryId', query.categoryId);
    if (query?.walletId) params.append('walletId', query.walletId);
    return api.get<{ message: string; data: Income[] }>(`/incomes?${params.toString()}`);
  },

  getOne: async (id: string) => {
    return api.get<{ message: string; data: Income }>(`/incomes/${id}`);
  },

  update: async (id: string, data: UpdateIncomeDto) => {
    return api.patch<{ message: string; data: Income }>(`/incomes/${id}`, data);
  },

  delete: async (id: string) => {
    return api.delete<{ message: string }>(`/incomes/${id}`);
  },

  getAnalytics: async (query?: IncomeQuery) => {
    const params = new URLSearchParams();
    if (query?.startDate) params.append('startDate', query.startDate);
    if (query?.endDate) params.append('endDate', query.endDate);
    if (query?.categoryId) params.append('categoryId', query.categoryId);
    if (query?.walletId) params.append('walletId', query.walletId);
    const response = await api.get<{ message: string; data: IncomeAnalytics }>(`/incomes/analytics?${params.toString()}`);
    return response.data;
  },

  getDailyTotal: async (date: string) => {
    const response = await api.get<{ message: string; data: { date: string; total: number } }>(`/incomes/daily/${date}`);
    return response.data;
  },

  getWeeklyTotal: async (startDate: string) => {
    const response = await api.get<{ message: string; data: { startDate: string; endDate: string; total: number } }>(`/incomes/weekly/${startDate}`);
    return response.data;
  },

  getMonthlyTotal: async (year: number, month: number) => {
    const response = await api.get<{ message: string; data: { year: number; month: number; total: number } }>(`/incomes/monthly/${year}/${month}`);
    return response.data;
  },
};

