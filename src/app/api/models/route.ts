import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/models - Fetching assistants for user');
    
    // Verify authentication
    const userAccount = await authenticateRequest(request);
    if (!userAccount) {
      console.log('❌ Unauthorized request to /api/models');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log(`🔍 Fetching assistants for account: ${userAccount.account.id}`);

    // Fetch assistants (models) for the user's account
    const assistants = await prisma.assistant.findMany({
      where: {
        accountId: userAccount.account.id,
      },
      include: {
        files: {
          include: {
            file: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Transform database records to match frontend Model interface
    const models = assistants.map((assistant) => ({
      id: assistant.id,
      name: assistant.name,
      description: assistant.description || '',
      status: mapAssistantStatus(assistant.status),
      createdAt: assistant.createdAt,
      updatedAt: assistant.updatedAt,
      lastTrained: assistant.lastTrained,
      documents: assistant.files.map((af) => ({
        id: af.file.id,
        name: af.file.originalName,
        type: mapFileType(af.file.fileType),
        size: Number(af.file.fileSize),
        uploadedAt: af.file.createdAt,
        status: mapFileStatus(af.file.status),
        content: af.file.extractedText,
      })),
      apiKey: assistant.apiKey,
      embedUrl: assistant.embedUrl,
      totalSessions: assistant.totalSessions,
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
        id: userAccount.id,
        email: userAccount.email,
      },
      // Add handoffSettings for advanced embed settings
      handoffSettings: assistant.handoffSettings,
    }));

    console.log(`✅ Found ${models.length} assistants for account`);

    return NextResponse.json({
      success: true,
      data: models,
    });

  } catch (error) {
    console.error('❌ Error fetching models:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch models',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper functions to map database enums to frontend types
function mapAssistantStatus(status: string): 'draft' | 'training' | 'active' | 'error' {
  switch (status) {
    case 'DRAFT':
      return 'draft';
    case 'TRAINING':
      return 'training';
    case 'ACTIVE':
      return 'active';
    case 'ERROR':
      return 'error';
    default:
      return 'draft';
  }
}

function mapFileType(fileType: string): 'pdf' | 'txt' | 'docx' | 'gmail' | 'crm' {
  if (fileType.includes('pdf')) return 'pdf';
  if (fileType.includes('text')) return 'txt';
  if (fileType.includes('word') || fileType.includes('docx')) return 'docx';
  return 'txt'; // Default fallback
}

function mapFileStatus(status: string): 'uploading' | 'processing' | 'completed' | 'error' {
  switch (status) {
    case 'UPLOADED':
      return 'completed';
    case 'PROCESSING':
      return 'processing';
    case 'COMPLETED':
    case 'PROCESSED':  // Add support for PROCESSED status
      return 'completed';
    case 'ERROR':
      return 'error';
    default:
      return 'uploading';
  }
} 