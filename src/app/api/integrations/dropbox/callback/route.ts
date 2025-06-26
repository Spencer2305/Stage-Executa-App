import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { exchangeCodeForToken, isDropboxConfigured } from '@/lib/dropbox';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  console.log('🔥 DROPBOX CALLBACK HIT!', request.url);
  try {
    // Check if Dropbox is configured
    if (!isDropboxConfigured()) {
      return NextResponse.redirect(
        new URL(`/dashboard/settings?error=dropbox_not_configured`, request.url)
      );
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    
    console.log('📋 Callback params:', { code: !!code, state: !!state, error });
    
    // Check for OAuth errors
    if (error) {
      return NextResponse.redirect(
        new URL(`/dashboard/settings?error=dropbox_auth_denied`, request.url)
      );
    }
    
    if (!code || !state) {
      return NextResponse.redirect(
        new URL(`/dashboard/settings?error=dropbox_missing_params`, request.url)
      );
    }
    
    // Validate state parameter
    const storedState = request.cookies.get('dropbox_oauth_state')?.value;
    if (!storedState || storedState !== state) {
      return NextResponse.redirect(
        new URL(`/dashboard/settings?error=dropbox_invalid_state`, request.url)
      );
    }
    
    // Extract user ID from state (state was created when user was authenticated)
    const userId = state.split('-')[0];
    console.log('🔍 Extracted userId from state:', userId);
    console.log('✅ Using userId from verified state parameter');
    
    // Get user's account directly using the verified userId
    const userAccount = await db.user.findUnique({
      where: { id: userId },
      include: { account: true }
    });
    
    if (!userAccount?.account) {
      return NextResponse.redirect(
        new URL(`/dashboard/settings?error=account_not_found`, request.url)
      );
    }
    
    // Exchange code for tokens
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/integrations/dropbox/callback`;
    const tokenResult = await exchangeCodeForToken(code, redirectUri);
    
    // Save or update Dropbox connection
    const expiresAt = tokenResult.expiresIn 
      ? new Date(Date.now() + tokenResult.expiresIn * 1000)
      : undefined;
      
    // Save or update Dropbox connection
    console.log('💾 Saving Dropbox connection:', {
      accountId: userAccount.account.accountId,
      dropboxAccountId: tokenResult.accountId,
      email: tokenResult.email,
      displayName: tokenResult.displayName
    });
    
    const connection = await db.dropboxConnection.upsert({
      where: {
        accountId_dropboxAccountId: {
          accountId: userAccount.account.id, // Use internal database ID, not external accountId
          dropboxAccountId: tokenResult.accountId,
        }
      },
      update: {
        accessToken: tokenResult.accessToken,
        refreshToken: tokenResult.refreshToken,
        expiresAt,
        dropboxEmail: tokenResult.email,
        displayName: tokenResult.displayName,
        isActive: true,
        updatedAt: new Date(),
      },
      create: {
        accountId: userAccount.account.id, // Use internal database ID, not external accountId
        userId: userId,
        accessToken: tokenResult.accessToken,
        refreshToken: tokenResult.refreshToken,
        expiresAt,
        dropboxAccountId: tokenResult.accountId,
        dropboxEmail: tokenResult.email,
        displayName: tokenResult.displayName,
        isActive: true,
      }
    });
    
    console.log('✅ Dropbox connection saved successfully:', connection.id);
    
    // Clear the state cookie
    const response = NextResponse.redirect(
      new URL('/dashboard/settings?success=dropbox_connected', request.url)
    );
    response.cookies.delete('dropbox_oauth_state');
    
    return response;

  } catch (error) {
    console.error('Dropbox callback error:', error);
    return NextResponse.redirect(
      new URL(`/dashboard/settings?error=dropbox_callback_failed`, request.url)
    );
  }
} 