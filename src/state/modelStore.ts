import { create } from 'zustand';
import { Model, CreateModelRequest } from '@/types/model';
import { modelApi } from '@/utils/api';
import { toast } from 'sonner';

interface ModelState {
  models: Model[];
  isLoading: boolean;
  selectedModel: Model | null;
  
  // Actions
  setModels: (models: Model[]) => void;
  addModel: (model: Model) => void;
  updateModel: (id: string, updates: Partial<Model>) => void;
  deleteModel: (id: string) => Promise<void>;
  setSelectedModel: (model: Model | null) => void;
  setLoading: (loading: boolean) => void;
  
  // Async actions
  createModel: (request: CreateModelRequest) => Promise<Model>;
  fetchModels: () => Promise<void>;
  trainModel: (id: string) => Promise<void>;
  refreshModel: (id: string) => Promise<void>;
}

export const useModelStore = create<ModelState>((set, get) => ({
  models: [],
  isLoading: false,
  selectedModel: null,
  
  setModels: (models) => set({ models }),
  
  addModel: (model) => set((state) => ({ 
    models: [...state.models, model] 
  })),
  
  updateModel: (id, updates) => set((state) => ({
    models: state.models.map(model => 
      model.id === id ? { ...model, ...updates, updatedAt: new Date() } : model
    )
  })),
  
  deleteModel: async (id: string) => {
    try {
      // Call API to delete from database
      await modelApi.delete(id);
      
      // Remove from local state only after successful API call
      set((state) => ({
        models: state.models.filter(model => model.id !== id)
      }));
      
      toast.success('Assistant deleted successfully');
    } catch (error) {
      console.error('Failed to delete assistant:', error);
      toast.error('Failed to delete assistant');
      throw error;
    }
  },
  
  setSelectedModel: (model) => set({ selectedModel: model }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  // Fetch all models from API
  fetchModels: async () => {
    set({ isLoading: true });
    try {
      console.log('🔍 ModelStore: Starting fetchModels...');
      
      // Check if we have an auth token
      const token = localStorage.getItem('executa-auth-token');
      if (!token) {
        console.log('❌ ModelStore: No auth token found');
        set({ isLoading: false });
        return;
      }
      
      console.log('✅ ModelStore: Auth token found, calling API...');
      const models = await modelApi.list();
      console.log('✅ ModelStore: API call successful, received models:', models.length);
      
      // Filter out any invalid models
      const validModels = models.filter(model => model && model.id);
      console.log('✅ ModelStore: Valid models after filtering:', validModels.length);
      
      set({ models: validModels, isLoading: false });
    } catch (error) {
      console.error('❌ ModelStore: Failed to fetch models:', error);
      console.error('❌ ModelStore: Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        status: (error as any)?.response?.status,
        data: (error as any)?.response?.data
      });
      toast.error('Failed to load assistants');
      set({ isLoading: false });
    }
  },
  
  // Create new assistant with real API call
  createModel: async (request) => {
    set({ isLoading: true });
    
    try {
      // Call the real API to create assistant
      const newModel = await modelApi.create(request);
      
      // Add to store
      get().addModel(newModel);
      
      toast.success('AI Assistant created successfully!');
      set({ isLoading: false });
      
      return newModel;
      
    } catch (error) {
      console.error('Failed to create assistant:', error);
      toast.error('Failed to create assistant');
      set({ isLoading: false });
      throw error;
    }
  },

  // Refresh a single model from API
  refreshModel: async (id: string) => {
    try {
      const model = await modelApi.get(id);
      get().updateModel(id, model);
    } catch (error) {
      console.error('Failed to refresh model:', error);
      toast.error('Failed to refresh assistant');
    }
  },
  
  trainModel: async (id) => {
    get().updateModel(id, { status: 'training' });
    
    // Mock training process
    setTimeout(() => {
      get().updateModel(id, { 
        status: 'active',
        lastTrained: new Date(),
        apiKey: `sk_${Math.random().toString(36).substring(7)}`,
        embedUrl: `https://chat.executa.ai/embed/${id}`
      });
    }, 3000);
  }
}));
