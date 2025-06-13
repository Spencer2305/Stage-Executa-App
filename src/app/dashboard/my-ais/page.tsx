"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useModelStore } from "@/state/modelStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { 
  Bot, 
  Search, 
  Plus, 
  MessageSquare, 
  Calendar, 
  Activity,
  Eye,
  Settings,
  MoreHorizontal,
  Edit3,
  Trash2,
  Copy,
  BarChart3,
  ExternalLink
} from "lucide-react";
import Link from "next/link";

export default function MyAIsPage() {
  const router = useRouter();
  const { models, isLoading, fetchModels, deleteModel } = useModelStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'training':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'training':
        return 'Training';
      case 'error':
        return 'Error';
      default:
        return 'Draft';
    }
  };

  const filteredModels = models.filter(model => {
    const matchesSearch = model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         model.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || model.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Handler functions for dropdown menu actions
  const handleViewAssistant = (assistantId: string) => {
    router.push(`/dashboard/assistants/${assistantId}`);
  };

  const handleEditAssistant = (assistantId: string) => {
    router.push(`/dashboard/assistants/${assistantId}/edit`);
  };

  const handleCopyEmbedCode = async (assistantId: string) => {
    const embedCode = `<script src="https://cdn.executa.ai/widget.js" data-assistant-id="${assistantId}"></script>`;
    try {
      await navigator.clipboard.writeText(embedCode);
      toast.success("Embed code copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy embed code");
    }
  };

  const handleOpenInNewTab = (assistantId: string) => {
    const chatUrl = `${window.location.origin}/chat/${assistantId}`;
    window.open(chatUrl, '_blank');
    toast.success("Opening assistant in new tab");
  };

  const handleViewAnalytics = (assistantId: string) => {
    router.push(`/dashboard/analytics?assistant=${assistantId}`);
  };

  const handleDeleteAssistant = (assistantId: string, assistantName: string) => {
    if (window.confirm(`Are you sure you want to delete "${assistantName}"? This action cannot be undone.`)) {
      deleteModel(assistantId);
      toast.success("Assistant deleted successfully");
    }
  };

  const handleSettingsClick = (assistantId: string) => {
    router.push(`/dashboard/assistants/${assistantId}/edit`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">My AI Assistants</h1>
            <p className="text-muted-foreground mt-1">
              Manage and monitor your AI assistants
            </p>
          </div>
          <Button asChild className="bg-brand-600 hover:bg-brand-700 text-white hover:text-white">
            <Link href="/dashboard/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Assistant
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card className="rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Bot className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{models.length}</p>
                  <p className="text-xs text-muted-foreground">Total Assistants</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{models.filter(m => m.status === 'active').length}</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Activity className="h-8 w-8 text-yellow-600" />
                <div>
                  <p className="text-2xl font-bold">{models.filter(m => m.status === 'training').length}</p>
                  <p className="text-xs text-muted-foreground">Training</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">
                    {models.reduce((total, model) => total + model.totalSessions, 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Sessions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assistants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {["all", "active", "training", "draft", "error"].map((status) => (
              <Button
                key={status}
                variant={filterStatus === status ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterStatus(status)}
                className={`capitalize ${
                  filterStatus === status 
                    ? "bg-brand-600 hover:bg-brand-700 text-white hover:text-white" 
                    : ""
                }`}
              >
                {status}
              </Button>
            ))}
          </div>
        </div>

        {/* Assistants Grid */}
        {filteredModels.length === 0 ? (
          <Card className="rounded-2xl">
            <CardContent className="text-center py-12">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Bot className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery || filterStatus !== "all" ? "No assistants found" : "No assistants yet"}
              </h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                {searchQuery || filterStatus !== "all" 
                  ? "Try adjusting your search or filters"
                  : "Create your first AI assistant to get started"
                }
              </p>
              {!searchQuery && filterStatus === "all" && (
                <Button asChild className="bg-brand-600 hover:bg-brand-700 text-white hover:text-white">
                  <Link href="/dashboard/create">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Assistant
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredModels.map((model) => (
              <Card key={model.id} className="rounded-2xl hover:shadow-lg transition-all duration-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Bot className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{model.name}</CardTitle>
                        <Badge variant="outline" className={getStatusColor(model.status)}>
                          {getStatusText(model.status)}
                        </Badge>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewAssistant(model.id)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditAssistant(model.id)}>
                          <Edit3 className="mr-2 h-4 w-4" />
                          Edit Assistant
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleViewAnalytics(model.id)}>
                          <BarChart3 className="mr-2 h-4 w-4" />
                          View Analytics
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleCopyEmbedCode(model.id)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy Embed Code
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenInNewTab(model.id)}>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Open in New Tab
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeleteAssistant(model.id, model.name)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Assistant
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {model.description && (
                    <CardDescription className="mt-2">
                      {model.description}
                    </CardDescription>
                  )}
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-primary">{model.totalSessions}</p>
                      <p className="text-xs text-muted-foreground">Sessions</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">{model.documents.length}</p>
                      <p className="text-xs text-muted-foreground">Documents</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-600">98%</p>
                      <p className="text-xs text-muted-foreground">Accuracy</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>Created {formatDate(model.createdAt)}</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <Link href={`/dashboard/assistants/${model.id}`}>
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Link>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1" 
                      onClick={() => handleSettingsClick(model.id)}
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 