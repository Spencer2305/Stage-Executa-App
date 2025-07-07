"use client";

import { useUserStore } from "@/state/userStore";
import { useModelStore } from "@/state/modelStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
        <div className="flex items-start space-x-4 p-5 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-100 shadow-sm">
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

// Enhanced Assistant Card Component with improved hierarchy and full clickability
function AssistantCard({ model }: { model: any }) {
  const router = useRouter();
  
  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return 'Never';
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
      Math.floor((dateObj.getTime() - Date.now()) / (1000 * 60 * 60 * 24)), 'day'
    );
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

  const getAccuracyColor = (status?: string) => {
    if (status === 'active') return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  // Mock metrics
  const accuracy = model?.status === 'active' ? '98%' : '--';
  const sessions = model?.totalSessions || 0;
  const documentCount = model?.documents?.length || 0;

  const handleCardClick = () => {
    router.push(`/dashboard/assistants/${model?.id || 'unknown'}`);
  };

  return (
    <Card 
      className="border border-gray-200 bg-white hover:border-gray-300 hover:shadow-lg transition-all duration-200 cursor-pointer group"
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
                <Badge className={`text-xs font-semibold border ${getStatusColor(model?.status)} px-3 py-1`}>
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
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <p className="text-sm text-amber-800 font-medium">
                Ready to activate
              </p>
            </div>
          </div>
        )}

        {sessions === 0 && model?.status === 'active' && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
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
}

export default function DashboardPage() {
  console.log('🎯 DashboardPage component mounting...');
  
  const { user, setUser } = useUserStore();
  const { models, isLoading, fetchModels } = useModelStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showWelcome, setShowWelcome] = useState(false);

  console.log('🔍 Dashboard component state:', {
    user: !!user,
    searchParams: window.location.search,
    hasToken: searchParams.get('token') ? 'YES' : 'NO',
    hasOAuth: searchParams.get('oauth') ? 'YES' : 'NO'
  });

  // Handle OAuth callback immediately on component mount
  useEffect(() => {
    console.log('🚀 Dashboard OAuth useEffect running...');
    const token = searchParams.get('token');
    const oauth = searchParams.get('oauth');
    
    console.log('OAuth check:', { token: !!token, oauth });
    
    if (token && oauth) {
      console.log(`✅ OAuth ${oauth} login successful, processing token immediately...`);
      console.log('🔑 Token:', token.substring(0, 50) + '...');
      
      // Store the token immediately and synchronously
      localStorage.setItem('executa-auth-token', token);
      console.log('💾 Token stored in localStorage');
      
      // Clean up URL immediately to prevent re-processing
      const url = new URL(window.location.href);
      url.searchParams.delete('token');
      url.searchParams.delete('oauth');
      window.history.replaceState({}, '', url.toString());
      console.log('🧹 URL cleaned up');
      
      // Force page reload to restart auth flow with token in localStorage
      console.log('🔄 Reloading page to restart auth flow...');
      window.location.reload();
      return;
    } else {
      console.log('❌ No OAuth params found in dashboard');
    }
  }, []); // Only run once on mount

  useEffect(() => {
    console.log('🔄 Dashboard main useEffect triggered');
    console.log('Current user state:', user);
    console.log('Current URL params:', window.location.search);
    
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
    <div className="p-8 space-y-8">
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
          <h1 className="text-4xl font-bold text-gray-900 leading-tight font-kanit tracking-wide">
            Welcome Back, {user?.name?.split(' ')[0] || 'There'}!
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
        <Card className="border border-gray-200 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-600 tracking-wide">
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
        
        <Card className="border border-gray-200 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-600 tracking-wide">
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
        
        <Card className="border border-gray-200 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-600 tracking-wide">
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
        
        <Card className="border border-gray-200 shadow-sm bg-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-600 tracking-wide">This Month</CardTitle>
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
                <h2 className="text-2xl font-bold text-gray-900 font-heading tracking-wide">Your AI Assistants</h2>
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
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {models.map((model) => (
                <AssistantCard key={model.id} model={model} />
              ))}
            </div>
          </div>
        </>
      )}

      {/* Success Messages */}
      {searchParams.get('success') === 'gmail_connected' && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Gmail successfully connected! Your emails are now being synced.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
} 