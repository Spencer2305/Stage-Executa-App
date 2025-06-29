import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { authenticateRequest } from './auth';
import { db } from './db';

let io: SocketIOServer | null = null;

export function initializeWebSocket(server: HTTPServer) {
  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', async (socket: any) => {
    console.log('Client connected:', socket.id);

    // Authenticate socket connection
    socket.on('authenticate', async (token: string) => {
      try {
        // Create a mock request object for authentication
        const mockRequest = {
          headers: {
            get: (name: string) => name === 'authorization' ? `Bearer ${token}` : null
          }
        } as any;

        const user = await authenticateRequest(mockRequest);
        if (!user) {
          socket.emit('auth_error', { message: 'Invalid token' });
          socket.disconnect();
          return;
        }

        // Store user info in socket
        socket.data.user = user;
        socket.data.accountId = user.account.id;

        // Join account-specific room
        socket.join(`account:${user.account.id}`);

        // Join agent-specific room if user is an agent
        const humanAgent = await db.humanAgent.findUnique({
          where: { userId: user.id }
        });

        if (humanAgent) {
          socket.data.agentId = humanAgent.id;
          socket.join(`agent:${humanAgent.id}`);
          
          // Update agent online status
          await db.humanAgent.update({
            where: { id: humanAgent.id },
            data: { 
              isOnline: true,
              lastActive: new Date()
            }
          });

          // Notify other agents in account
          socket.to(`account:${user.account.id}`).emit('agent_status_change', {
            agentId: humanAgent.id,
            name: humanAgent.name,
            isOnline: true
          });
        }

        socket.emit('authenticated', { 
          message: 'Successfully authenticated',
          user: {
            id: user.id,
            name: user.name,
            isAgent: !!humanAgent
          }
        });

      } catch (error) {
        console.error('Socket authentication error:', error);
        socket.emit('auth_error', { message: 'Authentication failed' });
        socket.disconnect();
      }
    });

    // Handle agent availability toggle
    socket.on('toggle_availability', async (available: boolean) => {
      if (!socket.data.agentId) return;

      try {
        await db.humanAgent.update({
          where: { id: socket.data.agentId },
          data: { isAvailable: available }
        });

        socket.to(`account:${socket.data.accountId}`).emit('agent_availability_change', {
          agentId: socket.data.agentId,
          isAvailable: available
        });

        socket.emit('availability_updated', { isAvailable: available });
      } catch (error) {
        console.error('Error updating agent availability:', error);
        socket.emit('error', { message: 'Failed to update availability' });
      }
    });

    // Handle typing indicators for ticket chat
    socket.on('typing_start', (data: { ticketId: string }) => {
      if (!socket.data.user) return;
      
      socket.to(`ticket:${data.ticketId}`).emit('agent_typing', {
        agentName: socket.data.user.name,
        ticketId: data.ticketId
      });
    });

    socket.on('typing_stop', (data: { ticketId: string }) => {
      socket.to(`ticket:${data.ticketId}`).emit('agent_stop_typing', {
        ticketId: data.ticketId
      });
    });

    // Join ticket room for real-time updates
    socket.on('join_ticket', (ticketId: string) => {
      socket.join(`ticket:${ticketId}`);
    });

    socket.on('leave_ticket', (ticketId: string) => {
      socket.leave(`ticket:${ticketId}`);
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log('Client disconnected:', socket.id);

      if (socket.data.agentId) {
        try {
          // Update agent offline status
          await db.humanAgent.update({
            where: { id: socket.data.agentId },
            data: { 
              isOnline: false,
              lastActive: new Date()
            }
          });

          // Notify other agents
          socket.to(`account:${socket.data.accountId}`).emit('agent_status_change', {
            agentId: socket.data.agentId,
            isOnline: false
          });
        } catch (error) {
          console.error('Error updating agent offline status:', error);
        }
      }
    });
  });

  return io;
}

export function getWebSocketServer(): SocketIOServer | null {
  return io;
}

// Notification functions
export async function notifyNewTicket(ticket: any) {
  if (!io) return;

  const notificationData = {
    type: 'new_ticket',
    ticket: {
      id: ticket.id,
      priority: ticket.priority,
      reason: ticket.reason,
      customerName: ticket.customerName || 'Customer',
      assistantName: ticket.assistant?.name,
      createdAt: ticket.createdAt
    }
  };

  // Notify all agents in the account
  io.to(`account:${ticket.accountId}`).emit('new_ticket', notificationData);

  // Send browser notification data
  io.to(`account:${ticket.accountId}`).emit('browser_notification', {
    title: `New ${ticket.priority} Priority Ticket`,
    body: `${ticket.customerName || 'Customer'} needs assistance with ${ticket.assistant?.name}`,
    icon: '/favicon.ico',
    tag: `ticket-${ticket.id}`,
    data: { ticketId: ticket.id }
  });
}

export async function notifyTicketUpdate(ticketId: string, update: any) {
  if (!io) return;

  // Notify agents in the account
  io.to(`account:${update.accountId}`).emit('ticket_updated', {
    ticketId,
    update
  });

  // Notify specific ticket room
  io.to(`ticket:${ticketId}`).emit('ticket_status_change', {
    ticketId,
    status: update.status,
    assignedAgent: update.assignedAgent,
    timestamp: new Date()
  });
}

export async function notifyTicketMessage(sessionId: string, message: any) {
  if (!io) return;

  // Get ticket ID from session
  const ticket = await db.handoffRequest.findFirst({
    where: { sessionId }
  });

  if (!ticket) return;

  // Notify ticket room
  io.to(`ticket:${ticket.id}`).emit('new_message', {
    ticketId: ticket.id,
    message: {
      id: message.id,
      content: message.content,
      sender: message.sender,
      senderName: message.humanAgent?.name || 'System',
      timestamp: message.createdAt,
      isInternal: message.isInternal
    }
  });

  // Notify account if it's from a customer
  if (message.sender === 'CUSTOMER') {
    io.to(`account:${ticket.accountId}`).emit('customer_message', {
      ticketId: ticket.id,
      customerName: 'Customer',
      preview: message.content.substring(0, 100)
    });
  }
}

export async function notifyAgentAssignment(ticketId: string, agentId: string, accountId: string) {
  if (!io) return;

  // Notify the assigned agent
  io.to(`agent:${agentId}`).emit('ticket_assigned', {
    ticketId,
    message: 'You have been assigned a new ticket'
  });

  // Notify account of assignment
  io.to(`account:${accountId}`).emit('ticket_assignment_change', {
    ticketId,
    agentId,
    timestamp: new Date()
  });
} 