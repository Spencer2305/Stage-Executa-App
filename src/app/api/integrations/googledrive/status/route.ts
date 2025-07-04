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

    // Check for Google Drive connection
    // Note: This will cause a TypeScript error until Prisma migration is run
    const googleDriveConnection = await db.googleDriveConnection.findFirst({
      where: {
        accountId: user.account.id,
        isActive: true
      }
    });

    if (!googleDriveConnection) {
      return NextResponse.json({ 
        connected: false,
        message: 'No Google Drive connection found'
      });
    }

    // Check if any Google Drive files are associated with this assistant
    const googleDriveFiles = await db.knowledgeFile.count({
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

    // Return connection info
    return NextResponse.json({
      connected: true,
      connection: {
        displayName: googleDriveConnection.displayName,
        email: googleDriveConnection.googleEmail,
        totalFiles: googleDriveFiles,
        lastSyncAt: googleDriveConnection.lastSyncAt,
        isActive: googleDriveConnection.isActive
      }
    });

  } catch (error) {
    console.error('Error checking Google Drive status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 