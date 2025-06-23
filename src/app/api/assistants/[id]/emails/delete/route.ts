import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: assistantId } = await params;
    const { emailIds } = await request.json();

    if (!emailIds || !Array.isArray(emailIds) || emailIds.length === 0) {
      return NextResponse.json({ error: 'Email IDs are required' }, { status: 400 });
    }

    // Verify the assistant belongs to the user's account
    const assistant = await db.assistant.findFirst({
      where: {
        id: assistantId,
        accountId: user.account.id
      }
    });

    if (!assistant) {
      return NextResponse.json({ error: 'Assistant not found' }, { status: 404 });
    }

    // First, remove the files from the assistant's knowledge base
    const removedAssistantFiles = await db.assistantFile.deleteMany({
      where: {
        assistantId: assistantId,
        fileId: {
          in: emailIds
        }
      }
    });

    // Check if any of these files are used by other assistants in the same account
    const filesWithOtherAssistants = await db.assistantFile.findMany({
      where: {
        fileId: {
          in: emailIds
        },
        assistant: {
          accountId: user.account.id
        }
      },
      select: {
        fileId: true
      }
    });

    const filesUsedElsewhere = new Set(filesWithOtherAssistants.map(af => af.fileId));
    const filesToDeleteCompletely = emailIds.filter(id => !filesUsedElsewhere.has(id));

    // Delete files that are not used by any other assistant in the account
    let deletedFilesCount = 0;
    if (filesToDeleteCompletely.length > 0) {
      const deletedFiles = await db.knowledgeFile.deleteMany({
        where: {
          id: {
            in: filesToDeleteCompletely
          },
          accountId: user.account.id,
          fileType: 'email'
        }
      });
      deletedFilesCount = deletedFiles.count;
    }

    return NextResponse.json({
      success: true,
      deletedCount: removedAssistantFiles.count,
      permanentlyDeletedCount: deletedFilesCount,
      message: `Removed ${removedAssistantFiles.count} emails from assistant${deletedFilesCount > 0 ? ` (${deletedFilesCount} permanently deleted)` : ''}`
    });

  } catch (error) {
    console.error('Error deleting emails:', error);
    return NextResponse.json(
      { error: 'Failed to delete emails' },
      { status: 500 }
    );
  }
} 