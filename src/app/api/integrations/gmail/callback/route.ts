import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

// Simple storage for Gmail integrations (matches the status endpoint)
import fs from 'fs';
import path from 'path';

const STORAGE_FILE = path.join(process.cwd(), '.gmail-integrations.json');

interface GmailIntegration {
  userId: string;
  email: string;
  accessToken?: string;
  refreshToken?: string;
  connectedAt: string;
  status: 'connected' | 'disconnected' | 'error';
}

const loadIntegrations = (): Map<string, GmailIntegration> => {
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const data = fs.readFileSync(STORAGE_FILE, 'utf8');
      const parsed = JSON.parse(data);
      return new Map(Object.entries(parsed));
    }
  } catch (error) {
    console.error('Error loading Gmail integrations:', error);
  }
  return new Map();
};

const saveIntegrations = (integrations: Map<string, GmailIntegration>) => {
  try {
    const data = Object.fromEntries(integrations);
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving Gmail integrations:', error);
  }
};

const GMAIL_INTEGRATIONS = loadIntegrations();

const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  process.env.GMAIL_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/integrations/gmail/callback`
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state'); // User ID

    if (error) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/settings?error=gmail_auth_failed&message=${encodeURIComponent(error)}`
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard/settings?error=gmail_auth_failed&message=Missing authorization code`
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

    // Store the Gmail integration
    GMAIL_INTEGRATIONS.set(state, {
      userId: state,
      email: userInfo.data.email,
      accessToken: tokens.access_token || undefined,
      refreshToken: tokens.refresh_token || undefined,
      connectedAt: new Date().toISOString(),
      status: 'connected'
    });
    
    // Persist to file
    saveIntegrations(GMAIL_INTEGRATIONS);

    // Redirect back to settings with success
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/settings?success=gmail_connected&email=${encodeURIComponent(userInfo.data.email)}`
    );

  } catch (error) {
    console.error('Gmail callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard/settings?error=gmail_auth_failed&message=${encodeURIComponent(
        error instanceof Error ? error.message : 'Unknown error'
      )}`
    );
  }
} 