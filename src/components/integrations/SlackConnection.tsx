'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, MessageSquare, ExternalLink, CheckCircle2, Users } from 'lucide-react';
import { toast } from 'sonner';

interface SlackConnectionProps {
  assistantId: string;
  onConnectionUpdate?: () => void;
}

interface SlackConnectionInfo {
  teamName: string;
  teamDomain?: string;
  userName: string;
  isActive: boolean;
  lastMessageAt?: string;
  totalMessages: number;
}

export default function SlackConnection({ assistantId, onConnectionUpdate }: SlackConnectionProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionInfo, setConnectionInfo] = useState<SlackConnectionInfo | null>(null);

  // Fetch connection status on component mount
  useEffect(() => {
    fetchConnectionStatus();
  }, [assistantId]);

  const fetchConnectionStatus = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/integrations/slack/status?assistantId=${assistantId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('executa-auth-token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.connected) {
          setConnectionInfo(data.connection);
        }
      }
    } catch (error) {
      console.error('Failed to fetch Slack connection status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      
      // Get auth URL from your API
      const response = await fetch(`/api/integrations/slack/auth?assistantId=${assistantId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('executa-auth-token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to initialize Slack connection');
      }
      
      const data = await response.json();
      
      // Redirect to Slack OAuth
      window.location.href = data.authUrl;
      
    } catch (error) {
      console.error('Slack connection error:', error);
      toast.error('Failed to connect to Slack. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!connectionInfo) return;
    
    try {
      setIsConnecting(true);
      const response = await fetch(`/api/integrations/slack/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('executa-auth-token')}`
        },
        body: JSON.stringify({ assistantId })
      });

      if (response.ok) {
        setConnectionInfo(null);
        toast.success('Slack integration disconnected successfully!');
        onConnectionUpdate?.();
      } else {
        throw new Error('Failed to disconnect');
      }
    } catch (error) {
      console.error('Error disconnecting Slack:', error);
      toast.error('Failed to disconnect Slack integration');
    } finally {
      setIsConnecting(false);
    }
  };

  const isConnected = connectionInfo?.isActive ?? false;

  if (isLoading) {
    return (
      <div className="flex items-center justify-between p-4 border rounded-lg">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h3 className="font-medium">Slack</h3>
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
        <div className="w-4 h-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center relative">
          <MessageSquare className="w-5 h-5 text-purple-600" />
          {isConnected && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-3 h-3 text-white" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h3 className="font-medium">Slack</h3>
            {isConnected && (
              <Badge variant="default" className="text-xs">
                Connected
              </Badge>
            )}
          </div>
          {isConnected && connectionInfo ? (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                <Users className="w-3 h-3 inline mr-1" />
                {connectionInfo.teamName}
                {connectionInfo.teamDomain && (
                  <span className="ml-1">({connectionInfo.teamDomain}.slack.com)</span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {connectionInfo.totalMessages} messages handled
                {connectionInfo.lastMessageAt && (
                  <span className="ml-2">
                    • Last: {new Date(connectionInfo.lastMessageAt).toLocaleDateString()}
                  </span>
                )}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Connect your Slack workspace to deploy your AI assistant as a bot
            </p>
          )}
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        {isConnected ? (
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleDisconnect}
          >
            <Settings className="w-4 h-4 mr-2" />
            Manage
          </Button>
        ) : (
          <Button 
            onClick={handleConnect}
            disabled={isConnecting}
            size="sm"
          >
            {isConnecting ? (
              <>
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
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

  // Keep the old detailed card view for when expanded (can be used later)
  const DetailedView = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              Slack Integration
            </CardTitle>
            <CardDescription>
              Add your AI assistant as a bot in your Slack workspace
            </CardDescription>
          </div>
          <Badge variant={isConnected ? "default" : "secondary"}>
            {isConnected ? "Connected" : "Not Connected"}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {isConnected && connectionInfo ? (
          <>
            {/* Connection Info */}
            <div className="space-y-2">
              <div className="text-sm">
                <span className="font-medium">Workspace:</span> {connectionInfo.teamName}
                {connectionInfo.teamDomain && (
                  <span className="text-muted-foreground"> ({connectionInfo.teamDomain}.slack.com)</span>
                )}
              </div>
              <div className="text-sm">
                <span className="font-medium">Connected by:</span> {connectionInfo.userName || 'Unknown User'}
              </div>
              <div className="text-sm">
                <span className="font-medium">Messages handled:</span> {connectionInfo.totalMessages}
              </div>
              {connectionInfo.lastMessageAt && (
                <div className="text-sm text-muted-foreground">
                  Last message: {new Date(connectionInfo.lastMessageAt).toLocaleString()}
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleDisconnect}
                size="sm"
                className="flex-1"
              >
                <Settings className="w-4 h-4 mr-2" />
                Manage Connection
              </Button>
            </div>

            {/* Usage Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-2">🎉 Your assistant is now active in Slack!</p>
                <ul className="space-y-1 text-xs">
                  <li>• Send direct messages to your bot</li>
                  <li>• Mention @{connectionInfo.teamName} Assistant in channels</li>
                  <li>• The bot will respond using your trained knowledge base</li>
                </ul>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Connection Setup */}
            <div className="space-y-3">
              <Button 
                onClick={handleConnect}
                disabled={isConnecting}
                className="w-full"
              >
                {isConnecting ? (
                  "Connecting to Slack..."
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Connect to Slack Workspace
                  </>
                )}
              </Button>
            </div>

            {/* Benefits */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="text-sm text-gray-700">
                <p className="font-medium mb-2">What you'll get:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Add your AI assistant as a bot user in Slack</li>
                  <li>• Team members can chat with the bot directly</li>
                  <li>• Mention the bot in channels for group discussions</li>
                  <li>• Responses powered by your trained knowledge base</li>
                </ul>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
} 