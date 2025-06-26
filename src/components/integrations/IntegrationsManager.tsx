'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Mail, 
  MessageSquare, 
  Cloud, 
  CheckCircle2, 
  ExternalLink, 
  Settings,
  Users,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface IntegrationsManagerProps {
  assistantId: string;
}

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: string;
  connected: boolean;
  isConnecting?: boolean;
  connectionInfo?: any;
  authUrl?: string;
  statusUrl?: string;
}

export default function IntegrationsManager({ assistantId }: IntegrationsManagerProps) {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);

  // Available integrations (only the working ones)
  const availableIntegrations = [
    {
      id: 'gmail',
      name: 'Gmail',
      description: 'Import emails and conversations to train your AI assistant with real customer interactions',
      icon: Mail,
      category: 'Email',
      authUrl: '/api/integrations/gmail/auth',
      statusUrl: '/api/integrations/gmail/status'
    },
    {
      id: 'slack',
      name: 'Slack',
      description: 'Deploy your AI assistant directly in Slack channels and DMs for team collaboration',
      icon: MessageSquare,
      category: 'Chat',
      authUrl: '/api/integrations/slack/auth',
      statusUrl: '/api/integrations/slack/status'
    },
    {
      id: 'dropbox',
      name: 'Dropbox',
      description: 'Access and train on documents stored in your Dropbox account',
      icon: Cloud,
      category: 'Cloud Storage',
      authUrl: '/api/integrations/dropbox/auth',
      statusUrl: '/api/integrations/dropbox/status'
    }
  ];

  useEffect(() => {
    fetchIntegrationsStatus();
  }, [assistantId]);

  const fetchIntegrationsStatus = async () => {
    setLoading(true);
    const integrationsWithStatus = await Promise.all(
      availableIntegrations.map(async (integration) => {
        try {
          const response = await fetch(`${integration.statusUrl}?assistantId=${assistantId}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('executa-auth-token')}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            return {
              ...integration,
              connected: data.connected || false,
              connectionInfo: data.connection || null
            };
          }
        } catch (error) {
          console.error(`Failed to fetch ${integration.name} status:`, error);
        }
        
        return {
          ...integration,
          connected: false,
          connectionInfo: null
        };
      })
    );
    
    setIntegrations(integrationsWithStatus);
    setLoading(false);
  };

  const handleConnect = async (integration: Integration) => {
    try {
      setIntegrations(prev => 
        prev.map(i => 
          i.id === integration.id 
            ? { ...i, isConnecting: true }
            : i
        )
      );

      const response = await fetch(`${integration.authUrl}?assistantId=${assistantId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('executa-auth-token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to initialize ${integration.name} connection`);
      }
      
      const data = await response.json();
      
      // Redirect to OAuth
      window.location.href = data.authUrl;
      
    } catch (error) {
      console.error(`${integration.name} connection error:`, error);
      toast.error(`Failed to connect to ${integration.name}. Please try again.`);
      
      setIntegrations(prev => 
        prev.map(i => 
          i.id === integration.id 
            ? { ...i, isConnecting: false }
            : i
        )
      );
    }
  };

  const handleDisconnect = async (integration: Integration) => {
    if (!integration.connected) return;
    
    try {
      setIntegrations(prev => 
        prev.map(i => 
          i.id === integration.id 
            ? { ...i, isConnecting: true }
            : i
        )
      );

      const response = await fetch(`/api/integrations/${integration.id}/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('executa-auth-token')}`
        },
        body: JSON.stringify({ assistantId })
      });

      if (response.ok) {
        setIntegrations(prev => 
          prev.map(i => 
            i.id === integration.id 
              ? { ...i, connected: false, connectionInfo: null, isConnecting: false }
              : i
          )
        );
        toast.success(`${integration.name} integration disconnected successfully!`);
      } else {
        throw new Error('Failed to disconnect');
      }
    } catch (error) {
      console.error(`Error disconnecting ${integration.name}:`, error);
      toast.error(`Failed to disconnect ${integration.name} integration`);
      
      setIntegrations(prev => 
        prev.map(i => 
          i.id === integration.id 
            ? { ...i, isConnecting: false }
            : i
        )
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span className="ml-2">Loading integrations...</span>
      </div>
    );
  }

  const connectedCount = integrations.filter(i => i.connected).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Available Integrations</h3>
          <p className="text-sm text-muted-foreground">
            Connect external services to enhance your assistant's capabilities
          </p>
        </div>
        <div className="flex space-x-2">
          <Badge variant="outline">
            {connectedCount} connected
          </Badge>
          <Badge variant="outline">
            {integrations.length} available
          </Badge>
        </div>
      </div>

      {/* Integrations List */}
      <ScrollArea className="h-96 border rounded-lg">
        <div className="p-4 space-y-3">
          {integrations.map((integration) => {
            const Icon = integration.icon;
            
            return (
              <div 
                key={integration.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center relative">
                    <Icon className="w-5 h-5 text-gray-600" />
                    {integration.connected && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium">{integration.name}</h4>
                      {integration.connected && (
                        <Badge variant="default" className="text-xs">
                          Connected
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {integration.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {integration.description}
                    </p>
                    
                    {/* Connection Info */}
                    {integration.connected && integration.connectionInfo && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        {integration.id === 'slack' && (
                          <span>
                            <Users className="w-3 h-3 inline mr-1" />
                            {integration.connectionInfo.teamName}
                            {integration.connectionInfo.teamDomain && (
                              <span className="ml-1">({integration.connectionInfo.teamDomain}.slack.com)</span>
                            )}
                          </span>
                        )}
                        {integration.id === 'gmail' && (
                          <span>
                            <Mail className="w-3 h-3 inline mr-1" />
                            {integration.connectionInfo.email || 'Connected'}
                          </span>
                        )}
                        {integration.id === 'dropbox' && (
                          <span>
                            <Cloud className="w-3 h-3 inline mr-1" />
                            {integration.connectionInfo.displayName || 'Connected'}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {integration.connected ? (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDisconnect(integration)}
                      disabled={integration.isConnecting}
                    >
                      {integration.isConnecting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Disconnecting...
                        </>
                      ) : (
                        <>
                          <Settings className="w-4 h-4 mr-2" />
                          Disconnect
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => handleConnect(integration)}
                      disabled={integration.isConnecting}
                      size="sm"
                    >
                      {integration.isConnecting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Connect
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
      
      {integrations.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No integrations available</p>
        </div>
      )}
    </div>
  );
} 