import { db } from './db';
import { ConversationPlatform, MessageRole, ConversationStatus } from '@prisma/client';

// Types for analytics data
export interface AnalyticsOverview {
  totalConversations: number;
  totalMessages: number;
  uniqueUsers: number;
  avgResponseTime: number;
  avgSatisfaction: number;
  errorRate: number;
  conversationGrowth: number;
  messageGrowth: number;
}

export interface PlatformBreakdown {
  platform: ConversationPlatform;
  conversations: number;
  messages: number;
  avgResponseTime?: number;
  avgSatisfaction?: number;
}

export interface DailyTrend {
  date: Date;
  conversations: number;
  messages: number;
  uniqueUsers: number;
  avgResponseTime?: number;
  avgSatisfaction?: number;
  errorRate?: number;
}

export interface PopularQuery {
  query: string;
  count: number;
  avgResponseTime?: number;
  avgSatisfaction?: number;
  isAnswered: boolean;
  category?: string;
  lastAsked: Date;
}

// Helper function to track a conversation
export async function trackConversation(data: {
  assistantId: string;
  accountId: string;
  platform: ConversationPlatform;
  sessionId?: string;
  userIdentifier?: string;
  threadId?: string;
}) {
  try {
    const conversation = await db.conversation.create({
      data: {
        assistantId: data.assistantId,
        accountId: data.accountId,
        platform: data.platform,
        sessionId: data.sessionId,
        userIdentifier: data.userIdentifier,
        threadId: data.threadId,
        status: 'ACTIVE',
      },
    });
    
    console.log(`📊 Created conversation tracking: ${conversation.id}`);
    return conversation;
  } catch (error) {
    console.error('Failed to track conversation:', error);
    return null;
  }
}

// Helper function to track a message
export async function trackMessage(data: {
  conversationId: string;
  role: MessageRole;
  content: string;
  tokenCount?: number;
  responseTime?: number;
  openaiMessageId?: string;
  hasError?: boolean;
  errorMessage?: string;
}) {
  try {
    const message = await db.conversationMessage.create({
      data: {
        conversationId: data.conversationId,
        role: data.role,
        content: data.content,
        tokenCount: data.tokenCount,
        responseTime: data.responseTime,
        openaiMessageId: data.openaiMessageId,
        hasError: data.hasError || false,
        errorMessage: data.errorMessage,
      },
    });

    // Update conversation stats
    await updateConversationStats(data.conversationId);
    
    console.log(`📊 Tracked message: ${message.id}`);
    return message;
  } catch (error) {
    console.error('Failed to track message:', error);
    return null;
  }
}

// Helper function to update conversation statistics
export async function updateConversationStats(conversationId: string) {
  try {
    const messages = await db.conversationMessage.findMany({
      where: { conversationId },
    });

    const totalMessages = messages.length;
    const userMessages = messages.filter(m => m.role === 'USER').length;
    const assistantMessages = messages.filter(m => m.role === 'ASSISTANT').length;
    const hasErrors = messages.some(m => m.hasError);
    
    // Calculate average response time (only for assistant messages)
    const assistantResponseTimes = messages
      .filter(m => m.role === 'ASSISTANT' && m.responseTime)
      .map(m => m.responseTime!);
    
    const avgResponseTime = assistantResponseTimes.length > 0
      ? assistantResponseTimes.reduce((sum, time) => sum + time, 0) / assistantResponseTimes.length
      : null;

    await db.conversation.update({
      where: { id: conversationId },
      data: {
        totalMessages,
        userMessages,
        assistantMessages,
        avgResponseTime,
        hasErrors,
        lastMessageAt: new Date(),
      },
    });

    console.log(`📊 Updated conversation stats: ${conversationId}`);
  } catch (error) {
    console.error('Failed to update conversation stats:', error);
  }
}

// Helper function to end a conversation
export async function endConversation(conversationId: string, userSatisfaction?: number) {
  try {
    await db.conversation.update({
      where: { id: conversationId },
      data: {
        status: 'COMPLETED',
        endedAt: new Date(),
        userSatisfaction,
      },
    });

    console.log(`📊 Ended conversation: ${conversationId}`);
  } catch (error) {
    console.error('Failed to end conversation:', error);
  }
}

