import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const redirectTo = searchParams.get('redirectTo') || '/dashboard';
    
    // Facebook OAuth configuration
    const clientId = process.env.FACEBOOK_CLIENT_ID;
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/oauth/facebook/callback`;
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Facebook OAuth not configured' },
        { status: 500 }
      );
    }

    // Create state parameter to prevent CSRF and store redirect info
    const state = Buffer.from(JSON.stringify({ redirectTo })).toString('base64');
    
    // Facebook OAuth URL
    const authUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'email');
    authUrl.searchParams.set('state', state);

    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error('Facebook OAuth error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Facebook OAuth' },
      { status: 500 }
    );
  }
} 