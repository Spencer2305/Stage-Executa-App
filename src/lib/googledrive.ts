import { google } from 'googleapis';
import { GoogleDriveFile, GoogleDriveAuthResult, GoogleDriveFileFilter, GoogleDriveListResult } from '@/types/googledrive';

// Google Drive scopes needed for file access
const GOOGLE_DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
];

// Check if Google Drive is configured
export function isGoogleDriveConfigured(): boolean {
}

// Initialize Google OAuth2 client
export function createGoogleDriveClient(accessToken?: string) {
  if (!isGoogleDriveConfigured()) {
  }
  
  const oauth2Client = new google.auth.OAuth2(
    `${process.env.NEXTAUTH_URL}/api/integrations/googledrive/callback`
  );

  if (accessToken) {
    oauth2Client.setCredentials({ access_token: accessToken });
  }

  return oauth2Client;
}

// Get authorization URL for OAuth flow
export function getGoogleDriveAuthUrl(state?: string): string {
  if (!isGoogleDriveConfigured()) {
    throw new Error('Google Drive integration not configured');
  }
  
  const oauth2Client = createGoogleDriveClient();
  
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: GOOGLE_DRIVE_SCOPES,
    prompt: 'consent', // Force consent to get refresh token
    state: state,
  });
  
  return authUrl;
}

// Exchange authorization code for tokens
export async function exchangeCodeForToken(code: string): Promise<GoogleDriveAuthResult> {
  try {
    const oauth2Client = createGoogleDriveClient();
    
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    
    if (!tokens.access_token) {
      throw new Error('No access token received from Google');
    }

    // Set credentials to get user info
    oauth2Client.setCredentials(tokens);
    
    // Get user information
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    
    if (!userInfo.data.email || !userInfo.data.id) {
      throw new Error('Unable to retrieve user information from Google');
    }

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || undefined,
      expiresIn: tokens.expiry_date ? Math.floor((tokens.expiry_date - Date.now()) / 1000) : undefined,
      accountId: userInfo.data.id,
      email: userInfo.data.email,
      displayName: userInfo.data.name || userInfo.data.email,
    };
  } catch (error) {
    console.error('Token exchange error:', error);
    throw new Error('Failed to exchange authorization code for access token');
  }
}

// Refresh access token using refresh token
export async function refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresIn: number }> {
  try {
    const oauth2Client = createGoogleDriveClient();
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    
    const { credentials } = await oauth2Client.refreshAccessToken();
    
    if (!credentials.access_token) {
      throw new Error('No access token received from refresh');
    }

    return {
      accessToken: credentials.access_token,
      expiresIn: credentials.expiry_date ? Math.floor((credentials.expiry_date - Date.now()) / 1000) : 3600,
    };
  } catch (error) {
    console.error('Token refresh error:', error);
    throw new Error('Failed to refresh Google Drive access token');
  }
}

// Supported Google Drive MIME types
const SUPPORTED_GOOGLE_DRIVE_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
  'application/json',
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/rtf',
  'application/vnd.oasis.opendocument.text',
  'application/vnd.oasis.opendocument.spreadsheet',
  'application/vnd.oasis.opendocument.presentation'
];

