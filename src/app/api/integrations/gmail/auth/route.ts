import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { authenticateRequest } from '@/lib/auth';

const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  process.env.GMAIL_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/integrations/gmail/callback`
);

// Debug logging
console.log('Gmail OAuth Config:', {
  clientId: process.env.GMAIL_CLIENT_ID ? 'SET' : 'MISSING',
  clientSecret: process.env.GMAIL_CLIENT_SECRET ? 'SET' : 'MISSING',
  redirectUri: process.env.GMAIL_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/integrations/gmail/callback`,
  nextAuthUrl: process.env.NEXTAUTH_URL
});

async function handleGmailAuth(request: NextRequest) {
  try {
    // Authenticate user
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate OAuth URL
    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.labels',
      'https://www.googleapis.com/auth/userinfo.email'
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: user.id, // Store user ID in state for callback
      prompt: 'consent'
    });
    
    return NextResponse.json({
      success: true,
      authUrl
    });

  } catch (error) {
    console.error('Gmail auth error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Gmail authentication' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return handleGmailAuth(request);
}

export async function POST(request: NextRequest) {
  return handleGmailAuth(request);
} 