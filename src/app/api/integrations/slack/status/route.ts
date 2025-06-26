import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const assistantId = searchParams.get('assistantId');

    if (!assistantId) {
      return NextResponse.json({ error: 'Assistant ID is required' }, { status: 400 });
    }

    // Check if assistant belongs to user
    const assistant = await db.assistant.findFirst({
      where: {
        id: assistantId,
        accountId: user.account.id
      }
    });

    if (!assistant) {
      return NextResponse.json({ error: 'Assistant not found' }, { status: 404 });
    }

    // Check for Slack connection
    const slackConnection = await db.slackConnection.findFirst({
      where: {
        assistantId: assistantId
      }
    });

    if (!slackConnection) {
      return NextResponse.json({ 
        connected: false,
        message: 'No Slack connection found'
      });
    }

    // Return connection info
    return NextResponse.json({
      connected: true,
      connection: {
        teamName: slackConnection.teamName,
        teamDomain: slackConnection.teamDomain,
        userName: slackConnection.botUserName || 'Bot User',
        isActive: true,
        lastMessageAt: slackConnection.updatedAt,
        totalMessages: 0 // TODO: Add message counter to schema
      }
    });

  } catch (error) {
    console.error('Error checking Slack status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 