'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { FileText, Settings, Mail, Cloud, Upload } from "lucide-react";
import KnowledgeBaseManager from "@/components/knowledge/KnowledgeBaseManager";
import GmailIntegration from "@/components/knowledge/GmailIntegration";
import EmailKnowledgeManager from "@/components/knowledge/EmailKnowledgeManager";
import DropboxIntegration from "@/components/integrations/DropboxIntegration";
import { Document as ModelDocument } from "@/types/model";

interface KnowledgeTabProps {
  assistantId: string;
  assistantFiles: ModelDocument[];
  onFilesUpdated: (files: ModelDocument[]) => void;
  isUploading: boolean;
  uploadProgress: number;
}

export default function KnowledgeTab({ 
  assistantId, 
  assistantFiles, 
  onFilesUpdated, 
  isUploading, 
  uploadProgress 
}: KnowledgeTabProps) {
  const searchParams = useSearchParams();
  const [integrationsStatus, setIntegrationsStatus] = useState({
    gmail: false,
    dropbox: false,
    slack: false
  });

  useEffect(() => {
    checkIntegrationsStatus();
  }, [assistantId]);

  const checkIntegrationsStatus = async () => {
    if (!assistantId) return;
    
    const token = localStorage.getItem('executa-auth-token');
    if (!token) return;

    try {
      const integrations = ['gmail', 'dropbox', 'slack'];
      const statusChecks = await Promise.all(
        integrations.map(async (integration) => {
          try {
            const response = await fetch(`/api/integrations/${integration}/status?assistantId=${assistantId}`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            const data = await response.json();
            return { [integration]: data.connected || false };
          } catch (error) {
            console.error(`Failed to check ${integration} status:`, error);
            return { [integration]: false };
          }
        })
      );

      const statusObj = statusChecks.reduce((acc, curr) => ({ ...acc, ...curr }), {
        gmail: false,
        dropbox: false,
        slack: false
      });
      setIntegrationsStatus(statusObj as typeof integrationsStatus);
    } catch (error) {
      console.error('Error checking integrations status:', error);
    }
  };

  return (
    <Card className="h-[calc(100vh-200px)] flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle>Knowledge Base</CardTitle>
        <CardDescription>
          Manage documents and data sources that train your assistant
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden">
        {/* Upload Progress */}
        {isUploading && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <Upload className="h-5 w-5 text-blue-600 animate-pulse" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900">Uploading...</p>
                <Progress value={uploadProgress} className="mt-2" />
              </div>
              <span className="text-sm text-blue-600">{uploadProgress}%</span>
            </div>
          </div>
        )}
        
        {/* Knowledge Sub-tabs */}
        <Tabs defaultValue={searchParams.get('subtab') || "documents"} className="h-full flex flex-col" onValueChange={(value) => {
          const url = new URL(window.location.href);
          url.searchParams.set('subtab', value);
          window.history.replaceState({}, '', url.toString());
        }}>
          <TabsList className={`grid w-full mb-4 ${
            integrationsStatus.gmail && integrationsStatus.dropbox 
              ? 'grid-cols-4' 
              : integrationsStatus.gmail || integrationsStatus.dropbox 
              ? 'grid-cols-3' 
              : 'grid-cols-2'
          }`}>
            <TabsTrigger value="documents" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span>Documents</span>
            </TabsTrigger>
            <TabsTrigger value="gmail-setup" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Gmail Setup</span>
            </TabsTrigger>
            {integrationsStatus.gmail && (
              <TabsTrigger value="gmail-emails" className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>Gmail Emails</span>
              </TabsTrigger>
            )}
            {integrationsStatus.dropbox && (
              <TabsTrigger value="dropbox-sync" className="flex items-center space-x-2">
                <Cloud className="h-4 w-4" />
                <span>Dropbox Sync</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* Documents Tab */}
          <TabsContent value="documents" className="flex-1 overflow-hidden">
            <KnowledgeBaseManager
              assistantId={assistantId}
              files={assistantFiles}
              onFilesUpdated={onFilesUpdated}
            />
          </TabsContent>

          {/* Gmail Setup Tab */}
          <TabsContent value="gmail-setup" className="flex-1 overflow-hidden">
            <GmailIntegration assistantId={assistantId} />
          </TabsContent>

          {/* Gmail Emails Tab */}
          {integrationsStatus.gmail && (
            <TabsContent value="gmail-emails" className="flex-1 overflow-hidden">
              <EmailKnowledgeManager assistantId={assistantId} />
            </TabsContent>
          )}

          {/* Dropbox Sync Tab */}
          {integrationsStatus.dropbox && (
            <TabsContent value="dropbox-sync" className="flex-1 overflow-hidden">
              <DropboxIntegration assistantId={assistantId} />
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
} 