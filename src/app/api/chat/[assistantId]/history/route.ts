import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assistantId: string }> }
) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { assistantId } = await params;

    if (!assistantId) {
      return NextResponse.json({ error: 'Assistant ID is required' }, { status: 400 });
    }

    // Get the assistant to verify it belongs to the user's account
    const assistant = await db.assistant.findUnique({
      where: { 
        id: assistantId,
        accountId: user.account.id
      },
      select: {
        id: true,
        name: true
      }
    });

    if (!assistant) {
      return NextResponse.json({ error: 'Assistant not found' }, { status: 404 });
    }

    // Get conversation history for this assistant and account
    const conversations = await db.conversation.findMany({
      where: {
        assistantId: assistantId,
        accountId: user.account.id
      },
      include: {
        messages: {
          orderBy: {
            timestamp: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Flatten all messages from all conversations into a single chronological list
    const allMessages = conversations.flatMap(conversation => 
      conversation.messages.map(message => ({
        id: message.id,
        content: message.content,
        sender: message.role === 'USER' ? 'user' : 'bot',
        timestamp: message.timestamp,
        conversationId: conversation.id,
        sessionId: conversation.sessionId,
        responseTime: message.responseTime
      }))
    );

    // Sort all messages by timestamp to create a unified chat history
    const sortedMessages = allMessages.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Get the most recent conversation's thread ID if available
    const mostRecentConversation = conversations[conversations.length - 1];
    const threadId = mostRecentConversation?.threadId || null;

    return NextResponse.json({
      assistantId: assistantId,
      assistantName: assistant.name,
      threadId: threadId,
      messages: sortedMessages,
      totalConversations: conversations.length,
      totalMessages: sortedMessages.length
    });

  } catch (error) {
    console.error('Error fetching chat history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 