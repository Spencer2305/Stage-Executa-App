import axios from 'axios';
import { Model, CreateModelRequest, ModelSession } from '@/types/model';

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('executa-auth-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth data and redirect to login
      localStorage.removeItem('executa-auth-token');
      localStorage.removeItem('executa-user-storage');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API functions
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  
  register: async (email: string, password: string, name?: string) => {
    const response = await api.post('/auth/register', { email, password, name });
    return response.data;
  },
  
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
  
  me: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// Models API functions
export const modelsApi = {
  getAll: async (): Promise<Model[]> => {
    const response = await api.get('/models');
    return response.data;
  },
  
  getById: async (id: string): Promise<Model> => {
    const response = await api.get(`/models/${id}`);
    return response.data;
  },
  
  create: async (data: CreateModelRequest): Promise<Model> => {
    const formData = new FormData();
    formData.append('name', data.name);
    if (data.description) {
      formData.append('description', data.description);
    }
    
    // Add files
    data.documents.forEach((file, index) => {
      formData.append(`documents`, file);
    });
    
    // Add integrations
    if (data.integrations) {
      formData.append('integrations', JSON.stringify(data.integrations));
    }
    
    const response = await api.post('/models', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  
  update: async (id: string, updates: Partial<Model>): Promise<Model> => {
    const response = await api.patch(`/models/${id}`, updates);
    return response.data;
  },
  
  delete: async (id: string): Promise<void> => {
    await api.delete(`/models/${id}`);
  },
  
  train: async (id: string): Promise<void> => {
    await api.post(`/models/${id}/train`);
  },
  
  generateApiKey: async (id: string): Promise<{ apiKey: string }> => {
    const response = await api.post(`/models/${id}/api-key`);
    return response.data;
  },
};

// Chat API functions
export const chatApi = {
  createSession: async (modelId: string): Promise<ModelSession> => {
    const response = await api.post('/chat/sessions', { modelId });
    return response.data;
  },
  
  sendMessage: async (sessionId: string, message: string) => {
    const response = await api.post(`/chat/sessions/${sessionId}/messages`, {
      content: message,
    });
    return response.data;
  },
  
  getSessions: async (modelId?: string): Promise<ModelSession[]> => {
    const params = modelId ? { modelId } : {};
    const response = await api.get('/chat/sessions', { params });
    return response.data;
  },
};

// Upload API functions
export const uploadApi = {
  uploadFile: async (file: File, onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
    
    return response.data;
  },
};

// Analytics API functions
export const analyticsApi = {
  getModelStats: async (modelId: string) => {
    const response = await api.get(`/analytics/models/${modelId}`);
    return response.data;
  },
  
  getDashboardStats: async () => {
    const response = await api.get('/analytics/dashboard');
    return response.data;
  },
};

export default api;

