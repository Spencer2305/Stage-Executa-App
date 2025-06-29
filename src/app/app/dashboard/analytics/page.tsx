"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  BarChart3, 
  TrendingUp, 
  MessageSquare, 
  Clock, 
  Users,
  Star,
  Filter,
  Download,
  Calendar,
  Bot,
  Globe,
  Mail,
  FileText,
  Activity,
  ThumbsUp,
  ChevronDown,
  TrendingDown,
  Zap,
  Target,
  Check,
  AlertCircle,
  RefreshCw,
  Database
} from "lucide-react";
import { useUserStore } from "@/state/userStore";
import { useModelStore } from "@/state/modelStore";
import { useEffect, useState } from "react";
import fetchApi from "@/utils/api";

// Simple Sparkline Component
function Sparkline({ data, color = "blue", trend = "up" }: { 
  data: number[], 
  color?: string, 
  trend?: "up" | "down" 
}) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((value - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  const colorClass = color === "green" ? "stroke-green-500" : 
                     color === "red" ? "stroke-red-500" :
                     color === "yellow" ? "stroke-yellow-500" : "stroke-blue-500";

  return (
    <div className="w-16 h-8">
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <polyline
          points={points}
          fill="none"
          className={colorClass}
          strokeWidth="3"
        />
      </svg>
    </div>
  );
}

// Mini Bar Chart Component  
function MiniBarChart({ data, color = "blue" }: { data: number[], color?: string }) {
  const max = Math.max(...data);
  
  const colorClass = color === "green" ? "fill-green-500" : 
                     color === "red" ? "fill-red-500" :
                     color === "yellow" ? "fill-yellow-500" : "fill-blue-500";

  return (
    <div className="w-20 h-8 flex items-end space-x-1">
      {data.map((value, index) => (
        <div 
          key={index} 
          className={`flex-1 ${colorClass} rounded-t`}
          style={{ height: `${(value / max) * 100}%` }}
        />
      ))}
    </div>
  );
}

interface AnalyticsData {
  overview: {
    totalConversations: number;
    totalMessages: number;
    uniqueUsers: number;
    avgResponseTime: number;
    avgSatisfaction: number;
    errorRate: number;
    conversationGrowth: number;
    messageGrowth: number;
  };
  platformBreakdown: Array<{
    platform: string;
    conversations: number;
    messages: number;
  }>;
  dailyTrends: Array<{
    date: string;
    conversations: number;
    messages: number;
    uniqueUsers: number;
    avgResponseTime?: number;
    avgSatisfaction?: number;
    errorRate?: number;
  }>;
  assistantPerformance: Array<{
    assistantId: string;
    assistantName: string;
    assistantStatus: string;
    conversations: number;
    totalMessages: number;
    avgResponseTime: number;
    avgSatisfaction: number;
  }>;
  popularQueries: Array<{
    query: string;
    count: number;
    avgResponseTime?: number;
    avgSatisfaction?: number;
    isAnswered: boolean;
    category?: string;
    lastAsked: string;
  }>;
  recentFeedback: Array<{
    id: string;
    rating: number;
    feedback?: string;
    feedbackType: string;
    platform: string;
    assistantName: string;
    createdAt: string;
  }>;
  timeRange: string;
  dateRange: {
    start: string;
    end: string;
  };
}

export default function AnalyticsPage() {
  const { user } = useUserStore();
  const { models, fetchModels } = useModelStore();
  
  // State for filters and data
  const [selectedAssistant, setSelectedAssistant] = useState("All Assistants");
  const [selectedTimeRange, setSelectedTimeRange] = useState("Last 7 days");
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  // Function to fetch analytics data
  const fetchAnalyticsData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Map time range to API format
      const timeRangeMap: { [key: string]: string } = {
        "Last 24 hours": "24h",
        "Last 7 days": "7d", 
        "Last 30 days": "30d",
        "Last 3 months": "90d",
        "Last 6 months": "180d",
        "Last year": "1y",
        "All time": "all"
      };

      const apiTimeRange = timeRangeMap[selectedTimeRange] || "7d";
      const assistantId = selectedAssistant !== "All Assistants" 
        ? models.find(m => m.name === selectedAssistant)?.id
        : undefined;

      const params = new URLSearchParams({
        timeRange: apiTimeRange,
      });
      
      if (assistantId) {
        params.append('assistantId', assistantId);
      }

      const response = await fetchApi(`/analytics?${params.toString()}`);
      
      if (response.data && response.data.success) {
        setAnalyticsData(response.data.data);
        setUsingMockData(false);
      } else {
        throw new Error(response.data?.error || 'Failed to fetch analytics');
      }
    } catch (err) {
      console.error('Analytics fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
      
      // Fallback to mock data
      setAnalyticsData(generateMockAnalyticsData());
      setUsingMockData(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate mock data as fallback
  const generateMockAnalyticsData = (): AnalyticsData => {
    const mockData = {
      overview: {
        totalConversations: 1247,
        totalMessages: 5834,
        uniqueUsers: 423,
        avgResponseTime: 1.2,
        avgSatisfaction: 4.6,
        errorRate: 2.3,
        conversationGrowth: 23.5,
        messageGrowth: 18.7,
      },
      platformBreakdown: [
        { platform: "WEBSITE", conversations: 865, messages: 4012 },
        { platform: "SLACK", conversations: 234, messages: 1245 },
        { platform: "DISCORD", conversations: 89, messages: 398 },
        { platform: "API", conversations: 59, messages: 179 },
      ],
      dailyTrends: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString(),
        conversations: Math.floor(Math.random() * 50) + 20,
        messages: Math.floor(Math.random() * 200) + 80,
        uniqueUsers: Math.floor(Math.random() * 25) + 10,
        avgResponseTime: Math.random() * 2 + 0.5,
        avgSatisfaction: Math.random() * 1.5 + 3.5,
        errorRate: Math.random() * 5,
      })),
      assistantPerformance: models.map((model, index) => ({
        assistantId: model.id,
        assistantName: model.name,
        assistantStatus: model.status,
        conversations: Math.floor(Math.random() * 500) + 50,
        totalMessages: Math.floor(Math.random() * 2000) + 200,
        avgResponseTime: Math.random() * 2 + 0.8,
        avgSatisfaction: Math.random() * 1.5 + 3.5,
      })),
      popularQueries: [
        { query: "How do I reset my password?", count: 89, isAnswered: true, category: "support", lastAsked: new Date().toISOString() },
        { query: "What are your business hours?", count: 67, isAnswered: true, category: "general", lastAsked: new Date().toISOString() },
        { query: "Can you help me with billing?", count: 54, isAnswered: true, category: "billing", lastAsked: new Date().toISOString() },
        { query: "How do I contact support?", count: 43, isAnswered: true, category: "support", lastAsked: new Date().toISOString() },
        { query: "What features are available?", count: 38, isAnswered: true, category: "general", lastAsked: new Date().toISOString() },
      ],
      recentFeedback: [
        { id: "1", rating: 5, feedback: "Great help!", feedbackType: "RATING", platform: "WEBSITE", assistantName: "Support Bot", createdAt: new Date().toISOString() },
        { id: "2", rating: 4, feedback: "Quick response", feedbackType: "RATING", platform: "SLACK", assistantName: "Help Assistant", createdAt: new Date().toISOString() },
        { id: "3", rating: 5, feedbackType: "THUMBS_UP", platform: "WEBSITE", assistantName: "Support Bot", createdAt: new Date().toISOString() },
      ],
      timeRange: selectedTimeRange,
      dateRange: {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString(),
      },
    };
    return mockData;
  };

  // Generate sample data for testing
  const generateSampleData = async () => {
    try {
      setIsGenerating(true);
      
      const assistantId = selectedAssistant !== "All Assistants" 
        ? models.find(m => m.name === selectedAssistant)?.id
        : undefined;
        
      const response = await fetchApi.post('/analytics/generate-sample', { assistantId });
      
      if (response.data && response.data.success) {
        // Refresh analytics data after generation
        await fetchAnalyticsData();
      } else {
        throw new Error(response.data?.error || 'Failed to generate sample data');
      }
    } catch (err) {
      console.error('Failed to generate sample data:', err);
      // You might want to show a toast notification here
    } finally {
      setIsGenerating(false);
    }
  };

  // Fetch data when filters change
  useEffect(() => {
    if (user) {
      fetchAnalyticsData();
    }
  }, [user, selectedTimeRange, selectedAssistant, models]);

  // Assistant options for dropdown
  const assistantOptions = [
    "All Assistants",
    ...models.map(model => model.name)
  ];

  // Time range options
  const timeRangeOptions = [
    "Last 24 hours",
    "Last 7 days", 
    "Last 30 days",
    "Last 3 months",
    "Last 6 months",
    "Last year",
    "All time"
  ];

  // Function to handle CSV export
  const handleExport = () => {
    if (!analyticsData) return;
    
    const csvData = `Assistant,Conversations,Rating,Response Time,Messages,Platform
${analyticsData.assistantPerformance.map(ap => 
  `${ap.assistantName},${ap.conversations},${ap.avgSatisfaction.toFixed(1)},${ap.avgResponseTime.toFixed(1)}s,${ap.totalMessages},Mixed`
).join('\n')}`;
    
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${selectedTimeRange.toLowerCase().replace(/\s+/g, '-')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
              <p className="text-gray-600">Loading analytics data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-white">
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">Failed to load analytics</p>
              <Button onClick={fetchAnalyticsData} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 font-kanit tracking-wide">Analytics</h1>
          <p className="text-gray-600 mt-1">
            Monitor performance and insights across all your AI assistants
          </p>
          {usingMockData && (
            <div className="flex items-center justify-between mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <div className="flex items-center">
                <Database className="h-4 w-4 text-amber-600 mr-2" />
                <span className="text-sm text-amber-800">
                  Showing demo data. Real analytics will appear after conversations.
                </span>
              </div>
              <Button 
                onClick={generateSampleData} 
                variant="outline" 
                size="sm"
                disabled={isGenerating}
                className="text-amber-800 border-amber-300 hover:bg-amber-100"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="h-3 w-3 mr-2" />
                    Generate Sample Data
                  </>
                )}
              </Button>
            </div>
          )}
          {(selectedAssistant !== "All Assistants" || selectedTimeRange !== "Last 7 days") && (
            <div className="flex items-center space-x-2 mt-2">
              <span className="text-sm text-gray-500">Filtered by:</span>
              {selectedAssistant !== "All Assistants" && (
                <Badge variant="secondary" className="text-xs">
                  {selectedAssistant}
                </Badge>
              )}
              {selectedTimeRange !== "Last 7 days" && (
                <Badge variant="secondary" className="text-xs">
                  {selectedTimeRange}
                </Badge>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {/* Assistant Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                {selectedAssistant}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {assistantOptions.map((option) => (
                <DropdownMenuItem
                  key={option}
                  onClick={() => setSelectedAssistant(option)}
                >
                  {option}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Time Range Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Calendar className="mr-2 h-4 w-4" />
                {selectedTimeRange}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {timeRangeOptions.map((option) => (
                <DropdownMenuItem
                  key={option}
                  onClick={() => setSelectedTimeRange(option)}
                >
                  {option}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Export Button */}
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>

          {/* Refresh Button */}
          <Button onClick={fetchAnalyticsData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.totalConversations.toLocaleString()}</div>
            <div className="flex items-center text-xs">
              {analyticsData.overview.conversationGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
              )}
              <span className={analyticsData.overview.conversationGrowth >= 0 ? "text-green-600" : "text-red-600"}>
                {analyticsData.overview.conversationGrowth >= 0 ? '+' : ''}{analyticsData.overview.conversationGrowth.toFixed(1)}%
              </span>
              <span className="text-gray-500 ml-1">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages Exchanged</CardTitle>
            <Mail className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.totalMessages.toLocaleString()}</div>
            <div className="flex items-center text-xs">
              {analyticsData.overview.messageGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
              )}
              <span className={analyticsData.overview.messageGrowth >= 0 ? "text-green-600" : "text-red-600"}>
                {analyticsData.overview.messageGrowth >= 0 ? '+' : ''}{analyticsData.overview.messageGrowth.toFixed(1)}%
              </span>
              <span className="text-gray-500 ml-1">vs last period</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.uniqueUsers.toLocaleString()}</div>
            <p className="text-xs text-gray-500">
              Active users in period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.avgResponseTime.toFixed(1)}s</div>
            <p className="text-xs text-gray-500">
              Average assistant response
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Satisfaction</CardTitle>
            <Star className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.avgSatisfaction.toFixed(1)}/5</div>
            <div className="flex items-center mt-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star}
                    className={`h-4 w-4 ${star <= Math.round(analyticsData.overview.avgSatisfaction) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                  />
                ))}
              </div>
              <span className="text-xs text-gray-500 ml-2">Average rating</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Target className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(100 - analyticsData.overview.errorRate).toFixed(1)}%</div>
            <p className="text-xs text-gray-500">
              Conversations without errors
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Distribution</CardTitle>
            <Globe className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analyticsData.platformBreakdown.slice(0, 3).map((platform, index) => (
                <div key={platform.platform} className="flex items-center justify-between text-sm">
                  <span className="capitalize">{platform.platform.toLowerCase()}</span>
                  <span className="font-medium">{platform.conversations}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Conversations Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Conversations Over Time</CardTitle>
            <CardDescription>Daily conversation volume across all assistants</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-100">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <p className="text-blue-700 font-medium">Interactive Chart</p>
                <p className="text-sm text-blue-600">Showing growth trend: +{analyticsData.overview.conversationGrowth.toFixed(1)}% this period</p>
                <div className="mt-4 flex justify-center">
                  <MiniBarChart 
                    data={analyticsData.dailyTrends.slice(-13).map(d => d.conversations)} 
                    color="blue" 
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Response Time Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Response Time Analysis</CardTitle>
            <CardDescription>Average response time trends and distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 rounded-lg border border-green-100">
              <div className="text-center">
                <Clock className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-green-700 font-medium">Response Time Trends</p>
                <p className="text-sm text-green-600">Current avg: {analyticsData.overview.avgResponseTime.toFixed(1)}s</p>
                <div className="mt-4 flex justify-center">
                  <Sparkline 
                    data={analyticsData.dailyTrends.slice(-13).map(d => d.avgResponseTime || 1)} 
                    color="green" 
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Popular Queries and Recent Feedback */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Popular Queries */}
        <Card>
          <CardHeader>
            <CardTitle>Popular Queries</CardTitle>
            <CardDescription>Most frequently asked questions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.popularQueries.slice(0, 5).map((query, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {query.query}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {query.category || 'general'}
                      </Badge>
                      {query.isAnswered ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <AlertCircle className="h-3 w-3 text-red-500" />
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{query.count}</p>
                    <p className="text-xs text-gray-500">asks</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Feedback */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Feedback</CardTitle>
            <CardDescription>Latest user ratings and comments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.recentFeedback.slice(0, 5).map((feedback) => (
                <div key={feedback.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star}
                        className={`h-3 w-3 ${star <= feedback.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                      />
                    ))}
                  </div>
                  <div className="flex-1">
                    {feedback.feedback && (
                      <p className="text-sm text-gray-900 mb-1">"{feedback.feedback}"</p>
                    )}
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <span>{feedback.assistantName}</span>
                      <span>•</span>
                      <span className="capitalize">{feedback.platform.toLowerCase()}</span>
                      <span>•</span>
                      <span>{new Date(feedback.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assistant Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Assistant Performance Comparison</CardTitle>
          <CardDescription>Detailed metrics for each AI assistant</CardDescription>
        </CardHeader>
        <CardContent>
          {analyticsData.assistantPerformance.length > 0 ? (
            <div className="space-y-4">
              {analyticsData.assistantPerformance.map((assistant) => (
                <div key={assistant.assistantId} className="flex items-center justify-between p-4 border rounded-lg hover:bg-white hover:shadow-md transition-all duration-200">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Bot className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{assistant.assistantName}</h4>
                      <p className="text-sm text-gray-500">
                        {assistant.conversations} conversations • {assistant.assistantStatus.toLowerCase()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6 text-sm">
                    <div className="text-center">
                      <p className="font-medium text-gray-900">{assistant.avgSatisfaction.toFixed(1)}</p>
                      <p className="text-gray-500">Rating</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-gray-900">{assistant.avgResponseTime.toFixed(1)}s</p>
                      <p className="text-gray-500">Response</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-gray-900">{assistant.totalMessages}</p>
                      <p className="text-gray-500">Messages</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No assistant data available</p>
              <p className="text-sm text-gray-400">Create some assistants to see performance metrics</p>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
} 