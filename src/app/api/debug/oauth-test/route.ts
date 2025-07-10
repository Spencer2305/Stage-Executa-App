export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider') || 'google';
    
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    
    let authUrl: URL;
    let clientId: string | undefined;
    let redirectUri: string;
    
    if (provider === 'google') {
      redirectUri = `${baseUrl}/api/auth/oauth/google/callback`;
      authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.set('client_id', clientId || '');
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', 'openid email profile');
      authUrl.searchParams.set('state', 'test-state');
      authUrl.searchParams.set('access_type', 'offline');
      authUrl.searchParams.set('prompt', 'consent');
    } else if (provider === 'facebook') {
      clientId = process.env.FACEBOOK_CLIENT_ID;
      redirectUri = `${baseUrl}/api/auth/oauth/facebook/callback`;
      authUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth');
      authUrl.searchParams.set('client_id', clientId || '');
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope', 'email');
      authUrl.searchParams.set('state', 'test-state');
    } else {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 });
    }

    return NextResponse.json({
      provider,
      clientId: clientId ? 'SET' : 'NOT_SET',
      redirectUri,
      authUrl: authUrl.toString(),
      baseUrl,
      env: {
        NEXTAUTH_URL: process.env.NEXTAUTH_URL,
        NODE_ENV: process.env.NODE_ENV
      }
    });
  } catch (error) {
    console.error('OAuth test error:', error);
    return NextResponse.json(
      { error: 'Failed to generate OAuth test data' },
      { status: 500 }
    );
  }
} 