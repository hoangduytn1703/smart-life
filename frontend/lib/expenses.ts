import { api } from './api';

export interface Category {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  userId: string;
  categoryId: string;
  walletId?: string;
  amount: number;
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

export interface CreateExpenseDto {
  amount: number;
  categoryId: string;
  description?: string;
  date: string;
  walletId?: string;
}

export interface UpdateExpenseDto {
  amount?: number;
  categoryId?: string;
  description?: string;
  date?: string;
  walletId?: string;
}

export interface ExpenseQuery {
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  walletId?: string;
}

export interface ExpenseAnalytics {
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

export const expensesApi = {
  getAll: async (query?: ExpenseQuery) => {
    const response = await api.get<{ message: string; data: Expense[] }>('/expenses', {
      params: query,
    });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get<{ message: string; data: Expense }>(`/expenses/${id}`);
    return response.data;
  },

  create: async (data: CreateExpenseDto) => {
    const response = await api.post<{ message: string; data: Expense }>('/expenses', data);
    return response.data;
  },

  update: async (id: string, data: UpdateExpenseDto) => {
    const response = await api.patch<{ message: string; data: Expense }>(`/expenses/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete<{ message: string }>(`/expenses/${id}`);
    return response.data;
  },

  getAnalytics: async (query?: ExpenseQuery) => {
    const response = await api.get<{ message: string; data: ExpenseAnalytics }>(
      '/expenses/analytics',
      { params: query },
    );
    return response.data;
  },

  getDailyTotal: async (date: string) => {
    const response = await api.get<{ message: string; data: { date: string; total: number } }>(
      `/expenses/daily/${date}`,
    );
    return response.data;
  },

  getWeeklyTotal: async (startDate: string) => {
    const response = await api.get<{
      message: string;
      data: { startDate: string; endDate: string; total: number };
    }>(`/expenses/weekly/${startDate}`);
    return response.data;
  },

  getMonthlyTotal: async (year: number, month: number) => {
    const response = await api.get<{
      message: string;
      data: { year: number; month: number; total: number };
    }>(`/expenses/monthly/${year}/${month}`);
    return response.data;
  },
};

