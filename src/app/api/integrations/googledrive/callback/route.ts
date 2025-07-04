import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { exchangeCodeForToken } from '@/lib/googledrive';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    console.log('🔄 Google Drive OAuth callback received:', { 
      hasCode: !!code, 
      hasState: !!state, 
      error 
    });

    // Handle OAuth errors
    if (error) {
      console.error('❌ Google Drive OAuth error:', error);
      return NextResponse.redirect(
        new URL(`/dashboard/settings?error=${encodeURIComponent(error)}`, process.env.NEXTAUTH_URL)
      );
    }

    if (!code) {
      console.error('❌ No authorization code received');
      return NextResponse.redirect(
        new URL('/dashboard/settings?error=no_code', process.env.NEXTAUTH_URL)
      );
    }

    if (!state) {
      console.error('❌ No state parameter received');
      return NextResponse.redirect(
        new URL('/dashboard/settings?error=no_state', process.env.NEXTAUTH_URL)
      );
    }

    // Verify state parameter (basic validation)
    // In a full implementation, you'd verify this against the stored state
    const stateParts = state.split('-');
    if (stateParts.length !== 3) {
      console.error('❌ Invalid state parameter format');
      return NextResponse.redirect(
        new URL('/dashboard/settings?error=invalid_state', process.env.NEXTAUTH_URL)
      );
    }

    const userId = stateParts[0];
    console.log('👤 Processing Google Drive callback for user:', userId);

    // Get user account information
    const userAccount = await db.user.findUnique({
      where: { id: userId },
      include: { account: true }
    });

    if (!userAccount?.account) {
      return NextResponse.redirect(
        new URL(`/dashboard/settings?error=account_not_found`, process.env.NEXTAUTH_URL)
      );
    }

    // Exchange code for tokens
    console.log('🔄 Exchanging code for Google Drive tokens...');
    const tokenResult = await exchangeCodeForToken(code);

    // Save or update Google Drive connection
    const expiresAt = tokenResult.expiresIn 
      ? new Date(Date.now() + tokenResult.expiresIn * 1000)
      : undefined;

    console.log('💾 Saving Google Drive connection:', {
      accountId: userAccount.account.id,
      googleAccountId: tokenResult.accountId,
      email: tokenResult.email,
      displayName: tokenResult.displayName
    });

    const connection = await db.googleDriveConnection.upsert({
      where: {
        accountId_googleAccountId: {
          accountId: userAccount.account.id,
          googleAccountId: tokenResult.accountId,
        }
      },
      update: {
        accessToken: tokenResult.accessToken,
        refreshToken: tokenResult.refreshToken,
        expiresAt,
        googleEmail: tokenResult.email,
        displayName: tokenResult.displayName,
        isActive: true,
        updatedAt: new Date(),
      },
      create: {
        accountId: userAccount.account.id,
        userId: userId,
        accessToken: tokenResult.accessToken,
        refreshToken: tokenResult.refreshToken,
        expiresAt,
        googleAccountId: tokenResult.accountId,
        googleEmail: tokenResult.email,
        displayName: tokenResult.displayName,
        isActive: true,
      }
    });

    console.log('✅ Google Drive connection saved successfully:', connection.id);

    // Redirect back to settings with success
    return NextResponse.redirect(
      new URL('/dashboard/settings?tab=integrations&connected=googledrive', process.env.NEXTAUTH_URL)
    );

  } catch (error) {
    console.error('❌ Google Drive callback error:', error);
    return NextResponse.redirect(
      new URL('/dashboard/settings?error=callback_failed', process.env.NEXTAUTH_URL)
    );
  }
} 