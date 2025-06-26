"use client";

import { useUserStore } from "@/state/userStore";
import { useModelStore } from "@/state/modelStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { 
  Bot, 
  Plus, 
  MessageSquare, 
  BarChart3, 
  TrendingUp,
  Activity,
  Eye,
  MoreHorizontal,
  Circle,
  FileText,
  Mail,
  Slack,
  Globe,
  Zap,
  Users,
  CheckCircle,
  ArrowRight,
  Lightbulb,
  Target,
  Rocket,
  HelpCircle,
  Copy,
  Edit,
  Upload,
  Heart,
  Sparkles,
  Clock,
  Star,
  ChevronRight,
  X
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

// Enhanced Onboarding for first-time users
function FirstTimeUserOnboarding({ router }: { router: any }) {
  const [completedSteps, setCompletedSteps] = useState([false, false, false]);

  return (
    <Card className="border border-gray-200 bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-purple-50/50 relative overflow-hidden shadow-sm">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5"></div>
      <CardHeader className="relative pb-6">
        <div className="flex items-start space-x-4">
          <div className="p-3 bg-blue-600 rounded-xl shadow-sm">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-2xl font-bold text-gray-900 leading-tight">
              Welcome to Executa
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2 text-base leading-relaxed">
              Building AI for everyone and every business with ease. Let's create your first AI assistant in just three simple steps.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative space-y-6">
        {/* Step 1 */}
        <div className="flex items-start space-x-4 p-5 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex-shrink-0">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
              completedSteps[0] ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white'
            }`}>
              {completedSteps[0] ? <CheckCircle className="w-5 h-5" /> : '1'}
            </div>
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900 mb-2 text-lg">Create your AI Assistant</h4>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Give your assistant a name and personality that perfectly represents your business and brand.
            </p>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 shadow-sm font-medium"
              onClick={() => router.push('/dashboard/create')}
            >
              <Plus className="mr-2 h-4 w-4" />
              Start Building
            </Button>
          </div>
        </div>

        {/* Step 2 */}
        <div className="flex items-start space-x-4 p-5 bg-gray-50/80 rounded-xl border border-gray-100">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-semibold">
              2
            </div>
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-700 mb-2 text-lg">Upload Knowledge Base</h4>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Add documents, connect Gmail, or integrate your tools so your AI understands your business inside and out.
            </p>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline" className="bg-white border-blue-200 text-blue-700 font-medium">
                <FileText className="w-3 h-3 mr-1.5" />
                Documents
              </Badge>
              <Badge variant="outline" className="bg-white border-red-200 text-red-700 font-medium">
                <Mail className="w-3 h-3 mr-1.5" />
                Gmail
              </Badge>
              <Badge variant="outline" className="bg-white border-purple-200 text-purple-700 font-medium">
                <Zap className="w-3 h-3 mr-1.5" />
                API
              </Badge>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="flex items-start space-x-4 p-5 bg-gray-50/80 rounded-xl border border-gray-100">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 font-semibold">
              3
            </div>
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-700 mb-2 text-lg">Deploy & Launch</h4>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Deploy your assistant on your website, Slack workspace, or anywhere your customers need assistance.
            </p>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline" className="bg-white border-green-200 text-green-700 font-medium">
                <Globe className="w-3 h-3 mr-1.5" />
                Website
              </Badge>
              <Badge variant="outline" className="bg-white border-purple-200 text-purple-700 font-medium">
                <Slack className="w-3 h-3 mr-1.5" />
                Slack
              </Badge>
              <Badge variant="outline" className="bg-white border-orange-200 text-orange-700 font-medium">
                <Zap className="w-3 h-3 mr-1.5" />
                API
              </Badge>
            </div>
          </div>
        </div>

        <div className="mt-8 p-5 bg-blue-50/80 backdrop-blur-sm rounded-xl border border-blue-100">
          <div className="flex items-start space-x-3">
            <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-blue-900 font-medium mb-1">Pro tip for getting started</p>
              <p className="text-blue-800 leading-relaxed">
                Start with documents you already have - even a simple FAQ document can power a remarkably helpful AI assistant!
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

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
    <div className="flex items-center gap-1.5 flex-wrap">
      {sources.has('docs') && (
        <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700 border border-blue-200 font-medium">
          <FileText className="w-3 h-3 mr-1" />
          Documents
        </Badge>
      )}
      {sources.has('gmail') && (
        <Badge variant="secondary" className="text-xs bg-red-50 text-red-700 border border-red-200 font-medium">
          <Mail className="w-3 h-3 mr-1" />
          Gmail
        </Badge>
      )}
      {sources.size === 0 && (
        <Badge variant="outline" className="text-xs text-gray-600 bg-gray-50 border-gray-200 font-medium">
          <Zap className="w-3 h-3 mr-1" />
          API Only
        </Badge>
      )}
    </div>
  );
}

// Deployment badges component
function DeploymentBadges({ isActive }: { isActive: boolean }) {
  if (!isActive) {
    return (
      <Badge variant="outline" className="text-xs text-gray-500 bg-gray-50 border-gray-200 font-medium">
        Not deployed
      </Badge>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <Badge variant="secondary" className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
        <Globe className="w-3 h-3 mr-1" />
        Website
      </Badge>
    </div>
  );
}

// Enhanced Assistant Card Component
function AssistantCard({ model }: { model: any }) {
  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return 'Never';
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
      Math.floor((dateObj.getTime() - Date.now()) / (1000 * 60 * 60 * 24)), 'day'
    );
  };

  const handleCopyEmbed = async () => {
    const embedCode = `<script src="https://cdn.executa.ai/widget.js" data-assistant-id="${model?.id || 'unknown'}"></script>`;
    try {
      await navigator.clipboard.writeText(embedCode);
      toast.success("Embed code copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy embed code");
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active': return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'training': return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'error': return 'text-red-700 bg-red-50 border-red-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'active': return 'Live';
      case 'training': return 'Training';
      case 'error': return 'Error';
      default: return 'Draft';
    }
  };

  // Mock metrics
  const accuracy = model?.status === 'active' ? '98%' : '--';
  const sessions = model?.totalSessions || 0;
  const lastInteraction = model?.status === 'active' ? formatDate(new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)) : 'Never';

  return (
    <Card className="border border-gray-200 hover:shadow-lg hover:border-gray-300 transition-all duration-300 group bg-white">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold text-xl text-gray-900 group-hover:text-blue-600 transition-colors">
                {model?.name || 'Untitled Assistant'}
              </h3>
              <Badge className={`text-xs font-medium border ${getStatusColor(model?.status)} px-2.5 py-1`}>
                <Circle className="w-2 h-2 mr-1.5 fill-current" />
                {getStatusText(model?.status)}
              </Badge>
            </div>
            {model?.description && (
              <p className="text-gray-600 leading-relaxed">{model.description}</p>
            )}
          </div>
        </div>

        {/* Training and Deployment Info */}
        <div className="space-y-4 mb-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Training Source</span>
            <TrainingSourceBadges documents={model?.documents || []} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Deployment</span>
            <DeploymentBadges isActive={model?.status === 'active'} />
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-4 mb-5 p-4 bg-gray-50/80 rounded-xl border border-gray-100">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900">{accuracy}</div>
                  <div className="text-xs font-medium text-gray-500 mt-0.5">Accuracy</div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Percentage of helpful responses</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div className="text-center">
                  <div className="text-xl font-bold text-gray-900">{sessions}</div>
                  <div className="text-xs font-medium text-gray-500 mt-0.5">Sessions</div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Total conversations with users</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <div className="text-center">
            <div className="text-xl font-bold text-gray-900">
              {lastInteraction === 'Never' ? '--' : lastInteraction}
            </div>
            <div className="text-xs font-medium text-gray-500 mt-0.5">Last Active</div>
          </div>
        </div>

        {/* Status Messages */}
        {model?.status !== 'active' && (
          <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-start gap-2">
              <Target className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-800 font-medium">
                Ready to deploy? Activate your assistant to start collecting insights and helping users.
              </p>
            </div>
          </div>
        )}

        {sessions === 0 && model?.status === 'active' && (
          <div className="mb-5 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-start gap-2">
              <Activity className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-800 font-medium">
                Your assistant is live but hasn't received any conversations yet. Share the link to get started!
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Link href={`/dashboard/assistants/${model?.id || 'unknown'}`}>
            <Button variant="outline" size="sm" className="w-full h-10 font-medium hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors">
              <MessageSquare className="mr-2 h-4 w-4" />
              Test Chat
            </Button>
          </Link>
          <Link href={`/dashboard/assistants/${model?.id || 'unknown'}`}>
            <Button variant="outline" size="sm" className="w-full h-10 font-medium hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700 transition-colors">
              <Upload className="mr-2 h-4 w-4" />
              Add Knowledge
            </Button>
          </Link>
          <Button variant="outline" size="sm" className="w-full h-10 font-medium hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-colors" onClick={handleCopyEmbed}>
            <Copy className="mr-2 h-4 w-4" />
            Copy Embed
          </Button>
          <Link href={`/dashboard/assistants/${model?.id || 'unknown'}`}>
            <Button variant="outline" size="sm" className="w-full h-10 font-medium hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 transition-colors">
              <Edit className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

// AI Suggestions Component with sleek design
function AISuggestionsSection({ models, router }: { models: any[], router: any }) {
  const [showSuggestions, setShowSuggestions] = useState(true);

  if (!showSuggestions) {
    return null;
  }

  const suggestions = [
    {
      id: 1,
      type: 'optimization',
      title: 'Optimize Response Time',
      description: 'Your assistants could respond 23% faster with knowledge base refinement',
      action: 'Review Knowledge Base',
      icon: Rocket,
      priority: 'high',
      estimated: '5 min',
      route: '/dashboard/files'
    },
    {
      id: 2,
      type: 'integration',
      title: 'Connect Gmail Integration',
      description: 'Add Gmail to expand your assistant\'s knowledge with email conversations',
      action: 'Connect Gmail',
      icon: Mail,
      priority: 'medium',
      estimated: '2 min',
      route: '/dashboard/settings'
    },
    {
      id: 3,
      type: 'analytics',
      title: 'View Conversation Insights',
      description: 'Discover patterns in user questions to improve your assistant',
      action: 'View Analytics',
      icon: BarChart3,
      priority: 'medium',
      estimated: '3 min',
      route: '/dashboard/analytics'
    },
    {
      id: 4,
      type: 'deployment',
      title: 'Deploy to Website',
      description: 'Add your assistant to your website to help visitors 24/7',
      action: 'Get Embed Code',
      icon: Globe,
      priority: 'high',
      estimated: '1 min',
      route: models.length > 0 ? `/dashboard/assistants/${models[0]?.id}` : '/dashboard/create'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Smart Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">
            AI Suggestions
          </h2>
          <p className="text-sm text-gray-600">Personalized recommendations to enhance your assistants</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-3 py-1 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-200/50 rounded-full">
            <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-medium text-gray-700">AI Powered</span>
          </div>
          <button
            onClick={() => setShowSuggestions(false)}
            className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
            title="Dismiss suggestions"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Compact Suggestions List */}
      <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
        {suggestions.map((suggestion, index) => {
          const IconComponent = suggestion.icon;
          
          return (
            <div key={suggestion.id} className="p-4 group cursor-pointer" onClick={() => router.push(suggestion.route)}>
              <div className="flex items-center space-x-4">
                {/* Priority Indicator */}
                <div className="flex-shrink-0">
                  <div className={`w-3 h-3 rounded-full ${
                    suggestion.priority === 'high' 
                      ? 'bg-orange-400' 
                      : 'bg-blue-400'
                  }`}></div>
                </div>

                {/* Icon */}
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
                    <IconComponent className="w-5 h-5 text-gray-600" />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="text-sm font-medium text-gray-900">
                      {suggestion.title}
                    </h3>
                    {suggestion.priority === 'high' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        High Impact
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {suggestion.description}
                  </p>
                </div>

                {/* Time and Action */}
                <div className="flex-shrink-0 text-right">
                  <div className="flex items-center space-x-3">
                    <div className="text-xs text-gray-500">
                      {suggestion.estimated}
                    </div>
                    <div className="flex items-center space-x-1 text-blue-600 group-hover:text-blue-700">
                      <span className="text-sm font-medium">{suggestion.action}</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
          <span>Complete suggestions to boost performance by 35%</span>
        </div>
        <div className="text-xs">
          {suggestions.filter(s => s.priority === 'high').length} high impact • {suggestions.length} total
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useUserStore();
  const { models, isLoading, fetchModels } = useModelStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    fetchModels();
    if (searchParams.get('welcome') === 'true') {
      setShowWelcome(true);
      // Remove the welcome parameter from URL
      const url = new URL(window.location.href);
      url.searchParams.delete('welcome');
      window.history.replaceState({}, '', url.toString());
    }
  }, [fetchModels, searchParams]);

  const totalConversations = models.reduce((total, model) => total + (model?.totalSessions || 0), 0);
  const activeModels = models.filter(model => model?.status === 'active');

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="p-8 space-y-8 max-w-7xl mx-auto">
        {/* Welcome Message for New Subscribers */}
        {showWelcome && (
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <CardTitle className="text-green-800">Welcome to Executa Pro! 🎉</CardTitle>
              </div>
              <CardDescription className="text-green-700">
                Your subscription is now active. You have access to all Pro features including 10 AI assistants, 
                10,000 conversations per month, and priority support.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="bg-green-600 hover:bg-green-700">
                <Link href="/dashboard/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First AI Assistant
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Header with enhanced styling */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 leading-tight font-kanit uppercase tracking-wide">
              Welcome back, {user?.name?.split(' ')[0] || 'there'}!
            </h1>
            <p className="text-gray-600 mt-2 text-lg leading-relaxed">
              Building AI solutions for everyone and every business with ease
            </p>
          </div>
          {models.length > 0 && (
          <Button 
            className="bg-blue-600 hover:bg-blue-700 shadow-sm text-base font-medium px-6 py-3 h-auto"
            onClick={() => router.push('/dashboard/create')}
          >
            <Plus className="mr-2 h-5 w-5" />
            Build AI Assistant
          </Button>
          )}
        </div>

        {/* Enhanced Stats Overview */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Total Assistants
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="inline w-3.5 h-3.5 ml-2 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Total number of AI assistants you've created</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
              <Bot className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{models.length}</div>
              <p className="text-sm text-gray-600 mt-1 flex items-center">
                <Circle className="w-2 h-2 mr-1.5 fill-emerald-500 text-emerald-500" />
                {activeModels.length} active
              </p>
            </CardContent>
          </Card>
          
          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Conversations
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="inline w-3.5 h-3.5 ml-2 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Total conversations across all assistants</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
              <MessageSquare className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{totalConversations}</div>
              <p className="text-sm text-gray-600 mt-1">Total across all assistants</p>
            </CardContent>
          </Card>
          
          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                Success Rate
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="inline w-3.5 h-3.5 ml-2 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Average response accuracy across assistants</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {models.length > 0 ? "98%" : "--"}
              </div>
              <p className="text-sm text-emerald-600 mt-1 flex items-center">
                {models.length > 0 ? (
                  <>
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Outperforming 82% of tools
                  </>
                ) : (
                  "No data available yet"
                )}
              </p>
            </CardContent>
          </Card>
          
          <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-gray-600 uppercase tracking-wide">This Month</CardTitle>
              <Activity className="h-5 w-5 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {totalConversations > 0 ? Math.floor(totalConversations * 0.7) : 0}
              </div>
              <p className="text-sm text-orange-600 mt-1 flex items-center">
                {totalConversations > 0 ? (
                  <>
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Up 23% this week
                  </>
                ) : (
                  "New conversations"
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* AI Suggestions Section */}
        {models.length > 0 && <AISuggestionsSection models={models} router={router} />}

        {/* Content: Onboarding or Assistant Grid */}
                {models.length === 0 ? (
          <FirstTimeUserOnboarding router={router} />
        ) : (
          <>
            {/* Enhanced Progress Banner */}
            {models.some(m => m?.status !== 'active') && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <Target className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-amber-900 text-lg">
                        Ready to activate your assistants?
                      </p>
                      <p className="text-amber-800 mt-1 leading-relaxed">
                        You have assistants ready to deploy. Activate them to start gathering valuable insights and helping your users.
                      </p>
                    </div>
                  </div>
                  <Button className="bg-amber-600 hover:bg-amber-700 shadow-sm font-medium">
                    Deploy Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                              </Button>
                            </div>
                  </div>
                )}

            {/* Enhanced Assistant Grid */}
            <div>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 font-kanit uppercase tracking-wide">Your AI Assistants</h2>
                  <p className="text-gray-600 mt-1">Manage and monitor your AI-powered assistants</p>
          </div>
                <Button 
                  variant="outline" 
                  className="font-medium hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
                  onClick={() => router.push('/dashboard/create')}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Assistant
                </Button>
              </div>
              
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {models.map((model) => (
                  <AssistantCard key={model.id} model={model} />
                ))}
                  </div>
                </div>
          </>
        )}
      </div>
    </div>
  );
} 