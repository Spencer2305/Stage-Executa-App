import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createAccountAndUser, createSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  console.log('🟦 Facebook OAuth callback called');
  console.log('🔍 Request URL:', request.url);
  
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    console.log('📋 OAuth params:', { code: !!code, state: !!state, error });

    if (error) {
      console.error('❌ Facebook OAuth error:', error);
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
    const tokenResponse = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    const tokenUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token');
    tokenUrl.searchParams.set('client_id', process.env.FACEBOOK_CLIENT_ID!);
    tokenUrl.searchParams.set('client_secret', process.env.FACEBOOK_CLIENT_SECRET!);
    tokenUrl.searchParams.set('code', code);
    tokenUrl.searchParams.set('redirect_uri', `${process.env.NEXTAUTH_URL}/api/auth/oauth/facebook/callback`);

    const tokenRes = await fetch(tokenUrl.toString());

    if (!tokenRes.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const tokenData = await tokenRes.json();

    // Get user info from Facebook (including profile picture)
    const userUrl = new URL('https://graph.facebook.com/me');
    userUrl.searchParams.set('access_token', tokenData.access_token);
    userUrl.searchParams.set('fields', 'id,name,email,picture.type(large)');

    const userResponse = await fetch(userUrl.toString());

    if (!userResponse.ok) {
      throw new Error('Failed to fetch user info from Facebook');
    }

    const facebookUser = await userResponse.json();
    console.log('Facebook user data:', facebookUser); // Debug log

    if (!facebookUser.email) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/login?error=oauth_no_email`);
    }

    // Extract user information
    const userInfo = {
      email: facebookUser.email,
      name: facebookUser.name || facebookUser.email.split('@')[0],
      avatar: facebookUser.picture?.data?.url || null,
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
    redirectUrl.searchParams.set('oauth', 'facebook');

    console.log('✅ Facebook OAuth success, redirecting to:', redirectUrl.toString());
    return NextResponse.redirect(redirectUrl.toString());

  } catch (error) {
    console.error('❌ Facebook OAuth callback error:', error);
    console.error('Error details:', error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/login?error=oauth_callback_error`);
  }
} 