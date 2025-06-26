'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface DiscordConnectionProps {
  assistantId?: string;
  isConnected?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  connectionInfo?: {
    guildName: string;
    totalMessages: number;
    lastMessageAt: string | null;
  };
}

export default function DiscordConnection({
  assistantId,
  isConnected = false,
  onConnect,
  onDisconnect,
  connectionInfo
}: DiscordConnectionProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    if (!assistantId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/integrations/discord/auth?assistantId=${assistantId}`);
      const data = await response.json();
      
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('Discord connection error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!assistantId) return;
    
    setIsLoading(true);
    try {
      await fetch(`/api/integrations/discord/disconnect?assistantId=${assistantId}`, {
        method: 'POST'
      });
      onDisconnect?.();
    } catch (error) {
      console.error('Discord disconnect error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="currentColor">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418Z"/>
          </svg>
        </div>
        <div>
          <h3 className="font-medium text-gray-900 dark:text-gray-100">Discord</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isConnected && connectionInfo
              ? `Connected to ${connectionInfo.guildName}`
              : 'Connect your AI to Discord servers'
            }
          </p>
          {isConnected && connectionInfo && (
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant="secondary" className="text-xs">
                {connectionInfo.totalMessages} messages
              </Badge>
              {connectionInfo.lastMessageAt && (
                <span className="text-xs text-gray-400">
                  Last active: {new Date(connectionInfo.lastMessageAt).toLocaleDateString()}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        {isConnected ? (
          <>
            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
              Connected ✓
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
              disabled={isLoading}
            >
              {isLoading ? 'Disconnecting...' : 'Disconnect'}
            </Button>
          </>
        ) : (
          <Button
            onClick={handleConnect}
            disabled={isLoading || !assistantId}
            size="sm"
          >
            {isLoading ? 'Connecting...' : 'Connect'}
          </Button>
        )}
      </div>
    </div>
  );
} 