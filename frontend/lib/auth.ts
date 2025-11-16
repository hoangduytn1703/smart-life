import { api, apiClient } from './api';

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export const authApi = {
  register: async (data: { email: string; password: string; name: string }) => {
    const response = await api.post<{ message: string; data: AuthResponse }>('/auth/register', data);
    if (response.data.data) {
      apiClient.setTokens(response.data.data.accessToken, response.data.data.refreshToken);
    }
    return response.data;
  },

  login: async (data: { email: string; password: string }) => {
    const response = await api.post<{ message: string; data: AuthResponse }>('/auth/login', data);
    if (response.data.data) {
      apiClient.setTokens(response.data.data.accessToken, response.data.data.refreshToken);
    }
    return response.data;
  },

  logout: () => {
    apiClient.clearTokens();
  },

  forgotPassword: async (email: string) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get<{ message: string; data: User }>('/users/me');
    return response.data;
  },
};

