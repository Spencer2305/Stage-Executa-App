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
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const assignedToMe = searchParams.get('assignedToMe') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {
      accountId: user.account.id
    };

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    if (priority && priority !== 'all') {
      whereClause.priority = priority;
    }

    if (assignedToMe) {
      // Find human agent record for current user
      const humanAgent = await db.humanAgent.findUnique({
        where: { userId: user.id }
      });
      
      if (humanAgent) {
        whereClause.assignedAgentId = humanAgent.id;
      } else {
        // User is not a human agent, return empty results
        return NextResponse.json({
          tickets: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0
          }
        });
      }
    }

    // Get tickets with related data
    const [tickets, totalCount] = await Promise.all([
      db.handoffRequest.findMany({
        where: whereClause,
        include: {
          session: {
            include: {
              messages: {
                take: 1,
                orderBy: { createdAt: 'desc' }
              }
            }
          },
          assistant: {
            select: {
              name: true,
              id: true
            }
          },
          assignedAgent: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      }),
      db.handoffRequest.count({ where: whereClause })
    ]);

    // Transform tickets to include additional data
    const transformedTickets = await Promise.all(
      tickets.map(async (ticket) => {
        // Get message count for session
        const messageCount = await db.chatMessage.count({
          where: { sessionId: ticket.sessionId }
        });

        // Get last activity timestamp
        const lastMessage = await db.chatMessage.findFirst({
          where: { sessionId: ticket.sessionId },
          orderBy: { createdAt: 'desc' }
        });

        return {
          id: ticket.id,
          status: ticket.status,
          priority: ticket.priority,
          reason: ticket.reason,
          customerName: ticket.session.customerName,
          customerEmail: ticket.session.customerEmail,
          customerPhone: ticket.session.customerPhone,
          assistantName: ticket.assistant.name,
          assistantId: ticket.assistant.id,
          assignedAgent: ticket.assignedAgent ? {
            id: ticket.assignedAgent.id,
            name: ticket.assignedAgent.name,
            email: ticket.assignedAgent.email,
            isOnline: ticket.assignedAgent.isOnline,
            user: ticket.assignedAgent.user
          } : null,
          context: ticket.context,
          customerQuery: ticket.customerQuery,
          createdAt: ticket.createdAt,
          assignedAt: ticket.assignedAt,
          acceptedAt: ticket.acceptedAt,
          resolvedAt: ticket.resolvedAt,
          channel: ticket.session.channel,
          messageCount,
          lastActivity: lastMessage?.createdAt || ticket.createdAt,
          sessionId: ticket.sessionId
        };
      })
    );

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      tickets: transformedTickets,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages
      }
    });

  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      assistantId,
      sessionId,
      reason,
      priority = 'NORMAL',
      context,
      customerQuery,
      customerInfo
    } = body;

    // Validate required fields
    if (!assistantId || !sessionId) {
      return NextResponse.json(
        { error: 'assistantId and sessionId are required' },
        { status: 400 }
      );
    }

    // Get the assistant
    const assistant = await db.assistant.findUnique({
      where: { id: assistantId }
    });

    if (!assistant) {
      return NextResponse.json({ error: 'Assistant not found' }, { status: 404 });
    }

    // Check if session exists, create if it doesn't
    let chatSession = await db.chatSession.findUnique({
      where: { id: sessionId }
    });

    if (!chatSession) {
      chatSession = await db.chatSession.create({
        data: {
          id: sessionId,
          accountId: assistant.accountId,
          assistantId: assistant.id,
          customerName: customerInfo?.name,
          customerEmail: customerInfo?.email,
          customerPhone: customerInfo?.phone,
          customerMetadata: customerInfo?.metadata,
          status: 'ACTIVE',
          channel: customerInfo?.channel || 'web'
        }
      });
    }

    // Create handoff request (ticket)
    const ticket = await db.handoffRequest.create({
      data: {
        accountId: assistant.accountId,
        sessionId: chatSession.id,
        assistantId: assistant.id,
        reason: reason as any,
        priority: priority as any,
        context,
        customerQuery,
        handoffSettings: assistant.handoffSettings || {},
        status: 'PENDING'
      },
      include: {
        session: true,
        assistant: {
          select: {
            name: true
          }
        }
      }
    });

    // Update chat session status
    await db.chatSession.update({
      where: { id: chatSession.id },
      data: {
        isHandedOff: true,
        status: 'TRANSFERRED'
      }
    });

    // Add system message about handoff
    await db.chatMessage.create({
      data: {
        sessionId: chatSession.id,
        content: 'Your conversation has been transferred to our support team. A human agent will be with you shortly.',
        messageType: 'SYSTEM',
        sender: 'AI_ASSISTANT',
        assistantId: assistant.id
      }
    });

    return NextResponse.json({
      success: true,
      ticket: {
        id: ticket.id,
        status: ticket.status,
        priority: ticket.priority,
        createdAt: ticket.createdAt,
        sessionId: ticket.sessionId
      }
    });

  } catch (error) {
    console.error('Error creating ticket:', error);
    return NextResponse.json(
      { error: 'Failed to create ticket' },
      { status: 500 }
    );
  }
} 