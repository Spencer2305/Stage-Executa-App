"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useModelStore } from "@/state/modelStore";
import { useUserStore } from "@/state/userStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Bot } from "lucide-react";
import { Document as ModelDocument } from "@/types/model";
import { 
  OverviewTab,
  ChatTab,
  KnowledgeTab,
  IntegrationsTab,
  EmbedTab,
  AnalyticsTab,
  SettingsTab
} from "@/components/assistants";

export default function AssistantViewPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const assistantId = params.id as string;
  const initialTab = searchParams.get('tab') || 'overview';
  
  const { models, fetchModels, refreshModel, updateModel } = useModelStore();
  const { user, isLoading: userLoading } = useUserStore();
  const assistant = models.find(m => m.id === assistantId);
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [assistantFiles, setAssistantFiles] = useState<ModelDocument[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Update URL when tab changes
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', newTab);
    window.history.replaceState({}, '', url.toString());
  };

  useEffect(() => {
    const loadAssistantData = async () => {
      try {
        setPageLoading(true);
        
        if (userLoading) return;
        
        if (!user) {
          router.push('/login');
          return;
        }
        
        if (models.length === 0) {
          await fetchModels();
        }
        
        const currentModels = useModelStore.getState().models;
        const foundAssistant = currentModels.find(m => m.id === assistantId);
        
        if (!foundAssistant && currentModels.length > 0) {
          try {
            await refreshModel(assistantId);
          } catch (error) {
            console.error('Failed to refresh assistant:', error);
            setNotFound(true);
          }
        } else if (currentModels.length === 0) {
          setNotFound(true);
        }
      } catch (error) {
        console.error('Error loading assistant data:', error);
        setNotFound(true);
      } finally {
        setPageLoading(false);
      }
    };

    loadAssistantData();
  }, [assistantId, fetchModels, refreshModel, user, userLoading, router]);

  useEffect(() => {
    if (assistant?.documents) {
      setAssistantFiles(assistant.documents);
    }
  }, [assistant?.documents]);

  const handleFilesUpdated = (updatedFiles: ModelDocument[]) => {
    setAssistantFiles(updatedFiles);
  };

  const handleAssistantUpdate = (updatedData: any) => {
    updateModel(assistantId, updatedData);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'training': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Live';
      case 'training': return 'Training';
      case 'draft': return 'Draft';
      case 'error': return 'Error';
      default: return 'Unknown';
    }
  };

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Bot className="h-12 w-12 animate-pulse text-primary mx-auto mb-4" />
          <p className="text-lg font-medium">Loading assistant...</p>
        </div>
      </div>
    );
  }

  if (notFound || !assistant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Assistant Not Found</h3>
            <p className="text-gray-600 mb-4">The assistant you're looking for doesn't exist or has been deleted.</p>
            <Link href="/dashboard">
              <Button>Go to Dashboard</Button>
                </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
            </Button>
              <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-gray-900 font-kanit tracking-wide">{assistant.name}</h1>
              <Badge className={`border ${getStatusColor(assistant.status)}`}>
                    {getStatusText(assistant.status)}
                  </Badge>
                </div>
            {assistant.description && (
              <p className="text-gray-600 mt-1">{assistant.description}</p>
            )}
              </div>
            </div>
          </div>

      {/* Tabbed Content */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="embed">Embed</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab assistant={assistant} />
        </TabsContent>

        <TabsContent value="chat">
          <ChatTab assistantId={assistantId} />
        </TabsContent>

        <TabsContent value="knowledge" className="h-[calc(100vh-200px)]">
          <KnowledgeTab
                    assistantId={assistantId}
            assistantFiles={assistantFiles}
                    onFilesUpdated={handleFilesUpdated}
            isUploading={isUploading}
            uploadProgress={uploadProgress}
                  />
                </TabsContent>

        <TabsContent value="integrations">
          <IntegrationsTab assistantId={assistantId} />
                </TabsContent>

        <TabsContent value="embed">
          <EmbedTab 
            assistant={assistant} 
            user={user}
          />
                    </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsTab assistantId={assistantId} />
                    </TabsContent>

        <TabsContent value="settings">
          <SettingsTab 
            assistant={assistant}
            onUpdate={handleAssistantUpdate}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
 