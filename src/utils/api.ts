import axios, { AxiosResponse } from 'axios';
import { Model, CreateModelRequest, ModelSession, Document as ModelDocument } from '@/types/model';

// Conditional logger for development only (check for dev mode without process)
const isDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost';
const logger = {
  log: (...args: any[]) => isDevelopment && console.log(...args),
  error: (...args: any[]) => console.error(...args), // Keep errors in production for debugging
  warn: (...args: any[]) => isDevelopment && console.warn(...args),
};

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests if available (but not for auth endpoints except /auth/me)
api.interceptors.request.use((config) => {
  // Don't add auth token to auth endpoints EXCEPT /auth/me which needs authentication
  const isAuthEndpoint = config.url?.includes('/auth/');
  const isAuthMeEndpoint = config.url?.includes('/auth/me');
  logger.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url} (isAuthEndpoint: ${isAuthEndpoint}, isAuthMeEndpoint: ${isAuthMeEndpoint})`);
  
  if (!isAuthEndpoint || isAuthMeEndpoint) {
    const token = localStorage.getItem('executa-auth-token');
    if (token) {
      logger.log('🔑 API: Adding Authorization header to request');
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      logger.log('❌ API: No token found, not adding Authorization header');
    }
  } else {
    logger.log('🔓 API: Auth endpoint (non-me), skipping Authorization header');
  }
  return config;
});

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't redirect on 401 for login/register endpoints (these are expected to fail)
    const isLoginEndpoint = error.config?.url?.includes('/auth/login');
    const isRegisterEndpoint = error.config?.url?.includes('/auth/register');
    
    if (error.response?.status === 401 && !isLoginEndpoint && !isRegisterEndpoint) {
      console.log('🚫 API: 401 error on protected endpoint, redirecting to login');
      localStorage.removeItem('executa-auth-token');
      window.location.href = '/login';
    } else if (error.response?.status === 401 && (isLoginEndpoint || isRegisterEndpoint)) {
      console.log('🔓 API: 401 error on auth endpoint, not redirecting');
    }
    return Promise.reject(error);
  }
);

// Auth API functions
export const authApi = {
  login: async (email: string, password: string) => {
    try {
      logger.log('Making login request:', { email });
      const response = await api.post('/auth/login', { email, password });
      logger.log('Login response:', response.data);
      return response.data;
    } catch (error) {
      logger.error('Login API error:', error);
      throw error;
    }
  },

  register: async (email: string, password: string, name: string, organizationName: string) => {
    try {
      logger.log('Making registration request:', { email, name, organizationName });
      const response = await api.post('/auth/register', { email, password, name, organizationName });
      logger.log('Registration response:', response.data);
      return response.data;
    } catch (error) {
      logger.error('Registration API error:', error);
      throw error;
    }
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  forgotPassword: async (email: string) => {
    try {
      logger.log('Making forgot password request:', { email });
      const response = await api.post('/auth/forgot-password', { email });
      logger.log('Forgot password response:', response.data);
      return response.data;
    } catch (error) {
      logger.error('Forgot password API error:', error);
      throw error;
    }
  },

  resetPassword: async (token: string, password: string) => {
    try {
      logger.log('Making reset password request with token');
      const response = await api.post('/auth/reset-password', { token, password });
      logger.log('Reset password response:', response.data);
      return response.data;
    } catch (error) {
      logger.error('Reset password API error:', error);
      throw error;
    }
  },

  verifyResetToken: async (token: string) => {
    try {
      logger.log('Verifying reset token');
      const response = await api.post('/auth/verify-reset-token', { token });
      logger.log('Token verification response:', response.data);
      return response.data;
    } catch (error) {
      logger.error('Token verification API error:', error);
      throw error;
    }
  },
};

// Model/Assistant API functions
export const modelApi = {
  // Get all models for current user
  list: async (): Promise<Model[]> => {
    const response = await api.get('/models');
    return response.data.data;
  },

  // Get single model by ID
  get: async (id: string): Promise<Model> => {
    const response = await api.get(`/models/${id}`);
    return response.data.data;
  },

  // Create new assistant with knowledge files
  create: async (data: CreateModelRequest): Promise<Model> => {
    logger.log('🔍 CLIENT: Creating assistant with data:', {
      name: data.name,
      useDropboxSync: data.useDropboxSync,
      documentsCount: data.documents.length
    });

    const formData = new FormData();
    
    // Add text fields
    formData.append('name', data.name);
    if (data.description) {
      formData.append('description', data.description);
    }
    if (data.useDropboxSync) {
      logger.log('🔍 CLIENT: Adding useDropboxSync=true to form data');
      formData.append('useDropboxSync', 'true');
    } else {
      logger.log('🔍 CLIENT: useDropboxSync is false, not adding to form data');
    }
    
    // Add files
    data.documents.forEach((file) => {
      formData.append('files', file);
    });

    // Debug: Log all form data entries
    for (let [key, value] of formData.entries()) {
      logger.log(`🔍 CLIENT: FormData ${key}:`, typeof value === 'string' ? value : `[File: ${(value as File).name}]`);
    }

    const response = await api.post('/assistants/create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data.data;
  },

  // Update existing model
  update: async (id: string, data: Partial<Model>): Promise<Model> => {
    const response = await api.put(`/models/${id}`, data);
    return response.data.data;
  },

  // Delete model
  delete: async (id: string): Promise<void> => {
    await api.delete(`/models/${id}`);
  },

  // Get model sessions
  getSessions: async (id: string): Promise<ModelSession[]> => {
    const response = await api.get(`/models/${id}/sessions`);
    return response.data.data;
  },

  // Knowledge base management
  getFiles: async (id: string): Promise<ModelDocument[]> => {
    const response = await api.get(`/assistants/${id}/files`);
    return response.data.data;
  },

  addFiles: async (id: string, files: File[], onProgress?: (progress: number) => void): Promise<{ files: ModelDocument[]; newFiles: number }> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await api.post(`/assistants/${id}/files`, formData, {
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
    
    return response.data.data;
  },

  removeFile: async (assistantId: string, fileId: string): Promise<{ remainingFiles: ModelDocument[]; deletedCompletely: boolean }> => {
    const response = await api.delete(`/assistants/${assistantId}/files?fileId=${fileId}`);
    return response.data.data;
  },
};

// File API functions
export const fileApi = {
  // Upload files to knowledge base
  upload: async (files: File[], onProgress?: (progress: number) => void) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    
    const response = await api.post('/files/upload', formData, {
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

  // Get all files for current user
  list: async (page = 1, limit = 20, status?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (status) {
      params.append('status', status);
    }
    
    const response = await api.get(`/files/upload?${params}`);
    return response.data;
  },
};

// Upload API functions (legacy - keeping for backward compatibility)
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

