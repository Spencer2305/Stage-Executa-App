'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Cloud, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  Download,
  Folder,
  Calendar,
  Settings
} from 'lucide-react';
import { toast } from 'sonner';

interface GoogleDriveIntegrationProps {
  assistantId: string;
  onSyncComplete?: () => void;
}

export default function GoogleDriveIntegration({ assistantId, onSyncComplete }: GoogleDriveIntegrationProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncStats, setSyncStats] = useState({
    totalFiles: 0,
    syncedFiles: 0,
    skippedFiles: 0,
    errorFiles: 0
  });

  const handleSync = async () => {
    try {
      setIsSyncing(true);
      setSyncProgress(0);
      
      const token = localStorage.getItem('executa-auth-token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`/api/integrations/googledrive/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          assistantId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start Google Drive sync');
      }

      const data = await response.json();

      // Set progress and stats from real API response
      setSyncProgress(100);
      setLastSync(new Date());
      setSyncStats({
        totalFiles: data.totalFiles || 0,
        syncedFiles: data.syncedFiles || 0,
        skippedFiles: data.skippedFiles || 0,
        errorFiles: data.errorFiles || 0
      });
      toast.success('Google Drive sync completed successfully!');
      if (onSyncComplete) onSyncComplete();
    } catch (error) {
      console.error('Google Drive sync error:', error);
      toast.error(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center">
            <Settings className="w-5 h-5 mr-2 text-blue-600" />
            Google Drive File Sync
          </h3>
          <p className="text-sm text-muted-foreground">
            Sync documents from your Google Drive account to train your assistant
          </p>
        </div>
        <Badge variant="outline" className="flex items-center">
          <CheckCircle className="w-3 h-3 mr-1" />
          Connected
        </Badge>
      </div>

      {/* Sync Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-base">
            <RefreshCw className="w-4 h-4 mr-2" />
            Sync Status
          </CardTitle>
          <CardDescription>
            Sync your Google Drive files to enhance your assistant's knowledge base
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isSyncing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Syncing files...</span>
                <span>{Math.round(syncProgress)}%</span>
              </div>
              <Progress value={syncProgress} className="h-2" />
            </div>
          )}

          {lastSync && !isSyncing && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="w-4 h-4 mr-2" />
              Last synced: {lastSync.toLocaleString()}
            </div>
          )}

          {/* Sync Stats */}
          {(syncStats.totalFiles > 0 || isSyncing) && (
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{syncStats.syncedFiles}</div>
                <div className="text-xs text-gray-600">Files Synced</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{syncStats.totalFiles}</div>
                <div className="text-xs text-gray-600">Total Files</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-900">{syncStats.skippedFiles}</div>
                <div className="text-xs text-blue-600">Skipped</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-900">{syncStats.errorFiles}</div>
                <div className="text-xs text-red-600">Errors</div>
              </div>
            </div>
          )}

          {/* Sync Button */}
          <Button 
            onClick={handleSync}
            disabled={isSyncing}
            className="w-full"
            size="lg"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Syncing Files...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Start Sync
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* File Types Supported */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <FileText className="w-4 h-4 mr-2" />
            Supported File Types
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
              PDF Documents
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
              Word Documents
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Text Files
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
              Markdown Files
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
              CSV Files
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-teal-500 rounded-full mr-2"></div>
              JSON Files
            </div>
          </div>
          <div className="mt-3 text-xs text-muted-foreground">
            Files are automatically filtered for supported formats and size limits (50MB max)
          </div>
        </CardContent>
      </Card>

      {/* Sync Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <Folder className="w-4 h-4 mr-2" />
            Sync Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Auto-sync new files</div>
              <div className="text-xs text-muted-foreground">Automatically sync new files added to Google Drive</div>
            </div>
            <Badge variant="secondary">Coming Soon</Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Selective folder sync</div>
              <div className="text-xs text-muted-foreground">Choose specific folders to sync</div>
            </div>
            <Badge variant="secondary">Coming Soon</Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">File type filters</div>
              <div className="text-xs text-muted-foreground">Customize which file types to include</div>
            </div>
            <Badge variant="secondary">Coming Soon</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 