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

    // Build filter conditions
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

    // 1. Total conversations and messages
    const conversationStats = await db.conversation.aggregate({
      where: whereConditions,
      _count: {
        id: true,
      },
      _sum: {
        totalMessages: true,
        userMessages: true,
        assistantMessages: true,
      },
      _avg: {
        avgResponseTime: true,
        userSatisfaction: true,
      },
    });

    // 2. Unique users count
    const uniqueUsers = await db.conversation.groupBy({
      by: ['userIdentifier'],
      where: {
        ...whereConditions,
        userIdentifier: {
          not: null,
        },
      },
    });

    // 3. Platform breakdown
    const platformStats = await db.conversation.groupBy({
      by: ['platform'],
      where: whereConditions,
      _count: {
        id: true,
      },
      _sum: {
        totalMessages: true,
      },
    });

    // 4. Daily trends (last 30 days regardless of timeRange)
    const trendsStartDate = new Date();
    trendsStartDate.setDate(endDate.getDate() - 30);
    
    const dailyTrends = await db.dailyAnalytics.findMany({
      where: {
        accountId: user.account.id,
        assistantId: assistantId || undefined,
        date: {
          gte: trendsStartDate,
          lte: endDate,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    // 5. Assistant performance comparison
    const assistantPerformance = await db.conversation.groupBy({
      by: ['assistantId'],
      where: {
        accountId: user.account.id,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: {
        id: true,
      },
      _sum: {
        totalMessages: true,
      },
      _avg: {
        avgResponseTime: true,
        userSatisfaction: true,
      },
    });

    // Get assistant names for the performance data
    const assistantIds = assistantPerformance.map(ap => ap.assistantId);
    const assistants = await db.assistant.findMany({
      where: {
        id: {
          in: assistantIds,
        },
        accountId: user.account.id,
      },
      select: {
        id: true,
        name: true,
        status: true,
      },
    });

    // 6. Popular queries
    const popularQueries = await db.popularQuery.findMany({
      where: {
        accountId: user.account.id,
        assistantId: assistantId || undefined,
        lastAsked: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        count: 'desc',
      },
      take: 10,
    });

    // 7. Recent feedback
    const recentFeedback = await db.userFeedback.findMany({
      where: {
        accountId: user.account.id,
        assistantId: assistantId || undefined,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
      include: {
        assistant: {
          select: {
            name: true,
          },
        },
      },
    });

    // 8. Error analysis
    const errorStats = await db.conversation.aggregate({
      where: {
        ...whereConditions,
        hasErrors: true,
      },
      _count: {
        id: true,
      },
    });

    // Calculate growth percentages (compare with previous period)
    const previousPeriodStart = new Date(startDate);
    const periodDuration = endDate.getTime() - startDate.getTime();
    previousPeriodStart.setTime(startDate.getTime() - periodDuration);

    const previousStats = await db.conversation.aggregate({
      where: {
        accountId: user.account.id,
        assistantId: assistantId || undefined,
        createdAt: {
          gte: previousPeriodStart,
          lt: startDate,
        },
      },
      _count: {
        id: true,
      },
      _sum: {
        totalMessages: true,
      },
      _avg: {
        avgResponseTime: true,
        userSatisfaction: true,
      },
    });

    // Calculate growth rates
    const currentConversations = conversationStats._count.id || 0;
    const previousConversations = previousStats._count.id || 0;
    const conversationGrowth = previousConversations > 0 
      ? ((currentConversations - previousConversations) / previousConversations * 100) 
      : 0;

    const currentMessages = conversationStats._sum.totalMessages || 0;
    const previousMessages = previousStats._sum.totalMessages || 0;
    const messageGrowth = previousMessages > 0 
      ? ((currentMessages - previousMessages) / previousMessages * 100) 
      : 0;

    // Transform data for frontend
    const analytics = {
      overview: {
        totalConversations: currentConversations,
        totalMessages: currentMessages,
        uniqueUsers: uniqueUsers.length,
        avgResponseTime: conversationStats._avg.avgResponseTime || 0,
        avgSatisfaction: conversationStats._avg.userSatisfaction || 0,
        errorRate: currentConversations > 0 ? (errorStats._count.id || 0) / currentConversations * 100 : 0,
        
        // Growth metrics
        conversationGrowth: Math.round(conversationGrowth * 100) / 100,
        messageGrowth: Math.round(messageGrowth * 100) / 100,
      },
      
      platformBreakdown: platformStats.map(ps => ({
        platform: ps.platform,
        conversations: ps._count.id,
        messages: ps._sum.totalMessages || 0,
      })),
      
      dailyTrends: dailyTrends.map(dt => ({
        date: dt.date,
        conversations: dt.totalConversations,
        messages: dt.totalMessages,
        uniqueUsers: dt.uniqueUsers,
        avgResponseTime: dt.avgResponseTime,
        avgSatisfaction: dt.avgUserSatisfaction,
        errorRate: dt.errorRate,
      })),
      
      assistantPerformance: assistantPerformance.map(ap => {
        const assistant = assistants.find(a => a.id === ap.assistantId);
        return {
          assistantId: ap.assistantId,
          assistantName: assistant?.name || 'Unknown',
          assistantStatus: assistant?.status || 'UNKNOWN',
          conversations: ap._count.id,
          totalMessages: ap._sum.totalMessages || 0,
          avgResponseTime: ap._avg.avgResponseTime || 0,
          avgSatisfaction: ap._avg.userSatisfaction || 0,
        };
      }).sort((a, b) => b.conversations - a.conversations),
      
      popularQueries: popularQueries.map(pq => ({
        query: pq.query,
        count: pq.count,
        avgResponseTime: pq.avgResponseTime,
        avgSatisfaction: pq.avgSatisfaction,
        isAnswered: pq.isAnswered,
        category: pq.category,
        lastAsked: pq.lastAsked,
      })),
      
      recentFeedback: recentFeedback.map(rf => ({
        id: rf.id,
        rating: rf.rating,
        feedback: rf.feedback,
        feedbackType: rf.feedbackType,
        platform: rf.platform,
        assistantName: rf.assistant.name,
        createdAt: rf.createdAt,
      })),
      
      timeRange,
      dateRange: {
        start: startDate,
        end: endDate,
      },
    };

    console.log(`✅ Analytics generated for account ${user.account.id}`);
    
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