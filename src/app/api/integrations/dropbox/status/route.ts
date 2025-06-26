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

    // Check for Dropbox connection
    const dropboxConnection = await db.dropboxConnection.findFirst({
      where: {
        accountId: user.account.id,
        isActive: true
      }
    });

    if (!dropboxConnection) {
      return NextResponse.json({ 
        connected: false,
        message: 'No Dropbox connection found'
      });
    }

    // Check if any Dropbox files are associated with this assistant
    const dropboxFiles = await db.knowledgeFile.count({
      where: {
        accountId: user.account.id,
        s3Key: {
          contains: 'dropbox'
        },
        assistantFiles: {
          some: {
            assistantId: assistantId
          }
        }
      }
    });

    // Return connection info
    return NextResponse.json({
      connected: true,
      connection: {
        displayName: dropboxConnection.displayName,
        email: dropboxConnection.dropboxEmail,
        totalFiles: dropboxFiles,
        lastSyncAt: dropboxConnection.lastSyncAt,
        isActive: dropboxConnection.isActive
      }
    });

  } catch (error) {
    console.error('Error checking Dropbox status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 