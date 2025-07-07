import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { notifyTicketUpdate, notifyAgentAssignment } from '@/lib/websocket';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const ticket = await db.handoffRequest.findUnique({
      where: { 
        id,
        accountId: user.account.id 
      },
      include: {
        session: {
          include: {
            messages: {
              orderBy: { createdAt: 'asc' },
              include: {
                humanAgent: {
                  select: {
                    name: true,
                    email: true
                  }
                }
              }
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
      }
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: ticket.id,
      status: ticket.status,
      priority: ticket.priority,
      reason: ticket.reason,
      context: ticket.context,
      customerQuery: ticket.customerQuery,
      createdAt: ticket.createdAt,
      assignedAt: ticket.assignedAt,
      acceptedAt: ticket.acceptedAt,
      resolvedAt: ticket.resolvedAt,
      customer: {
        name: ticket.session.customerName,
        email: ticket.session.customerEmail,
        phone: ticket.session.customerPhone,
        metadata: ticket.session.customerMetadata
      },
      assistant: ticket.assistant,
      assignedAgent: ticket.assignedAgent ? {
        id: ticket.assignedAgent.id,
        name: ticket.assignedAgent.name,
        email: ticket.assignedAgent.email,
        user: ticket.assignedAgent.user
      } : null,
      session: {
        id: ticket.session.id,
        channel: ticket.session.channel,
        status: ticket.session.status,
        totalMessages: ticket.session.totalMessages
      },
      messages: ticket.session.messages.map(msg => ({
        id: msg.id,
        content: msg.content,
        messageType: msg.messageType,
        sender: msg.sender,
        createdAt: msg.createdAt,
        isInternal: msg.isInternal,
        humanAgent: msg.humanAgent,
        metadata: msg.metadata
      }))
    });

  } catch (error) {
    console.error('Error fetching ticket:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ticket' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action, data } = body;

    // Find the ticket
    const ticket = await db.handoffRequest.findUnique({
      where: { 
        id,
        accountId: user.account.id 
      },
      include: {
        session: true,
        assignedAgent: true
      }
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    switch (action) {
      case 'accept': {
        // Find human agent record for current user
        const humanAgent = await db.humanAgent.findUnique({
          where: { userId: user.id }
        });

        if (!humanAgent) {
          return NextResponse.json({ error: 'User is not a human agent' }, { status: 403 });
        }

        // Update ticket status and assign to current user
        const updatedTicket = await db.handoffRequest.update({
          where: { id },
          data: {
            status: 'ACCEPTED',
            assignedAgentId: humanAgent.id,
            assignedAt: new Date(),
            acceptedAt: new Date()
          }
        });

        // Update chat session
        await db.chatSession.update({
          where: { id: ticket.sessionId },
          data: {
            humanAgentId: humanAgent.id,
            status: 'TRANSFERRED'
          }
        });

        // Add system message
        await db.chatMessage.create({
          data: {
            sessionId: ticket.sessionId,
            content: `Agent ${humanAgent.name} has joined the conversation and will assist you.`,
            messageType: 'SYSTEM',
            sender: 'SYSTEM'
          }
        });

        // Send real-time notifications
        await notifyTicketUpdate(ticket.id, {
          status: 'ACCEPTED',
          assignedAgent: {
            id: humanAgent.id,
            name: humanAgent.name,
            email: humanAgent.email
          },
          accountId: ticket.accountId
        });

        await notifyAgentAssignment(ticket.id, humanAgent.id, ticket.accountId);

        return NextResponse.json({
          success: true,
          ticket: updatedTicket
        });
      }

      case 'resolve': {
        const { resolutionNotes, customerSatisfaction } = data || {};

        const updatedTicket = await db.handoffRequest.update({
          where: { id },
          data: {
            status: 'RESOLVED',
            resolvedAt: new Date(),
            ...(resolutionNotes && { 
              context: ticket.context ? 
                `${ticket.context}\n\nResolution: ${resolutionNotes}` : 
                `Resolution: ${resolutionNotes}`
            })
          }
        });

        // Update chat session
        await db.chatSession.update({
          where: { id: ticket.sessionId },
          data: {
            status: 'RESOLVED'
          }
        });

        // Add system message
        await db.chatMessage.create({
          data: {
            sessionId: ticket.sessionId,
            content: 'This support ticket has been resolved. Thank you for contacting us!',
            messageType: 'SYSTEM',
            sender: 'SYSTEM'
          }
        });

        // Send real-time notification
        await notifyTicketUpdate(ticket.id, {
          status: 'RESOLVED',
          resolvedAt: new Date(),
          accountId: ticket.accountId
        });

        return NextResponse.json({
          success: true,
          ticket: updatedTicket
        });
      }

      case 'transfer': {
        const { agentId, reason } = data || {};

        if (!agentId) {
          return NextResponse.json({ error: 'Agent ID is required for transfer' }, { status: 400 });
        }

        // Verify target agent exists and is in same account
        const targetAgent = await db.humanAgent.findUnique({
          where: { 
            id: agentId,
            accountId: user.account.id
          }
        });

        if (!targetAgent) {
          return NextResponse.json({ error: 'Target agent not found' }, { status: 404 });
        }

        const updatedTicket = await db.handoffRequest.update({
          where: { id },
          data: {
            assignedAgentId: agentId,
            status: 'ASSIGNED',
            assignedAt: new Date(),
            acceptedAt: null, // Reset acceptance time
            context: ticket.context ? 
              `${ticket.context}\n\nTransferred: ${reason || 'No reason provided'}` : 
              `Transferred: ${reason || 'No reason provided'}`
          }
        });

        // Update chat session
        await db.chatSession.update({
          where: { id: ticket.sessionId },
          data: {
            humanAgentId: agentId
          }
        });

        // Add system message
        await db.chatMessage.create({
          data: {
            sessionId: ticket.sessionId,
            content: `This conversation has been transferred to ${targetAgent.name}.`,
            messageType: 'SYSTEM',
            sender: 'SYSTEM'
          }
        });

        // Send real-time notifications
        await notifyTicketUpdate(ticket.id, {
          status: 'ASSIGNED',
          assignedAgent: {
            id: targetAgent.id,
            name: targetAgent.name,
            email: targetAgent.email
          },
          accountId: ticket.accountId
        });

        await notifyAgentAssignment(ticket.id, agentId, ticket.accountId);

        return NextResponse.json({
          success: true,
          ticket: updatedTicket
        });
      }

      case 'update_priority': {
        const { priority } = data || {};

        if (!['LOW', 'NORMAL', 'HIGH', 'URGENT'].includes(priority)) {
          return NextResponse.json({ error: 'Invalid priority' }, { status: 400 });
        }

        const updatedTicket = await db.handoffRequest.update({
          where: { id },
          data: { priority }
        });

        return NextResponse.json({
          success: true,
          ticket: updatedTicket
        });
      }

      case 'add_note': {
        const { note, isInternal = true } = data || {};

        if (!note) {
          return NextResponse.json({ error: 'Note content is required' }, { status: 400 });
        }

        // Find human agent record for current user
        const humanAgent = await db.humanAgent.findUnique({
          where: { userId: user.id }
        });

        const message = await db.chatMessage.create({
          data: {
            sessionId: ticket.sessionId,
            content: note,
            messageType: 'TEXT',
            sender: 'HUMAN_AGENT',
            humanAgentId: humanAgent?.id,
            isInternal,
            metadata: {
              type: 'agent_note',
              addedBy: user.name,
              timestamp: new Date().toISOString()
            }
          }
        });

        return NextResponse.json({
          success: true,
          message
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error updating ticket:', error);
    return NextResponse.json(
      { error: 'Failed to update ticket' },
      { status: 500 }
    );
  }
} 