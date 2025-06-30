import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '7d';
    const assistantId = searchParams.get('assistantId'); // Optional filter

    console.log(`📊 Fetching analytics for account ${user.account.id}, timeRange: ${timeRange}, assistantId: ${assistantId}`);

    // Calculate date range
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

    // Get all assistants for the account
    const allAssistants = await db.assistant.findMany({
      where: {
        accountId: user.account.id,
        ...(assistantId ? { id: assistantId } : {})
      },
      select: {
        id: true,
        name: true,
        status: true,
        totalMessages: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            files: true
          }
        }
      }
    });

    // Calculate basic statistics from assistant data
    const totalAssistantMessages = allAssistants.reduce((sum, assistant) => sum + (assistant.totalMessages || 0), 0);
    const activeAssistants = allAssistants.filter(a => a.status === 'ACTIVE');
    const averageResponseTime = 1.2; // Default until we have real conversation data
    const averageSatisfaction = 4.5; // Default until we have real feedback data

    // Try to get conversation data if it exists
    let conversationStats = { _count: { id: 0 }, _sum: { totalMessages: 0 }, _avg: { avgResponseTime: 0, userSatisfaction: 0 } };
    let uniqueUsersCount = 0;
    let errorRate = 0;
    let hasConversationData = false;
    let recentConversations: any[] = [];

    try {
      // Check if conversation table exists by trying a simple query
      const testConversation = await db.$queryRaw`SELECT COUNT(*) as count FROM conversations WHERE account_id = ${user.account.id} LIMIT 1`;
      hasConversationData = true;
      
      // If we reach here, conversation table exists
      const whereConditions: any = {
        accountId: user.account.id,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      };

      if (assistantId) {
        whereConditions.assistantId = assistantId;
      }

      // Get conversation statistics
      conversationStats = await (db as any).conversation.aggregate({
        where: whereConditions,
        _count: { id: true },
        _sum: { totalMessages: true },
        _avg: { avgResponseTime: true, userSatisfaction: true },
      });

      // Get unique users
      const uniqueUsers = await (db as any).conversation.groupBy({
        by: ['userIdentifier'],
        where: {
          ...whereConditions,
          userIdentifier: { not: null },
        },
      });
      uniqueUsersCount = uniqueUsers.length;

      // Get error rate
      const errorStats = await (db as any).conversation.aggregate({
        where: { ...whereConditions, hasErrors: true },
        _count: { id: true },
      });
      errorRate = conversationStats._count.id > 0 ? (errorStats._count.id || 0) / conversationStats._count.id * 100 : 0;

      // Get recent conversations with messages
      const conversations = await (db as any).conversation.findMany({
        where: {
          accountId: user.account.id,
          ...(assistantId ? { assistantId } : {})
        },
        include: {
          assistant: {
            select: {
              name: true,
              id: true
            }
          },
          messages: {
            orderBy: {
              timestamp: 'asc'
            },
            select: {
              id: true,
              role: true,
              content: true,
              timestamp: true,
              responseTime: true,
              hasError: true
            }
          }
        },
        orderBy: {
          lastMessageAt: 'desc'
        },
        take: 10
      });

      recentConversations = conversations.map((conv: any) => ({
        id: conv.id,
        assistantId: conv.assistantId,
        assistantName: conv.assistant.name,
        platform: conv.platform,
        totalMessages: conv.totalMessages,
        userMessages: conv.userMessages,
        assistantMessages: conv.assistantMessages,
        avgResponseTime: conv.avgResponseTime,
        userSatisfaction: conv.userSatisfaction,
        status: conv.status,
        hasErrors: conv.hasErrors,
        createdAt: conv.createdAt,
        lastMessageAt: conv.lastMessageAt,
        messages: conv.messages
      }));

    } catch (error) {
      // Conversation table doesn't exist or other error - use default values
      console.log('Conversation data not available, using assistant data only');
      hasConversationData = false;
    }

    // Get real daily trends data only - no sample data
    const getRealDailyTrends = async () => {
      const days = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const trends = [];
      
      try {
        // Try to get real daily analytics data if it exists
        if (hasConversationData) {
          const dailyStats = await (db as any).dailyAnalytics.findMany({
            where: {
              accountId: user.account.id,
              date: {
                gte: startDate,
                lte: endDate,
              },
              ...(assistantId ? { assistantId } : {}),
            },
            orderBy: { date: 'asc' }
          });
          
          // Create a map of existing data
          const statsMap = new Map();
          dailyStats.forEach((stat: any) => {
            statsMap.set(stat.date.toISOString().split('T')[0], stat);
          });
          
          // Fill in all days in range
          for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            const dayStats = statsMap.get(dateStr);
            trends.push({
              date: dateStr,
              conversations: dayStats?.totalConversations || 0,
              messages: dayStats?.totalMessages || 0,
              uniqueUsers: dayStats?.uniqueUsers || 0,
              avgResponseTime: dayStats?.avgResponseTime || 0,
              avgSatisfaction: dayStats?.avgUserSatisfaction || 0,
              errorRate: dayStats?.errorRate || 0,
            });
          }
        } else {
          // No conversation tracking - show zeros for all days
          for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            
            trends.push({
              date: date.toISOString().split('T')[0],
              conversations: 0,
              messages: 0,
              uniqueUsers: 0,
              avgResponseTime: 0,
              avgSatisfaction: 0,
              errorRate: 0,
            });
          }
        }
      } catch (error) {
        console.warn('Could not fetch daily analytics, showing zeros:', error);
        // Fallback to zeros if daily analytics table doesn't exist
        for (let i = days - 1; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          
          trends.push({
            date: date.toISOString().split('T')[0],
            conversations: 0,
            messages: 0,
            uniqueUsers: 0,
            avgResponseTime: 0,
            avgSatisfaction: 0,
            errorRate: 0,
          });
        }
      }
      
      return trends;
    };

    // Get real response time distribution data only
    const getRealResponseTimeDistribution = async () => {
      try {
        if (hasConversationData) {
          // Get actual response times from conversation messages
          const messages = await (db as any).conversationMessage.findMany({
            where: {
              conversation: {
                accountId: user.account.id,
                ...(assistantId ? { assistantId } : {}),
                createdAt: {
                  gte: startDate,
                  lte: endDate,
                }
              },
              role: 'ASSISTANT',
              responseTime: { not: null }
            },
            select: {
              responseTime: true
            }
          });

          if (messages.length === 0) {
            return { fast: 0, medium: 0, slow: 0, verySlow: 0 };
          }

          // Categorize response times
          let fast = 0, medium = 0, slow = 0, verySlow = 0;
          
          messages.forEach((msg: any) => {
            const responseTime = msg.responseTime;
            if (responseTime < 2) {
              fast++;
            } else if (responseTime < 5) {
              medium++;
            } else if (responseTime < 10) {
              slow++;
            } else {
              verySlow++;
            }
          });

          return { fast, medium, slow, verySlow };
        } else {
          // No conversation data - show zeros
          return { fast: 0, medium: 0, slow: 0, verySlow: 0 };
        }
      } catch (error) {
        console.warn('Could not fetch response time data, showing zeros:', error);
        return { fast: 0, medium: 0, slow: 0, verySlow: 0 };
      }
    };

    // Return actual conversations or empty array
    const getActualConversations = () => {
      return recentConversations; // Only return real conversations, no samples
    };

    // Get real daily trends data
    const dailyTrends = await getRealDailyTrends();
    
    // Get real response time distribution
    const responseTimeDistribution = await getRealResponseTimeDistribution();

    // Transform data for frontend
    const analytics = {
      overview: {
        totalConversations: conversationStats._count.id || 0,
        totalMessages: conversationStats._sum.totalMessages || 0,
        uniqueUsers: uniqueUsersCount,
        avgResponseTime: conversationStats._avg.avgResponseTime || 0,
        avgSatisfaction: conversationStats._avg.userSatisfaction || 0,
        errorRate: errorRate,
        conversationGrowth: 0, // Will be implemented when we have historical data
        messageGrowth: 0, // Will be implemented when we have historical data
      },
      
      platformBreakdown: [
        { 
          platform: 'WEBSITE', 
          conversations: conversationStats._count.id || 0, 
          messages: conversationStats._sum.totalMessages || 0 
        }
      ],
      
      dailyTrends: dailyTrends,
      
      // Show all assistants with their real data
      assistantPerformance: allAssistants.map(assistant => ({
        assistantId: assistant.id,
        assistantName: assistant.name,
        assistantStatus: assistant.status,
        conversations: 0, // Will be filled when conversation tracking is working
        totalMessages: assistant.totalMessages || 0,
        avgResponseTime: 0, // Real data only
        avgSatisfaction: 0, // Real data only
        filesCount: assistant._count.files,
        createdAt: assistant.createdAt,
        hasConversationData: hasConversationData
      })).sort((a, b) => {
        // Sort by total messages, then by creation date
        if (b.totalMessages !== a.totalMessages) {
          return b.totalMessages - a.totalMessages;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }),
      
      popularQueries: [], // Will be populated when we have query tracking
      
      recentConversations: getActualConversations(),
      
      responseTimeDistribution: responseTimeDistribution,
      
      timeRange,
      dateRange: {
        start: startDate,
        end: endDate,
      },
      
      // Meta information
      hasConversationData: hasConversationData,
      assistantCount: allAssistants.length,
      activeAssistantCount: activeAssistants.length,
    };

    console.log(`✅ Analytics generated for account ${user.account.id} - ${analytics.assistantCount} assistants, ${analytics.overview.totalMessages} total messages`);
    
    return NextResponse.json({
      success: true,
      data: analytics,
    });

  } catch (error) {
    console.error('❌ Error fetching analytics:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch analytics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 