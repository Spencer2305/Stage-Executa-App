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
  Calendar,
  Bot,
  Globe,
  Activity,
  ThumbsUp,
  ChevronDown,
  TrendingDown,
  AlertCircle,
  RefreshCw,
  Database,
  Zap,
  Target
} from "lucide-react";
import { useEffect, useState } from "react";
import fetchApi from "@/utils/api";

// Simple Sparkline Component
function Sparkline({ data, color = "blue" }: { 
  data: number[], 
  color?: string
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

interface AssistantAnalyticsData {
  assistant: {
    id: string;
    name: string;
    status: string;
    createdAt: string;
  };
  overview: {
    totalConversations: number;
    totalMessages: number;
    userMessages: number;
    assistantMessages: number;
    uniqueUsers: number;
    avgResponseTime: number;
    avgSatisfaction: number;
    errorRate: number;
    conversationGrowth: number;
    satisfactionChange: number;
  };
  platformBreakdown: Array<{
    platform: string;
    conversations: number;
    messages: number;
    avgResponseTime: number;
    avgSatisfaction: number;
  }>;
  hourlyUsage: Array<{
    hour: number;
    conversations: number;
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
  recentConversations: Array<{
    id: string;
    platform: string;
    totalMessages: number;
    avgResponseTime?: number;
    userSatisfaction?: number;
    status: string;
    duration?: number;
    createdAt: string;
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
  feedback: {
    totalFeedback: number;
    avgRating: number;
    recent: Array<{
      id: string;
      rating: number;
      feedback?: string;
      feedbackType: string;
      platform: string;
      createdAt: string;
    }>;
  };
  responseTimeDistribution: {
    fast: number;
    medium: number;
    slow: number;
    verySlow: number;
  };
  timeRange: string;
  dateRange: {
    start: string;
    end: string;
  };
}

interface Props {
  assistantId: string;
}

export default function AssistantAnalytics({ assistantId }: Props) {
  const [analyticsData, setAnalyticsData] = useState<AssistantAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState("Last 7 days");

  // Time range options
  const timeRangeOptions = [
    "Last 24 hours",
    "Last 7 days", 
    "Last 30 days",
    "Last 3 months",
    "Last 6 months",
    "Last year"
  ];

  // Function to fetch assistant analytics data
  const fetchAssistantAnalytics = async () => {
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
        "Last year": "1y"
      };

      const apiTimeRange = timeRangeMap[selectedTimeRange] || "7d";
      const params = new URLSearchParams({
        timeRange: apiTimeRange,
      });

      const response = await fetchApi(`/analytics/${assistantId}?${params.toString()}`);
      
      if (response.data && response.data.success) {
        setAnalyticsData(response.data.data);
        setUsingMockData(false);
      } else {
        throw new Error(response.data?.error || 'Failed to fetch assistant analytics');
      }
    } catch (err) {
      console.error('Assistant analytics fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
      
      // Fallback to mock data
      setAnalyticsData(generateMockAssistantData());
      setUsingMockData(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate mock data as fallback
  const generateMockAssistantData = (): AssistantAnalyticsData => {
    return {
      assistant: {
        id: assistantId,
        name: "AI Assistant",
        status: "active",
        createdAt: new Date().toISOString(),
      },
      overview: {
        totalConversations: 234,
        totalMessages: 1456,
        userMessages: 728,
        assistantMessages: 728,
        uniqueUsers: 89,
        avgResponseTime: 1.1,
        avgSatisfaction: 4.7,
        errorRate: 1.8,
        conversationGrowth: 15.3,
        satisfactionChange: 0.2,
      },
      platformBreakdown: [
        { platform: "WEBSITE", conversations: 180, messages: 1100, avgResponseTime: 1.0, avgSatisfaction: 4.8 },
        { platform: "SLACK", conversations: 35, messages: 245, avgResponseTime: 1.3, avgSatisfaction: 4.5 },
        { platform: "API", conversations: 19, messages: 111, avgResponseTime: 0.9, avgSatisfaction: 4.6 },
      ],
      hourlyUsage: Array.from({ length: 24 }, (_, hour) => ({
        hour,
        conversations: Math.floor(Math.random() * 15) + 2,
      })),
      dailyTrends: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString(),
        conversations: Math.floor(Math.random() * 40) + 10,
        messages: Math.floor(Math.random() * 200) + 50,
        uniqueUsers: Math.floor(Math.random() * 20) + 5,
        avgResponseTime: Math.random() * 1.5 + 0.5,
        avgSatisfaction: Math.random() * 1 + 4,
        errorRate: Math.random() * 3,
      })),
      recentConversations: Array.from({ length: 5 }, (_, i) => ({
        id: `conv_${i}`,
        platform: ["WEBSITE", "SLACK", "API"][Math.floor(Math.random() * 3)],
        totalMessages: Math.floor(Math.random() * 10) + 2,
        avgResponseTime: Math.random() * 2 + 0.5,
        userSatisfaction: Math.random() * 2 + 3,
        status: Math.random() > 0.9 ? "ERROR" : "COMPLETED",
        duration: Math.floor(Math.random() * 30) + 2,
        createdAt: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
      })),
      popularQueries: [
        { query: "How do I get started?", count: 45, isAnswered: true, category: "onboarding", lastAsked: new Date().toISOString() },
        { query: "What features are available?", count: 32, isAnswered: true, category: "features", lastAsked: new Date().toISOString() },
        { query: "How much does it cost?", count: 28, isAnswered: true, category: "pricing", lastAsked: new Date().toISOString() },
        { query: "Can I integrate with my app?", count: 24, isAnswered: true, category: "integration", lastAsked: new Date().toISOString() },
      ],
      feedback: {
        totalFeedback: 67,
        avgRating: 4.7,
        recent: [
          { id: "1", rating: 5, feedback: "Very helpful!", feedbackType: "RATING", platform: "WEBSITE", createdAt: new Date().toISOString() },
          { id: "2", rating: 4, feedback: "Quick responses", feedbackType: "RATING", platform: "SLACK", createdAt: new Date().toISOString() },
          { id: "3", rating: 5, feedbackType: "THUMBS_UP", platform: "WEBSITE", createdAt: new Date().toISOString() },
        ],
      },
      responseTimeDistribution: {
        fast: 156,    // < 1s
        medium: 45,   // 1-3s
        slow: 23,     // 3-10s
        verySlow: 10, // > 10s
      },
      timeRange: selectedTimeRange,
      dateRange: {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString(),
      },
    };
  };

  // Fetch data when component mounts or filters change
  useEffect(() => {
    fetchAssistantAnalytics();
  }, [assistantId, selectedTimeRange]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading assistant analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Failed to load assistant analytics</p>
            <Button onClick={fetchAssistantAnalytics} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const peakHour = analyticsData.hourlyUsage.reduce((max, current) => 
    current.conversations > max.conversations ? current : max
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics</h2>
          <p className="text-gray-600 mt-1">
            Performance insights for {analyticsData.assistant.name}
          </p>
          {usingMockData && (
            <div className="flex items-center mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md">
              <Database className="h-4 w-4 text-amber-600 mr-2" />
              <span className="text-sm text-amber-800">
                Showing demo data. Real analytics will appear after conversations.
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
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

          {/* Refresh Button */}
          <Button onClick={fetchAssistantAnalytics} variant="outline" size="sm">
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
            <CardTitle className="text-sm font-medium">User Satisfaction</CardTitle>
            <Star className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.avgSatisfaction.toFixed(1)}/5</div>
            <div className="flex items-center text-xs">
              {analyticsData.overview.satisfactionChange >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
              )}
              <span className={analyticsData.overview.satisfactionChange >= 0 ? "text-green-600" : "text-red-600"}>
                {analyticsData.overview.satisfactionChange >= 0 ? '+' : ''}{analyticsData.overview.satisfactionChange.toFixed(1)}
              </span>
              <span className="text-gray-500 ml-1">change</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.avgResponseTime.toFixed(1)}s</div>
            <p className="text-xs text-gray-500">
              Average response time
            </p>
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
      </div>

      {/* Platform Breakdown and Usage Patterns */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Platform Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Breakdown</CardTitle>
            <CardDescription>Conversations by platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.platformBreakdown.map((platform) => (
                <div key={platform.platform} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Globe className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 capitalize">
                        {platform.platform.toLowerCase()}
                      </p>
                      <p className="text-sm text-gray-500">
                        {platform.conversations} conversations
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{platform.avgSatisfaction.toFixed(1)}/5</p>
                    <p className="text-xs text-gray-500">{platform.avgResponseTime.toFixed(1)}s avg</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Usage Patterns */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Patterns</CardTitle>
            <CardDescription>Peak hours and activity distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Peak Hour</p>
                  <p className="text-sm text-gray-500">Most active time</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-blue-600">
                    {peakHour.hour}:00
                  </p>
                  <p className="text-xs text-gray-500">{peakHour.conversations} conversations</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Unique Users</p>
                  <p className="text-sm text-gray-500">Active users in period</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-green-600">
                    {analyticsData.overview.uniqueUsers}
                  </p>
                  <p className="text-xs text-gray-500">users</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Messages Per Chat</p>
                  <p className="text-sm text-gray-500">Average interaction length</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-purple-600">
                    {(analyticsData.overview.totalMessages / analyticsData.overview.totalConversations).toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-500">messages</p>
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
            <div className="space-y-3">
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
            <CardTitle>User Feedback</CardTitle>
            <CardDescription>Latest ratings and comments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Average Rating</p>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star}
                        className={`h-4 w-4 ${star <= Math.round(analyticsData.feedback.avgRating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                      />
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-yellow-600">
                    {analyticsData.feedback.avgRating.toFixed(1)}/5
                  </p>
                  <p className="text-xs text-gray-500">{analyticsData.feedback.totalFeedback} reviews</p>
                </div>
              </div>
              
              {analyticsData.feedback.recent.slice(0, 3).map((feedback) => (
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

      {/* Response Time Analysis and Recent Conversations */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Response Time Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Response Time Analysis</CardTitle>
            <CardDescription>Distribution of response times</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Fast (&lt; 1s)</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${(analyticsData.responseTimeDistribution.fast / analyticsData.overview.totalConversations) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600">{analyticsData.responseTimeDistribution.fast}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Medium (1-3s)</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-yellow-500 h-2 rounded-full" 
                      style={{ width: `${(analyticsData.responseTimeDistribution.medium / analyticsData.overview.totalConversations) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600">{analyticsData.responseTimeDistribution.medium}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Slow (3-10s)</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-orange-500 h-2 rounded-full" 
                      style={{ width: `${(analyticsData.responseTimeDistribution.slow / analyticsData.overview.totalConversations) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600">{analyticsData.responseTimeDistribution.slow}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Very Slow (&gt; 10s)</span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full" 
                      style={{ width: `${(analyticsData.responseTimeDistribution.verySlow / analyticsData.overview.totalConversations) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600">{analyticsData.responseTimeDistribution.verySlow}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Conversations */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Conversations</CardTitle>
            <CardDescription>Latest user interactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analyticsData.recentConversations.map((conversation) => (
                <div key={conversation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${conversation.status === 'ERROR' ? 'bg-red-500' : 'bg-green-500'}`} />
                    <div>
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {conversation.platform.toLowerCase()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {conversation.totalMessages} messages • {conversation.duration}min
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {conversation.userSatisfaction ? `${conversation.userSatisfaction.toFixed(1)}/5` : '—'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(conversation.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 