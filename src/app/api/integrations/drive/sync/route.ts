import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

const STORAGE_FILE = path.join(process.cwd(), '.drive-integrations.json');

function loadIntegrations() {
  if (fs.existsSync(STORAGE_FILE)) {
    return new Map(JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf-8')));
  }
  return new Map();
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const integrations = loadIntegrations();
    const integration = integrations.get(user.id);
    if (!integration || integration.status !== 'connected') {
      return NextResponse.json({ error: 'Google Drive not connected' }, { status: 400 });
    }
    // Set up OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_DRIVE_CLIENT_ID,
      process.env.GOOGLE_DRIVE_CLIENT_SECRET,
      process.env.GOOGLE_DRIVE_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/integrations/drive/callback`
    );
    oauth2Client.setCredentials({
      access_token: integration.accessToken,
      refresh_token: integration.refreshToken
    });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    // List files (first 20 for demo)
    const filesRes = await drive.files.list({
      pageSize: 20,
      fields: 'files(id, name, mimeType, modifiedTime, size)'
    });
    return NextResponse.json({ success: true, files: filesRes.data.files || [] });
  } catch (error) {
    console.error('Google Drive sync error:', error);
    return NextResponse.json({ error: 'Failed to sync Google Drive files' }, { status: 500 });
  }
} 