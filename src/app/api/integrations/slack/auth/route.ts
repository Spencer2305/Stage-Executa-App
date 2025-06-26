import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { getSlackAuthUrl, isSlackConfigured } from '@/lib/slack';

export async function GET(request: NextRequest) {
  try {
    // Check if Slack is configured
    if (!isSlackConfigured()) {
      return NextResponse.json({ 
        error: 'Slack integration not configured',
        message: 'Please configure SLACK_CLIENT_ID, SLACK_CLIENT_SECRET, and SLACK_SIGNING_SECRET environment variables'
      }, { status: 503 });
    }

    // Authenticate user
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get assistant ID from query params
    const url = new URL(request.url);
    const assistantId = url.searchParams.get('assistantId');
    
    if (!assistantId) {
      return NextResponse.json({ error: 'Assistant ID is required' }, { status: 400 });
    }

    // Verify the assistant belongs to the user's account
    const { db } = await import('@/lib/db');
    const assistant = await db.assistant.findFirst({
      where: {
        id: assistantId,
        accountId: user.account.id
      }
    });

    if (!assistant) {
      return NextResponse.json({ error: 'Assistant not found' }, { status: 404 });
    }

    // Generate state parameter to prevent CSRF
    const state = `${user.id}-${Date.now()}-${Math.random().toString(36)}`;
    
    // Get Slack authorization URL
    const authUrl = getSlackAuthUrl(state, assistantId);
    
    // Store state in session/cookie for validation
    const response = NextResponse.json({
      success: true,
      authUrl,
      state
    });
    
    // Set state in cookie for verification
    response.cookies.set('slack_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
    });
    
    return response;

  } catch (error) {
    console.error('Slack auth error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate Slack authorization' },
      { status: 500 }
    );
  }
} 