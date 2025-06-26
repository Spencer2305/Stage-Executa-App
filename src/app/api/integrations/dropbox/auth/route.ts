import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { getDropboxAuthUrl } from '@/lib/dropbox';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate state parameter to prevent CSRF
    const state = `${user.id}-${Date.now()}-${Math.random().toString(36)}`;
    
    // Get Dropbox authorization URL
    const authUrl = getDropboxAuthUrl(state);
    
    // Store state in session/cookie for validation (you'll need to implement this)
    const response = NextResponse.json({
      success: true,
      authUrl,
      state
    });
    
    // Set state in cookie for verification
    response.cookies.set('dropbox_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
    });
    
    return response;

  } catch (error) {
    console.error('Dropbox auth error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Dropbox authorization' },
      { status: 500 }
    );
  }
} 