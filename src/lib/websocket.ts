import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { db } from './db';
import jwt from 'jsonwebtoken';

let io: SocketIOServer | null = null;

export function initializeWebSocket(server: HTTPServer) {
  io = new SocketIOServer(server, {
    cors: {
      origin: ["http://localhost:3000", "http://localhost:3001"],
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', async (socket: any) => {
    console.log('Client connected:', socket.id);

    // Handle authentication
    socket.on('authenticate', async (token: string) => {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key') as any;

        const user = await db.user.findUnique({
          where: { id: decoded.userId },
          include: {
            account: true
          }
        });

        if (!user) {
          socket.emit('auth_error', { message: 'User not found' });
          socket.disconnect();
          return;
        }

        socket.data.userId = user.id;
        socket.data.accountId = user.account.id;
        socket.data.isOwner = user.role === 'OWNER';
        
        // Join account room
        socket.join(`account:${user.account.id}`);

        socket.emit('authenticated', { 
          message: 'Successfully authenticated',
          user: {
            id: user.id,
            name: user.name,
            isOwner: user.role === 'OWNER'
          }
        });

      } catch (error) {
        console.error('Socket authentication error:', error);
        socket.emit('auth_error', { message: 'Authentication failed' });
        socket.disconnect();
      }
    });

    // Handle ticket room management
    socket.on('join_ticket', (ticketId: string) => {
      if (!socket.data.accountId) return;
      socket.join(`ticket:${ticketId}`);
      console.log(`User joined ticket room: ${ticketId}`);
    });

    socket.on('leave_ticket', (ticketId: string) => {
      socket.leave(`ticket:${ticketId}`);
      console.log(`User left ticket room: ${ticketId}`);
    });

    // Handle chat typing indicators
    socket.on('typing_start', (data: { ticketId: string; userName: string }) => {
      socket.to(`ticket:${data.ticketId}`).emit('user_typing', {
        ticketId: data.ticketId,
        userName: data.userName,
        isTyping: true
      });
    });

    socket.on('typing_stop', (data: { ticketId: string; userName: string }) => {
      socket.to(`ticket:${data.ticketId}`).emit('user_typing', {
        ticketId: data.ticketId,
        userName: data.userName,
        isTyping: false
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}

export function getIO() {
  return io;
}

// Simplified notification functions for account owners only
export async function notifyNewTicket(ticketData: any) {
  if (!io) return;

  // Notify account owner
  io.to(`account:${ticketData.accountId}`).emit('new_ticket', {
    ticketId: ticketData.id,
    priority: ticketData.priority,
    reason: ticketData.reason,
    customerName: ticketData.customerName,
    assistantName: ticketData.assistant?.name,
    timestamp: new Date()
  });
}

export async function notifyTicketUpdate(ticketId: string, update: any) {
  if (!io) return;

  // Notify account owner
  io.to(`account:${update.accountId}`).emit('ticket_updated', {
    ticketId,
    update
  });

  // Notify specific ticket room
  io.to(`ticket:${ticketId}`).emit('ticket_status_change', {
    ticketId,
    status: update.status,
    assignedTo: update.assignedTo,
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
      senderName: message.senderName || 'System',
      timestamp: message.createdAt,
      isInternal: message.isInternal
    }
  });

  // Notify account owner if it's from a customer
  if (message.sender === 'CUSTOMER') {
    io.to(`account:${ticket.accountId}`).emit('customer_message', {
      ticketId: ticket.id,
      customerName: 'Customer',
      preview: message.content.substring(0, 100)
    });
  }
} 