"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useModelStore } from "@/state/modelStore";
import { useUserStore } from "@/state/userStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import KnowledgeBaseManager from "@/components/knowledge/KnowledgeBaseManager";
import { Document as ModelDocument } from "@/types/model";
import { 
  ArrowLeft, 
  Bot, 
  MessageSquare, 
  FileText, 
  Users, 
  Activity,
  Send,
  Settings,
  Share,
  Copy,
  ExternalLink,
  BarChart3,
  Edit,
  Trash2,
  Download,
  Globe,
  Slack,
  Zap,
  Upload,
  Play,
  Pause,
  CheckCircle,
  Clock,
  TrendingUp,
  Eye,
  Mail,
  Database,
  Rocket,
  Monitor,
  Code,
  Palette,
  Smartphone,
  RotateCcw,
  ImageIcon,
  User
} from "lucide-react";

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date | string;
}

export default function AssistantViewPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const assistantId = params.id as string;
  const initialTab = searchParams.get('tab') || 'overview';
  
  const { models, deleteModel, fetchModels, refreshModel, isLoading } = useModelStore();
  const { user, isLoading: userLoading } = useUserStore();
  const assistant = models.find(m => m.id === assistantId);
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [message, setMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      content: "Hello! I'm ready to help you with any questions about the knowledge base. What would you like to know?",
      sender: "bot",
      timestamp: new Date()
    }
  ]);
  const [assistantFiles, setAssistantFiles] = useState<ModelDocument[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Embed styling state
  const [embedStyle, setEmbedStyle] = useState({
    bubbleColor: assistant?.embedBubbleColor || "#3B82F6",
    buttonShape: assistant?.embedButtonShape || "rounded",
    fontStyle: assistant?.embedFontStyle || "system",
    position: assistant?.embedPosition || "bottom-right",
    // Full chat UI styling
    chatBackgroundColor: assistant?.chatBackgroundColor || "#FFFFFF",
    userMessageBubbleColor: assistant?.userMessageBubbleColor || "#3B82F6",
    assistantMessageBubbleColor: assistant?.assistantMessageBubbleColor || "#F3F4F6",
    assistantFontStyle: assistant?.assistantFontStyle || "sans",
    messageBubbleRadius: assistant?.messageBubbleRadius || 12,
    showAssistantAvatar: assistant?.showAssistantAvatar !== false,
    assistantAvatarUrl: assistant?.assistantAvatarUrl || "",
    showChatHeader: assistant?.showChatHeader !== false,
    chatHeaderTitle: assistant?.chatHeaderTitle || "AI Assistant",
    welcomeMessage: assistant?.welcomeMessage || ""
  });
  const [embedCodeType, setEmbedCodeType] = useState<'styled' | 'raw'>('styled');

  useEffect(() => {
    const loadAssistantData = async () => {
      try {
        setPageLoading(true);
        
        if (userLoading) {
          console.log('⏳ Waiting for user authentication...');
          return;
        }
        
        if (!user) {
          console.log('❌ User not authenticated, redirecting to login...');
          router.push('/login');
          return;
        }
        
        console.log('✅ User authenticated, proceeding with data fetch...');
        
        if (models.length === 0) {
          console.log('📋 No models in store, fetching all models...');
          await fetchModels();
        }
        
        const currentModels = useModelStore.getState().models;
        console.log('📋 After fetchModels, current models length:', currentModels.length);
        
        const foundAssistant = currentModels.find(m => m.id === assistantId);
        console.log(`🔍 Looking for assistant ${assistantId} in ${currentModels.length} models`);
        
        if (!foundAssistant && currentModels.length > 0) {
          console.log(`🔄 Assistant ${assistantId} not found in models, trying to refresh...`);
          try {
            await refreshModel(assistantId);
          } catch (error) {
            console.error('Failed to refresh assistant:', error);
            setNotFound(true);
          }
        } else if (currentModels.length === 0) {
          console.log('❌ No models found after fetch');
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

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: message,
      sender: "user",
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setMessage("");

    // Simulate bot response
    setTimeout(() => {
      const botResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: "Thank you for your message! This is a demo response. In a real implementation, this would be connected to your AI assistant.",
        sender: "bot" as const,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, botResponse]);
    }, 1000);
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return 'Invalid Date';
    
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(dateObj);
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

  // Action handlers
  const handleCopyEmbedCode = async () => {
    const embedCode = `<script src="https://cdn.executa.ai/widget.js" data-assistant-id="${assistantId}"></script>`;
    try {
      await navigator.clipboard.writeText(embedCode);
      toast.success("Embed code copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy embed code");
    }
  };

  const handleToggleStatus = async () => {
    // Mock toggle between active/draft
    toast.success(assistant?.status === 'active' ? "Assistant paused" : "Assistant activated");
  };

  const handleShareAssistant = async () => {
    const shareUrl = `${window.location.origin}/chat/${assistantId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Share link copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy share link");
    }
  };

  const handleFilesUpdated = (updatedFiles: ModelDocument[]) => {
    setAssistantFiles(updatedFiles);
  };

  const simulateUpload = (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          toast.success(`${file.name} uploaded successfully!`);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  // Functions for embed functionality
  const saveEmbedStyles = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      const response = await fetch(`/api/models/${assistantId}/embed-styles`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(embedStyle),
      });

      if (!response.ok) {
        throw new Error('Failed to save embed styles');
      }

      const data = await response.json();
      toast.success("Embed styles saved successfully!");
      
      // Update the assistant in the store if needed
      if (data.assistant) {
        // TODO: Update the modelStore with the new assistant data
      }
    } catch (error) {
      console.error("Error saving embed styles:", error);
      toast.error("Failed to save embed styles");
    }
  };

  const resetToDefaults = () => {
    setEmbedStyle({
      bubbleColor: "#3B82F6",
      buttonShape: "rounded",
      fontStyle: "system",
      position: "bottom-right",
      // Full chat UI defaults
      chatBackgroundColor: "#FFFFFF",
      userMessageBubbleColor: "#3B82F6",
      assistantMessageBubbleColor: "#F3F4F6",
      assistantFontStyle: "sans",
      messageBubbleRadius: 12,
      showAssistantAvatar: true,
      assistantAvatarUrl: "",
      showChatHeader: true,
      chatHeaderTitle: "AI Assistant",
      welcomeMessage: ""
    });
    toast.success("Reset to default styling");
  };

  const generateStyledEmbedCode = () => {
    return `<!-- Executa AI Assistant Widget with Full Styling -->
<div id="executa-chat-widget"></div>
<script>
  (function() {
    var widget = document.createElement('div');
    widget.id = 'executa-chat-container';
    widget.style.cssText = \`
      position: fixed;
      ${embedStyle.position}: 20px;
      ${embedStyle.position.includes('bottom') ? 'bottom' : 'top'}: 20px;
      z-index: 9999;
      font-family: ${embedStyle.fontStyle === 'system' ? '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui' : 
        embedStyle.fontStyle === 'sans' ? '"Inter", sans-serif' :
        embedStyle.fontStyle === 'serif' ? 'Georgia, serif' : 
        '"JetBrains Mono", monospace'};
    \`;
    
    var button = document.createElement('button');
    button.style.cssText = \`
      width: 60px;
      height: 60px;
      border-radius: ${embedStyle.buttonShape === 'square' ? '8px' : 
        embedStyle.buttonShape === 'rounded' ? '16px' : '50%'};
      background-color: ${embedStyle.bubbleColor};
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
    \`;
    button.innerHTML = '<svg width="24" height="24" fill="white" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>';
    
    // Chat interface styles
    var chatStyles = \`
      .executa-chat-interface {
        display: none;
        position: fixed;
        ${embedStyle.position}: 20px;
        ${embedStyle.position.includes('bottom') ? 'bottom' : 'top'}: 90px;
        width: 350px;
        height: 500px;
        background-color: ${embedStyle.chatBackgroundColor};
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.12);
        font-family: ${embedStyle.assistantFontStyle === 'sans' ? '"Inter", sans-serif' :
          embedStyle.assistantFontStyle === 'serif' ? 'Georgia, serif' : 
          '"JetBrains Mono", monospace'};
        z-index: 10000;
      }
      .executa-chat-header {
        display: ${embedStyle.showChatHeader ? 'flex' : 'none'};
        padding: 16px;
        border-bottom: 1px solid #E5E7EB;
        align-items: center;
        background: linear-gradient(90deg, ${embedStyle.bubbleColor} 0%, ${embedStyle.userMessageBubbleColor} 100%);
        color: white;
        border-radius: 12px 12px 0 0;
      }
      .executa-user-message {
        background-color: ${embedStyle.userMessageBubbleColor};
        color: white;
        border-radius: ${embedStyle.messageBubbleRadius}px;
        padding: 8px 12px;
        margin: 8px;
        margin-left: auto;
        max-width: 80%;
      }
      .executa-assistant-message {
        background-color: ${embedStyle.assistantMessageBubbleColor};
        color: #374151;
        border-radius: ${embedStyle.messageBubbleRadius}px;
        padding: 8px 12px;
        margin: 8px;
        max-width: 80%;
        display: flex;
        align-items: flex-start;
        gap: 8px;
      }
      .executa-avatar {
        display: ${embedStyle.showAssistantAvatar ? 'block' : 'none'};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: ${embedStyle.bubbleColor};
      }
    \`;
    
    var styleSheet = document.createElement('style');
    styleSheet.textContent = chatStyles;
    document.head.appendChild(styleSheet);
    
    widget.appendChild(button);
    document.body.appendChild(widget);
    
    // Chat functionality
    button.addEventListener('click', function() {
      // Toggle chat interface
      var existingChat = document.querySelector('.executa-chat-interface');
      if (existingChat) {
        existingChat.style.display = existingChat.style.display === 'none' ? 'block' : 'none';
      } else {
        // Create chat interface
        var chatInterface = document.createElement('div');
        chatInterface.className = 'executa-chat-interface';
        chatInterface.style.display = 'block';
        
        var headerHTML = ${embedStyle.showChatHeader ? 
          `'<div class="executa-chat-header"><h3 style="margin: 0; font-size: 16px;">' + '${embedStyle.chatHeaderTitle}' + '</h3></div>'` : 
          "''"};
        
        var welcomeHTML = ${embedStyle.welcomeMessage ? 
          `'<div class="executa-assistant-message">' + ${embedStyle.showAssistantAvatar ? "'<div class=\"executa-avatar\"></div>'" : "''"} + '<div>${embedStyle.welcomeMessage}</div></div>'` : 
          "''"};
        
        chatInterface.innerHTML = headerHTML + 
          '<div style="flex: 1; overflow-y: auto; padding: 16px;">' + welcomeHTML + '</div>' +
          '<div style="padding: 16px; border-top: 1px solid #E5E7EB;">' +
          '<input type="text" placeholder="Type your message..." style="width: 100%; padding: 8px; border: 1px solid #D1D5DB; border-radius: 6px;">' +
          '</div>';
        
        document.body.appendChild(chatInterface);
      }
    });
  })();
</script>`;
  };

  const generateRawEmbedCode = () => {
    return `<!-- Executa AI Assistant Widget (Raw) -->
<div id="executa-chat" data-assistant-id="${assistant?.id}"></div>
<script src="https://cdn.executa.ai/widget.js"></script>
<script>
  ExecutaChat.init({
    assistantId: '${assistant?.id}',
    containerId: 'executa-chat'
  });
</script>`;
  };

  const copyEmbedCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Embed code copied to clipboard!");
    } catch (error) {
      console.error("Error copying embed code:", error);
      toast.error("Failed to copy embed code");
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
    <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
            </Button>
              <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-gray-900">{assistant.name}</h1>
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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge</TabsTrigger>
          <TabsTrigger value="embed">Embed</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Status Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Status</CardTitle>
              </CardHeader>
              <CardContent>
              <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${assistant.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <span className="font-medium">{getStatusText(assistant.status)}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {assistant.status === 'active' ? 'Responding to queries' : 'Not accepting queries'}
                </p>
            </CardContent>
          </Card>
          
            {/* Conversations Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Conversations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{assistant.totalSessions || 0}</div>
                <p className="text-xs text-gray-500">Total sessions</p>
            </CardContent>
          </Card>
          
            {/* Knowledge Sources */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Knowledge Sources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{assistant.documents?.length || 0}</div>
                <p className="text-xs text-gray-500">Documents uploaded</p>
              </CardContent>
            </Card>

            {/* Last Updated */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Last Updated</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm font-medium">{formatDate(assistant.updatedAt || assistant.createdAt)}</div>
                <p className="text-xs text-gray-500">Knowledge base</p>
              </CardContent>
            </Card>

            {/* Deployment Status */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Deployment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {assistant.status === 'active' ? (
              <div className="flex items-center space-x-2">
                      <Globe className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Website Embed</span>
                </div>
                  ) : (
                    <span className="text-sm text-gray-500">Not deployed</span>
                  )}
              </div>
            </CardContent>
          </Card>
          
            {/* Response Time */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Avg Response Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1.2s</div>
                <p className="text-xs text-green-600">⬇ 15% faster this week</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Knowledge base updated</p>
                    <p className="text-xs text-gray-500">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">New conversation started</p>
                    <p className="text-xs text-gray-500">5 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Assistant deployed</p>
                    <p className="text-xs text-gray-500">1 day ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chat Tab */}
        <TabsContent value="chat" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Your Assistant</CardTitle>
                    <CardDescription>
                Try out conversations to see how your assistant responds
                    </CardDescription>
              </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <ScrollArea className="h-96 border rounded-lg p-4">
                  <div className="space-y-4">
                    {chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          msg.sender === 'user' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {formatDate(msg.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Type your message..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1"
                    />
                  <Button onClick={handleSendMessage} disabled={!message.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
        </TabsContent>

        {/* Knowledge Tab */}
        <TabsContent value="knowledge" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Knowledge Base</CardTitle>
              <CardDescription>
                Manage documents and data sources that train your assistant
              </CardDescription>
            </CardHeader>
            <CardContent>
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
              
                             <KnowledgeBaseManager
                 assistantId={assistantId}
                 files={assistantFiles}
                 onFilesUpdated={handleFilesUpdated}
               />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Embed Tab */}
        <TabsContent value="embed" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Chat UI Styler Section */}
          <div className="space-y-6">
              <Card>
              <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Palette className="h-5 w-5" />
                    <span>Chat UI Styler – Customise the Full Experience</span>
                  </CardTitle>
                  <CardDescription>
                    Visual controls for the complete AI chat interface
                  </CardDescription>
              </CardHeader>
                <CardContent className="space-y-6">
                  {/* Widget Button Settings */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-gray-700 border-b pb-2">Widget Button</h4>
                    
                    {/* Chat Bubble Color */}
                    <div className="space-y-2">
                      <Label>Chat Bubble Color</Label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="color"
                          value={embedStyle.bubbleColor}
                          onChange={(e) => setEmbedStyle(prev => ({ ...prev, bubbleColor: e.target.value }))}
                          className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                        />
                        <Input
                          value={embedStyle.bubbleColor}
                          onChange={(e) => setEmbedStyle(prev => ({ ...prev, bubbleColor: e.target.value }))}
                          placeholder="#3B82F6"
                          className="flex-1"
                        />
                      </div>
                </div>
                
                    {/* Button Shape */}
                    <div className="space-y-2">
                      <Label>Button Shape</Label>
                      <select
                        value={embedStyle.buttonShape}
                        onChange={(e) => setEmbedStyle(prev => ({ ...prev, buttonShape: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="square">Square</option>
                        <option value="rounded">Rounded</option>
                        <option value="pill">Pill</option>
                      </select>
                    </div>

                    {/* Position */}
                    <div className="space-y-2">
                      <Label>Position</Label>
                      <select
                        value={embedStyle.position}
                        onChange={(e) => setEmbedStyle(prev => ({ ...prev, position: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="bottom-left">Bottom Left</option>
                        <option value="bottom-right">Bottom Right</option>
                      </select>
                    </div>
                  </div>

                  {/* Chat Interface Settings */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-gray-700 border-b pb-2">Chat Interface</h4>

                    {/* Chat Background Color */}
                    <div className="space-y-2">
                      <Label>Chat Background Color</Label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="color"
                          value={embedStyle.chatBackgroundColor}
                          onChange={(e) => setEmbedStyle(prev => ({ ...prev, chatBackgroundColor: e.target.value }))}
                          className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                        />
                        <Input
                          value={embedStyle.chatBackgroundColor}
                          onChange={(e) => setEmbedStyle(prev => ({ ...prev, chatBackgroundColor: e.target.value }))}
                          placeholder="#FFFFFF"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    {/* User Message Bubble Color */}
                    <div className="space-y-2">
                      <Label>User Message Bubble Color</Label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="color"
                          value={embedStyle.userMessageBubbleColor}
                          onChange={(e) => setEmbedStyle(prev => ({ ...prev, userMessageBubbleColor: e.target.value }))}
                          className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                        />
                        <Input
                          value={embedStyle.userMessageBubbleColor}
                          onChange={(e) => setEmbedStyle(prev => ({ ...prev, userMessageBubbleColor: e.target.value }))}
                          placeholder="#3B82F6"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    {/* Assistant Message Bubble Color */}
                    <div className="space-y-2">
                      <Label>Assistant Message Bubble Color</Label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="color"
                          value={embedStyle.assistantMessageBubbleColor}
                          onChange={(e) => setEmbedStyle(prev => ({ ...prev, assistantMessageBubbleColor: e.target.value }))}
                          className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                        />
                        <Input
                          value={embedStyle.assistantMessageBubbleColor}
                          onChange={(e) => setEmbedStyle(prev => ({ ...prev, assistantMessageBubbleColor: e.target.value }))}
                          placeholder="#F3F4F6"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    {/* Assistant Font Style */}
                    <div className="space-y-2">
                      <Label>Assistant Font Style</Label>
                      <select
                        value={embedStyle.assistantFontStyle}
                        onChange={(e) => setEmbedStyle(prev => ({ ...prev, assistantFontStyle: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="sans">Sans Serif</option>
                        <option value="serif">Serif</option>
                        <option value="monospace">Monospace</option>
                      </select>
                    </div>

                    {/* Message Bubble Border Radius */}
                    <div className="space-y-2">
                      <Label>Message Bubble Border Radius: {embedStyle.messageBubbleRadius}px</Label>
                      <input
                        type="range"
                        min="0"
                        max="24"
                        value={embedStyle.messageBubbleRadius}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmbedStyle(prev => ({ ...prev, messageBubbleRadius: parseInt(e.target.value) }))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>0px</span>
                        <span>24px</span>
                      </div>
                    </div>

                    {/* Assistant Avatar Toggle */}
                    <div className="flex items-center justify-between">
                      <Label>Show Assistant Avatar</Label>
                      <button
                        onClick={() => setEmbedStyle(prev => ({ ...prev, showAssistantAvatar: !prev.showAssistantAvatar }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          embedStyle.showAssistantAvatar ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            embedStyle.showAssistantAvatar ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Avatar Upload */}
                    {embedStyle.showAssistantAvatar && (
                      <div className="space-y-2">
                        <Label>Assistant Avatar</Label>
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                            {embedStyle.assistantAvatarUrl ? (
                              <img 
                                src={embedStyle.assistantAvatarUrl} 
                                alt="Avatar" 
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <ImageIcon className="h-5 w-5 text-gray-400" />
                            )}
                          </div>
                          <Button variant="outline" size="sm">
                            Upload Avatar
                          </Button>
                        </div>
                  </div>
                )}
                
                    {/* Chat Header Toggle */}
                    <div className="flex items-center justify-between">
                      <Label>Enable Chat Header</Label>
                      <button
                        onClick={() => setEmbedStyle(prev => ({ ...prev, showChatHeader: !prev.showChatHeader }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          embedStyle.showChatHeader ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            embedStyle.showChatHeader ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                </div>
                
                    {/* Header Title */}
                    {embedStyle.showChatHeader && (
                      <div className="space-y-2">
                        <Label>Header Title Text</Label>
                        <Input
                          value={embedStyle.chatHeaderTitle}
                          onChange={(e) => setEmbedStyle(prev => ({ ...prev, chatHeaderTitle: e.target.value }))}
                          placeholder="AI Assistant"
                          className="w-full"
                        />
                      </div>
                    )}

                    {/* Welcome Message */}
                    <div className="space-y-2">
                      <Label>Welcome Message Override</Label>
                      <Textarea
                        value={embedStyle.welcomeMessage}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEmbedStyle(prev => ({ ...prev, welcomeMessage: e.target.value }))}
                        placeholder="Enter a custom welcome message (optional)"
                        className="w-full min-h-[80px]"
                      />
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <Button onClick={saveEmbedStyles} className="flex-1">
                      Save Style Settings
                    </Button>
                    <Button onClick={resetToDefaults} variant="outline" className="flex items-center space-x-2">
                      <RotateCcw className="h-4 w-4" />
                      <span>Reset</span>
                    </Button>
                </div>
              </CardContent>
            </Card>
            </div>

            {/* Live Preview Section */}
            <div className="space-y-6">
              <Card>
              <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Smartphone className="h-5 w-5" />
                    <span>Live Preview</span>
                  </CardTitle>
                  <CardDescription>
                    Full chat interface preview with your styling
                  </CardDescription>
              </CardHeader>
                <CardContent>
                  <div className="relative bg-gray-100 rounded-lg h-96 overflow-hidden border">
                    {/* Mock website background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-gray-100 p-4">
                      <div className="text-xs text-gray-500 mb-2">Your Website</div>
                      <div className="space-y-2">
                        <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                        <div className="h-3 bg-gray-300 rounded w-2/3"></div>
                      </div>
                    </div>
                    
                    {/* Widget Button Preview */}
                    <div 
                      className={`absolute ${
                        embedStyle.position === 'bottom-left' ? 'bottom-4 left-4' : 'bottom-4 right-4'
                      } z-10`}
                    >
                      <button
                        className={`w-14 h-14 flex items-center justify-center border-none cursor-pointer shadow-lg transition-all duration-300 hover:scale-105`}
                        style={{
                          backgroundColor: embedStyle.bubbleColor,
                          borderRadius: embedStyle.buttonShape === 'square' ? '8px' : 
                            embedStyle.buttonShape === 'rounded' ? '16px' : '50%'
                        }}
                      >
                        <MessageSquare className="h-6 w-6 text-white" />
                      </button>
                    </div>
                  </div>

                  {/* Separate Chat Interface Preview */}
                  <div className="mt-4">
                    <div className="text-sm font-medium text-gray-700 mb-3">Chat Interface Preview:</div>
                    <div 
                      className="w-full max-w-sm mx-auto rounded-xl shadow-lg border overflow-hidden"
                      style={{ 
                        backgroundColor: embedStyle.chatBackgroundColor,
                        fontFamily: embedStyle.assistantFontStyle === 'sans' ? '"Inter", sans-serif' :
                          embedStyle.assistantFontStyle === 'serif' ? 'Georgia, serif' : 
                          '"JetBrains Mono", monospace'
                      }}
                    >
                      {/* Chat Header */}
                      {embedStyle.showChatHeader && (
                        <div 
                          className="p-4 text-white flex items-center"
                          style={{ 
                            background: `linear-gradient(90deg, ${embedStyle.bubbleColor} 0%, ${embedStyle.userMessageBubbleColor} 100%)` 
                          }}
                        >
                          <h3 className="text-base font-medium">{embedStyle.chatHeaderTitle}</h3>
                        </div>
                      )}

                      {/* Chat Messages */}
                      <div className="p-4 space-y-3 min-h-[300px] max-h-[300px] overflow-y-auto">
                        {/* Welcome Message */}
                        {embedStyle.welcomeMessage && (
                          <div className="flex items-start space-x-2">
                            {embedStyle.showAssistantAvatar && (
                              <div 
                                className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center"
                                style={{ backgroundColor: embedStyle.bubbleColor }}
                              >
                                {embedStyle.assistantAvatarUrl ? (
                                  <img 
                                    src={embedStyle.assistantAvatarUrl} 
                                    alt="Avatar" 
                                    className="w-full h-full rounded-full object-cover"
                                  />
                                ) : (
                                  <User className="w-4 h-4 text-white" />
                                )}
                              </div>
                            )}
                            <div 
                              className="max-w-[80%] px-3 py-2 text-sm text-gray-800"
                              style={{ 
                                backgroundColor: embedStyle.assistantMessageBubbleColor,
                                borderRadius: `${embedStyle.messageBubbleRadius}px`
                              }}
                            >
                              {embedStyle.welcomeMessage}
                            </div>
                          </div>
                        )}

                        {/* Sample User Message */}
                        <div className="flex justify-end">
                          <div 
                            className="max-w-[80%] px-3 py-2 text-sm text-white"
                            style={{ 
                              backgroundColor: embedStyle.userMessageBubbleColor,
                              borderRadius: `${embedStyle.messageBubbleRadius}px`
                            }}
                          >
                            Hello! How can you help me?
                          </div>
                        </div>

                        {/* Sample Assistant Response */}
                        <div className="flex items-start space-x-2">
                          {embedStyle.showAssistantAvatar && (
                            <div 
                              className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center"
                              style={{ backgroundColor: embedStyle.bubbleColor }}
                            >
                              {embedStyle.assistantAvatarUrl ? (
                                <img 
                                  src={embedStyle.assistantAvatarUrl} 
                                  alt="Avatar" 
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                <User className="w-4 h-4 text-white" />
                              )}
                            </div>
                          )}
                          <div 
                            className="max-w-[80%] px-3 py-2 text-sm text-gray-800"
                            style={{ 
                              backgroundColor: embedStyle.assistantMessageBubbleColor,
                              borderRadius: `${embedStyle.messageBubbleRadius}px`
                            }}
                          >
                            I'm here to help! Feel free to ask me anything about our services.
                          </div>
                        </div>

                        {/* Another sample exchange */}
                        <div className="flex justify-end">
                          <div 
                            className="max-w-[80%] px-3 py-2 text-sm text-white"
                            style={{ 
                              backgroundColor: embedStyle.userMessageBubbleColor,
                              borderRadius: `${embedStyle.messageBubbleRadius}px`
                            }}
                          >
                            What are your business hours?
                          </div>
                        </div>

                        <div className="flex items-start space-x-2">
                          {embedStyle.showAssistantAvatar && (
                            <div 
                              className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center"
                              style={{ backgroundColor: embedStyle.bubbleColor }}
                            >
                              {embedStyle.assistantAvatarUrl ? (
                                <img 
                                  src={embedStyle.assistantAvatarUrl} 
                                  alt="Avatar" 
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                <User className="w-4 h-4 text-white" />
                              )}
                            </div>
                          )}
                          <div 
                            className="max-w-[80%] px-3 py-2 text-sm text-gray-800"
                            style={{ 
                              backgroundColor: embedStyle.assistantMessageBubbleColor,
                              borderRadius: `${embedStyle.messageBubbleRadius}px`
                            }}
                          >
                            We're open Monday to Friday, 9 AM to 6 PM EST. Feel free to reach out anytime!
                          </div>
                        </div>
                      </div>

                      {/* Chat Input */}
                      <div className="p-4 border-t border-gray-200">
                        <div className="flex items-center space-x-2">
                          <input 
                            type="text" 
                            placeholder="Type your message..."
                            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value="Type your message..."
                            readOnly
                          />
                          <button 
                            className="p-2 rounded-lg"
                            style={{ backgroundColor: embedStyle.userMessageBubbleColor }}
                          >
                            <Send className="h-4 w-4 text-white" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Embed Code Generator Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Code className="h-5 w-5" />
                    <span>Embed Generator</span>
                  </CardTitle>
                  <CardDescription>
                    Copy and paste this code into your website to add the styled chat widget
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button onClick={resetToDefaults} variant="outline" size="sm" className="flex items-center space-x-2">
                    <RotateCcw className="h-4 w-4" />
                    <span>Reset to Default Style</span>
                </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Code Type Tabs */}
              <Tabs value={embedCodeType} onValueChange={(value) => setEmbedCodeType(value as 'styled' | 'raw')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="styled">Styled Embed</TabsTrigger>
                  <TabsTrigger value="raw">Raw Embed</TabsTrigger>
                </TabsList>

                {/* Styled Embed Content */}
                <TabsContent value="styled" className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600">
                        Working styled embed snippet that includes all UI settings
                      </p>
                      <Button
                        onClick={() => copyEmbedCode(generateStyledEmbedCode())}
                        className="flex items-center space-x-2"
                      >
                        <Copy className="h-4 w-4" />
                        <span>Copy Code</span>
                </Button>
                    </div>
                    <ScrollArea className="h-64 w-full border rounded-md">
                      <pre className="p-4 text-xs overflow-x-auto">
                        <code>{generateStyledEmbedCode()}</code>
                      </pre>
                    </ScrollArea>
                  </div>
                </TabsContent>

                {/* Raw Embed Content */}
                <TabsContent value="raw" className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600">
                        Minimal version without styles for full customization
                      </p>
                      <Button
                        onClick={() => copyEmbedCode(generateRawEmbedCode())}
                        className="flex items-center space-x-2"
                      >
                        <Copy className="h-4 w-4" />
                        <span>Copy Code</span>
                </Button>
                    </div>
                    <ScrollArea className="h-32 w-full border rounded-md">
                      <pre className="p-4 text-xs overflow-x-auto">
                        <code>{generateRawEmbedCode()}</code>
                      </pre>
                    </ScrollArea>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-xs text-blue-800">
                        <strong>Note:</strong> This embed includes no styling. You can target <code className="bg-blue-100 px-1 rounded">.executa-chat</code> via your own stylesheet for full customization.
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Conversations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{assistant.totalSessions || 0}</div>
                <p className="text-xs text-green-600">+12% from last week</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Satisfaction Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4.8/5</div>
                <p className="text-xs text-green-600">+0.2 from last week</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Avg Response Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1.2s</div>
                <p className="text-xs text-green-600">15% faster than average</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">47</div>
                <p className="text-xs text-blue-600">This month</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Usage Analytics</CardTitle>
              <CardDescription>
                {assistant.totalSessions === 0 
                  ? "No analytics data yet - start chatting to see insights!" 
                  : "Performance metrics and user engagement data"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">Analytics Chart</p>
                  <p className="text-sm text-gray-500">Interactive analytics coming soon</p>
        </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assistant Settings</CardTitle>
              <CardDescription>
                Configure your assistant's behavior and appearance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Assistant Name</Label>
                  <Input defaultValue={assistant.name} />
      </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <select className="w-full p-2 border rounded-md">
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="paused">Paused</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea defaultValue={assistant.description || ""} rows={3} />
              </div>

              <div className="flex space-x-4 pt-4">
                <Button>Save Changes</Button>
                <Button variant="outline">Cancel</Button>
                <Button variant="destructive" className="ml-auto">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Assistant
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={`text-sm font-medium ${className}`}>{children}</label>;
}

function Textarea({ className, ...props }: { className?: string; [key: string]: any }) {
  return (
    <textarea 
      className={`w-full p-2 border rounded-md resize-none ${className}`} 
      {...props} 
    />
  );
} 