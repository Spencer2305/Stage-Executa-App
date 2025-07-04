// Google Drive file representation
export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  createdTime: string;
  modifiedTime: string;
  parents?: string[];
  webViewLink?: string;
  webContentLink?: string;
  thumbnailLink?: string;
  description?: string;
}

// File filter options for Google Drive API
export interface GoogleDriveFileFilter {
  includeExtensions?: string[];
  maxFileSize?: number;
  folders?: string[];
  excludePattern?: RegExp;
}

// OAuth result after successful Google Drive authentication
export interface GoogleDriveAuthResult {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  accountId: string;
  email: string;
  displayName: string;
}

// Database model for Google Drive connections
export interface GoogleDriveConnection {
  id: string;
  userId: string;
  accountId: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  googleAccountId: string;
  googleEmail: string;
  displayName: string;
  isActive: boolean;
  lastSyncAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Sync session tracking
export interface GoogleDriveSyncSession {
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

// API response for file listing
export interface GoogleDriveListResult {
  files: GoogleDriveFile[];
  totalCount: number;
  hasMore: boolean;
  nextPageToken?: string;
} 