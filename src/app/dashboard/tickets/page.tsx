"use client";

import { useEffect, useState } from "react";
import { useUserStore } from "@/state/userStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import { useNotification } from "@/components/ui/notification";
import { 
  Ticket, 
  Mail, 
  MessageSquare, 
  Clock, 
  User, 
  Filter,
  Search,
  MoreHorizontal,
  CheckCircle,
  AlertCircle,
  XCircle,
  Settings,
  ExternalLink,
  Zap,
  Phone,
  Globe,
  Bell,
  Wifi,
  WifiOff
} from "lucide-react";
import { useWebSocket } from '@/hooks/useWebSocket';
import { Avatar } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TicketData {
  id: string;
  status: 'PENDING' | 'ASSIGNED' | 'ACCEPTED' | 'IN_PROGRESS' | 'RESOLVED' | 'EXPIRED';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  reason: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  assistantName: string;
  assignedAgent?: {
    name: string;
    email: string;
    isOnline: boolean;
  };
  context?: string;
  customerQuery?: string;
  createdAt: string;
  assignedAt?: string;
  resolvedAt?: string;
  channel: 'web' | 'email' | 'phone' | 'chat';
  messageCount: number;
  lastActivity: string;
}

interface Agent {
  id: string;
  name: string;
  email: string;
  isOnline: boolean;
  isAvailable: boolean;
  department?: string;
  skills: string[];
  activeTickets: number;
}

