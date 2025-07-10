import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { authenticateRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_DRIVE_CLIENT_ID,
  process.env.GOOGLE_DRIVE_CLIENT_SECRET,
  process.env.GOOGLE_DRIVE_REDIRECT_URI || `${process.env.NEXTAUTH_URL}/api/integrations/drive/callback`
);

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const scopes = [
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
      'openid',
      'profile'
    ];

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: user.id,
      prompt: 'consent'
    });

    return NextResponse.json({ success: true, authUrl });
  } catch (error) {
    console.error('Google Drive auth error:', error);
    return NextResponse.json({ error: 'Failed to initiate Google Drive authentication' }, { status: 500 });
  }
} 