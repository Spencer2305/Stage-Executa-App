import { authenticateRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log(`🔍 GET /api/models/${id} - Fetching assistant`);
    
    const auth = await authenticateRequest(request);
    if (!auth) {
      console.log(`❌ Unauthorized request to /api/models/${id}`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the specific assistant with its files
    const assistant = await db.assistant.findFirst({
      where: {
        id: id,
        accountId: auth.account.id,
      },
      include: {
        files: {
          include: {
            file: true,
          },
        },
      },
    });

    if (!assistant) {
      console.log(`❌ Assistant ${id} not found for account ${auth.account.id}`);
      return NextResponse.json({ error: 'Assistant not found' }, { status: 404 });
    }

    // Transform to match frontend Model interface
    const transformedAssistant = {
      id: assistant.id,
      name: assistant.name,
      description: assistant.description || '',
      status: assistant.status === 'ACTIVE' ? 'active' : 
              assistant.status === 'TRAINING' ? 'training' : 
              assistant.status === 'ERROR' ? 'error' : 'draft',
      type: 'assistant' as const,
      capabilities: ['chat', 'search'],
      
      // Document/file information
      documents: assistant.files.map((af: any) => ({
        id: af.file.id,
        name: af.file.originalName,
        size: Number(af.file.fileSize), // Convert BigInt to number
        type: af.file.mimeType || 'application/octet-stream',
        status: af.file.status === 'PROCESSED' ? 'completed' :
                af.file.status === 'PROCESSING' ? 'processing' : 
                af.file.status === 'ERROR' ? 'error' : 'pending',
        uploadedAt: af.file.createdAt,
        content: af.file.extractedText || undefined,
        url: af.file.s3Key ? `https://s3.amazonaws.com/bucket/${af.file.s3Key}` : undefined,
      })),
      
      // Metadata
      createdAt: assistant.createdAt,
      updatedAt: assistant.updatedAt,
      lastTrained: assistant.lastTrained,
      
      // Stats (mock for now)
      totalSessions: Math.floor(Math.random() * 1000) + 100,
      
      // API info (mock for now)  
      apiKey: assistant.id.startsWith('asst_') ? assistant.id : `sk_${assistant.id.slice(0, 8)}`,
      embedUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3008'}/chat/${assistant.id}`,
      // Embed styling fields
      embedBubbleColor: assistant.embedBubbleColor,
      embedButtonShape: assistant.embedButtonShape,
      embedFontStyle: assistant.embedFontStyle,
      embedPosition: assistant.embedPosition,
      chatBackgroundColor: assistant.chatBackgroundColor,
      userMessageBubbleColor: assistant.userMessageBubbleColor,
      assistantMessageBubbleColor: assistant.assistantMessageBubbleColor,
      assistantFontStyle: assistant.assistantFontStyle,
      messageBubbleRadius: assistant.messageBubbleRadius,
      showAssistantAvatar: assistant.showAssistantAvatar,
      assistantAvatarUrl: assistant.assistantAvatarUrl,
      showChatHeader: assistant.showChatHeader,
      chatHeaderTitle: assistant.chatHeaderTitle,
      welcomeMessage: assistant.welcomeMessage,
      owner: {
        id: auth.account.id, // Assuming auth.account.id is the owner's ID
        email: auth.account.email, // Assuming auth.account.email is the owner's email
      },
      // Add handoffSettings for advanced embed settings
      handoffSettings: assistant.handoffSettings,
    };

    console.log(`✅ Successfully fetched assistant ${id} with ${transformedAssistant.documents.length} documents`);

    return NextResponse.json({
      data: transformedAssistant,
      success: true,
    });

  } catch (error) {
    console.error('❌ Error fetching assistant:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log(`🗑️ DELETE /api/models/${id} - Deleting assistant`);
    
    const auth = await authenticateRequest(request);
    if (!auth) {
      console.log(`❌ Unauthorized request to DELETE /api/models/${id}`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the assistant exists and belongs to this user
    const assistant = await db.assistant.findFirst({
      where: {
        id: id,
        accountId: auth.account.id,
      },
      include: {
        files: {
          include: {
            file: true,
          },
        },
      },
    });

    if (!assistant) {
      console.log(`❌ Assistant ${id} not found for account ${auth.account.id}`);
      return NextResponse.json({ error: 'Assistant not found' }, { status: 404 });
    }

    console.log(`🔍 Found assistant "${assistant.name}" with ${assistant.files.length} files`);

    // Start a transaction to ensure all deletions succeed or fail together
    await db.$transaction(async (tx) => {
      // 1. Delete assistant-file associations
      await tx.assistantFile.deleteMany({
        where: {
          assistantId: id,
        },
      });
      console.log(`🔗 Deleted assistant-file associations for assistant ${id}`);

      // 2. Check which files are orphaned (not used by other assistants)
      const orphanedFiles = [];
      for (const assistantFile of assistant.files) {
        const otherAssistantFiles = await tx.assistantFile.findMany({
          where: {
            fileId: assistantFile.file.id,
          },
        });
        
        if (otherAssistantFiles.length === 0) {
          orphanedFiles.push(assistantFile.file);
        }
      }

      // 3. Delete orphaned files from database
      if (orphanedFiles.length > 0) {
        const orphanedFileIds = orphanedFiles.map(f => f.id);
        await tx.knowledgeFile.deleteMany({
          where: {
            id: {
              in: orphanedFileIds,
            },
          },
        });
        console.log(`🗑️ Deleted ${orphanedFiles.length} orphaned files from database`);
      }

      // 4. Delete the assistant itself
      await tx.assistant.delete({
        where: {
          id: id,
        },
      });
      console.log(`🤖 Deleted assistant ${id} from database`);
    });

    // TODO: Clean up OpenAI resources
    // When OpenAI integration is fully implemented, add:
    // - Delete OpenAI assistant (assistant.openaiAssistantId)
    // - Delete OpenAI vector store (assistant.vectorStoreId)
    // - Delete OpenAI files
    
    // TODO: Clean up S3 files
    // Add S3 cleanup for orphaned files if needed

    console.log(`✅ Successfully deleted assistant ${id} and cleaned up associated resources`);

    return NextResponse.json({
      success: true,
      message: `Assistant "${assistant.name}" deleted successfully`,
      data: {
        deletedAssistantId: id,
        deletedAssistantName: assistant.name,
        orphanedFilesDeleted: assistant.files.length,
      },
    });

  } catch (error) {
    console.error('❌ Error deleting assistant:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete assistant',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
} 