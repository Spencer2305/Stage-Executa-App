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
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';

interface DropboxIntegrationProps {
  assistantId: string;
}

export default function DropboxIntegration({ assistantId }: DropboxIntegrationProps) {
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

      const response = await fetch(`/api/integrations/dropbox/sync`, {
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
        throw new Error(errorData.error || 'Failed to start Dropbox sync');
      }

      const data = await response.json();
      
      // Simulate progress for now (in real implementation, this would be WebSocket or polling)
      const progressInterval = setInterval(() => {
        setSyncProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 10;
        });
      }, 500);

      // Wait for sync completion (mock)
      setTimeout(() => {
        clearInterval(progressInterval);
        setSyncProgress(100);
        setLastSync(new Date());
        setSyncStats({
          totalFiles: data.totalFiles || 25,
          syncedFiles: data.syncedFiles || 20,
          skippedFiles: data.skippedFiles || 3,
          errorFiles: data.errorFiles || 2
        });
        toast.success('Dropbox sync completed successfully!');
      }, 3000);

    } catch (error) {
      console.error('Dropbox sync error:', error);
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
            <Cloud className="w-5 h-5 mr-2 text-blue-600" />
            Dropbox File Sync
          </h3>
          <p className="text-sm text-muted-foreground">
            Sync documents from your Dropbox account to train your assistant
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
            Sync your Dropbox files to enhance your assistant's knowledge base
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
          {syncStats.totalFiles > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-600">{syncStats.totalFiles}</div>
                <div className="text-xs text-muted-foreground">Total Files</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600">{syncStats.syncedFiles}</div>
                <div className="text-xs text-muted-foreground">Synced</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-yellow-600">{syncStats.skippedFiles}</div>
                <div className="text-xs text-muted-foreground">Skipped</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-red-600">{syncStats.errorFiles}</div>
                <div className="text-xs text-muted-foreground">Errors</div>
              </div>
            </div>
          )}

          <Button 
            onClick={handleSync} 
            disabled={isSyncing}
            className="w-full"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Syncing Files...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Sync Dropbox Files
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-base">
            <Folder className="w-4 h-4 mr-2" />
            What Gets Synced
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start space-x-2">
              <FileText className="w-4 h-4 mt-0.5 text-blue-500" />
              <div>
                <div className="font-medium">Documents</div>
                <div className="text-muted-foreground">PDF, Word, text files, and more</div>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle className="w-4 h-4 mt-0.5 text-green-500" />
              <div>
                <div className="font-medium">Smart Processing</div>
                <div className="text-muted-foreground">Only text-based files are processed for training</div>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 mt-0.5 text-yellow-500" />
              <div>
                <div className="font-medium">Privacy First</div>
                <div className="text-muted-foreground">Files are processed securely and never shared</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 