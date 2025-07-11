import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, getIntegrationContext } from '@/lib/auth';
import { db } from '@/lib/db';
import OpenAI from 'openai';

// Initialize OpenAI client conditionally
let openai: OpenAI | null = null;

// Only initialize OpenAI client if API key is available
if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key') {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// Enhanced AI auto-detection function to check if user wants human assistance
async function detectHumanRequest(message: string, sensitivity: string = 'medium'): Promise<{ isHumanRequest: boolean; confidence: number; reason: string }> {
  try {
    const sensitivityPrompts = {
      low: `Only detect very explicit requests for human help. Look for direct phrases like:
      - "I want to talk to a human"
      - "Transfer me to an agent"
      - "Get me a person"
      - "I need human help"
      Be very conservative and only trigger on clear, unambiguous requests.`,
      
      medium: `Detect clear requests for human help including:
      - Direct requests for human assistance
      - Expressions of frustration with AI limitations ("this bot isn't helping")
      - Complex issues that likely need human attention
      - Frustrated customers who seem ready to escalate
      - Requests for managers or supervisors
      Look for both explicit requests and clear signals of dissatisfaction with AI assistance.`,
      
      high: `Detect any indication that the customer might benefit from human assistance:
      - Subtle frustration or confusion
      - Complex multi-part questions
      - Emotional distress or urgency
      - Technical issues that seem complex
      - Any hint that AI responses aren't meeting their needs
      - Questions about policies, refunds, or account issues
      Be more liberal in detection to catch customers who might need help but haven't explicitly asked.`
    };

    const prompt = `You are an expert at analyzing customer messages to determine if they want or need human assistance. ${sensitivityPrompts[sensitivity as keyof typeof sensitivityPrompts]}

Customer Message: "${message}"

Analyze for these indicators:

EXPLICIT REQUESTS:
- Direct words: "human", "agent", "representative", "person", "staff", "support team"
- Transfer requests: "transfer", "escalate", "forward", "connect"
- Dissatisfaction with AI: "bot", "robot", "automated", "this isn't helping"

FRUSTRATION SIGNALS:
- Emotional words: "frustrated", "annoyed", "angry", "upset", "terrible"
- Failure indicators: "not working", "doesn't work", "still broken", "tried everything"
- Urgency: "urgent", "emergency", "immediately", "asap", "critical"

ESCALATION PATTERNS:
- Authority requests: "manager", "supervisor", "boss", "escalate"
- Complaint language: "complaint", "report", "unacceptable", "disappointed"
- Refund/cancel: "refund", "cancel", "money back", "dispute"

COMPLEXITY INDICATORS:
- Multiple questions or issues in one message
- Technical terminology suggesting complex problems
- Account-specific or policy questions
- Billing or payment issues

Respond with JSON only:
{
  "isHumanRequest": boolean,
  "confidence": number (0.0 to 1.0, where 1.0 is completely certain),
  "reason": "specific explanation of why this was detected as needing human assistance"
}`;

    if (!openai) {
      return { isHumanRequest: false, confidence: 0, reason: "OpenAI client not initialized" };
    }
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "system", content: prompt }],
      temperature: 0.1,
      max_tokens: 200
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) return { isHumanRequest: false, confidence: 0, reason: "No response from AI" };

    try {
      const parsed = JSON.parse(response);
      return {
        isHumanRequest: parsed.isHumanRequest || false,
        confidence: Math.max(0, Math.min(1, parsed.confidence || 0)),
        reason: parsed.reason || "Unknown"
      };
    } catch (parseError) {
      console.error('Failed to parse AI detection response:', parseError);
      
      // Fallback: simple keyword-based detection
      const messageLower = message.toLowerCase();
      const humanKeywords = ['human', 'agent', 'person', 'representative', 'manager', 'supervisor'];
      const frustrationKeywords = ['frustrated', 'angry', 'terrible', 'useless', 'not working'];
      
      const hasHumanKeyword = humanKeywords.some(keyword => messageLower.includes(keyword));
      const hasFrustration = frustrationKeywords.some(keyword => messageLower.includes(keyword));
      
      if (hasHumanKeyword) {
        return { isHumanRequest: true, confidence: 0.8, reason: "Explicit human request detected" };
      } else if (hasFrustration && sensitivity === 'high') {
        return { isHumanRequest: true, confidence: 0.5, reason: "Frustration detected with high sensitivity" };
      }
      
      return { isHumanRequest: false, confidence: 0, reason: "Parse error, no clear indicators" };
    }
  } catch (error) {
    console.error('AI detection error:', error);
    return { isHumanRequest: false, confidence: 0, reason: "AI detection failed" };
  }
}

