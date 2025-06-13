"use client";

import { useUserStore } from "@/state/userStore";
import { useModelStore } from "@/state/modelStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CreateAssistantDialog from "@/components/models/CreateAssistantDialog";
import { 
  Bot, 
  Plus, 
  MessageSquare, 
  BarChart3, 
  Clock, 
  Users,
  TrendingUp,
  Zap,
  Eye,
  Calendar,
  Activity
} from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { user } = useUserStore();
  const { models, isLoading, fetchModels } = useModelStore();
  const router = useRouter();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!user) {
      router.push("/login");
      return;
    }
    
    // Fetch user's models
    fetchModels();
  }, [user, router, fetchModels]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

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
        return 'bg-green-500';
      case 'training':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {user.name?.split(' ')[0] || 'there'}!</h1>
            <p className="text-muted-foreground mt-1">
              Manage your AI assistants and monitor their performance
            </p>
          </div>
          <CreateAssistantDialog>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Assistant
            </Button>
          </CreateAssistantDialog>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Assistants</CardTitle>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{models.length}</div>
              <p className="text-xs text-muted-foreground">
                {models.length === 0 ? "Create your first assistant" : `${models.filter(m => m.status === 'active').length} active`}
              </p>
            </CardContent>
          </Card>
          
          <Card className="rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversations</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {models.reduce((total, model) => total + model.totalSessions, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Total across all assistants
              </p>
            </CardContent>
          </Card>
          
          <Card className="rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">
                Unique visitors this month
              </p>
            </CardContent>
          </Card>
          
          <Card className="rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {models.length > 0 ? "98%" : "--"}
              </div>
              <p className="text-xs text-muted-foreground">
                {models.length > 0 ? "Average response accuracy" : "No data available yet"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Assistants */}
          <div className="lg:col-span-2">
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle>Your AI Assistants</CardTitle>
                <CardDescription>
                  Manage and monitor your deployed AI assistants
                </CardDescription>
              </CardHeader>
              <CardContent>
                {models.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                      <Bot className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No assistants yet</h3>
                    <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                      Create your first AI assistant by uploading documents and training your knowledge base.
                    </p>
                    <CreateAssistantDialog>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Your First Assistant
                      </Button>
                    </CreateAssistantDialog>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {models.map((model) => (
                      <Card key={model.id} className="border rounded-2xl hover:shadow-md transition-all duration-200">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                <Bot className="h-5 w-5 text-primary" />
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                  <h4 className="font-medium">{model.name}</h4>
                                  <div className="flex items-center space-x-1">
                                    <div className={`w-2 h-2 rounded-full ${getStatusColor(model.status)}`} />
                                    <span className="text-xs text-muted-foreground">{getStatusText(model.status)}</span>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                  <div className="flex items-center space-x-1">
                                    <MessageSquare className="h-3 w-3" />
                                    <span>{model.totalSessions} sessions</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>{formatDate(model.createdAt)}</span>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Activity className="h-3 w-3" />
                                    <span>{model.documents.length} docs</span>
                                  </div>
                                </div>
                                {model.description && (
                                  <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                                    {model.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {model.status === 'training' && (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                              )}
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions & Recent Activity */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <CreateAssistantDialog>
                  <Button variant="outline" className="w-full justify-start">
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Assistant
                  </Button>
                </CreateAssistantDialog>
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  View Analytics
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Zap className="mr-2 h-4 w-4" />
                  API Documentation
                </Button>
              </CardContent>
            </Card>

            {/* Getting Started */}
            <Card className="rounded-2xl shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Getting Started</CardTitle>
                <CardDescription>
                  Complete these steps to set up your first assistant
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">
                    ✓
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Create your account</p>
                    <p className="text-xs text-green-600">Completed</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className={`w-6 h-6 rounded-full ${models.length > 0 ? 'bg-primary text-primary-foreground' : 'border-2 border-muted-foreground/20 text-muted-foreground'} flex items-center justify-center text-xs font-medium`}>
                    {models.length > 0 ? '✓' : '2'}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Create your first assistant</p>
                    <p className={`text-xs ${models.length > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {models.length > 0 ? 'Completed' : 'Upload documents and train your AI'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className={`w-6 h-6 rounded-full ${models.some(m => m.status === 'active') ? 'bg-primary text-primary-foreground' : 'border-2 border-muted-foreground/20 text-muted-foreground'} flex items-center justify-center text-xs font-medium`}>
                    {models.some(m => m.status === 'active') ? '✓' : '3'}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Deploy your assistant</p>
                    <p className={`text-xs ${models.some(m => m.status === 'active') ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {models.some(m => m.status === 'active') ? 'Assistant is live!' : 'Get embed codes and API keys'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-full border-2 border-muted-foreground/20 text-muted-foreground flex items-center justify-center text-xs font-medium">
                    4
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Monitor and optimize</p>
                    <p className="text-xs text-muted-foreground">Track performance and user feedback</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 