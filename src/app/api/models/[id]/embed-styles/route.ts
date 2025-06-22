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
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const assistantId = params.id;

    // Get the assistant's embed styles
    const assistant = await prisma.assistant.findFirst({
      where: {
        id: assistantId,
        accountId: user.account.id,
      },
      select: {
        id: true,
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
        welcomeMessage: true,
      },
    });

    if (!assistant) {
      return NextResponse.json({ error: 'Assistant not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: assistant.id,
      embedBubbleColor: assistant.embedBubbleColor || "#3B82F6",
      embedButtonShape: assistant.embedButtonShape || "rounded",
      embedFontStyle: assistant.embedFontStyle || "system",
      embedPosition: assistant.embedPosition || "bottom-right",
      chatBackgroundColor: assistant.chatBackgroundColor || "#FFFFFF",
      userMessageBubbleColor: assistant.userMessageBubbleColor || "#3B82F6",
      assistantMessageBubbleColor: assistant.assistantMessageBubbleColor || "#F3F4F6",
      assistantFontStyle: assistant.assistantFontStyle || "sans",
      messageBubbleRadius: assistant.messageBubbleRadius || 12,
      showAssistantAvatar: assistant.showAssistantAvatar !== false,
      assistantAvatarUrl: assistant.assistantAvatarUrl || "",
      showChatHeader: assistant.showChatHeader !== false,
      chatHeaderTitle: assistant.chatHeaderTitle || "AI Assistant",
      welcomeMessage: assistant.welcomeMessage || "",
    });
  } catch (error) {
    console.error('Error fetching embed styles:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 