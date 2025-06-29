import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { exchangeCodeForToken } from '@/lib/slack';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      console.error('Slack OAuth error:', error);
      return NextResponse.redirect(
        new URL(`/app/dashboard/settings?error=slack_${error}`, process.env.NEXTAUTH_URL)
      );
    }

    if (!code || !state) {
      console.error('Missing code or state in Slack callback');
      return NextResponse.redirect(
        new URL('/app/dashboard/settings?error=slack_missing_params', process.env.NEXTAUTH_URL)
      );
    }

    // Verify state parameter
    const cookies = request.cookies;
    const storedState = cookies.get('slack_oauth_state')?.value;
    
    if (!storedState || storedState !== state.split(':')[0]) {
      console.error('Invalid state parameter in Slack callback');
      return NextResponse.redirect(
        new URL('/app/dashboard/settings?error=slack_invalid_state', process.env.NEXTAUTH_URL)
      );
    }

    // Extract assistant ID from state
    const [, assistantId] = state.split(':');
    if (!assistantId) {
      console.error('Missing assistant ID in state parameter');
      return NextResponse.redirect(
        new URL('/app/dashboard/settings?error=slack_missing_assistant', process.env.NEXTAUTH_URL)
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
        new URL('/app/dashboard/settings?error=assistant_not_found', process.env.NEXTAUTH_URL)
      );
    }

    // Exchange code for tokens
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/integrations/slack/callback`;
    const tokenResult = await exchangeCodeForToken(code, redirectUri);

    console.log('💾 Saving Slack connection:', {
      assistantId,
      teamId: tokenResult.team.id,
      teamName: tokenResult.team.name,
      botUserId: tokenResult.bot_user_id
    });

    // Save Slack connection
    await db.slackConnection.upsert({
      where: {
        teamId_assistantId: {
          teamId: tokenResult.team.id,
          assistantId: assistantId,
        }
      },
      update: {
        teamName: tokenResult.team.name,
        teamDomain: tokenResult.team.domain,
        userId: tokenResult.authed_user.id,
        userName: '', // We'll get this from Slack API later
        botToken: tokenResult.access_token,
        botUserId: tokenResult.bot_user_id,
        botScopes: tokenResult.scope,
        isActive: true,
        updatedAt: new Date(),
      },
      create: {
        accountId: assistant.accountId,
        assistantId: assistantId,
        teamId: tokenResult.team.id,
        teamName: tokenResult.team.name,
        teamDomain: tokenResult.team.domain,
        userId: tokenResult.authed_user.id,
        userName: '', // We'll get this from Slack API later
        botToken: tokenResult.access_token,
        botUserId: tokenResult.bot_user_id,
        botScopes: tokenResult.scope,
        isActive: true,
      }
    });

    console.log('✅ Slack connection saved successfully');

    // Clear the state cookie
    const response = NextResponse.redirect(
      new URL(`/app/dashboard/assistants/${assistantId}?success=slack_connected&team=${encodeURIComponent(tokenResult.team.name)}`, process.env.NEXTAUTH_URL || request.url)
    );
    
    response.cookies.set('slack_oauth_state', '', {
      maxAge: 0
    });

    return response;

  } catch (error) {
    console.error('Slack callback error:', error);
    return NextResponse.redirect(
      new URL('/app/dashboard/settings?error=slack_callback_failed', process.env.NEXTAUTH_URL)
    );
  }
} 