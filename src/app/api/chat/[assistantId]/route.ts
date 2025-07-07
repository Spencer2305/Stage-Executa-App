import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, getIntegrationContext } from '@/lib/auth';
import { db } from '@/lib/db';
import OpenAI from 'openai';

const openai = new OpenAI({
});

// Auto-detection function to check if user wants human assistance
async function detectHumanRequest(message: string, sensitivity: string = 'medium'): Promise<{ isHumanRequest: boolean; confidence: number; reason: string }> {
  try {
    const sensitivityPrompts = {
      low: "Only detect very explicit requests for human help like 'I want to talk to a human' or 'transfer me to an agent'.",
      medium: "Detect clear requests for human help including frustrated customers or complex issues that need human attention.",
      high: "Detect any indication that the customer might benefit from human assistance, including subtle frustration or complex queries."
    };

    const prompt = `Analyze this customer message to determine if they want to speak to a human agent. ${sensitivityPrompts[sensitivity as keyof typeof sensitivityPrompts]}

Message: "${message}"

Consider these indicators:
- Direct requests ("human", "agent", "representative", "person")
- Frustration expressions ("this is not working", "frustrated", "annoyed")
- Complex issues that might need human help
- Escalation language ("manager", "supervisor", "complaint")
- Urgency indicators ("urgent", "important", "asap")

Respond with JSON only:
{
  "isHumanRequest": boolean,
  "confidence": number (0-1),
  "reason": "brief explanation of why this was detected as human request"
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "system", content: prompt }],
      temperature: 0.1,
      max_tokens: 150
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) return { isHumanRequest: false, confidence: 0, reason: "No response from AI" };

    try {
      const parsed = JSON.parse(response);
      return {
        isHumanRequest: parsed.isHumanRequest || false,
        confidence: parsed.confidence || 0,
        reason: parsed.reason || "Unknown"
      };
    } catch (parseError) {
      console.error('Failed to parse AI detection response:', parseError);
      return { isHumanRequest: false, confidence: 0, reason: "Parse error" };
    }
  } catch (error) {
    console.error('AI detection error:', error);
    return { isHumanRequest: false, confidence: 0, reason: "AI detection failed" };
  }
}

// Check for various handoff triggers
async function checkForHandoffTriggers(
  message: string, 
  assistantId: string, 
  sessionId: string, 
  threadId: string
): Promise<{ shouldHandoff: boolean; reason: string; handoffId?: string; message: string }> {
  try {
    // Get assistant handoff settings
    const assistant = await db.assistant.findUnique({
      where: { id: assistantId },
      select: {
        handoffEnabled: true,
        handoffSettings: true,
        account: {
          select: { id: true }
        }
      }
    });

    if (!assistant?.handoffEnabled || !assistant.handoffSettings) {
      return { shouldHandoff: false, reason: "Handoff not enabled", message: "" };
    }

    const settings = assistant.handoffSettings as any;
    const reasons: string[] = [];

    // 1. Check keyword triggers
    if (settings.triggerOnKeywords?.length) {
      const messageWords = message.toLowerCase().split(/\s+/);
      const foundKeywords = settings.triggerOnKeywords.filter((keyword: string) => 
        messageWords.some((word) => word.includes(keyword.toLowerCase()))
      );
      
      if (foundKeywords.length > 0) {
        reasons.push(`Keyword trigger: ${foundKeywords.join(', ')}`);
      }
    }

    // 2. Check AI auto-detection
    if (settings.triggerOnAutoDetect) {
      const detection = await detectHumanRequest(message, settings.autoDetectSensitivity || 'medium');
      
      // Set confidence threshold based on sensitivity
      const thresholds = { low: 0.8, medium: 0.6, high: 0.4 };
      const threshold = thresholds[settings.autoDetectSensitivity as keyof typeof thresholds] || 0.6;
      
      if (detection.isHumanRequest && detection.confidence >= threshold) {
        reasons.push(`AI auto-detection: ${detection.reason} (confidence: ${Math.round(detection.confidence * 100)}%)`);
      }
    }

    // 3. Check sentiment (if enabled)
    if (settings.triggerOnSentiment && reasons.length === 0) {
      // Simple sentiment check - could be enhanced with proper sentiment analysis
      const negativeWords = ['frustrated', 'angry', 'upset', 'annoyed', 'terrible', 'awful', 'horrible', 'hate', 'worst'];
      const hasNegativeSentiment = negativeWords.some(word => message.toLowerCase().includes(word));
      
      if (hasNegativeSentiment) {
        reasons.push("Negative sentiment detected");
      }
    }

    // If any triggers were hit, create handoff
    if (reasons.length > 0) {
      const handoffReason = reasons.join("; ");
      
      // Create handoff request
      const handoffResult = await createHandoffRequest(
        assistantId,
        sessionId,
        threadId,
        handoffReason,
        message,
        'NORMAL',
        settings
      );

      return {
        shouldHandoff: true,
        reason: handoffReason,
        handoffId: handoffResult.handoffId,
        message: handoffResult.message
      };
    }

    return { shouldHandoff: false, reason: "No triggers matched", message: "" };

  } catch (error) {
    console.error('Error checking handoff triggers:', error);
    return { shouldHandoff: false, reason: "Error checking triggers", message: "" };
  }
}

// Helper to create handoff request
async function createHandoffRequest(
  assistantId: string,
  sessionId: string,
  threadId: string,
  reason: string,
  customerQuery: string,
  priority: string,
  handoffSettings: any
): Promise<{ handoffId: string; message: string }> {
  try {
    // Get or create chat session
    let chatSession = await db.chatSession.findUnique({
      where: { id: sessionId }
    });

    if (!chatSession) {
      const assistant = await db.assistant.findUnique({
        where: { id: assistantId },
        select: { accountId: true }
      });

      chatSession = await db.chatSession.create({
        data: {
          id: sessionId,
          accountId: assistant!.accountId,
          assistantId: assistantId,
          status: 'ACTIVE',
          channel: 'web'
        }
      });
    }

    // Create handoff request
    const handoffRequest = await db.handoffRequest.create({
      data: {
        accountId: chatSession.accountId,
        sessionId: chatSession.id,
        assistantId: assistantId,
        reason: reason as any,
        priority: priority as any,
        context: `Auto-triggered from chat. Thread ID: ${threadId}`,
        customerQuery,
        handoffSettings,
        status: 'PENDING'
      }
    });

    // Update chat session
    await db.chatSession.update({
      where: { id: chatSession.id },
      data: {
        isHandedOff: true,
        status: 'TRANSFERRED'
      }
    });

    // Add system message
    await db.chatMessage.create({
      data: {
        sessionId: chatSession.id,
        content: handoffSettings.handoffMessage || 'I\'m connecting you with a human agent who can better assist you.',
        messageType: 'SYSTEM',
        sender: 'AI_ASSISTANT',
        assistantId: assistantId
      }
    });

    return {
      handoffId: handoffRequest.id,
      message: handoffSettings.customerWaitMessage || 'Please wait while I connect you with a human agent.'
    };

  } catch (error) {
    console.error('Error creating handoff request:', error);
    throw error;
  }
}

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

      // Check for handoff triggers before processing the message
      const handoffCheck = await checkForHandoffTriggers(message, assistant.id, sessionId, currentThreadId);
      if (handoffCheck.shouldHandoff) {
        return NextResponse.json({
          handoffTriggered: true,
          handoffReason: handoffCheck.reason,
          handoffId: handoffCheck.handoffId,
          response: handoffCheck.message,
          threadId: currentThreadId,
          assistantId: assistantId,
          timestamp: new Date().toISOString()
        });
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

// Export the POST handler
export const POST = handleChatMessage; 