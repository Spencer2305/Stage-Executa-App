import { useEffect, useState, useRef, useCallback } from 'react';
import io, { Socket } from 'socket.io-client';

interface WebSocketHook {
  socket: Socket | null;
  isConnected: boolean;
  tickets: any[];
  agents: any[];
  onNewTicket: (callback: (ticket: any) => void) => void;
  onTicketUpdate: (callback: (update: any) => void) => void;
  onAgentStatusChange: (callback: (agent: any) => void) => void;
  onNewMessage: (callback: (message: any) => void) => void;
  requestNotificationPermission: () => Promise<boolean>;
  joinTicket: (ticketId: string) => void;
  leaveTicket: (ticketId: string) => void;
  toggleAvailability: (available: boolean) => void;
  startTyping: (ticketId: string) => void;
  stopTyping: (ticketId: string) => void;
}

export function useWebSocket(token?: string): WebSocketHook {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  
  const newTicketCallbacks = useRef<((ticket: any) => void)[]>([]);
  const ticketUpdateCallbacks = useRef<((update: any) => void)[]>([]);
  const agentStatusCallbacks = useRef<((agent: any) => void)[]>([]);
  const messageCallbacks = useRef<((message: any) => void)[]>([]);

  const onNewTicket = useCallback((callback: (ticket: any) => void) => {
    newTicketCallbacks.current.push(callback);
    return () => {
      const index = newTicketCallbacks.current.indexOf(callback);
      if (index > -1) {
        newTicketCallbacks.current.splice(index, 1);
      }
    };
  }, []);

  const onTicketUpdate = useCallback((callback: (update: any) => void) => {
    ticketUpdateCallbacks.current.push(callback);
    return () => {
      const index = ticketUpdateCallbacks.current.indexOf(callback);
      if (index > -1) {
        ticketUpdateCallbacks.current.splice(index, 1);
      }
    };
  }, []);

  const onAgentStatusChange = useCallback((callback: (agent: any) => void) => {
    agentStatusCallbacks.current.push(callback);
    return () => {
      const index = agentStatusCallbacks.current.indexOf(callback);
      if (index > -1) {
        agentStatusCallbacks.current.splice(index, 1);
      }
    };
  }, []);

  const onNewMessage = useCallback((callback: (message: any) => void) => {
    messageCallbacks.current.push(callback);
    return () => {
      const index = messageCallbacks.current.indexOf(callback);
      if (index > -1) {
        messageCallbacks.current.splice(index, 1);
      }
    };
  }, []);

  // Request notification permission
  const requestNotificationPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }, []);

  // Show browser notification
  const showNotification = useCallback((title: string, options: NotificationOptions) => {
    if (Notification.permission === 'granted') {
      const notification = new Notification(title, options);
      
      // Auto-close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      return notification;
    }
  }, []);

  // Socket action methods
  const joinTicket = useCallback((ticketId: string) => {
    if (socket && isConnected) {
      socket.emit('join_ticket', ticketId);
    }
  }, [socket, isConnected]);

  const leaveTicket = useCallback((ticketId: string) => {
    if (socket && isConnected) {
      socket.emit('leave_ticket', ticketId);
    }
  }, [socket, isConnected]);

  const toggleAvailability = useCallback((available: boolean) => {
    if (socket && isConnected) {
      socket.emit('toggle_availability', available);
    }
  }, [socket, isConnected]);

  const startTyping = useCallback((ticketId: string) => {
    if (socket && isConnected) {
      socket.emit('typing_start', { ticketId });
    }
  }, [socket, isConnected]);

  const stopTyping = useCallback((ticketId: string) => {
    if (socket && isConnected) {
      socket.emit('typing_stop', { ticketId });
    }
  }, [socket, isConnected]);

  useEffect(() => {
    if (!token) return;

    // Initialize socket connection
    const newSocket = io(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000', {
      transports: ['websocket', 'polling'],
      timeout: 20000,
    });

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      
      // Authenticate with token
      newSocket.emit('authenticate', token);
    });

    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    newSocket.on('authenticated', (data: any) => {
      console.log('WebSocket authenticated:', data);
    });

    newSocket.on('auth_error', (error: any) => {
      console.error('WebSocket auth error:', error);
      setIsConnected(false);
    });

    // Ticket event handlers
    newSocket.on('new_ticket', (data: any) => {
      console.log('New ticket received:', data);
      setTickets(prev => [data.ticket, ...prev]);
      
      // Trigger callbacks
      newTicketCallbacks.current.forEach(callback => callback(data.ticket));
    });

    newSocket.on('ticket_updated', (data: any) => {
      console.log('Ticket updated:', data);
      setTickets(prev => prev.map(ticket => 
        ticket.id === data.ticketId 
          ? { ...ticket, ...data.update }
          : ticket
      ));
      
      // Trigger callbacks
      ticketUpdateCallbacks.current.forEach(callback => callback(data));
    });

    newSocket.on('ticket_status_change', (data: any) => {
      console.log('Ticket status changed:', data);
      setTickets(prev => prev.map(ticket => 
        ticket.id === data.ticketId 
          ? { ...ticket, status: data.status, assignedAgent: data.assignedAgent }
          : ticket
      ));
    });

    // Agent event handlers
    newSocket.on('agent_status_change', (data: any) => {
      console.log('Agent status changed:', data);
      setAgents(prev => prev.map(agent =>
        agent.id === data.agentId
          ? { ...agent, isOnline: data.isOnline }
          : agent
      ));
      
      // Trigger callbacks
      agentStatusCallbacks.current.forEach(callback => callback(data));
    });

    newSocket.on('agent_availability_change', (data: any) => {
      console.log('Agent availability changed:', data);
      setAgents(prev => prev.map(agent =>
        agent.id === data.agentId
          ? { ...agent, isAvailable: data.isAvailable }
          : agent
      ));
    });

    newSocket.on('availability_updated', (data: any) => {
      console.log('Your availability updated:', data);
    });

    // Message event handlers
    newSocket.on('new_message', (data: any) => {
      console.log('New message received:', data);
      
      // Trigger callbacks
      messageCallbacks.current.forEach(callback => callback(data));
    });

    newSocket.on('customer_message', (data: any) => {
      console.log('Customer message received:', data);
      
      // Show notification for customer messages
      showNotification(`New message from ${data.customerName}`, {
        body: data.preview,
        icon: '/favicon.ico',
        tag: `customer-message-${data.ticketId}`,
        data: { ticketId: data.ticketId }
      });
    });

    // Typing indicators
    newSocket.on('agent_typing', (data: any) => {
      console.log('Agent typing:', data);
    });

    newSocket.on('agent_stop_typing', (data: any) => {
      console.log('Agent stopped typing:', data);
    });

    // Browser notification event
    newSocket.on('browser_notification', (data: any) => {
      showNotification(data.title, {
        body: data.body,
        icon: data.icon,
        tag: data.tag,
        data: data.data
      });
    });

    // Assignment notifications
    newSocket.on('ticket_assigned', (data: any) => {
      console.log('Ticket assigned to you:', data);
      showNotification('New Ticket Assigned', {
        body: data.message,
        icon: '/favicon.ico',
        tag: `assignment-${data.ticketId}`,
        data: { ticketId: data.ticketId }
      });
    });

    newSocket.on('ticket_assignment_change', (data: any) => {
      console.log('Ticket assignment changed:', data);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.disconnect();
      setSocket(null);
      setIsConnected(false);
    };
  }, [token, showNotification]);

  return {
    socket,
    isConnected,
    tickets,
    agents,
    onNewTicket,
    onTicketUpdate,
    onAgentStatusChange,
    onNewMessage,
    requestNotificationPermission,
    joinTicket,
    leaveTicket,
    toggleAvailability,
    startTyping,
    stopTyping
  };
} 