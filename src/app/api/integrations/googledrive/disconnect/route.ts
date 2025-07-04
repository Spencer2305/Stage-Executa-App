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

    // Find all Google Drive files associated with this assistant
    const googleDriveFiles = await db.knowledgeFile.findMany({
      where: {
        accountId: user.account.id,
        s3Key: {
          contains: 'googledrive'
        },
        assistantFiles: {
          some: {
            assistantId: assistantId
          }
        }
      }
    });

    if (googleDriveFiles.length === 0) {
      return NextResponse.json({ error: 'No Google Drive files found for this assistant' }, { status: 404 });
    }

    // Remove the association between Google Drive files and this assistant
    await db.assistantFile.deleteMany({
      where: {
        assistantId: assistantId,
        fileId: {
          in: googleDriveFiles.map(f => f.id)
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Google Drive integration disconnected successfully',
      disconnectedFiles: googleDriveFiles.length
    });

  } catch (error) {
    console.error('Error disconnecting Google Drive:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 