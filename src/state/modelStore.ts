import { create } from 'zustand';
import { Model, CreateModelRequest } from '@/types/model';
import { v4 as uuidv4 } from 'uuid';

interface ModelState {
  models: Model[];
  isLoading: boolean;
  selectedModel: Model | null;
  
  // Actions
  setModels: (models: Model[]) => void;
  addModel: (model: Model) => void;
  updateModel: (id: string, updates: Partial<Model>) => void;
  deleteModel: (id: string) => void;
  setSelectedModel: (model: Model | null) => void;
  setLoading: (loading: boolean) => void;
  
  // Async actions
  createModel: (request: CreateModelRequest) => Promise<Model>;
  fetchModels: () => Promise<void>;
  trainModel: (id: string) => Promise<void>;
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
  
  deleteModel: (id) => set((state) => ({
    models: state.models.filter(model => model.id !== id)
  })),
  
  setSelectedModel: (model) => set({ selectedModel: model }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  createModel: async (request) => {
    set({ isLoading: true });
    
    try {
      // Create new model with training status
      const newModel: Model = {
        id: `assistant_${uuidv4()}`,
        name: request.name,
        description: request.description,
        status: 'training',
        createdAt: new Date(),
        updatedAt: new Date(),
        documents: request.documents.map((file, index) => ({
          id: `doc_${uuidv4()}`,
          name: file.name,
          type: file.name.endsWith('.pdf') ? 'pdf' : 
                file.name.endsWith('.docx') ? 'docx' : 'txt',
          size: file.size,
          uploadedAt: new Date(),
          status: 'processing'
        })),
        totalSessions: 0,
        owner: {
          id: 'mock_user_id',
          email: 'user@example.com'
        }
      };
      
      // Add to store
      get().addModel(newModel);
      
      // Simulate training process (5 seconds)
      setTimeout(() => {
        get().updateModel(newModel.id, { 
          status: 'active',
          lastTrained: new Date(),
          apiKey: `sk_${Math.random().toString(36).substring(7)}`,
          embedUrl: `https://chat.executa.ai/embed/${newModel.id}`,
          documents: newModel.documents.map(doc => ({
            ...doc,
            status: 'completed'
          }))
        });
      }, 5000);
      
      set({ isLoading: false });
      return newModel;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
  
  fetchModels: async () => {
    set({ isLoading: true });
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 500));
    set({ isLoading: false });
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
