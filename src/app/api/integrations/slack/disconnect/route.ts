import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { assistantId } = body;

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

    // Find and delete the Slack connection
    const deletedConnection = await db.slackConnection.deleteMany({
      where: {
        assistantId: assistantId,
        accountId: user.account.id
      }
    });

    if (deletedConnection.count === 0) {
      return NextResponse.json({ error: 'No Slack connection found to disconnect' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Slack integration disconnected successfully',
      disconnectedConnections: deletedConnection.count
    });

  } catch (error) {
    console.error('Error disconnecting Slack:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 