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

    // Find all Dropbox files associated with this assistant
    const dropboxFiles = await db.knowledgeFile.findMany({
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

    if (dropboxFiles.length === 0) {
      return NextResponse.json({ error: 'No Dropbox files found for this assistant' }, { status: 404 });
    }

    // Remove the association between Dropbox files and this assistant
    await db.assistantFile.deleteMany({
      where: {
        assistantId: assistantId,
        fileId: {
          in: dropboxFiles.map(f => f.id)
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Dropbox integration disconnected successfully',
      disconnectedFiles: dropboxFiles.length
    });

  } catch (error) {
    console.error('Error disconnecting Dropbox:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 