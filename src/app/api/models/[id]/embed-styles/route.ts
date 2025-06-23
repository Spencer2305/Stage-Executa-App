import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { authenticateRequest } from '@/lib/auth';

const prisma = new PrismaClient();

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const assistantId = params.id;
    const body = await request.json();
    const { 
      bubbleColor, 
      buttonShape, 
      fontStyle, 
      position,
      chatBackgroundColor,
      userMessageBubbleColor,
      assistantMessageBubbleColor,
      assistantFontStyle,
      messageBubbleRadius,
      showAssistantAvatar,
      assistantAvatarIcon,
      showChatHeader,
      chatHeaderTitle,
      welcomeMessage
    } = body;

    // Verify the assistant belongs to the user's account
    const assistant = await prisma.assistant.findFirst({
      where: {
        id: assistantId,
        accountId: user.account.id,
      },
    });

    if (!assistant) {
      return NextResponse.json({ error: 'Assistant not found' }, { status: 404 });
    }

    // Update the assistant with new embed styles
    const updatedAssistant = await prisma.assistant.update({
      where: { id: assistantId },
      data: {
        embedBubbleColor: bubbleColor,
        embedButtonShape: buttonShape,
        embedFontStyle: fontStyle,
        embedPosition: position,
        chatBackgroundColor,
        userMessageBubbleColor,
        assistantMessageBubbleColor,
        assistantFontStyle,
        messageBubbleRadius: messageBubbleRadius ? parseInt(messageBubbleRadius.toString()) : null,
        showAssistantAvatar,
        assistantAvatarUrl: assistantAvatarIcon || null,
        showChatHeader,
        chatHeaderTitle: chatHeaderTitle || null,
        welcomeMessage: welcomeMessage || null,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: 'Embed styles updated successfully',
      assistant: updatedAssistant,
      styles: { 
        bubbleColor, 
        buttonShape, 
        fontStyle, 
        position,
        chatBackgroundColor,
        userMessageBubbleColor,
        assistantMessageBubbleColor,
        assistantFontStyle,
        messageBubbleRadius,
        showAssistantAvatar,
        assistantAvatarIcon,
        showChatHeader,
        chatHeaderTitle,
        welcomeMessage
      },
    });
  } catch (error) {
    console.error('Error updating embed styles:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const assistantId = params.id;

    // Fetch assistant embed settings
    const assistant = await prisma.assistant.findUnique({
      where: { id: assistantId },
      select: {
        id: true,
        name: true,
        embedBubbleColor: true,
        embedButtonShape: true,
        embedFontStyle: true,
        embedPosition: true,
        chatBackgroundColor: true,
        userMessageBubbleColor: true,
        assistantMessageBubbleColor: true,
        assistantFontStyle: true,
        messageBubbleRadius: true,
        showAssistantAvatar: true,
        assistantAvatarUrl: true,
        showChatHeader: true,
        chatHeaderTitle: true,
        welcomeMessage: true
      }
    });

    if (!assistant) {
      return NextResponse.json(
        { error: 'Assistant not found' },
        { status: 404 }
      );
    }

    // Return the styling configuration
    return NextResponse.json({
      assistantId: assistant.id,
      name: assistant.name,
      bubbleColor: assistant.embedBubbleColor || '#3B82F6',
      buttonShape: assistant.embedButtonShape || 'rounded',
      fontStyle: assistant.embedFontStyle || 'system',
      position: assistant.embedPosition || 'bottom-right',
      chatBackgroundColor: assistant.chatBackgroundColor || '#FFFFFF',
      userBubbleColor: assistant.userMessageBubbleColor || '#3B82F6',
      assistantBubbleColor: assistant.assistantMessageBubbleColor || '#F3F4F6',
      assistantFontStyle: assistant.assistantFontStyle || 'sans',
      messageBubbleRadius: assistant.messageBubbleRadius || 12,
      showAssistantAvatar: assistant.showAssistantAvatar !== false,
      assistantAvatarUrl: assistant.assistantAvatarUrl,
      showChatHeader: assistant.showChatHeader !== false,
      chatTitle: assistant.chatHeaderTitle || 'AI Assistant',
      welcomeMessage: assistant.welcomeMessage || 'Hello! How can I help you today?'
    });

  } catch (error) {
    console.error('Error fetching assistant embed styles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch embed styles' },
      { status: 500 }
    );
  }
} 