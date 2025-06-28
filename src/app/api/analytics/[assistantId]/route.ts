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
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '7d';

    console.log(`📊 Fetching analytics for assistant ${assistantId}, timeRange: ${timeRange}`);

    // Verify assistant belongs to user's account
    const assistant = await db.assistant.findFirst({
      where: {
        id: assistantId,
        accountId: user.account.id,
      },
    });

    if (!assistant) {
      return NextResponse.json({ error: 'Assistant not found' }, { status: 404 });
    }

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

    const whereConditions = {
      assistantId,
      accountId: user.account.id,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
    };

    // 1. Conversation and message stats
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

    // 2. Unique users
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
      _avg: {
        avgResponseTime: true,
        userSatisfaction: true,
      },
    });

    // 4. Hourly usage patterns (last 7 days)
    const hourlyPatterns = await db.conversation.findMany({
      where: {
        assistantId,
        accountId: user.account.id,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      select: {
        createdAt: true,
      },
    });

    // Process hourly patterns
    const hourlyUsage = new Array(24).fill(0);
    hourlyPatterns.forEach(conv => {
      const hour = new Date(conv.createdAt).getHours();
      hourlyUsage[hour]++;
    });

    // 5. Daily trends
    const dailyTrends = await db.dailyAnalytics.findMany({
      where: {
        assistantId,
        accountId: user.account.id,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    // 6. Recent conversations
    const recentConversations = await db.conversation.findMany({
      where: {
        assistantId,
        accountId: user.account.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
      select: {
        id: true,
        platform: true,
        totalMessages: true,
        avgResponseTime: true,
        userSatisfaction: true,
        status: true,
        createdAt: true,
        endedAt: true,
      },
    });

    // 7. Popular queries for this assistant
    const popularQueries = await db.popularQuery.findMany({
      where: {
        assistantId,
        accountId: user.account.id,
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

    // 8. User feedback for this assistant
    const feedbackStats = await db.userFeedback.aggregate({
      where: {
        assistantId,
        accountId: user.account.id,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: {
        id: true,
      },
      _avg: {
        rating: true,
      },
    });

    const recentFeedback = await db.userFeedback.findMany({
      where: {
        assistantId,
        accountId: user.account.id,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    });

    // 9. Response time distribution
    const responseTimeStats = await db.conversation.findMany({
      where: {
        ...whereConditions,
        avgResponseTime: {
          not: null,
        },
      },
      select: {
        avgResponseTime: true,
      },
    });

    // Categorize response times
    const responseTimeDistribution = {
      fast: 0,      // < 1s
      medium: 0,    // 1-3s
      slow: 0,      // 3-10s
      verySlow: 0,  // > 10s
    };

    responseTimeStats.forEach(conv => {
      const time = conv.avgResponseTime || 0;
      if (time < 1) responseTimeDistribution.fast++;
      else if (time < 3) responseTimeDistribution.medium++;
      else if (time < 10) responseTimeDistribution.slow++;
      else responseTimeDistribution.verySlow++;
    });

    // 10. Error analysis
    const errorStats = await db.conversation.aggregate({
      where: {
        ...whereConditions,
        hasErrors: true,
      },
      _count: {
        id: true,
      },
    });

    // Calculate growth compared to previous period
    const previousPeriodStart = new Date(startDate);
    const periodDuration = endDate.getTime() - startDate.getTime();
    previousPeriodStart.setTime(startDate.getTime() - periodDuration);

    const previousStats = await db.conversation.aggregate({
      where: {
        assistantId,
        accountId: user.account.id,
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

    const currentSatisfaction = conversationStats._avg.userSatisfaction || 0;
    const previousSatisfaction = previousStats._avg.userSatisfaction || 0;
    const satisfactionChange = previousSatisfaction > 0 
      ? currentSatisfaction - previousSatisfaction 
      : 0;

    // Transform data for frontend
    const analytics = {
      assistant: {
        id: assistant.id,
        name: assistant.name,
        status: assistant.status,
        createdAt: assistant.createdAt,
      },
      
      overview: {
        totalConversations: currentConversations,
        totalMessages: conversationStats._sum.totalMessages || 0,
        userMessages: conversationStats._sum.userMessages || 0,
        assistantMessages: conversationStats._sum.assistantMessages || 0,
        uniqueUsers: uniqueUsers.length,
        avgResponseTime: conversationStats._avg.avgResponseTime || 0,
        avgSatisfaction: conversationStats._avg.userSatisfaction || 0,
        errorRate: currentConversations > 0 ? (errorStats._count.id || 0) / currentConversations * 100 : 0,
        
        // Growth metrics
        conversationGrowth: Math.round(conversationGrowth * 100) / 100,
        satisfactionChange: Math.round(satisfactionChange * 100) / 100,
      },
      
      platformBreakdown: platformStats.map(ps => ({
        platform: ps.platform,
        conversations: ps._count.id,
        messages: ps._sum.totalMessages || 0,
        avgResponseTime: ps._avg.avgResponseTime || 0,
        avgSatisfaction: ps._avg.userSatisfaction || 0,
      })),
      
      hourlyUsage: hourlyUsage.map((count, hour) => ({
        hour,
        conversations: count,
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
      
      recentConversations: recentConversations.map(rc => ({
        id: rc.id,
        platform: rc.platform,
        totalMessages: rc.totalMessages,
        avgResponseTime: rc.avgResponseTime,
        userSatisfaction: rc.userSatisfaction,
        status: rc.status,
        duration: rc.endedAt ? 
          Math.round((new Date(rc.endedAt).getTime() - new Date(rc.createdAt).getTime()) / 1000 / 60) : 
          null, // Duration in minutes
        createdAt: rc.createdAt,
      })),
      
      popularQueries: popularQueries.map(pq => ({
        query: pq.query,
        count: pq.count,
        avgResponseTime: pq.avgResponseTime,
        avgSatisfaction: pq.avgSatisfaction,
        isAnswered: pq.isAnswered,
        category: pq.category,
        lastAsked: pq.lastAsked,
      })),
      
      feedback: {
        totalFeedback: feedbackStats._count.id || 0,
        avgRating: feedbackStats._avg.rating || 0,
        recent: recentFeedback.map(rf => ({
          id: rf.id,
          rating: rf.rating,
          feedback: rf.feedback,
          feedbackType: rf.feedbackType,
          platform: rf.platform,
          createdAt: rf.createdAt,
        })),
      },
      
      responseTimeDistribution,
      
      timeRange,
      dateRange: {
        start: startDate,
        end: endDate,
      },
    };

    console.log(`✅ Assistant analytics generated for ${assistantId}`);
    
    return NextResponse.json({
      success: true,
      data: analytics,
    });

  } catch (error) {
    console.error('❌ Error fetching assistant analytics:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch assistant analytics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 