export async function listGoogleDriveFiles(
  accessToken: string,
  filter?: GoogleDriveFileFilter,
  pageToken?: string
): Promise<GoogleDriveListResult> {
  try {
    const oauth2Client = createGoogleDriveClient(accessToken);
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // Build query for file filtering
    let query = "trashed = false";
    
    // Filter by supported file types (extension)
    if (filter?.includeExtensions && filter.includeExtensions.length > 0) {
      const extensions = filter.includeExtensions.map(ext => `name contains '.${ext}'`).join(' or ');
      query += ` and (${extensions})`;
    }

    // Filter by folders if specified
    if (filter?.folders && filter.folders.length > 0) {
      const folderQueries = filter.folders.map(folderId => `'${folderId}' in parents`).join(' or ');
      query += ` and (${folderQueries})`;
    }

    console.log('🔍 Google Drive query:', query);

    const response = await drive.files.list({
      q: query,
      fields: 'nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, parents, webViewLink, webContentLink, thumbnailLink, description)',
      pageSize: 100,
      pageToken: pageToken,
      orderBy: 'modifiedTime desc',
    });

    const files = response.data.files || [];
    
    // Apply additional filtering: include files with supported MIME types even if extension doesn't match
    const filteredFiles: GoogleDriveFile[] = files
      .filter(file => {
        // Skip Google Workspace files that can't be downloaded directly
        const isGoogleWorkspaceFile = file.mimeType?.startsWith('application/vnd.google-apps.');
        if (isGoogleWorkspaceFile) {
          return false;
        }

        // Filter by file size if specified
        if (filter?.maxFileSize && file.size) {
          const sizeInBytes = parseInt(file.size, 10);
          if (sizeInBytes > filter.maxFileSize) {
            return false;
          }
        }

        // Filter by exclusion pattern if specified
        if (filter?.excludePattern && file.name) {
          if (filter.excludePattern.test(file.name)) {
            return false;
          }
        }

        // Accept if extension matches OR mimeType is supported
        const extensionMatch = filter?.includeExtensions && filter.includeExtensions.length > 0
          ? filter.includeExtensions.some(ext => file.name?.toLowerCase().endsWith('.' + ext))
          : true;
        const mimeTypeMatch = SUPPORTED_GOOGLE_DRIVE_MIME_TYPES.includes(file.mimeType || '');
        return extensionMatch || mimeTypeMatch;
      })
      .map(file => ({
        id: file.id!,
        name: file.name!,
        mimeType: file.mimeType!,
        size: file.size ? parseInt(file.size, 10) : undefined,
        createdTime: file.createdTime!,
        modifiedTime: file.modifiedTime!,
        parents: file.parents === null ? undefined : file.parents,
        webViewLink: file.webViewLink === null ? undefined : file.webViewLink,
        webContentLink: file.webContentLink === null ? undefined : file.webContentLink,
        thumbnailLink: file.thumbnailLink === null ? undefined : file.thumbnailLink,
        description: file.description === null ? undefined : file.description,
      }));

    return {
      files: filteredFiles,
      totalCount: filteredFiles.length,
      hasMore: !!response.data.nextPageToken,
      nextPageToken: response.data.nextPageToken || undefined,
    };
  } catch (error) {
    console.error('Google Drive file listing error:', error);
    throw new Error('Failed to list files from Google Drive');
  }
}

// Download file content from Google Drive
export async function downloadGoogleDriveFile(accessToken: string, fileId: string): Promise<Buffer> {
  try {
    const oauth2Client = createGoogleDriveClient(accessToken);
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    const response = await drive.files.get({
      fileId: fileId,
      alt: 'media',
    }, {
      responseType: 'arraybuffer',
    });

    return Buffer.from(response.data as ArrayBuffer);
  } catch (error) {
    console.error('Google Drive file download error:', error);
    throw new Error(`Failed to download file ${fileId} from Google Drive`);
  }
}

// Get file metadata from Google Drive
export async function getGoogleDriveFileMetadata(accessToken: string, fileId: string): Promise<GoogleDriveFile> {
  try {
    const oauth2Client = createGoogleDriveClient(accessToken);
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    const response = await drive.files.get({
      fileId: fileId,
      fields: 'id, name, mimeType, size, createdTime, modifiedTime, parents, webViewLink, webContentLink, thumbnailLink, description',
    });

    const file = response.data;
    
    return {
      id: file.id!,
      name: file.name!,
      mimeType: file.mimeType!,
      size: file.size ? parseInt(file.size, 10) : undefined,
      createdTime: file.createdTime!,
      modifiedTime: file.modifiedTime!,
      parents: file.parents === null ? undefined : file.parents,
      webViewLink: file.webViewLink === null ? undefined : file.webViewLink,
      webContentLink: file.webContentLink === null ? undefined : file.webContentLink,
      thumbnailLink: file.thumbnailLink === null ? undefined : file.thumbnailLink,
      description: file.description === null ? undefined : file.description,
    };
  } catch (error) {
    console.error('Google Drive file metadata error:', error);
    throw new Error(`Failed to get metadata for file ${fileId} from Google Drive`);
  }
} 