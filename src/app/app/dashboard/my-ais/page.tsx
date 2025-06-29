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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  ExternalLink,
  MoreVertical,
  Circle,
  FileText,
  Mail,
  Zap,
  Target,
  TrendingUp,
  RefreshCw,
  Lightbulb,
  Globe,
  Filter,
  Users,
  ArrowRight,
  AlertTriangle
} from "lucide-react";
import Link from "next/link";


// Training source badge component
function TrainingSourceBadges({ documents }: { documents: any[] }) {
  const sources = new Set<string>();
  
  documents.forEach(doc => {
    if (doc.type === 'pdf' || doc.type === 'txt' || doc.type === 'docx') {
      sources.add('docs');
    } else if (doc.type === 'gmail') {
      sources.add('gmail');
    }
  });

  return (
    <div className="flex items-center space-x-1">
      {sources.has('docs') && (
        <Badge variant="secondary" className="text-xs">
          <FileText className="w-3 h-3 mr-1" />
          Docs
        </Badge>
      )}
      {sources.has('gmail') && (
        <Badge variant="secondary" className="text-xs">
          <Mail className="w-3 h-3 mr-1" />
          Gmail
        </Badge>
      )}
      {sources.size === 0 && (
        <Badge variant="outline" className="text-xs text-gray-500">
          <Zap className="w-3 h-3 mr-1" />
          API
        </Badge>
      )}
    </div>
  );
}

// Deployment badges component
function DeploymentBadges({ isActive }: { isActive: boolean }) {
  if (!isActive) {
    return (
      <Badge variant="outline" className="text-xs text-gray-500">
        Not deployed
      </Badge>
    );
  }

  return (
    <div className="flex items-center space-x-1">
      <Badge variant="secondary" className="text-xs">
        <Globe className="w-3 h-3 mr-1" />
        Website
      </Badge>
    </div>
  );
}

// Progress nudge component
function ProgressNudge({ model }: { model: any }) {
  if (model.totalSessions > 0 || model.documents.length > 5) {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
      <div className="flex items-start space-x-2">
        <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5" />
        <div>
          <p className="text-xs text-blue-800 font-medium">
            {model.totalSessions === 0 && model.status === 'draft' 
              ? "Ready to deploy? Train your assistant to start helping users"
              : "No usage yet — deploy your assistant to start collecting insights"
            }
          </p>
          {model.status === 'draft' && (
            <Button size="sm" className="mt-2 text-xs h-6 px-2">
              <Target className="w-3 h-3 mr-1" />
              Deploy Now
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MyAIsPage() {
  const router = useRouter();
  const { models, isLoading, fetchModels, deleteModel } = useModelStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  
  // Confirmation dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [assistantToDelete, setAssistantToDelete] = useState<{id: string, name: string} | null>(null);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }
    
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(dateObj);
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

  const handleDeleteAssistant = async (assistantId: string, assistantName: string) => {
    setAssistantToDelete({ id: assistantId, name: assistantName });
    setShowDeleteDialog(true);
  };

  const confirmDeleteAssistant = async () => {
    if (!assistantToDelete) return;
    
    try {
      await deleteModel(assistantToDelete.id);
      // Success toast is already handled in the store
    } catch (error) {
      // Error toast is already handled in the store
    } finally {
      setShowDeleteDialog(false);
      setAssistantToDelete(null);
    }
  };

  const cancelDeleteAssistant = () => {
    setShowDeleteDialog(false);
    setAssistantToDelete(null);
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
      <div className="p-8 space-y-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold font-kanit tracking-wide">My AI Assistants</h1>
            <p className="text-muted-foreground mt-1">
              Manage and monitor your AI assistants
            </p>
          </div>
          <Button asChild className="bg-brand-600 hover:bg-brand-700 text-white hover:text-white">
            <Link href="/app/dashboard/create">
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
                  <Link href="/app/dashboard/create">
                    <Plus className="mr-2 h-4 w-4" />
                    Create Assistant
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredModels.map((model) => {
              const getAccuracyColor = (status?: string) => {
                if (status === 'active') return 'text-emerald-600 bg-emerald-50 border-emerald-200';
                return 'text-gray-600 bg-gray-50 border-gray-200';
              };

              const accuracy = model?.status === 'active' ? '98%' : '--';
              const sessions = model?.totalSessions || 0;
              const documentCount = model?.documents?.length || 0;

              const handleCardClick = () => {
                router.push(`/app/dashboard/assistants/${model?.id || 'unknown'}`);
              };

              return (
                <Card 
                  key={model.id}
                  className="border border-gray-200 bg-white hover:border-gray-300 hover:shadow-lg transition-all duration-200 cursor-pointer group rounded-2xl"
                  onClick={handleCardClick}
                >
                  <CardContent className="p-6">
                    {/* Header with improved hierarchy */}
                    <div className="mb-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
                            <Bot className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-1">
                              {model?.name || 'Untitled Assistant'}
                            </h3>
                            <Badge variant="outline" className={`text-xs font-semibold border ${getStatusColor(model?.status)} px-3 py-1`}>
                              <Circle className="w-2 h-2 mr-1.5 fill-current" />
                              {getStatusText(model?.status)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      {model?.description && (
                        <p className="text-gray-600 leading-relaxed text-sm ml-15">
                          {model.description}
                        </p>
                      )}
                    </div>

                    {/* Key Metrics with Visual Hierarchy */}
                    <div className="mb-6">
                      <div className="grid grid-cols-3 gap-4">
                        {/* Accuracy - Highlighted as most important */}
                        <div className="text-center">
                          <div className={`inline-flex items-center justify-center w-full py-3 px-2 rounded-xl border ${getAccuracyColor(model?.status)} mb-2`}>
                            <div className="text-2xl font-bold">{accuracy}</div>
                          </div>
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Accuracy</div>
                        </div>
                        
                        {/* Sessions */}
                        <div className="text-center">
                          <div className="py-3 px-2 mb-2">
                            <div className="text-xl font-bold text-gray-900">{sessions}</div>
                          </div>
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Sessions</div>
                        </div>
                        
                        {/* Documents */}
                        <div className="text-center">
                          <div className="py-3 px-2 mb-2">
                            <div className="text-xl font-bold text-gray-900">{documentCount}</div>
                          </div>
                          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Documents</div>
                        </div>
                      </div>
                    </div>

                    {/* Training Source and Deployment - Compact */}
                    <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                      <div>
                        <span className="text-gray-500 font-medium block mb-2">Training Source</span>
                        <TrainingSourceBadges documents={model?.documents || []} />
                      </div>
                      <div>
                        <span className="text-gray-500 font-medium block mb-2">Deployment</span>
                        <DeploymentBadges isActive={model?.status === 'active'} />
                      </div>
                    </div>

                    {/* Status Messages - Only show if important */}
                    {model?.status !== 'active' && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-amber-600 flex-shrink-0" />
                          <p className="text-sm text-amber-800 font-medium">
                            Ready to activate
                          </p>
                        </div>
                      </div>
                    )}

                    {sessions === 0 && model?.status === 'active' && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                        <div className="flex items-center gap-2">
                          <Activity className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          <p className="text-sm text-blue-800 font-medium">
                            Live but no conversations yet
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Click indicator */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                      <div className="text-sm text-gray-500">
                        Click to manage assistant
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all duration-200" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Delete Assistant
              </DialogTitle>
              <DialogDescription>
                Are you sure you want to delete <strong>"{assistantToDelete?.name}"</strong>? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={cancelDeleteAssistant}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={confirmDeleteAssistant}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete Assistant
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
} 