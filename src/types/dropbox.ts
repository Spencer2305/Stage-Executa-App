export interface DropboxFile {
  id: string;
  name: string;
  path_lower: string;
  size: number;
  client_modified: string;
  server_modified: string;
  content_hash: string;
  is_downloadable: boolean;
}

export interface DropboxConnection {
  id: string;
  userId: string;
  accountId: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  dropboxAccountId: string;
  dropboxEmail: string;
  displayName: string;
  isActive: boolean;
  lastSyncAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DropboxSyncSession {
  id: string;
  connectionId: string;
  status: 'PENDING' | 'SYNCING' | 'COMPLETED' | 'ERROR';
  totalFiles: number;
  processedFiles: number;
  errorFiles: number;
  syncedFiles: number;
  skippedFiles: number;
  errorMessage?: string;
  startedAt: Date;
  completedAt?: Date;
}

export interface DropboxAuthResult {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  accountId: string;
  email: string;
  displayName: string;
}

export interface DropboxFileFilter {
  includeExtensions?: string[];
  excludeExtensions?: string[];
  maxFileSize?: number;
  includeSharedFiles?: boolean;
  includeFolders?: string[];
  excludeFolders?: string[];
} 