export interface Model {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'training' | 'active' | 'error';
  createdAt: Date;
  updatedAt: Date;
  lastTrained?: Date;
  documents: Document[];
  apiKey?: string;
  embedUrl?: string;
  totalSessions: number;
  owner: {
    id: string;
    email: string;
  };
}

export interface Document {
  id: string;
  name: string;
  type: 'pdf' | 'txt' | 'docx' | 'gmail' | 'crm';
  size: number;
  uploadedAt: Date;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  content?: string;
}

export interface CreateModelRequest {
  name: string;
  description?: string;
  documents: File[];
  integrations?: {
    gmail?: boolean;
    salesforce?: boolean;
    hubspot?: boolean;
  };
}

export interface ModelSession {
  id: string;
  modelId: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

