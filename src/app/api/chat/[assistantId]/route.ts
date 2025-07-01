import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, getIntegrationContext } from '@/lib/auth';
import { db } from '@/lib/db';
import OpenAI from 'openai';
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/security';

const openai = new OpenAI({
});

async function handleChatMessage(
  request: NextRequest,
  { params }: { params: Promise<{ assistantId: string }> }
): Promise<NextResponse> {
  try {
    const { message, threadId, sessionId, userIdentifier } = await request.json();
    const { assistantId } = await params;

    if (!message || !assistantId) {
      return NextResponse.json({ error: 'Message and assistant ID are required' }, { status: 400 });
    }

    // Get the assistant
    const assistant = await db.assistant.findUnique({
      where: { id: assistantId },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        openaiAssistantId: true,
        account: {
          select: {
            id: true,
            accountId: true,
            name: true
          }
        }
      },
    });

    if (!assistant) {
      return NextResponse.json({ error: 'Assistant not found' }, { status: 404 });
    }

    if (assistant.status !== 'ACTIVE') {
      return NextResponse.json({ 
        error: 'Assistant is not active', 
        details: `Current status: ${assistant.status}` 
      }, { status: 400 });
    }

    if (!assistant.openaiAssistantId) {
      return NextResponse.json({ 
        error: 'Assistant not properly configured', 
        details: 'OpenAI assistant ID missing' 
      }, { status: 500 });
    }

    // Check if OpenAI API key is configured
      console.log('⚠️ OpenAI API key not configured - returning demo response');
      return NextResponse.json({
        response: `Hello! I'm ${assistant.name}, but I need an OpenAI API key to be configured to provide intelligent responses based on my knowledge base. Please add your OpenAI API key to the .env file.`,
        assistantId: assistantId,
        timestamp: new Date().toISOString(),
        isDemo: true
      });
    }

    // Track analytics - find or create conversation
    let conversation = null;
    const startTime = Date.now();
    
    try {
      // Try to find existing conversation by sessionId or threadId
      if (sessionId || threadId) {
        conversation = await db.conversation.findFirst({
          where: {
            assistantId: assistantId,
            OR: [
              { sessionId: sessionId },
              { threadId: threadId }
            ]
          }
        });
      }

      // Create new conversation if none found
      if (!conversation) {
        conversation = await db.conversation.create({
          data: {
            assistantId: assistantId,
            accountId: assistant.account.id,
            sessionId: sessionId,
            platform: 'WEBSITE',
            userIdentifier: userIdentifier,
            threadId: threadId,
            status: 'ACTIVE',
            totalMessages: 0,
            userMessages: 0,
            assistantMessages: 0
          }
        });
      }
    } catch (err) {
      console.warn('Could not create conversation record:', err);
      // Continue without conversation tracking
    }

    try {
      // Create or use existing thread
      let currentThreadId = threadId;
      if (!currentThreadId) {
        const thread = await openai.beta.threads.create();
        currentThreadId = thread.id;
        
        // Update conversation with thread ID
        if (conversation) {
          await db.conversation.update({
            where: { id: conversation.id },
            data: { threadId: currentThreadId }
          });
        }
      }

      // Add user message to thread
      await openai.beta.threads.messages.create(currentThreadId, {
        role: "user",
        content: message
      });

      // Track user message
      if (conversation) {
        await db.conversationMessage.create({
          data: {
            conversationId: conversation.id,
            role: 'USER',
            content: message,
            timestamp: new Date()
          }
        }).catch(err => console.warn('Could not save user message:', err));
      }

      // Create and poll run
      const run = await openai.beta.threads.runs.createAndPoll(currentThreadId, {
        assistant_id: assistant.openaiAssistantId,
        instructions: `You are ${assistant.name} for ${assistant.account.name}. Use your knowledge base to provide helpful, accurate responses. 

${await getIntegrationContext(assistant.account.id)}

When users ask about integrations or connecting external services, refer them to the dashboard settings. If they ask about specific data from integrations (like emails, CRM data, etc.), explain that this data can be connected through the integrations and will then be available for you to help with.

Always be helpful and professional, and make it clear what capabilities are available through the connected integrations.`
      });

      if (run.status === 'completed') {
        // Get the assistant's response
        const messages = await openai.beta.threads.messages.list(currentThreadId);
        const lastMessage = messages.data[0];
        
        if (lastMessage && lastMessage.role === 'assistant' && lastMessage.content[0].type === 'text') {
          const responseTime = (Date.now() - startTime) / 1000; // Convert to seconds
          const assistantResponse = lastMessage.content[0].text.value;

          // Update assistant message count
          await db.assistant.update({
            where: { id: assistantId },
            data: {
              totalMessages: {
                increment: 1
              }
            }
          });

          // Track assistant message and update conversation stats
          if (conversation) {
            try {
              await db.conversationMessage.create({
                data: {
                  conversationId: conversation.id,
                  role: 'ASSISTANT',
                  content: assistantResponse,
                  responseTime: responseTime,
                  openaiMessageId: lastMessage.id,
                  timestamp: new Date()
                }
              });

              // Update conversation statistics
              await db.conversation.update({
                where: { id: conversation.id },
                data: {
                  totalMessages: { increment: 2 }, // User + Assistant message
                  userMessages: { increment: 1 },
                  assistantMessages: { increment: 1 },
                  avgResponseTime: responseTime,
                  lastMessageAt: new Date()
                }
              });
            } catch (err) {
              console.warn('Could not update conversation stats:', err);
            }
          }

          return NextResponse.json({
            response: assistantResponse,
            threadId: currentThreadId,
            assistantId: assistantId,
            timestamp: new Date().toISOString(),
            responseTime: responseTime
          });
        }
      } else {
        console.error('OpenAI run failed:', run.status, run.last_error);
        return NextResponse.json({ 
          error: 'Failed to get response from assistant',
          details: `Run status: ${run.status}`
        }, { status: 500 });
      }

    } catch (openaiError: any) {
      console.error('OpenAI API error:', openaiError);
      
      // Check if it's a quota/billing error
      if (openaiError.status === 429) {
        return NextResponse.json({ 
          error: 'API rate limit exceeded. Please try again in a moment.',
          details: 'OpenAI rate limit'
        }, { status: 429 });
      }
      
      if (openaiError.status === 403 || openaiError.status === 401) {
        return NextResponse.json({ 
          error: 'OpenAI API authentication failed. Please check your API key.',
          details: 'OpenAI auth error'
        }, { status: 500 });
      }

      return NextResponse.json({ 
        error: 'Failed to process chat message',
        details: process.env.NODE_ENV === 'development' ? openaiError.message : undefined
      }, { status: 500 });
    }

    return NextResponse.json({ error: 'Unexpected error occurred' }, { status: 500 });

  } catch (error) {
    console.error('Chat endpoint error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 });
  }
}

// Apply rate limiting to chat messages
export const POST = withRateLimit(RATE_LIMIT_CONFIGS.CHAT, handleChatMessage); 