// Helper function to track popular queries
export async function trackPopularQuery(data: {
  accountId: string;
  assistantId?: string;
  query: string;
  responseTime?: number;
  satisfaction?: number;
  isAnswered?: boolean;
  category?: string;
}) {
  try {
    // Create a hash of the query for efficient lookup
    const queryHash = Buffer.from(data.query.toLowerCase().trim()).toString('base64');

    const existingQuery = await db.popularQuery.findUnique({
      where: {
        accountId_assistantId_queryHash: {
          accountId: data.accountId,
          assistantId: data.assistantId || null,
          queryHash,
        },
      },
    });

    if (existingQuery) {
      // Update existing query
      const newCount = existingQuery.count + 1;
      const newAvgResponseTime = data.responseTime && existingQuery.avgResponseTime
        ? (existingQuery.avgResponseTime * existingQuery.count + data.responseTime) / newCount
        : data.responseTime || existingQuery.avgResponseTime;
      
      const newAvgSatisfaction = data.satisfaction && existingQuery.avgSatisfaction
        ? (existingQuery.avgSatisfaction * existingQuery.count + data.satisfaction) / newCount
        : data.satisfaction || existingQuery.avgSatisfaction;

      await db.popularQuery.update({
        where: { id: existingQuery.id },
        data: {
          count: newCount,
          avgResponseTime: newAvgResponseTime,
          avgSatisfaction: newAvgSatisfaction,
          lastAsked: new Date(),
          isAnswered: data.isAnswered ?? existingQuery.isAnswered,
          category: data.category || existingQuery.category,
        },
      });
    } else {
      // Create new query record
      await db.popularQuery.create({
        data: {
          accountId: data.accountId,
          assistantId: data.assistantId,
          query: data.query,
          queryHash,
          count: 1,
          avgResponseTime: data.responseTime,
          avgSatisfaction: data.satisfaction,
          lastAsked: new Date(),
          isAnswered: data.isAnswered ?? true,
          category: data.category,
        },
      });
    }

    console.log(`📊 Tracked popular query: ${data.query.substring(0, 50)}...`);
  } catch (error) {
    console.error('Failed to track popular query:', error);
  }
}

// Helper function to record user feedback
export async function recordUserFeedback(data: {
  conversationId: string;
  messageId?: string;
  accountId: string;
  assistantId: string;
  rating: number;
  feedback?: string;
  feedbackType?: 'RATING' | 'THUMBS_UP' | 'THUMBS_DOWN' | 'COMMENT' | 'BUG_REPORT' | 'FEATURE_REQUEST';
  userIdentifier?: string;
  platform: ConversationPlatform;
}) {
  try {
    const userFeedback = await db.userFeedback.create({
      data: {
        conversationId: data.conversationId,
        messageId: data.messageId,
        accountId: data.accountId,
        assistantId: data.assistantId,
        rating: data.rating,
        feedback: data.feedback,
        feedbackType: data.feedbackType || 'RATING',
        userIdentifier: data.userIdentifier,
        platform: data.platform,
      },
    });

    console.log(`📊 Recorded user feedback: ${userFeedback.id}`);
    return userFeedback;
  } catch (error) {
    console.error('Failed to record user feedback:', error);
    return null;
  }
}

