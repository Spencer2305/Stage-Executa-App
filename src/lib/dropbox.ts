import { Dropbox } from 'dropbox';
import { DropboxFile, DropboxAuthResult, DropboxFileFilter } from '@/types/dropbox';

// Initialize Dropbox client
export function createDropboxClient(accessToken?: string) {
  return new Dropbox({
    clientId: process.env.DROPBOX_APP_KEY!,
    clientSecret: process.env.DROPBOX_APP_SECRET,
    accessToken: accessToken,
  });
}

// Get authorization URL for OAuth flow
export function getDropboxAuthUrl(state?: string): string {
  const clientId = process.env.DROPBOX_APP_KEY!;
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/integrations/dropbox/callback`;
  
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    token_access_type: 'offline', // Request refresh token
    ...(state && { state }),
  });
  
  return `https://www.dropbox.com/oauth2/authorize?${params.toString()}`;
}

// Exchange authorization code for access token
export async function exchangeCodeForToken(
  code: string,
  redirectUri: string
): Promise<DropboxAuthResult> {
  try {
    // Exchange code for token using fetch
    const tokenResponse = await fetch('https://api.dropboxapi.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        client_id: process.env.DROPBOX_APP_KEY!,
        client_secret: process.env.DROPBOX_APP_SECRET!,
        redirect_uri: redirectUri,
      }),
    });
    
    if (!tokenResponse.ok) {
      throw new Error(`Token exchange failed: ${tokenResponse.statusText}`);
    }
    
    const tokenData = await tokenResponse.json();
    console.log('✅ Token exchange successful:', { 
      hasAccessToken: !!tokenData.access_token,
      hasRefreshToken: !!tokenData.refresh_token,
      expiresIn: tokenData.expires_in 
    });
    
    // Get account info using native fetch (correct Dropbox API endpoint)
    const accountResponse = await fetch('https://api.dropboxapi.com/2/users/get_current_account', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      },
      body: 'null' // Dropbox API requires a body, even if null
    });
    
    console.log('📡 Account info response status:', accountResponse.status);
    
    if (!accountResponse.ok) {
      const errorText = await accountResponse.text();
      console.log('❌ Account info error:', errorText);
      throw new Error(`Account info failed: ${accountResponse.statusText} - ${errorText}`);
    }
    
    const accountInfo = await accountResponse.json();
    console.log('👤 Account info received:', {
      accountId: accountInfo.account_id,
      email: accountInfo.email,
      name: accountInfo.name?.display_name
    });
    
    return {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
      accountId: accountInfo.account_id,
      email: accountInfo.email,
      displayName: accountInfo.name.display_name,
    };
  } catch (error) {
    console.error('Dropbox token exchange error:', error);
    throw new Error('Failed to exchange code for token');
  }
}

// Refresh access token
export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  expiresIn: number;
}> {
  try {
    const response = await fetch('https://api.dropboxapi.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: process.env.DROPBOX_APP_KEY!,
        client_secret: process.env.DROPBOX_APP_SECRET!,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return {
      accessToken: data.access_token,
      expiresIn: data.expires_in || 14400, // 4 hours default
    };
  } catch (error) {
    console.error('Dropbox token refresh error:', error);
    throw new Error('Failed to refresh access token');
  }
}

// List all files in user's Dropbox using native fetch
export async function listDropboxFiles(
  accessToken: string,
  filters?: DropboxFileFilter,
  cursor?: string
): Promise<{
  files: DropboxFile[];
  hasMore: boolean;
  cursor?: string;
}> {
  try {
    let apiUrl: string;
    let requestBody: any;
    
    if (cursor) {
      // Continue listing from cursor
      apiUrl = 'https://api.dropboxapi.com/2/files/list_folder/continue';
      requestBody = { cursor };
    } else {
      // Start fresh listing
      apiUrl = 'https://api.dropboxapi.com/2/files/list_folder';
      requestBody = {
        path: '',
        recursive: true,
        include_media_info: false,
        include_deleted: false,
        include_has_explicit_shared_members: false,
        include_mounted_folders: true,
        limit: 2000
      };
    }
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Dropbox API error:', errorText);
      throw new Error(`Dropbox API failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Filter files based on criteria
    let files = data.entries
      .filter((entry: any) => entry['.tag'] === 'file')
      .map((file: any) => ({
        id: file.id,
        name: file.name,
        path_lower: file.path_lower,
        size: file.size,
        client_modified: file.client_modified,
        server_modified: file.server_modified,
        content_hash: file.content_hash,
        is_downloadable: file.is_downloadable || true,
      }));
    
    // Apply filters
    if (filters) {
      files = applyFileFilters(files, filters);
    }
    
    return {
      files,
      hasMore: data.has_more,
      cursor: data.cursor,
    };
  } catch (error) {
    console.error('Dropbox list files error:', error);
    throw new Error('Failed to list Dropbox files');
  }
}

// Download file content from Dropbox using native fetch
export async function downloadDropboxFile(
  accessToken: string,
  path: string
): Promise<Buffer> {
  try {
    const response = await fetch('https://content.dropboxapi.com/2/files/download', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Dropbox-API-Arg': JSON.stringify({ path }),
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Dropbox download API error:', errorText);
      throw new Error(`Dropbox download failed: ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error(`Dropbox download error for ${path}:`, error);
    throw new Error(`Failed to download file: ${path}`);
  }
}

// Apply file filters
function applyFileFilters(files: DropboxFile[], filters: DropboxFileFilter): DropboxFile[] {
  return files.filter((file) => {
    // Size filter
    if (filters.maxFileSize && file.size > filters.maxFileSize) {
      return false;
    }
    
    // Extension filters
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    if (filters.includeExtensions && filters.includeExtensions.length > 0) {
      if (!extension || !filters.includeExtensions.includes(extension)) {
        return false;
      }
    }
    
    if (filters.excludeExtensions && filters.excludeExtensions.length > 0) {
      if (extension && filters.excludeExtensions.includes(extension)) {
        return false;
      }
    }
    
    // Folder filters
    if (filters.includeFolders && filters.includeFolders.length > 0) {
      const isInIncludedFolder = filters.includeFolders.some(folder => 
        file.path_lower.startsWith(folder.toLowerCase())
      );
      if (!isInIncludedFolder) {
        return false;
      }
    }
    
    if (filters.excludeFolders && filters.excludeFolders.length > 0) {
      const isInExcludedFolder = filters.excludeFolders.some(folder => 
        file.path_lower.startsWith(folder.toLowerCase())
      );
      if (isInExcludedFolder) {
        return false;
      }
    }
    
    return true;
  });
}

// Validate Dropbox connection
export async function validateDropboxConnection(accessToken: string): Promise<boolean> {
  try {
    const dbx = createDropboxClient(accessToken);
    await dbx.usersGetCurrentAccount();
    return true;
  } catch (error) {
    console.error('Dropbox connection validation failed:', error);
    return false;
  }
} 