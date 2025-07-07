import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createAccountAndUser, createSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  console.log('🔵 Google OAuth callback called');
  console.log('🔍 Request URL:', request.url);
  
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    console.log('📋 OAuth params:', { code: !!code, state: !!state, error });

    if (error) {
      console.error('❌ Google OAuth error:', error);
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/login?error=oauth_error`);
    }

    if (!code || !state) {
      console.error('❌ Missing OAuth params - code:', !!code, 'state:', !!state);
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/login?error=oauth_missing_params`);
    }

    // Decode state parameter
    let stateData;
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    } catch {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/login?error=oauth_invalid_state`);
    }

    // Exchange code for token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/oauth/google/callback`,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const tokenData = await tokenResponse.json();

    // Get user info from Google
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error('Failed to fetch user info from Google');
    }

    const googleUser = await userResponse.json();
    console.log('Google user data:', googleUser); // Debug log

    if (!googleUser.email) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/login?error=oauth_no_email`);
    }

    // Extract user information
    const userInfo = {
      email: googleUser.email,
      name: googleUser.name || googleUser.email.split('@')[0],
      avatar: googleUser.picture || null,
    };

    // Check if user already exists
    let user = await db.user.findUnique({
      where: { email: userInfo.email },
      include: { account: true }
    });

    let authToken;

    if (user) {
      // User exists, update profile info and create session
      await db.user.update({
        where: { id: user.id },
        data: {
          name: userInfo.name,
          avatar: userInfo.avatar,
        }
      });
      
      authToken = await createSession(user.id);
    } else {
      // Create new user with profile information
      const result = await createAccountAndUser(
        userInfo.email,
        '', // No password for OAuth users
        userInfo.name
      );
      
      // Update the user with avatar after creation
      if (userInfo.avatar) {
        await db.user.update({
          where: { id: result.user.id },
          data: { avatar: userInfo.avatar }
        });
      }
      
      user = result.user as any;
      authToken = result.token;
    }

    // Redirect to frontend with token
    const redirectUrl = new URL(stateData.redirectTo || '/dashboard', process.env.NEXTAUTH_URL!);
    redirectUrl.searchParams.set('token', authToken);
    redirectUrl.searchParams.set('oauth', 'google');

    console.log('✅ Google OAuth success, redirecting to:', redirectUrl.toString());
    return NextResponse.redirect(redirectUrl.toString());

  } catch (error) {
    console.error('❌ Google OAuth callback error:', error);
    console.error('Error details:', error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/login?error=oauth_callback_error`);
  }
} 