// Generate sample analytics data for testing
export async function generateSampleAnalyticsData(accountId: string, assistantId?: string) {
  try {
    console.log('🎯 Generating sample analytics data...');
    
    const assistants = assistantId 
      ? [{ id: assistantId }]
      : await db.assistant.findMany({
          where: { accountId },
          select: { id: true },
        });

    if (assistants.length === 0) {
      console.log('No assistants found for sample data generation');
      return;
    }

    const platforms: ConversationPlatform[] = ['WEBSITE', 'SLACK', 'DISCORD', 'API'];
    const sampleQueries = [
      'How do I reset my password?',
      'What are your business hours?',
      'Can you help me with billing questions?',
      'How do I contact support?',
      'What features are available in the pro plan?',
      'How do I integrate with my website?',
      'Can I export my data?',
      'What is your refund policy?',
      'How do I upgrade my account?',
      'Is there an API available?',
    ];

    // Generate data for the last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);

    for (const assistant of assistants) {
      // Generate 5-20 conversations per day
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dailyConversations = Math.floor(Math.random() * 16) + 5; // 5-20 conversations
        
        for (let i = 0; i < dailyConversations; i++) {
          const platform = platforms[Math.floor(Math.random() * platforms.length)];
          const userIdentifier = `user_${Math.floor(Math.random() * 1000)}`;
          
          // Create conversation
          const conversation = await db.conversation.create({
            data: {
              assistantId: assistant.id,
              accountId,
              platform,
              userIdentifier,
              sessionId: `session_${Date.now()}_${i}`,
              status: Math.random() > 0.95 ? 'ERROR' : 'COMPLETED',
              totalMessages: 0,
              userMessages: 0,
              assistantMessages: 0,
              startedAt: new Date(d.getTime() + Math.random() * 24 * 60 * 60 * 1000),
              endedAt: new Date(d.getTime() + Math.random() * 24 * 60 * 60 * 1000 + 5 * 60 * 1000),
              userSatisfaction: Math.random() * 2 + 3, // 3-5 rating
              hasErrors: Math.random() > 0.95,
            },
          });

          // Generate 2-8 messages per conversation
          const messageCount = Math.floor(Math.random() * 7) + 2;
          let userMessages = 0;
          let assistantMessages = 0;
          let totalResponseTime = 0;

          for (let j = 0; j < messageCount; j++) {
            const isUser = j % 2 === 0;
            const role: MessageRole = isUser ? 'USER' : 'ASSISTANT';
            const responseTime = isUser ? null : Math.random() * 3 + 0.5; // 0.5-3.5 seconds
            
            if (responseTime) totalResponseTime += responseTime;
            
            await db.conversationMessage.create({
              data: {
                conversationId: conversation.id,
                role,
                content: isUser 
                  ? sampleQueries[Math.floor(Math.random() * sampleQueries.length)]
                  : 'Thank you for your question! I\'d be happy to help you with that.',
                tokenCount: Math.floor(Math.random() * 100) + 20,
                responseTime,
                hasError: Math.random() > 0.98,
                timestamp: new Date(conversation.startedAt.getTime() + j * 30000), // 30 seconds apart
              },
            });

            if (isUser) userMessages++;
            else assistantMessages++;
          }

          // Update conversation stats
          await db.conversation.update({
            where: { id: conversation.id },
            data: {
              totalMessages: messageCount,
              userMessages,
              assistantMessages,
              avgResponseTime: assistantMessages > 0 ? totalResponseTime / assistantMessages : null,
            },
          });

          // Track popular query
          if (userMessages > 0) {
            const query = sampleQueries[Math.floor(Math.random() * sampleQueries.length)];
            await trackPopularQuery({
              accountId,
              assistantId: assistant.id,
              query,
              responseTime: totalResponseTime / assistantMessages,
              satisfaction: conversation.userSatisfaction || undefined,
              isAnswered: Math.random() > 0.1,
              category: ['support', 'billing', 'technical', 'general'][Math.floor(Math.random() * 4)],
            });
          }

          // Add feedback occasionally
          if (Math.random() > 0.7) {
            await recordUserFeedback({
              conversationId: conversation.id,
              accountId,
              assistantId: assistant.id,
              rating: Math.floor(Math.random() * 3) + 3, // 3-5 stars
              feedback: Math.random() > 0.5 ? 'Great help, thank you!' : undefined,
              platform,
              userIdentifier,
            });
          }
        }
      }
    }

    console.log('✅ Sample analytics data generated successfully');
  } catch (error) {
    console.error('❌ Failed to generate sample analytics data:', error);
  }
}

// Utility to calculate time ranges
export function getDateRange(timeRange: string) {
  const endDate = new Date();
  const startDate = new Date();
  
  switch (timeRange) {
    case '24h':
      startDate.setDate(endDate.getDate() - 1);
      break;
    case '7d':
      startDate.setDate(endDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(endDate.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(endDate.getDate() - 90);
      break;
    case '180d':
      startDate.setDate(endDate.getDate() - 180);
      break;
    case '1y':
      startDate.setFullYear(endDate.getFullYear() - 1);
      break;
    default:
      startDate.setDate(endDate.getDate() - 7);
  }

  return { startDate, endDate };
} 