import { api } from './api';

export interface Wallet {
  id: string;
  userId: string;
  name: string;
  balance: number;
  includedInTotal: boolean;
  icon?: string;
  color?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWalletDto {
  name: string;
  includedInTotal?: boolean;
  icon?: string;
  color?: string;
  order?: number;
}

export interface UpdateWalletDto {
  name?: string;
  includedInTotal?: boolean;
  icon?: string;
  color?: string;
  order?: number;
}

export interface TransferMoneyDto {
  fromWalletId: string;
  toWalletId: string;
  amount: number;
  description?: string;
}

export interface ReorderWalletsDto {
  wallets: { id: string; order: number }[];
}

export const walletsApi = {
  getAll: async () => {
    const response = await api.get<{ message: string; data: Wallet[] }>('/wallets');
    return response.data;
  },

  getOne: async (id: string) => {
    const response = await api.get<{ message: string; data: Wallet }>(`/wallets/${id}`);
    return response.data;
  },

  getTotalBalance: async () => {
    const response = await api.get<{ message: string; data: { totalBalance: number } }>('/wallets/total-balance');
    return response.data;
  },

  create: async (data: CreateWalletDto) => {
    const response = await api.post<{ message: string; data: Wallet }>('/wallets', data);
    return response.data;
  },

  update: async (id: string, data: UpdateWalletDto) => {
    const response = await api.patch<{ message: string; data: Wallet }>(`/wallets/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete<{ message: string }>(`/wallets/${id}`);
    return response.data;
  },

  transfer: async (data: TransferMoneyDto) => {
    const response = await api.post<{ message: string }>('/wallets/transfer', data);
    return response.data;
  },

  reorder: async (data: ReorderWalletsDto) => {
    const response = await api.post<{ message: string }>('/wallets/reorder', data);
    return response.data;
  },
};

