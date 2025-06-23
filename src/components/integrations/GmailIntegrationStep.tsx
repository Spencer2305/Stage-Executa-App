"use client";

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, CheckCircle, AlertCircle, Loader2, ExternalLink, Settings } from 'lucide-react';
import { toast } from 'sonner';

interface GmailIntegrationStepProps {
  onGmailStatusChange: (connected: boolean) => void;
}

interface GmailStatus {
  connected: boolean;
  email?: string;
  connectedAt?: string;
  loading?: boolean;
  totalEmails?: number;
  lastSync?: string;
}

export default function GmailIntegrationStep({ onGmailStatusChange }: GmailIntegrationStepProps) {
  const [gmailStatus, setGmailStatus] = useState<GmailStatus>({ 
    connected: false, 
    loading: true 
  });
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    checkGmailStatus();
  }, []);

  const checkGmailStatus = async () => {
    try {
      const token = localStorage.getItem('executa-auth-token');
      const response = await fetch('/api/integrations/gmail/status', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const status = {
          connected: data.connected,
          email: data.email,
          connectedAt: data.connectedAt,
          loading: false,
          totalEmails: data.totalEmails || 0,
          lastSync: data.lastSync
        };
        setGmailStatus(status);
        onGmailStatusChange(data.connected);
      } else {
        setGmailStatus({ connected: false, loading: false });
        onGmailStatusChange(false);
      }
    } catch (error) {
      console.error('Failed to check Gmail status:', error);
      setGmailStatus({ connected: false, loading: false });
      onGmailStatusChange(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const token = localStorage.getItem('executa-auth-token');
      const response = await fetch('/api/integrations/gmail/auth', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.authUrl) {
          // Redirect to Google OAuth
          window.location.href = data.authUrl;
        }
      } else {
        throw new Error('Failed to initiate Gmail connection');
      }
    } catch (error) {
      console.error('Gmail connection error:', error);
      toast.error('Failed to connect Gmail');
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const token = localStorage.getItem('executa-auth-token');
      const response = await fetch('/api/integrations/gmail/status', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'disconnect' })
      });

      if (response.ok) {
        setGmailStatus({ connected: false, loading: false });
        onGmailStatusChange(false);
        toast.success('Gmail disconnected successfully');
      } else {
        throw new Error('Failed to disconnect Gmail');
      }
    } catch (error) {
      console.error('Disconnect error:', error);
      toast.error('Failed to disconnect Gmail');
    }
  };

  if (gmailStatus.loading) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Integrations</Label>
          <p className="text-sm text-muted-foreground">
            Connect external data sources to enhance your assistant's knowledge.
          </p>
        </div>
        
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Checking Gmail connection...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Integrations</Label>
        <p className="text-sm text-muted-foreground">
          Connect external data sources to enhance your assistant's knowledge.
        </p>
      </div>
      
      <div className="space-y-3">
        {/* Gmail Integration Card */}
        <div className={`border rounded-lg p-4 transition-all ${
          gmailStatus.connected ? 'border-green-200 bg-green-50' : 'border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Mail className={`h-6 w-6 ${
                  gmailStatus.connected ? 'text-green-600' : 'text-gray-400'
                }`} />
                {gmailStatus.connected && (
                  <CheckCircle className="absolute -bottom-1 -right-1 h-3 w-3 text-green-600 bg-white rounded-full" />
                )}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <p className="font-medium text-sm">Gmail Integration</p>
                  {gmailStatus.connected && (
                    <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                      Connected
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {gmailStatus.connected 
                    ? `Connected as ${gmailStatus.email} • ${gmailStatus.totalEmails} emails synced`
                    : 'Import emails to enhance knowledge base'
                  }
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {gmailStatus.connected ? (
                <>
                  <Button variant="outline" size="sm" onClick={handleDisconnect}>
                    Disconnect
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={handleConnect}
                  disabled={connecting}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {connecting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Connect Gmail
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
          
          {gmailStatus.connected && gmailStatus.lastSync && (
            <div className="mt-3 pt-3 border-t border-green-200">
              <p className="text-xs text-green-600">
                Last synced: {new Date(gmailStatus.lastSync).toLocaleString()}
              </p>
            </div>
          )}
        </div>

        {/* Help Text */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">Optional Integration</p>
              <p>
                Gmail integration is optional. You can connect your Gmail to automatically import relevant emails 
                into your assistant's knowledge base. This helps your assistant understand customer inquiries 
                and provide better responses.
              </p>
            </div>
          </div>
        </div>

        {/* Coming Soon - Other Integrations */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="flex items-center justify-between p-3 border rounded-lg opacity-50">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 bg-purple-500 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">S</span>
              </div>
              <div>
                <p className="font-medium text-xs">Slack</p>
                <p className="text-xs text-muted-foreground">Import conversations</p>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">Coming Soon</Badge>
          </div>

          <div className="flex items-center justify-between p-3 border rounded-lg opacity-50">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 bg-blue-500 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">N</span>
              </div>
              <div>
                <p className="font-medium text-xs">Notion</p>
                <p className="text-xs text-muted-foreground">Sync knowledge pages</p>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">Coming Soon</Badge>
          </div>
        </div>
      </div>
    </div>
  );
} 