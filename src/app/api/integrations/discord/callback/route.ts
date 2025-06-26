import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { exchangeCodeForToken, getGuildInfo } from '@/lib/discord';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      console.error('Discord OAuth error:', error);
      return NextResponse.redirect(
        new URL(`/dashboard/settings?error=discord_${error}`, process.env.NEXTAUTH_URL)
      );
    }

    if (!code || !state) {
      console.error('Missing code or state in Discord callback');
      return NextResponse.redirect(
        new URL('/dashboard/settings?error=discord_missing_params', process.env.NEXTAUTH_URL)
      );
    }

    // Verify state parameter
    const cookies = request.cookies;
    const storedState = cookies.get('discord_oauth_state')?.value;
    
    if (!storedState || storedState !== state.split(':')[0]) {
      console.error('Invalid state parameter in Discord callback');
      return NextResponse.redirect(
        new URL('/dashboard/settings?error=discord_invalid_state', process.env.NEXTAUTH_URL)
      );
    }

    // Extract assistant ID from state
    const [, assistantId] = state.split(':');
    if (!assistantId) {
      console.error('Missing assistant ID in state parameter');
      return NextResponse.redirect(
        new URL('/dashboard/settings?error=discord_missing_assistant', process.env.NEXTAUTH_URL)
      );
    }

    // Get the assistant and verify ownership
    const assistant = await db.assistant.findUnique({
      where: { id: assistantId },
      include: { account: true }
    });

    if (!assistant) {
      console.error('Assistant not found:', assistantId);
      return NextResponse.redirect(
        new URL('/dashboard/settings?error=assistant_not_found', process.env.NEXTAUTH_URL)
      );
    }

    // Exchange code for tokens
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/integrations/discord/callback`;
    const tokenResult = await exchangeCodeForToken(code, redirectUri);

    console.log('💾 Saving Discord connection:', {
      assistantId,
      guildInfo: tokenResult.guild
    });

    // Get guild information
    let guildInfo;
    try {
      guildInfo = await getGuildInfo(tokenResult.access_token);
    } catch (error) {
      console.error('Failed to get guild info:', error);
      // Use basic info from token if available
      guildInfo = tokenResult.guild || {
        id: 'unknown',
        name: 'Discord Server',
        icon: null
      };
    }

    // Save Discord connection
    await db.discordConnection.upsert({
      where: {
        guildId_assistantId: {
          guildId: guildInfo.id,
          assistantId: assistantId,
        }
      },
      update: {
        guildName: guildInfo.name,
        guildIcon: guildInfo.icon || null,
        botToken: process.env.DISCORD_BOT_TOKEN!, // Use the main bot token
        permissions: tokenResult.scope || 'bot',
        isActive: true,
        updatedAt: new Date(),
      },
      create: {
        accountId: assistant.accountId,
        assistantId: assistantId,
        guildId: guildInfo.id,
        guildName: guildInfo.name,
        guildIcon: guildInfo.icon || null,
        botToken: process.env.DISCORD_BOT_TOKEN!,
        botUserId: null, // Will be populated when bot joins
        permissions: tokenResult.scope || 'bot',
        isActive: true,
      }
    });

    console.log('✅ Discord connection saved successfully');

    // Clear the state cookie
    const response = NextResponse.redirect(
      new URL(`/dashboard/assistants/${assistantId}?success=discord_connected&guild=${encodeURIComponent(guildInfo.name)}`, process.env.NEXTAUTH_URL)
    );
    
    response.cookies.set('discord_oauth_state', '', {
      maxAge: 0
    });

    return response;

  } catch (error) {
    console.error('Discord callback error:', error);
    return NextResponse.redirect(
      new URL('/dashboard/settings?error=discord_callback_failed', process.env.NEXTAUTH_URL)
    );
  }
} 