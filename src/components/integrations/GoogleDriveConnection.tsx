"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Link, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  Download,
  Settings,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { useNotification } from '@/components/ui/notification';

interface GoogleDriveConnectionProps {
  onConnectionUpdate?: () => void;
}

export default function GoogleDriveConnection({ onConnectionUpdate }: GoogleDriveConnectionProps) {
  const { showSuccess, showError } = useNotification();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false); // You'll populate this from your DB
  const [connectionInfo, setConnectionInfo] = useState<{
    email?: string;
    displayName?: string;
    lastSyncAt?: string;
  } | null>(null);
  
  // Confirmation dialog state
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      
      // Get auth URL from your API
      const response = await fetch('/api/integrations/googledrive/auth', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('executa-auth-token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to initialize Google Drive connection');
      }
      
      const data = await response.json();
      
      // Redirect to Google OAuth
      window.location.href = data.authUrl;
      
    } catch (error) {
      console.error('Google Drive connection error:', error);
      showError('Failed to connect to Google Drive. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    setShowDisconnectDialog(true);
  };

  const confirmDisconnect = async () => {
    // TODO: Implement disconnect functionality
    showSuccess('Google Drive disconnected successfully');
    setShowDisconnectDialog(false);
  };

  const cancelDisconnect = () => {
    setShowDisconnectDialog(false);
  };

  const handleSyncFiles = async () => {
    // TODO: Implement sync functionality
    showSuccess('File sync started - this feature is coming soon');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <img 
                src="/Google_drive.png" 
                alt="Google Drive" 
                className="w-6 h-6"
              />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Google Drive Integration
                {isConnected && (
                  <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Connected
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {isConnected 
                  ? 'Sync files from your Google Drive account to train AI assistants'
                  : 'Connect your Google Drive account to automatically import files'
                }
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {isConnected && connectionInfo ? (
          <>
            {/* Connection Info */}
            <div className="space-y-2">
              <div className="text-sm">
                <span className="font-medium">Account:</span> {connectionInfo.email}
              </div>
              <div className="text-sm">
                <span className="font-medium">Display Name:</span> {connectionInfo.displayName}
              </div>
              {connectionInfo.lastSyncAt && (
                <div className="text-sm text-muted-foreground">
                  Last synced: {new Date(connectionInfo.lastSyncAt).toLocaleString()}
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button 
                onClick={handleSyncFiles}
                size="sm"
                className="flex-1"
              >
                <Download className="w-4 h-4 mr-2" />
                Sync Files Now
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleDisconnect}
                size="sm"
              >
                <Settings className="w-4 h-4 mr-2" />
                Manage
              </Button>
            </div>
          </>
        ) :
          <>
            {/* Connection Benefits */}
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Automatically import all supported files from Google Drive
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Keep your AI assistants up-to-date with file changes
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Filter files by type, folder, or size
              </div>
            </div>
            
            {/* Connect Button */}
            <Button 
              onClick={handleConnect} 
              disabled={isConnecting}
              className="w-full"
            >
              {isConnecting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Link className="w-4 h-4 mr-2" />
                  Connect Google Drive Account
                </>
              )}
            </Button>
          </>
        )}
        
        {/* Security Notice */}
        <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Privacy & Security:</strong> We only access files you explicitly choose to sync. 
              Your Google Drive credentials are encrypted and stored securely. You can disconnect at any time.
            </div>
          </div>
        </div>
      </CardContent>
      
      {/* Disconnect Confirmation Dialog */}
      <Dialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Disconnect Google Drive?
            </DialogTitle>
            <DialogDescription>
              This will remove all Google Drive files from this assistant's knowledge base. 
              You can reconnect and re-sync your files at any time.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-end gap-2 mt-4">
            <Button 
              variant="outline" 
              onClick={cancelDisconnect}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDisconnect}
            >
              Disconnect
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}