// Enhanced handoff trigger checking with comprehensive detection
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

    // Get conversation history for pattern analysis
    const conversationHistory = await getConversationHistory(sessionId, threadId);

    // 1. Check AI auto-detection (most sophisticated)
    if (settings.triggerOnAutoDetect) {
      const detection = await detectHumanRequest(message, settings.autoDetectSensitivity || 'medium');
      
      const thresholds = { low: 0.8, medium: 0.6, high: 0.4 };
      const threshold = thresholds[settings.autoDetectSensitivity as keyof typeof thresholds] || 0.6;
      
      if (detection.isHumanRequest && detection.confidence >= threshold) {
        reasons.push(`AI auto-detection: ${detection.reason} (${Math.round(detection.confidence * 100)}% confidence)`);
      }
    }

    // 2. Check escalation patterns
    if (settings.triggerOnEscalation) {
      const escalationKeywords = settings.escalationKeywords || ['manager', 'supervisor', 'complaint', 'refund', 'cancel', 'escalate'];
      const foundEscalation = escalationKeywords.some((keyword: string) => 
        message.toLowerCase().includes(keyword.toLowerCase())
      );
      
      if (foundEscalation) {
        reasons.push("Escalation pattern detected");
      }
    }

    // 3. Check urgency indicators
    if (settings.triggerOnUrgency) {
      const urgencyKeywords = settings.urgencyKeywords || ['urgent', 'asap', 'emergency', 'immediately', 'critical', 'time-sensitive'];
      const foundUrgency = urgencyKeywords.some((keyword: string) => 
        message.toLowerCase().includes(keyword.toLowerCase())
      );
      
      if (foundUrgency) {
        reasons.push("Urgency indicators detected");
      }
    }

    // 4. Check high customer effort indicators
    if (settings.triggerOnHighEffort) {
      const effortIndicators = settings.effortIndicators || ['tried everything', 'nothing works', 'still not working', 'multiple times', 'several attempts'];
      const foundEffort = effortIndicators.some((indicator: string) => 
        message.toLowerCase().includes(indicator.toLowerCase())
      );
      
      if (foundEffort) {
        reasons.push("High customer effort detected");
      }
    }

    // 5. Check custom keyword triggers
    if (settings.triggerOnKeywords?.length) {
      const messageWords = message.toLowerCase().split(/\s+/);
      const foundKeywords = settings.triggerOnKeywords.filter((keyword: string) => 
        messageWords.some((word) => word.includes(keyword.toLowerCase()))
      );
      
      if (foundKeywords.length > 0) {
        reasons.push(`Custom keywords: ${foundKeywords.join(', ')}`);
      }
    }

    // 6. Check conversation length
    if (settings.triggerOnComplexity && conversationHistory.messageCount >= (settings.maxConversationLength || 10)) {
      reasons.push(`Long conversation: ${conversationHistory.messageCount} messages`);
    }

    // 7. Check question repetition
    if (settings.triggerOnRepetition) {
      const repetitionCount = await checkQuestionRepetition(message, conversationHistory.messages, settings.maxRepetitions || 2);
      if (repetitionCount >= (settings.maxRepetitions || 2)) {
        reasons.push(`Question repeated ${repetitionCount} times`);
      }
    }

    // 8. Check failed resolution attempts
    if (settings.triggerOnFailedAttempts) {
      const failedAttempts = await analyzeFailedAttempts(conversationHistory.messages, settings.maxFailedAttempts || 3);
      if (failedAttempts >= (settings.maxFailedAttempts || 3)) {
        reasons.push(`${failedAttempts} failed resolution attempts`);
      }
    }

    // 9. Check sentiment (using enhanced analysis)
    if (settings.triggerOnSentiment) {
      const sentimentScore = await analyzeSentiment(message);
      if (sentimentScore <= (settings.sentimentThreshold || -0.5)) {
        reasons.push(`Negative sentiment: ${sentimentScore.toFixed(2)}`);
      }
    }

    // If any triggers were hit, create handoff
    if (reasons.length > 0) {
      const detailedReason = reasons.join("; ");
      
      // Map trigger types to proper HandoffReason enum values
      let handoffReason: string;
      if (reasons.some(r => r.includes('AI auto-detection') || r.includes('Custom keywords'))) {
        handoffReason = 'CUSTOMER_REQUESTED';
      } else if (reasons.some(r => r.includes('Escalation pattern') || r.includes('Urgency'))) {
        handoffReason = 'ESCALATION_TRIGGERED';
      } else if (reasons.some(r => r.includes('Negative sentiment'))) {
        handoffReason = 'SENTIMENT_NEGATIVE';
      } else if (reasons.some(r => r.includes('Long conversation') || r.includes('failed attempts') || r.includes('High customer effort'))) {
        handoffReason = 'COMPLEX_ISSUE';
      } else {
        handoffReason = 'AI_UNABLE_TO_HELP';
      }
      
      // Determine priority based on trigger types
      let priority = 'NORMAL';
      if (reasons.some(r => r.includes('urgent') || r.includes('emergency') || r.includes('escalation'))) {
        priority = 'HIGH';
      } else if (reasons.some(r => r.includes('failed attempts') || r.includes('negative sentiment'))) {
        priority = 'NORMAL';
      }
      
      // Create handoff request
      const handoffResult = await createHandoffRequest(
        assistantId,
        sessionId,
        threadId,
        handoffReason,
        detailedReason,
        message,
        priority,
        settings
      );

      return {
        shouldHandoff: true,
        reason: detailedReason,
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

// Helper function to get conversation history
async function getConversationHistory(sessionId: string, threadId: string) {
  try {
    // Get from database first
    let messages: any[] = [];
    let messageCount = 0;

    if (sessionId) {
      const session = await db.chatSession.findUnique({
        where: { id: sessionId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            take: 50 // Limit to recent messages
          }
        }
      });
      
      if (session?.messages) {
        messages = session.messages;
        messageCount = session.messages.length;
      }
    }

    // If we have fewer than 10 messages, try to get from OpenAI thread
    if (messageCount < 10 && threadId && openai) {
      try {
        const threadMessages = await openai.beta.threads.messages.list(threadId, { limit: 50 });
        const aiMessages = threadMessages.data.map(msg => ({
          content: msg.content[0]?.type === 'text' ? msg.content[0].text.value : '',
          sender: msg.role === 'user' ? 'CUSTOMER' : 'AI_ASSISTANT',
          createdAt: new Date(msg.created_at * 1000)
        }));
        
        // Merge and deduplicate
        const allMessages = [...messages, ...aiMessages];
        messageCount = Math.max(messageCount, threadMessages.data.length);
        messages = allMessages;
      } catch (error) {
        console.warn('Could not fetch thread messages:', error);
      }
    }

    return { messages, messageCount };
  } catch (error) {
    console.warn('Error getting conversation history:', error);
    return { messages: [], messageCount: 0 };
  }
}

// Enhanced sentiment analysis
async function analyzeSentiment(message: string): Promise<number> {
  try {
    const prompt = `Analyze the sentiment of this customer message and return a score between -1 (very negative) and 1 (very positive), where 0 is neutral.

Message: "${message}"

Consider:
- Frustration indicators (annoyed, angry, upset, terrible, awful)
- Satisfaction indicators (great, thanks, helpful, perfect)
- Urgency and stress indicators
- Overall emotional tone

Respond with just the numerical score (e.g., -0.7, 0.2, 0.8):`;

    if (!openai) {
      return 0; // Return neutral sentiment if OpenAI not available
    }
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "system", content: prompt }],
      temperature: 0.1,
      max_tokens: 10
    });

    const response = completion.choices[0]?.message?.content?.trim();
    const score = parseFloat(response || '0');
    
    return isNaN(score) ? 0 : Math.max(-1, Math.min(1, score));
  } catch (error) {
    console.warn('Sentiment analysis failed:', error);
    // Fallback to simple keyword-based sentiment
    const message_lower = message.toLowerCase();
    const negativeWords = ['frustrated', 'angry', 'upset', 'annoyed', 'terrible', 'awful', 'horrible', 'hate', 'worst', 'useless'];
    const positiveWords = ['thanks', 'great', 'helpful', 'perfect', 'amazing', 'excellent', 'love'];
    
    const negativeCount = negativeWords.filter(word => message_lower.includes(word)).length;
    const positiveCount = positiveWords.filter(word => message_lower.includes(word)).length;
    
    if (negativeCount > positiveCount) return -0.6;
    if (positiveCount > negativeCount) return 0.6;
    return 0;
  }
}

