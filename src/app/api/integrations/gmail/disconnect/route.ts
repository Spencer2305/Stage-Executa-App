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

    // Find all email files associated with this assistant
    const emailFiles = await db.knowledgeFile.findMany({
      where: {
        accountId: user.account.id,
        mimeType: {
          contains: 'message/'
        },
        assistantFiles: {
          some: {
            assistantId: assistantId
          }
        }
      }
    });

    if (emailFiles.length === 0) {
      return NextResponse.json({ error: 'No Gmail files found for this assistant' }, { status: 404 });
    }

    // Remove the association between email files and this assistant
    await db.assistantFile.deleteMany({
      where: {
        assistantId: assistantId,
        fileId: {
          in: emailFiles.map(f => f.id)
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Gmail integration disconnected successfully',
      disconnectedFiles: emailFiles.length
    });

  } catch (error) {
    console.error('Error disconnecting Gmail:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 