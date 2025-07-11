export interface Model {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'training' | 'active' | 'error';
  createdAt: Date | string;
  updatedAt: Date | string;
  lastTrained?: Date | string;
  documents: Document[];
  apiKey?: string;
  embedUrl?: string;
  embedBubbleColor?: string;
  embedButtonShape?: string;
  embedFontStyle?: string;
  embedPosition?: string;
  // Full chat UI styling
  chatBackgroundColor?: string;
  userMessageBubbleColor?: string;
  assistantMessageBubbleColor?: string;
  assistantFontStyle?: string;
  messageBubbleRadius?: number;
  showAssistantAvatar?: boolean;
  assistantAvatarUrl?: string;
  showChatHeader?: boolean;
  chatHeaderTitle?: string;
  welcomeMessage?: string;
  totalSessions: number;
  
  // Handoff configuration
  handoffEnabled?: boolean;
  handoffSettings?: any;
  
  owner: {
    id: string;
    email: string;
  };
}

export interface Document {
  id: string;
  name: string;
  type: 'pdf' | 'txt' | 'docx' | 'gmail' | 'outlook' | 'imap' | 'crm';
  size: number;
  uploadedAt: Date | string;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  content?: string;
  // Email specific fields
  emailMetadata?: {
    messageId?: string;
    threadId?: string;
    from?: string;
    to?: string[];
    subject?: string;
    date?: Date | string;
    labels?: string[];
  };
}

export interface EmailIntegration {
  id: string;
  provider: 'gmail' | 'outlook' | 'imap';
  email: string;
  refreshToken: string;
  accessToken?: string;
  lastSyncAt?: Date;
  totalEmails?: number;
  processedEmails?: number;
  syncStatus: 'idle' | 'syncing' | 'error';
  createdAt: Date;
}

export interface CreateModelRequest {
  name: string;
  description?: string;
  documents: File[];
  useDropboxSync?: boolean;
  integrations?: {
    gmail?: boolean;
    salesforce?: boolean;
    hubspot?: boolean;
  };
  emailIntegrations?: EmailIntegration[];
}

export interface ModelSession {
  id: string;
  modelId: string;
  messages: ChatMessage[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date | string;
}