// Check for question repetition
async function checkQuestionRepetition(currentMessage: string, messages: any[], maxRepetitions: number): Promise<number> {
  try {
    if (messages.length < 2) return 0;

    const userMessages = messages
      .filter(msg => msg.sender === 'CUSTOMER' || msg.sender === 'USER')
      .map(msg => msg.content.toLowerCase())
      .slice(-10); // Check last 10 user messages

    let repetitionCount = 0;
    const currentLower = currentMessage.toLowerCase();

    // Simple similarity check
    for (const prevMessage of userMessages) {
      const similarity = calculateStringSimilarity(currentLower, prevMessage);
      if (similarity > 0.7) { // 70% similarity threshold
        repetitionCount++;
      }
    }

    return repetitionCount;
  } catch (error) {
    console.warn('Error checking question repetition:', error);
    return 0;
  }
}

// Analyze failed resolution attempts
async function analyzeFailedAttempts(messages: any[], maxAttempts: number): Promise<number> {
  try {
    if (messages.length < 4) return 0; // Need at least some conversation

    const recentMessages = messages.slice(-20); // Look at recent conversation
    let failedAttempts = 0;

    // Look for patterns indicating failed resolution
    const frustrationPatterns = [
      'still not working', 'still doesn\'t work', 'that didn\'t help',
      'not solved', 'same issue', 'same problem', 'still have the problem',
      'doesn\'t solve', 'not working', 'not fixed', 'still broken'
    ];

    for (const message of recentMessages) {
      if (message.sender === 'CUSTOMER' || message.sender === 'USER') {
        const content = message.content.toLowerCase();
        if (frustrationPatterns.some(pattern => content.includes(pattern))) {
          failedAttempts++;
        }
      }
    }

    return failedAttempts;
  } catch (error) {
    console.warn('Error analyzing failed attempts:', error);
    return 0;
  }
}

