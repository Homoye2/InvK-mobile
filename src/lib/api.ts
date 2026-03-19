import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const API_URL = 'http://localhost:3000';

const api = axios.create({ baseURL: API_URL, headers: { 'Content-Type': 'application/json' } });

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
    }
    return Promise.reject(error);
  },
);

export const authAPI = {
  login: (identifier: string, password: string) =>
    api.post('/auth/login', { identifier, password }),
  register: (data: { tenantName: string; name: string; phone: string; email?: string; password: string }) =>
    api.post('/auth/register', data),
};

export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getActivity: () => api.get('/dashboard/activity'),
};

export const productsAPI = {
  getAll: () => api.get('/products'),
  create: (data: any) => api.post('/products', data),
  update: (id: string, data: any) => api.patch(`/products/${id}`, data),
  delete: (id: string) => api.delete(`/products/${id}`),
};

export const salesAPI = {
  getAll: (limit = 50) => api.get('/sales', { params: { limit } }),
  getMine: (limit = 20) => api.get('/sales/mine', { params: { limit } }),
  create: (data: any) => api.post('/sales', data),
  cancel: (id: string) => api.patch(`/sales/${id}/cancel`),
};

export const inventoryAPI = {
  getStocks: () => api.get('/inventory/stocks'),
  getLowStocks: () => api.get('/inventory/low-stocks'),
  adjustStock: (data: any) => api.post('/inventory/adjust', data),
  getMovements: () => api.get('/inventory/movements'),
};

export const usersAPI = {
  getAll: () => api.get('/users'),
  invite: (data: { name: string; email: string; password: string }) => api.post('/users/invite', data),
  toggleActive: (id: string) => api.patch(`/users/${id}/toggle-active`),
  updateProfile: (data: any) => api.patch('/users/profile', data),
};

export const subscriptionsAPI = {
  getMySubscription: () => api.get('/subscriptions/me'),
  getUsage: () => api.get('/subscriptions/usage'),
  getPlans: () => api.get('/subscriptions/plans'),
};

export const notificationsAPI = {
  getMine: () => api.get('/notifications'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
};

export default api;
