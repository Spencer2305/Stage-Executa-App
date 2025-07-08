import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { notifyTicketUpdate } from '@/lib/websocket';

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
              select: {
                id: true,
                content: true,
                messageType: true,
                sender: true,
                createdAt: true,
                isInternal: true
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
        account: {
          include: {
            users: {
              where: {
                role: 'OWNER'
              },
              select: {
                name: true,
                email: true
              },
              take: 1
            }
          }
        }
      }
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const accountOwner = ticket.account.users[0];

    return NextResponse.json({
      success: true,
      ticket: {
        id: ticket.id,
        status: ticket.status,
        reason: ticket.reason,
        priority: ticket.priority,
        context: ticket.context,
        customerQuery: ticket.customerQuery,
        createdAt: ticket.createdAt,
        resolvedAt: ticket.resolvedAt,
        assistant: ticket.assistant,
        assignedTo: accountOwner ? {
          name: accountOwner.name,
          email: accountOwner.email
        } : null,
        session: {
          id: ticket.session.id,
          customerName: ticket.session.customerName,
          customerEmail: ticket.session.customerEmail,
          customerPhone: ticket.session.customerPhone,
          messages: ticket.session.messages
        }
      }
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
        session: true
      }
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Only account owner can manage tickets
    if (user.role !== 'OWNER') {
      return NextResponse.json({ error: 'Only account owner can manage tickets' }, { status: 403 });
    }

    switch (action) {
      case 'accept': {
        // Update ticket status to accepted (account owner takes the ticket)
        const updatedTicket = await db.handoffRequest.update({
          where: { id },
          data: {
            status: 'ACCEPTED',
            assignedAt: new Date(),
            acceptedAt: new Date()
          }
        });

        // Update chat session
        await db.chatSession.update({
          where: { id: ticket.sessionId },
          data: {
            status: 'TRANSFERRED'
          }
        });

        // Add system message
        await db.chatMessage.create({
          data: {
            sessionId: ticket.sessionId,
            content: `${user.name} has joined the conversation and will assist you.`,
            messageType: 'SYSTEM',
            sender: 'SYSTEM'
          }
        });

        // Send real-time notifications
        await notifyTicketUpdate(ticket.id, {
          status: 'ACCEPTED',
          assignedTo: {
            name: user.name,
            email: user.email
          },
          accountId: ticket.accountId
        });

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

      case 'add_message': {
        const { content, isInternal } = data || {};

        if (!content) {
          return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
        }

        // Add message to chat session
        const message = await db.chatMessage.create({
          data: {
            sessionId: ticket.sessionId,
            content,
            messageType: 'TEXT',
            sender: 'HUMAN_AGENT',
            isInternal: isInternal || false
          }
        });

        return NextResponse.json({
          success: true,
          message: {
            id: message.id,
            content: message.content,
            sender: message.sender,
            senderName: user.name,
            timestamp: message.createdAt,
            isInternal: message.isInternal
          }
        });
      }

      case 'close': {
        const updatedTicket = await db.handoffRequest.update({
          where: { id },
          data: {
            status: 'RESOLVED',
            resolvedAt: new Date()
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
            content: 'This conversation has been closed.',
            messageType: 'SYSTEM',
            sender: 'SYSTEM'
          }
        });

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