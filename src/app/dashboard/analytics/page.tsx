"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Target
} from "lucide-react";
import { useUserStore } from "@/state/userStore";
import { useModelStore } from "@/state/modelStore";
import { useEffect } from "react";

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

export default function AnalyticsPage() {
  const { user } = useUserStore();
  const { models, fetchModels } = useModelStore();

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  // Enhanced mock data with trends
  const mockData = {
    totalConversations: 1247,
    avgResponseTime: 1.2,
    satisfactionRate: 4.6,
    topAssistant: models.length > 0 ? models[0]?.name : "Customer Support Bot",
    weeklyGrowth: 23,
    monthlyActive: 234,
    conversationTrend: [45, 52, 48, 61, 55, 67, 73, 69, 78, 82, 87, 91, 95],
    satisfactionTrend: [4.2, 4.3, 4.1, 4.4, 4.5, 4.3, 4.6, 4.7, 4.5, 4.6, 4.8, 4.7, 4.6],
    responseTimeTrend: [1.8, 1.6, 1.5, 1.4, 1.3, 1.2, 1.1, 1.0, 1.1, 1.2, 1.0, 1.1, 1.2],
    usersTrend: [15, 18, 22, 28, 25, 32, 38, 42, 45, 48, 52, 55, 60]
  };

  const assistantData = models.map((model, index) => ({
    ...model,
    conversations: Math.floor(Math.random() * 500) + 50,
    avgRating: (4 + Math.random()).toFixed(1),
    responseTime: (0.8 + Math.random() * 2).toFixed(1),
    platform: index % 2 === 0 ? 'Website' : 'Slack'
  }));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">
            Monitor performance and insights across all your AI assistants
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            All Assistants
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm">
            Last 7 days
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Enhanced Summary Boxes with Sparklines */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Most Used Assistant</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-xl font-bold text-gray-900">{mockData.topAssistant}</div>
                <p className="text-xs text-gray-500">
                  {mockData.totalConversations} conversations this month
                </p>
                <p className="text-xs text-green-600 mt-1">
                  ↗ Up {mockData.weeklyGrowth}% this week
                </p>
              </div>
              <Sparkline data={mockData.conversationTrend} color="blue" trend="up" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Highest Satisfaction</CardTitle>
            <ThumbsUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-xl font-bold text-gray-900">{mockData.satisfactionRate}/5.0</div>
                <p className="text-xs text-gray-500">
                  Average across all assistants
                </p>
                <p className="text-xs text-green-600 mt-1">
                  ↗ +0.4 improvement this month
                </p>
              </div>
              <Sparkline data={mockData.satisfactionTrend} color="green" trend="up" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Average Response Time</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-xl font-bold text-gray-900">{mockData.avgResponseTime}s</div>
                <p className="text-xs text-gray-500">
                  Avg. response 1.2s – faster than 82% of tools
                </p>
                <p className="text-xs text-green-600 mt-1">
                  ↘ {mockData.weeklyGrowth}% faster than last week
                </p>
              </div>
              <Sparkline data={mockData.responseTimeTrend} color="blue" trend="down" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Monthly Active Users</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-xl font-bold text-gray-900">{mockData.monthlyActive}</div>
                <p className="text-xs text-gray-500">
                  Unique users this month
                </p>
                <p className="text-xs text-green-600 mt-1">
                  ↗ +{mockData.weeklyGrowth}% from last month
                </p>
              </div>
              <MiniBarChart data={mockData.usersTrend} color="purple" />
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
                <p className="text-sm text-blue-600">Showing growth trend: +{mockData.weeklyGrowth}% this week</p>
                <div className="mt-4 flex justify-center">
                  <MiniBarChart data={[40, 45, 52, 48, 61, 55, 67, 73, 69, 78, 82, 87, 91]} color="blue" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Response Time Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Response Time Trends</CardTitle>
            <CardDescription>Average response time by assistant</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 rounded-lg border border-green-100">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-green-700 font-medium">Performance Metrics</p>
                <p className="text-sm text-green-600">Average: {mockData.avgResponseTime}s response time</p>
                <div className="mt-4 flex justify-center">
                  <Sparkline data={mockData.responseTimeTrend} color="green" trend="down" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtering Options */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Filter Analytics</CardTitle>
              <CardDescription>View data by platform or knowledge source</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Platform</label>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="cursor-pointer hover:bg-blue-50">
                  <Globe className="w-3 h-3 mr-1" />
                  Website (12)
                </Badge>
                <Badge variant="outline" className="cursor-pointer hover:bg-blue-50">
                  <MessageSquare className="w-3 h-3 mr-1" />
                  Slack (8)
                </Badge>
                <Badge variant="outline" className="cursor-pointer hover:bg-blue-50">
                  <Zap className="w-3 h-3 mr-1" />
                  API (3)
                </Badge>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Knowledge Source</label>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="cursor-pointer hover:bg-green-50">
                  <FileText className="w-3 h-3 mr-1" />
                  Documents (15)
                </Badge>
                <Badge variant="outline" className="cursor-pointer hover:bg-green-50">
                  <Mail className="w-3 h-3 mr-1" />
                  Gmail (5)
                </Badge>
                <Badge variant="outline" className="cursor-pointer hover:bg-green-50">
                  <Zap className="w-3 h-3 mr-1" />
                  API (2)
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Time Range</label>
              <select className="w-full p-2 border rounded-md text-sm">
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last 3 months</option>
                <option>All time</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assistant Performance Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Assistant Performance</CardTitle>
              <CardDescription>Detailed metrics for each AI assistant</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm">
                Group by Platform
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {models.length === 0 ? (
            <div className="text-center py-12">
              <Bot className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No assistants to analyze yet</h3>
              <p className="text-gray-500 mb-4">Create your first AI assistant to start seeing analytics</p>
              <div className="space-y-3">
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
                  <Target className="w-4 h-4" />
                  <span>Demo data shown below to preview the analytics experience</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {assistantData.map((assistant) => (
                <div key={assistant.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Bot className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{assistant.name}</h4>
                      <p className="text-sm text-gray-500">
                        {assistant.conversations} conversations • {assistant.platform}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6 text-sm">
                    <div className="text-center">
                      <p className="font-medium text-gray-900">{assistant.avgRating}</p>
                      <p className="text-gray-500">Rating</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-gray-900">{assistant.responseTime}s</p>
                      <p className="text-gray-500">Response</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium text-gray-900">{assistant.conversations}</p>
                      <p className="text-gray-500">Sessions</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Demo Data Section */}
          {models.length === 0 && (
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h4 className="font-medium text-gray-900 mb-4">Preview Analytics (Demo Data)</h4>
              <div className="space-y-3">
                {[
                  { name: "Customer Support Bot", conversations: 342, rating: "4.8", response: "0.9s", platform: "Website" },
                  { name: "Sales Assistant", conversations: 189, rating: "4.6", response: "1.2s", platform: "Slack" },
                  { name: "FAQ Helper", conversations: 156, rating: "4.7", response: "0.8s", platform: "Website" },
                ].map((demo, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg bg-blue-50/50 border-blue-200">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Bot className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{demo.name}</h4>
                        <p className="text-sm text-gray-500">
                          {demo.conversations} conversations • {demo.platform}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-6 text-sm">
                      <div className="text-center">
                        <p className="font-medium text-gray-900">{demo.rating}</p>
                        <p className="text-gray-500">Rating</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-gray-900">{demo.response}</p>
                        <p className="text-gray-500">Response</p>
                      </div>
                      <div className="text-center">
                        <p className="font-medium text-gray-900">{demo.conversations}</p>
                        <p className="text-gray-500">Sessions</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
                 </CardContent>
       </Card>
     </div>
   );
 } 