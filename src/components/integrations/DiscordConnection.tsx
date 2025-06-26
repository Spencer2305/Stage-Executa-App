'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, ExternalLink } from 'lucide-react';

interface DiscordConnectionProps {
  assistantId: string;
  onConnectionUpdate?: () => void;
}

export default function DiscordConnection({ assistantId, onConnectionUpdate }: DiscordConnectionProps) {
  const isConnected = false; // Will be implemented later

  const handleConnect = () => {
    // TODO: Implement Discord integration
    alert('Discord integration coming soon!');
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
          <MessageCircle className="w-5 h-5 text-indigo-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <h3 className="font-medium">Discord</h3>
            {isConnected && (
              <Badge variant="default" className="text-xs">
                Connected
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Add your AI assistant as a bot in Discord servers and channels
          </p>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button 
          onClick={handleConnect}
          size="sm"
          variant="outline"
          disabled
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Coming Soon
        </Button>
      </div>
    </div>
  );
} 