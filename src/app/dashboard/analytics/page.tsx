"use client";

import { useState, useEffect } from "react";
import { useModelStore } from "@/state/modelStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  BarChart3, 
  TrendingUp, 
  MessageSquare, 
  Users, 
  Clock,
  Calendar,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Bot
} from "lucide-react";

export default function AnalyticsPage() {
  const { models, fetchModels } = useModelStore();
  const [timeRange, setTimeRange] = useState("7d");

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  // Mock data - in real app this would come from your analytics API
  const analytics = {
    totalConversations: 1247,
    totalUsers: 342,
    avgResponseTime: 1.2,
    satisfactionRate: 94.5,
    conversationsChange: 12.5,
    usersChange: 8.3,
    responseTimeChange: -5.2,
    satisfactionChange: 2.1,
  };

  const timeRanges = [
    { label: "Last 7 days", value: "7d" },
    { label: "Last 30 days", value: "30d" },
    { label: "Last 3 months", value: "3m" },
    { label: "Last year", value: "1y" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground mt-1">
              Monitor your AI assistants' performance and usage
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="flex bg-muted rounded-lg p-1">
              {timeRanges.map((range) => (
                <Button
                  key={range.value}
                  variant={timeRange === range.value ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setTimeRange(range.value)}
                  className="text-xs"
                >
                  {range.label}
                </Button>
              ))}
            </div>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Conversations</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalConversations.toLocaleString()}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
                <span className="text-green-600">+{analytics.conversationsChange}%</span>
                <span className="ml-1">from last period</span>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalUsers.toLocaleString()}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
                <span className="text-green-600">+{analytics.usersChange}%</span>
                <span className="ml-1">from last period</span>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.avgResponseTime}s</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <ArrowDownRight className="h-3 w-3 text-green-600 mr-1" />
                <span className="text-green-600">{analytics.responseTimeChange}%</span>
                <span className="ml-1">faster</span>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Satisfaction Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.satisfactionRate}%</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <ArrowUpRight className="h-3 w-3 text-green-600 mr-1" />
                <span className="text-green-600">+{analytics.satisfactionChange}%</span>
                <span className="ml-1">from last period</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Conversations Over Time */}
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Conversations Over Time</CardTitle>
              <CardDescription>
                Daily conversation volume and trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Placeholder for chart - in real app use recharts or similar */}
              <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Chart visualization would go here</p>
                  <p className="text-xs text-muted-foreground">(Integration with charting library needed)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Response Time Distribution */}
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Response Time Distribution</CardTitle>
              <CardDescription>
                How quickly your AI responds to queries
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted/20 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Response time chart would go here</p>
                  <p className="text-xs text-muted-foreground">(Integration with charting library needed)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Tables */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Top Performing Assistants */}
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Top Performing Assistants</CardTitle>
              <CardDescription>
                Ranked by conversation volume and satisfaction
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {models.length === 0 ? (
                  <div className="text-center py-8">
                    <Bot className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-2">No assistants yet</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Create your first AI assistant to see analytics
                    </p>
                    <Button asChild size="sm">
                      <Link href="/dashboard/create">Create Assistant</Link>
                    </Button>
                  </div>
                ) : (
                  models
                    .sort((a, b) => b.totalSessions - a.totalSessions)
                    .slice(0, 4)
                    .map((assistant, index) => (
                      <div key={assistant.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{assistant.name}</p>
                            <p className="text-sm text-muted-foreground">{assistant.totalSessions} conversations</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="text-right">
                            <p className="font-bold text-green-600">
                              {assistant.status === 'active' ? '98%' : '--'}
                            </p>
                            <p className="text-xs text-muted-foreground">satisfaction</p>
                          </div>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/dashboard/assistants/${assistant.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest interactions and events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { action: "New conversation started", assistant: "Customer Support Bot", time: "2 minutes ago" },
                  { action: "Training completed", assistant: "HR Assistant", time: "15 minutes ago" },
                  { action: "High satisfaction rating", assistant: "Product Guide", time: "1 hour ago" },
                  { action: "Document updated", assistant: "Technical Support", time: "2 hours ago" },
                  { action: "New user interaction", assistant: "Customer Support Bot", time: "3 hours ago" },
                ].map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">{activity.assistant}</p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {activity.time}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 