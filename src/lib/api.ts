import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { useAuthStore } from '@/store/useAuthStore';

export const baseURL =
import.meta.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

// Create an axios instance with defaults
const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const { token } = useAuthStore.getState();
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, logout user
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export interface ApiResponse<T = any> {
  code: number;
  message?: string;
  reason?: string;
  data?: T;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  totalPages: number;
  currentPage: number;
}

// Generic API request function
export async function authFetch<T = any>(
  url: string,
  options: AxiosRequestConfig = {}
): Promise<T> {
  try {
    const response: AxiosResponse<ApiResponse<T>> = await api({
      url,
      ...options,
    });

    return response.data.data as T;
  } catch (error: any) {
    console.error('API request failed:', error.response?.data || error.message);
    
    // Throw a more descriptive error
    const apiError = new Error(
      error.response?.data?.reason || error.response?.data?.message || 'API request failed'
    );
    (apiError as any).status = error.response?.status;
    (apiError as any).code = error.response?.data?.code;
    
    throw apiError;
  }
}

// Convenience methods for common HTTP verbs
export const apiClient = {
  // GET request
  get: <T = any>(url: string, params?: any): Promise<T> => 
    authFetch<T>(url, { method: 'GET', params }),

  // POST request
  post: <T = any>(url: string, data?: any): Promise<T> => 
    authFetch<T>(url, { method: 'POST', data }),

  // PUT request
  put: <T = any>(url: string, data?: any): Promise<T> => 
    authFetch<T>(url, { method: 'PUT', data }),

  // PATCH request
  patch: <T = any>(url: string, data?: any): Promise<T> => 
    authFetch<T>(url, { method: 'PATCH', data }),

  // DELETE request
  delete: <T = any>(url: string): Promise<T> => 
    authFetch<T>(url, { method: 'DELETE' }),
};

// Specific API methods for your application
export const campaignAPI = {
  // Campaign methods
  getAll: (params?: any) => apiClient.get('/api/campaigns', params),
  getById: (id: string) => apiClient.get(`/api/campaigns/${id}`),
  create: (data: any) => apiClient.post('/api/campaigns', data),
  update: (id: string, data: any) => apiClient.put(`/api/campaigns/${id}`, data),
  delete: (id: string) => apiClient.delete(`/api/campaigns/${id}`),
  updateStats: (id: string, data: any) => apiClient.patch(`/api/campaigns/${id}/stats`, data),
  updateStatus: (id: string, status: string) => apiClient.post(`/api/campaigns/${id}/status`, { status }),
};

export const deviceAPI = {
  // Device methods
  getAll: () => apiClient.get('/api/devices'),
  getById: (id: string) => apiClient.get(`/api/devices/${id}`),
  create: (data: any) => apiClient.post('/api/devices', data),
  update: (id: string, data: any) => apiClient.put(`/api/devices/${id}`, data),
  delete: (id: string) => apiClient.delete(`/api/devices/${id}`),
  updateStatus: (id: string, data: any) => apiClient.patch(`/api/devices/${id}/status`, data),
  updateStats: (id: string, data: any) => apiClient.patch(`/api/devices/${id}/stats`, data),
};

export const contactAPI = {
  // Contact list methods
  getLists: () => apiClient.get('/api/contacts/lists'),
  getListById: (id: string) => apiClient.get(`/api/contacts/lists/${id}`),
  createList: (data: any) => apiClient.post('/api/contacts/lists', data),
  updateList: (id: string, data: any) => apiClient.put(`/api/contacts/lists/${id}`, data),
  deleteList: (id: string) => apiClient.delete(`/api/contacts/lists/${id}`),
  
  // Contact methods
  getContacts: (listId: string, params?: any) => 
    apiClient.get(`/api/contacts/lists/${listId}/contacts`, params),
  createContact: (listId: string, data: any) => 
    apiClient.post(`/api/contacts/lists/${listId}/contacts`, data),
  updateContact: (id: string, data: any) => 
    apiClient.put(`/api/contacts/contacts/${id}`, data),
  deleteContact: (id: string) => 
    apiClient.delete(`/api/contacts/contacts/${id}`),
  importContacts: (listId: string, contacts: any[]) => 
    apiClient.post(`/api/contacts/lists/${listId}/contacts/import`, { contacts }),
};

export const messageAPI = {
  // Message methods
  getAll: (params?: any) => apiClient.get('/api/messages', params),
  getById: (id: string) => apiClient.get(`/api/messages/${id}`),
  create: (data: any) => apiClient.post('/api/messages', data),
  update: (id: string, data: any) => apiClient.put(`/api/messages/${id}`, data),
  delete: (id: string) => apiClient.delete(`/api/messages/${id}`),
  
  // Variant methods
  getVariants: (messageId: string) => 
    apiClient.get(`/api/messages/${messageId}/variants`),
  createVariant: (messageId: string, data: any) => 
    apiClient.post(`/api/messages/${messageId}/variants`, data),
  
  // Template methods
  getTemplates: () => apiClient.get('/api/messages/templates'),
  createTemplate: (data: any) => apiClient.post('/api/messages/templates', data),
  updateTemplate: (id: string, data: any) => apiClient.put(`/api/messages/templates/${id}`, data),
  deleteTemplate: (id: string) => apiClient.delete(`/api/messages/templates/${id}`),
};

export const authAPI = {
  // Auth methods (without token)
  signin: (email: string, password: string) => 
    api.post<{ user: any; token: string }>('/api/auth/signin', { email, password }),
  
  signup: (email: string, password: string, name: string) => 
    api.post<{ user: any; token: string }>('/api/auth/signup', { email, password, name }),
  
  getProfile: () => apiClient.get('/api/auth/me'),
  changePassword: (currentPassword: string, newPassword: string) => 
    apiClient.put('/api/auth/change-password', { currentPassword, newPassword }),
};

export default api;