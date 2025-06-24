import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { authenticateRequest } from '@/lib/auth';
import jwt from 'jsonwebtoken';

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

    console.log('Updating embed styles for assistant:', assistantId);
    console.log('Update data:', {
      embedBubbleColor: bubbleColor,
      embedButtonShape: buttonShape,
      embedFontStyle: fontStyle,
      embedPosition: position,
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
    });

    // Update the assistant with new embed styles
    const updatedAssistant = await prisma.assistant.update({
      where: { id: assistantId },
      data: {
        embedBubbleColor: bubbleColor || '#3B82F6',
        embedButtonShape: buttonShape || 'rounded',
        embedFontStyle: fontStyle || 'system',
        embedPosition: position || 'bottom-right',
        chatBackgroundColor: chatBackgroundColor || '#FFFFFF',
        userMessageBubbleColor: userMessageBubbleColor || '#3B82F6',
        assistantMessageBubbleColor: assistantMessageBubbleColor || '#F3F4F6',
        assistantFontStyle: assistantFontStyle || 'sans',
        messageBubbleRadius: messageBubbleRadius ? parseInt(messageBubbleRadius.toString()) : 12,
        showAssistantAvatar: showAssistantAvatar !== false,
        assistantAvatarUrl: assistantAvatarIcon || null,
        showChatHeader: showChatHeader !== false,
        chatHeaderTitle: chatHeaderTitle || 'AI Assistant',
        welcomeMessage: welcomeMessage || null,
        updatedAt: new Date(),
      },
    });

    console.log('Successfully updated assistant embed styles');

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
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// GET - Fetch embed styles for assistant (public endpoint for WordPress plugins)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('GET /api/models/[id]/embed-styles - assistantId:', params.id);

    // No authentication required - this is a public endpoint for WordPress plugins
    const assistantId = params.id;

    // Fetch assistant with embed styles
    const assistant = await prisma.assistant.findUnique({
      where: { id: assistantId },
      select: {
        id: true,
        name: true,
        // All embed style fields
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
      }
    });

    if (!assistant) {
      console.log('Assistant not found:', assistantId);
      return NextResponse.json(
        { error: 'Assistant not found' },
        { status: 404 }
      );
    }

    // Return embed styles in the format expected by WordPress plugin
    const embedStyles = {
      // Basic info
      assistantId: assistant.id,
      assistantName: assistant.name,
      
      // Colors
      bubbleColor: assistant.embedBubbleColor || '#3B82F6',
      chatBackgroundColor: assistant.chatBackgroundColor || '#FFFFFF',
      userBubbleColor: assistant.userMessageBubbleColor || '#3B82F6',
      assistantBubbleColor: assistant.assistantMessageBubbleColor || '#F3F4F6',
      
      // Layout & positioning
      buttonShape: assistant.embedButtonShape || 'rounded',
      position: assistant.embedPosition || 'bottom-right',
      messageBubbleRadius: assistant.messageBubbleRadius || 12,
      
      // Typography
      assistantFontStyle: assistant.assistantFontStyle || 'sans',
      
      // Avatar & header
      showAssistantAvatar: assistant.showAssistantAvatar !== false,
      assistantAvatarUrl: assistant.assistantAvatarUrl || null,
      showChatHeader: assistant.showChatHeader !== false,
      
      // Content
      chatTitle: assistant.chatHeaderTitle || 'AI Assistant',
      welcomeMessage: assistant.welcomeMessage || 'Hello! How can I help you today?',
      
      // Meta
      lastUpdated: new Date().toISOString()
    };

    console.log('Returning embed styles for WordPress plugin:', embedStyles);

    // Add CORS headers for cross-origin requests from WordPress sites
    return new NextResponse(JSON.stringify(embedStyles), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      }
    });

  } catch (error) {
    console.error('Error fetching embed styles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch embed styles' },
      { status: 500 }
    );
  }
} 