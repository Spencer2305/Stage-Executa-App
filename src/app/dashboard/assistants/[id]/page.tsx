"use client";

import { useParams } from "next/navigation";
import { useModelStore } from "@/state/modelStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import { 
  ArrowLeft, 
  Bot, 
  MessageSquare, 
  Send, 
  Copy, 
  ExternalLink,
  Settings,
  BarChart3,
  FileText,
  Calendar,
  Activity,
  Users,
  Clock,
  Share,
  Download,
  Edit,
  Trash2
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function AssistantViewPage() {
  const params = useParams();
  const router = useRouter();
  const { models, deleteModel } = useModelStore();
  const [message, setMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      content: "Hello! I'm your AI assistant. How can I help you today?",
      sender: "bot",
      timestamp: new Date()
    }
  ]);

  const assistantId = params?.id as string;
  const assistant = models.find(m => m.id === assistantId);

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const newMessage = {
      id: chatMessages.length + 1,
      content: message,
      sender: "user" as const,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, newMessage]);
    setMessage("");

    // Simulate bot response
    setTimeout(() => {
      const botResponse = {
        id: chatMessages.length + 2,
        content: "Thanks for your message! This is a demo response from your AI assistant.",
        sender: "bot" as const,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, botResponse]);
    }, 1000);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
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
      case 'active': return 'Active';
      case 'training': return 'Training';
      case 'draft': return 'Draft';
      case 'error': return 'Error';
      default: return 'Unknown';
    }
  };

  // Button handler functions
  const handleCopyEmbedCode = async () => {
    const embedCode = `<script src="https://cdn.executa.ai/widget.js" data-assistant-id="${assistantId}"></script>`;
    try {
      await navigator.clipboard.writeText(embedCode);
      toast.success("Embed code copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy embed code");
    }
  };

  const handleOpenInNewTab = () => {
    const chatUrl = `${window.location.origin}/chat/${assistantId}`;
    window.open(chatUrl, '_blank');
    toast.success("Opening assistant in new tab");
  };

  const handleViewAnalytics = () => {
    router.push(`/dashboard/analytics?assistant=${assistantId}`);
  };

  const handleEditAssistant = () => {
    router.push(`/dashboard/assistants/${assistantId}/edit`);
  };

  const handleDeleteAssistant = () => {
    if (window.confirm(`Are you sure you want to delete "${assistant?.name}"? This action cannot be undone.`)) {
      deleteModel(assistantId);
      toast.success("Assistant deleted successfully");
      router.push("/dashboard");
    }
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

  const handleExportChat = () => {
    const chatData = chatMessages.map(msg => ({
      sender: msg.sender,
      content: msg.content,
      timestamp: msg.timestamp.toISOString()
    }));
    
    const dataStr = JSON.stringify(chatData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${assistant?.name || 'assistant'}-chat-export.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success("Chat exported successfully!");
  };

  if (!assistant) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <Bot className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Assistant Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The AI assistant you're looking for doesn't exist or has been deleted.
            </p>
            <Button asChild>
              <Link href="/dashboard/my-ais">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to My AIs
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/my-ais">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Bot className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{assistant.name}</h1>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className={getStatusColor(assistant.status)}>
                    {getStatusText(assistant.status)}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Created {formatDate(assistant.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleShareAssistant}>
              <Share className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="sm" onClick={handleEditAssistant}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-lg font-semibold">{assistant.totalSessions}</p>
                  <p className="text-xs text-muted-foreground">Total Sessions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-lg font-semibold">{assistant.documents.length}</p>
                  <p className="text-xs text-muted-foreground">Documents</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-lg font-semibold">847</p>
                  <p className="text-xs text-muted-foreground">Unique Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="rounded-xl">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-lg font-semibold">98%</p>
                  <p className="text-xs text-muted-foreground">Success Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <Card className="rounded-xl h-[600px] flex flex-col">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <MessageSquare className="h-5 w-5" />
                      <span>Test Chat</span>
                    </CardTitle>
                    <CardDescription>
                      Try out your AI assistant's responses
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleExportChat}>
                    <Download className="h-4 w-4 mr-2" />
                    Export Chat
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col p-0">
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {chatMessages.map((msg) => (
                      <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] rounded-lg p-3 ${
                          msg.sender === 'user' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted'
                        }`}>
                          <p className="text-sm">{msg.content}</p>
                          <p className={`text-xs mt-1 ${
                            msg.sender === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                          }`}>
                            {formatDate(msg.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                
                <div className="border-t p-4">
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Type your message..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1"
                    />
                    <Button onClick={handleSendMessage} size="sm">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Assistant Details */}
          <div className="space-y-6">
            {/* Assistant Info */}
            <Card className="rounded-xl">
              <CardHeader>
                <CardTitle>Assistant Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Name</Label>
                  <p className="text-sm text-muted-foreground">{assistant.name}</p>
                </div>
                
                {assistant.description && (
                  <div>
                    <Label className="text-sm font-medium">Description</Label>
                    <p className="text-sm text-muted-foreground">{assistant.description}</p>
                  </div>
                )}
                
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge variant="outline" className={getStatusColor(assistant.status)}>
                    {getStatusText(assistant.status)}
                  </Badge>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Created</Label>
                  <p className="text-sm text-muted-foreground">{formatDate(assistant.createdAt)}</p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="rounded-xl">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" onClick={handleCopyEmbedCode}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Embed Code
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={handleOpenInNewTab}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open in New Tab
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={handleViewAnalytics}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Analytics
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={handleEditAssistant}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Assistant
                </Button>
                <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive" onClick={handleDeleteAssistant}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Assistant
                </Button>
              </CardContent>
            </Card>

            {/* Documents */}
            <Card className="rounded-xl">
              <CardHeader>
                <CardTitle>Knowledge Base</CardTitle>
                <CardDescription>
                  {assistant.documents.length} documents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-32">
                  <div className="space-y-2">
                    {assistant.documents.map((doc, index) => (
                      <div key={doc.id || index} className="flex items-center space-x-2 p-2 border rounded-lg">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm truncate block">
                            {typeof doc === 'object' ? doc.name : doc}
                          </span>
                          {typeof doc === 'object' && doc.size && (
                            <span className="text-xs text-muted-foreground">
                              {(doc.size / 1024).toFixed(1)} KB
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>;
} 