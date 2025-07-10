import { NextRequest, NextResponse } from 'next/server';
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
function saveIntegrations(map: Map<string, any>) {
  fs.writeFileSync(STORAGE_FILE, JSON.stringify(Array.from(map.entries()), null, 2));
}

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_DRIVE_CLIENT_ID,
  process.env.GOOGLE_DRIVE_CLIENT_SECRET,
  process.env.GOOGLE_DRIVE_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/integrations/drive/callback`
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state'); // userId

    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/settings?error=drive_auth_failed&message=${encodeURIComponent(error)}`
      );
    }
    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/settings?error=drive_auth_failed&message=Missing+authorization+code`
      );
    }

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get user's email address
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    if (!userInfo.data.email) {
      throw new Error('Could not retrieve user email');
    }

    // Store the Drive integration
    const integrations = loadIntegrations();
    integrations.set(state, {
      userId: state,
      email: userInfo.data.email,
      accessToken: tokens.access_token || undefined,
      refreshToken: tokens.refresh_token || undefined,
      connectedAt: new Date().toISOString(),
      status: 'connected'
    });
    saveIntegrations(integrations);

    // Redirect back to settings with success
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/settings?success=drive_connected&email=${encodeURIComponent(userInfo.data.email)}`
    );
  } catch (error) {
    console.error('Google Drive callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/settings?error=drive_auth_failed&message=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`
    );
  }
} 