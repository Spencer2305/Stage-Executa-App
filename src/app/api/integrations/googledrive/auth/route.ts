import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { getGoogleDriveAuthUrl, isGoogleDriveConfigured } from '@/lib/googledrive';

export async function GET(request: NextRequest) {
  try {
    // Check if Google Drive is configured
    if (!isGoogleDriveConfigured()) {
      return NextResponse.json({ 
        error: 'Google Drive integration not configured',
      }, { status: 503 });
    }

    // Authenticate user
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Generate state parameter to prevent CSRF
    const state = `${user.id}-${Date.now()}-${Math.random().toString(36)}`;
    
    // Get Google Drive authorization URL
    const authUrl = getGoogleDriveAuthUrl(state);
    
    // Store state in session/cookie for validation
    const response = NextResponse.json({
      success: true,
      authUrl,
      state
    });
    
    // Set state in cookie for verification
    response.cookies.set('googledrive_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
    });
    
    return response;

  } catch (error) {
    console.error('Google Drive auth error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Google Drive authorization' },
      { status: 500 }
    );
  }
} 