export default function TicketManagerPage() {
  const { user, isLoading: userLoading } = useUserStore();
  const { showSuccess, showError } = useNotification();
  
  // Get auth token from localStorage
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    const authToken = localStorage.getItem('executa-auth-token');
    setToken(authToken);
  }, []);
  
  const { 
    isConnected, 
    onNewTicket, 
    onTicketUpdate, 
    requestNotificationPermission,
    toggleAvailability
  } = useWebSocket(token || undefined);

  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // Load tickets from API
  useEffect(() => {
    if (userLoading) return;
    
    const fetchTickets = async () => {
      try {
        const response = await fetch('/api/support/tickets', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch tickets');
        }

        const data = await response.json();
        setTickets(data.tickets || []);
      } catch (error) {
        console.error('Error fetching tickets:', error);
        showError('Failed to load tickets');
        // Fallback to mock data for demo
        setTickets([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTickets();
  }, [userLoading, showError, token]);

  // WebSocket event handlers
  useEffect(() => {
    if (!onNewTicket || !onTicketUpdate) return;

    const handleNewTicket = (ticket: TicketData) => {
      setTickets(prev => [ticket, ...prev]);
      
      // Show browser notification if enabled
      if (notificationsEnabled) {
        new Notification(`New ${ticket.priority} Priority Ticket`, {
          body: `${ticket.customerName || 'Customer'} needs assistance`,
          icon: '/favicon.ico'
        });
      }
    };

    const handleTicketUpdate = ({ ticketId, update }: any) => {
      setTickets(prev => prev.map(ticket => 
        ticket.id === ticketId ? { ...ticket, ...update } : ticket
      ));
    };

    // Register event listeners
    onNewTicket(handleNewTicket);
    onTicketUpdate(handleTicketUpdate);
  }, [onNewTicket, onTicketUpdate, notificationsEnabled]);

  // Initialize notifications
  useEffect(() => {
    if (!requestNotificationPermission) return;
    
    const initNotifications = async () => {
      const granted = await requestNotificationPermission();
      setNotificationsEnabled(granted);
    };
    initNotifications();
  }, [requestNotificationPermission]);

  // Load agents from API
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const response = await fetch('/api/support/agents', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch agents');
        }

        const data = await response.json();
        setAgents(data.agents || []);
        
        // Find current user agent
        const userAgent = data.agents?.find((agent: Agent) => agent.email === user?.email);
        setCurrentAgent(userAgent || null);
      } catch (error) {
        console.error('Error fetching agents:', error);
      }
    };

    fetchAgents();
  }, [user, token]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ASSIGNED': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ACCEPTED': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'IN_PROGRESS': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'RESOLVED': return 'bg-green-100 text-green-800 border-green-200';
      case 'EXPIRED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'NORMAL': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'LOW': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'web': return <Globe className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'phone': return <Phone className="h-4 w-4" />;
      case 'chat': return <MessageSquare className="h-4 w-4" />;
      default: return <Globe className="h-4 w-4" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.customerQuery?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleAcceptTicket = async (ticketId: string) => {
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'accept'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to accept ticket');
      }

      // Update local state
      setTickets(prev => prev.map(ticket => 
        ticket.id === ticketId 
          ? { ...ticket, status: 'ACCEPTED' as const, acceptedAt: new Date().toISOString() }
          : ticket
      ));

      showSuccess("Ticket accepted successfully");
    } catch (error) {
      console.error('Error accepting ticket:', error);
      showError('Failed to accept ticket');
    }
  };

  const handleResolveTicket = async (ticketId: string) => {
    try {
      const response = await fetch(`/api/support/tickets/${ticketId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'resolve',
          data: {
            resolutionNotes: 'Resolved via ticket manager'
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to resolve ticket');
      }

      // Update local state
      setTickets(prev => prev.map(ticket => 
        ticket.id === ticketId 
          ? { ...ticket, status: 'RESOLVED' as const, resolvedAt: new Date().toISOString() }
          : ticket
      ));

      showSuccess("Ticket resolved successfully");
    } catch (error) {
      console.error('Error resolving ticket:', error);
      showError('Failed to resolve ticket');
    }
  };

  const handleAvailabilityToggle = (available: boolean) => {
    toggleAvailability(available);
    if (currentAgent) {
      setCurrentAgent(prev => prev ? { ...prev, isAvailable: available } : null);
    }
  };

  if (userLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Ticket className="h-12 w-12 animate-pulse text-primary mx-auto mb-4" />
          <p className="text-lg font-medium">Loading tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Ticket Manager</h1>
          <p className="text-gray-600 mt-1">Manage customer support requests across all channels</p>
        </div>
        <Button>
          <Settings className="h-4 w-4 mr-2" />
          Configure Integrations
        </Button>
      </div>

      {/* Integration Status Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-2 border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Mail className="h-5 w-5 text-green-600" />
              Email Integration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 font-medium">Active</p>
                                        <p className="text-xs text-green-600">info@executasolutions.com</p>
              </div>
              <Badge className="bg-green-100 text-green-800 border-green-200">
                Connected
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-gray-600" />
              Executa Portal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-700 font-medium">Built-in</p>
                <p className="text-xs text-gray-600">Native interface</p>
              </div>
              <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                Available
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <ExternalLink className="h-5 w-5 text-gray-400" />
              Zendesk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 font-medium">Not Connected</p>
                <p className="text-xs text-gray-400">Click to setup</p>
              </div>
              <Button variant="outline" size="sm">
                Connect
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ticket Management Interface */}
      <Tabs defaultValue="queue" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="queue">Ticket Queue</TabsTrigger>
          <TabsTrigger value="active">Active Chats</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="space-y-4">
          {/* Filters and Search */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Support Queue</CardTitle>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search tickets..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline">
                        <Filter className="h-4 w-4 mr-2" />
                        Status
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setStatusFilter("all")}>All Statuses</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatusFilter("PENDING")}>Pending</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatusFilter("ASSIGNED")}>Assigned</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatusFilter("IN_PROGRESS")}>In Progress</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatusFilter("RESOLVED")}>Resolved</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline">
                        <Filter className="h-4 w-4 mr-2" />
                        Priority
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => setPriorityFilter("all")}>All Priorities</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setPriorityFilter("URGENT")}>Urgent</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setPriorityFilter("HIGH")}>High</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setPriorityFilter("NORMAL")}>Normal</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setPriorityFilter("LOW")}>Low</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredTickets.map((ticket) => (
                  <div key={ticket.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="font-mono text-sm font-medium text-gray-900">{ticket.id}</span>
                          <Badge className={`text-xs ${getStatusColor(ticket.status)}`}>
                            {ticket.status}
                          </Badge>
                          <Badge className={`text-xs ${getPriorityColor(ticket.priority)}`}>
                            {ticket.priority}
                          </Badge>
                          <div className="flex items-center text-gray-500">
                            {getChannelIcon(ticket.channel)}
                            <span className="ml-1 text-xs">{ticket.channel}</span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <User className="h-4 w-4 text-gray-400" />
                              <span className="text-sm font-medium text-gray-900">
                                {ticket.customerName || 'Anonymous'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 ml-6">{ticket.customerEmail}</p>
                            {ticket.customerPhone && (
                              <p className="text-xs text-gray-500 ml-6">{ticket.customerPhone}</p>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-600">
                                Created {formatTimeAgo(ticket.createdAt)}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 ml-6">
                              {ticket.messageCount} messages • Last activity {formatTimeAgo(ticket.lastActivity)}
                            </p>
                          </div>
                        </div>

                        <div className="mb-3">
                          <p className="text-sm text-gray-700 font-medium mb-1">Assistant: {ticket.assistantName}</p>
                          {ticket.customerQuery && (
                            <p className="text-sm text-gray-600 italic">"{ticket.customerQuery}"</p>
                          )}
                          {ticket.context && (
                            <p className="text-xs text-gray-500 mt-1">Context: {ticket.context}</p>
                          )}
                        </div>

                        {ticket.assignedAgent && (
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">Assigned to:</span>
                            <span className="text-xs font-medium text-gray-900">{ticket.assignedAgent.name}</span>
                            <div className={`w-2 h-2 rounded-full ${ticket.assignedAgent.isOnline ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        {ticket.status === 'PENDING' && (
                          <Button 
                            size="sm" 
                            onClick={() => handleAcceptTicket(ticket.id)}
                          >
                            Accept
                          </Button>
                        )}
                        {(ticket.status === 'ASSIGNED' || ticket.status === 'IN_PROGRESS') && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleResolveTicket(ticket.id)}
                          >
                            Resolve
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Open Chat</DropdownMenuItem>
                            <DropdownMenuItem>Transfer</DropdownMenuItem>
                            <DropdownMenuItem>Add Note</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredTickets.length === 0 && (
                  <div className="text-center py-8">
                    <Ticket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No tickets found</p>
                    <p className="text-sm text-gray-400">Try adjusting your search or filters</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active">
          <Card>
            <CardHeader>
              <CardTitle>Active Chat Sessions</CardTitle>
              <CardDescription>
                Real-time conversations currently being handled by agents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No active chat sessions</p>
                <p className="text-sm text-gray-400">Active conversations will appear here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resolved">
          <Card>
            <CardHeader>
              <CardTitle>Resolved Tickets</CardTitle>
              <CardDescription>
                View completed support cases and customer feedback
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tickets.filter(t => t.status === 'RESOLVED').map((ticket) => (
                  <div key={ticket.id} className="border rounded-lg p-4 bg-green-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="font-mono text-sm font-medium">{ticket.id}</span>
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            RESOLVED
                          </Badge>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                        <p className="text-sm text-gray-700 mb-1">
                          <strong>{ticket.customerName}</strong> • {ticket.assistantName}
                        </p>
                        <p className="text-xs text-gray-600">
                          Resolved {formatTimeAgo(ticket.resolvedAt!)} by {ticket.assignedAgent?.name}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Tickets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tickets.length}</div>
                <p className="text-xs text-gray-500">+12% from last week</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Avg Resolution Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2.3h</div>
                <p className="text-xs text-gray-500">-15% improvement</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Customer Satisfaction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4.8/5</div>
                <p className="text-xs text-gray-500">+0.2 from last month</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Active Agents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">3</div>
                <p className="text-xs text-gray-500">2 online now</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Agent Status Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Agent Status ({agents.filter(a => a.isOnline).length} online, {agents.filter(a => a.isOnline && a.isAvailable).length} available)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map(agent => (
              <div key={agent.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <Avatar name={agent.name} size="md" />
                
                <div className="flex-1">
                  <div className="font-medium">{agent.name}</div>
                  <div className="text-sm text-muted-foreground">{agent.email}</div>
                  <div className="text-xs text-muted-foreground">
                    {agent.activeTickets} active tickets
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-1">
                  <Badge variant={agent.isOnline ? 'default' : 'secondary'}>
                    {agent.isOnline ? 'Online' : 'Offline'}
                  </Badge>
                  {agent.isOnline && (
                    <Badge variant={agent.isAvailable ? 'default' : 'outline'}>
                      {agent.isAvailable ? 'Available' : 'Busy'}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Connection Status */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <Wifi className="h-4 w-4 text-green-500" />
              <span className="text-sm text-green-600">Connected</span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-600">Disconnected</span>
            </>
          )}
        </div>

        {/* Notification Toggle */}
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          <Switch 
            checked={notificationsEnabled}
            onCheckedChange={setNotificationsEnabled}
          />
          <span className="text-sm">Notifications</span>
        </div>

        {/* Agent Availability Toggle */}
        {currentAgent && (
          <div className="flex items-center gap-2">
            <Switch 
              checked={currentAgent.isAvailable}
              onCheckedChange={handleAvailabilityToggle}
            />
            <span className="text-sm">
              {currentAgent.isAvailable ? 'Available' : 'Unavailable'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
} 