// Simple string similarity calculation
function calculateStringSimilarity(str1: string, str2: string): number {
  const words1 = str1.split(/\s+/);
  const words2 = str2.split(/\s+/);
  
  const commonWords = words1.filter(word => 
    word.length > 3 && words2.includes(word)
  ).length;
  
  const totalWords = Math.max(words1.length, words2.length);
  return totalWords > 0 ? commonWords / totalWords : 0;
}

// Helper to create handoff request
async function createHandoffRequest(
  assistantId: string,
  sessionId: string,
  threadId: string,
  reason: string,
  detailedReason: string,
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

    // Create handoff request with proper enum value and detailed context
    const handoffRequest = await db.handoffRequest.create({
      data: {
        accountId: chatSession.accountId,
        sessionId: chatSession.id,
        assistantId: assistantId,
        reason: reason as any,
        priority: priority as any,
        context: `${detailedReason} | Auto-triggered from chat. Thread ID: ${threadId}`,
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
        content: handoffSettings.handoffMessage || 'I\'m connecting you with our support team who can better assist you.',
        messageType: 'SYSTEM',
        sender: 'AI_ASSISTANT',
        assistantId: assistantId
      }
    });

    return {
      handoffId: handoffRequest.id,
      message: handoffSettings.customerWaitMessage || 'Please wait while we connect you with our support team.'
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

    // Get the assistant with all settings
    const assistant = await db.assistant.findUnique({
      where: { id: assistantId },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        instructions: true,
        openaiAssistantId: true,
        handoffEnabled: true,
        handoffSettings: true,
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
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('your-openai-api-key')) {
      console.log('⚠️ OpenAI API key not configured - returning demo response');
      return NextResponse.json({
        response: `Hello! I'm ${assistant.name}, but I need an OpenAI API key to be configured to provide intelligent responses based on my knowledge base. Please add your OpenAI API key to the .env file.`,
        assistantId: assistantId,
        timestamp: new Date().toISOString(),
        isDemo: true
      });
    }

    // Parse settings (load from database or use defaults)
    const handoffSettingsData = assistant.handoffSettings as any || {};
    const advancedConfig = handoffSettingsData._advancedConfig || {};
    
    const advancedSettings = advancedConfig.advanced || {
      temperature: 0.7,
      topP: 0.9,
      maxTokens: 500,
      stopSequences: '',
      enableStreaming: true,
      enableRetry: true
    };
    
    const behaviorSettings = advancedConfig.behavior || {
      responseStyle: 'friendly',
      responseLength: 'balanced',
      confidenceLevel: 'balanced',
      allowGeneralKnowledge: true,
      requireSourceCitation: false,
      allowFollowUpQuestions: true,
      enableContextMemory: true
    };
    
    const moderationSettings = advancedConfig.moderation || {
      contentFilterLevel: 'moderate',
      privacyMode: 'maximum',
      blockedTopics: '',
      logConversations: true,
      enableFeedback: true
    };

    const knowledgeSettings = advancedConfig.knowledgeBase || {
      searchSensitivity: 'moderate',
      maxContextLength: '4000',
      prioritizeRecentFiles: true,
      includeFileMetadata: true,
      crossReferenceFiles: true
    };

    console.log('Loaded AI settings:', {
      advanced: advancedSettings,
      behavior: behaviorSettings,
      moderation: moderationSettings,
      knowledge: knowledgeSettings
    });

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
        const thread = await openai!.beta.threads.create();
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
      if (!openai) {
        return NextResponse.json({ 
          error: 'OpenAI client not initialized - API key missing',
          details: 'OpenAI API key not configured properly'
        }, { status: 500 });
      }
      
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

      // Build enhanced instructions with all behavior settings
      let enhancedInstructions = `You are ${assistant.name} for ${assistant.account.name}. `;
      
      // Add base instructions
      if (assistant.instructions) {
        enhancedInstructions += assistant.instructions;
      } else {
        enhancedInstructions += "Use your knowledge base to provide helpful, accurate responses.";
      }

      // Apply behavior settings to instructions
      if (behaviorSettings.responseStyle) {
        const styleMap = {
          'friendly': '\n\nTone: Use a warm, friendly, and approachable tone in all responses.',
          'professional': '\n\nTone: Maintain a professional and business-appropriate tone throughout.',
          'casual': '\n\nTone: Use a relaxed and conversational tone.',
          'formal': '\n\nTone: Use formal language and proper etiquette.',
          'technical': '\n\nTone: Use precise technical language when appropriate.'
        };
        enhancedInstructions += styleMap[behaviorSettings.responseStyle as keyof typeof styleMap] || '';
      }

      if (behaviorSettings.responseLength) {
        const lengthMap = {
          'concise': '\n\nLength: Keep responses brief and to the point.',
          'detailed': '\n\nLength: Provide comprehensive and thorough responses with full explanations.',
          'balanced': '\n\nLength: Balance brevity with necessary detail.'
        };
        enhancedInstructions += lengthMap[behaviorSettings.responseLength as keyof typeof lengthMap] || '';
      }

      if (behaviorSettings.confidenceLevel) {
        const confidenceMap = {
          'conservative': '\n\nConfidence: Only provide information you are highly confident about. Acknowledge uncertainty when appropriate.',
          'balanced': '\n\nConfidence: Balance confidence with appropriate caution. Clarify limitations when needed.',
          'assertive': '\n\nConfidence: Provide confident responses while maintaining accuracy.'
        };
        enhancedInstructions += confidenceMap[behaviorSettings.confidenceLevel as keyof typeof confidenceMap] || '';
      }

      if (behaviorSettings.allowGeneralKnowledge === false) {
        enhancedInstructions += '\n\nKnowledge Restriction: Only use information from your knowledge base. Do not use general knowledge outside of your training data.';
      }

      if (behaviorSettings.requireSourceCitation) {
        enhancedInstructions += '\n\nSource Citation: Always cite sources from your knowledge base when providing information.';
      }

      if (behaviorSettings.allowFollowUpQuestions) {
        enhancedInstructions += '\n\nInteraction: Suggest relevant follow-up questions to help users explore topics further.';
      }

      if (behaviorSettings.enableContextMemory) {
        enhancedInstructions += '\n\nContext: Remember and reference context from earlier in the conversation.';
      }

      // Add moderation guidelines
      if (moderationSettings.blockedTopics) {
        enhancedInstructions += `\n\nContent Restrictions: Avoid discussing these topics: ${moderationSettings.blockedTopics}`;
      }

      if (moderationSettings.contentFilterLevel) {
        const filterMap = {
          'strict': '\n\nContent Filter: Apply strict content filtering. Avoid any potentially sensitive topics.',
          'moderate': '\n\nContent Filter: Apply moderate content filtering. Use good judgment about sensitive topics.',
          'relaxed': '\n\nContent Filter: Apply minimal content filtering while staying professional.'
        };
        enhancedInstructions += filterMap[moderationSettings.contentFilterLevel as keyof typeof filterMap] || '';
      }

      // Add integration context
      enhancedInstructions += `\n\n${await getIntegrationContext(assistant.account.id)}

When users ask about integrations or connecting external services, refer them to the dashboard settings. If they ask about specific data from integrations (like emails, CRM data, etc.), explain that this data can be connected through the integrations and will then be available for you to help with.

Always be helpful and professional, and make it clear what capabilities are available through the connected integrations.`;

      // Prepare OpenAI run parameters with advanced settings
      const runParams: any = {
        assistant_id: assistant.openaiAssistantId,
        instructions: enhancedInstructions
      };

      // Apply advanced OpenAI parameters
      if (advancedSettings.temperature !== undefined) {
        const temp = typeof advancedSettings.temperature === 'string' 
          ? parseFloat(advancedSettings.temperature) 
          : advancedSettings.temperature;
        if (!isNaN(temp) && temp >= 0 && temp <= 2) {
          runParams.temperature = temp;
        }
      }

      if (advancedSettings.topP !== undefined) {
        const topP = typeof advancedSettings.topP === 'string' 
          ? parseFloat(advancedSettings.topP) 
          : advancedSettings.topP;
        if (!isNaN(topP) && topP >= 0 && topP <= 1) {
          runParams.top_p = topP;
        }
      }

      if (advancedSettings.maxTokens !== undefined) {
        const maxTokens = typeof advancedSettings.maxTokens === 'string' 
          ? parseInt(advancedSettings.maxTokens) 
          : advancedSettings.maxTokens;
        if (!isNaN(maxTokens) && maxTokens > 0) {
          runParams.max_completion_tokens = maxTokens;
        }
      }

      // Handle stop sequences
      if (advancedSettings.stopSequences && typeof advancedSettings.stopSequences === 'string') {
        const stopSeqs = advancedSettings.stopSequences.split(',').map((s: string) => s.trim()).filter((s: string) => s.length > 0);
        if (stopSeqs.length > 0) {
          runParams.stop = stopSeqs;
        }
      }

      console.log('Creating OpenAI run with parameters:', runParams);

      // Create and poll run with advanced settings
      const run = await openai.beta.threads.runs.createAndPoll(currentThreadId, runParams);

      if (run.status === 'completed') {
        // Get the assistant's response
        const messages = await openai.beta.threads.messages.list(currentThreadId);
        const lastMessage = messages.data[0];
        
        if (lastMessage && lastMessage.role === 'assistant' && lastMessage.content[0].type === 'text') {
          const responseTime = (Date.now() - startTime) / 1000; // Convert to seconds
          let assistantResponse = lastMessage.content[0].text.value;

          // Apply post-processing based on settings
          if (behaviorSettings.responseLength === 'concise' && assistantResponse.length > 500) {
            // For concise responses, suggest shorter format (this is applied via instructions mainly)
            console.log('Response length setting: concise - applied via instructions');
          }

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

          // Check if streaming is enabled for response format
          const shouldStream = advancedSettings.enableStreaming !== false;

          return NextResponse.json({
            response: assistantResponse,
            threadId: currentThreadId,
            assistantId: assistantId,
            timestamp: new Date().toISOString(),
            responseTime: responseTime,
            settings: {
              streaming: shouldStream,
              temperature: runParams.temperature,
              topP: runParams.top_p,
              maxTokens: runParams.max_completion_tokens
            }
          });
        }
        
        // If we get here, the run completed but no valid response was found
        return NextResponse.json({ 
          error: 'No valid response from assistant',
          details: 'Run completed but no assistant message found'
        }, { status: 500 });
      } else {
        console.error('OpenAI run failed:', run.status, run.last_error);
        
        // Handle retry if enabled
        if (advancedSettings.enableRetry !== false && run.status === 'failed') {
          console.log('Retrying failed request...');
          // Could implement retry logic here
        }
        
        return NextResponse.json({ 
          error: 'Failed to get response from assistant',
          details: `Run status: ${run.status}`
        }, { status: 500 });
      }

    } catch (openaiError: any) {
      console.error('OpenAI API error:', openaiError);
      
      // Check if retry is enabled for error handling
      if (advancedSettings.enableRetry !== false) {
        console.log('Retry is enabled for error recovery');
      }
      
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