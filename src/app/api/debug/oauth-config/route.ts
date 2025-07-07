import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  const config = {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NOT_SET',
    FACEBOOK_CLIENT_ID: process.env.FACEBOOK_CLIENT_ID ? 'SET' : 'NOT_SET',
    FACEBOOK_CLIENT_SECRET: process.env.FACEBOOK_CLIENT_SECRET ? 'SET' : 'NOT_SET',
    google_redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/oauth/google/callback`,
    facebook_redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/oauth/facebook/callback`,
  };

  return NextResponse.json({
    message: 'OAuth Configuration Check',
    config,
    note: 'This endpoint is only available in development mode'
  });
} 