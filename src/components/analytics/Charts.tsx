'use client';

import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, TooltipProps
} from 'recharts';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ConversationTrendsData {
  date: string;
  conversations: number;
  messages: number;
  uniqueUsers: number;
  avgResponseTime: number;
  avgSatisfaction: number;
  errorRate: number;
}

interface ConversationTrendsChartProps {
  data: ConversationTrendsData[];
}

interface ResponseTimeData {
  fast: number;
  medium: number;
  slow: number;
  verySlow: number;
}

interface ResponseTimeChartProps {
  data: ResponseTimeData;
}

interface MiniTrendData {
  date: string;
  value: number;
}

interface MiniTrendChartProps {
  data: MiniTrendData[];
  color?: string;
}

interface Message {
  id: string;
  role: 'USER' | 'ASSISTANT';
  content: string;
  timestamp: string;
  responseTime?: number | null;
  hasError: boolean;
}

interface Conversation {
  id: string;
  assistantId: string;
  assistantName: string;
  platform: string;
  totalMessages: number;
  userMessages: number;
  assistantMessages: number;
  avgResponseTime?: number | null;
  userSatisfaction?: number | null;
  status: string;
  hasErrors: boolean;
  createdAt: string;
  lastMessageAt: string;
  messages: Message[];
}

interface ConversationsListProps {
  conversations: Conversation[];
}

// Custom tooltip for conversation trends
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="text-sm font-medium text-gray-900">{`Date: ${label}`}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {`${entry.dataKey}: ${entry.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Custom tooltip for response time chart
const ResponseTimeTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="text-sm font-medium text-gray-900">{data.name}</p>
        <p className="text-sm" style={{ color: data.color }}>
          {`Count: ${data.value}`}
        </p>
        <p className="text-xs text-gray-500">
          {`${((data.value / data.payload.total) * 100).toFixed(1)}%`}
        </p>
      </div>
    );
  }
  return null;
};

export function ConversationTrendsChart({ data }: ConversationTrendsChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorConversations" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 12 }}
          tickFormatter={(value) => {
            const date = new Date(value);
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          }}
        />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="conversations"
          stroke="#3b82f6"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorConversations)"
          name="Conversations"
        />
        <Area
          type="monotone"
          dataKey="messages"
          stroke="#10b981"
          strokeWidth={2}
          fillOpacity={1}
          fill="url(#colorMessages)"
          name="Messages"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ResponseTimeChart({ data }: ResponseTimeChartProps) {
  const chartData = [
    { name: 'Fast (<2s)', value: data.fast, color: '#10b981', total: data.fast + data.medium + data.slow + data.verySlow },
    { name: 'Medium (2-5s)', value: data.medium, color: '#f59e0b', total: data.fast + data.medium + data.slow + data.verySlow },
    { name: 'Slow (5-10s)', value: data.slow, color: '#ef4444', total: data.fast + data.medium + data.slow + data.verySlow },
    { name: 'Very Slow (>10s)', value: data.verySlow, color: '#dc2626', total: data.fast + data.medium + data.slow + data.verySlow },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={120}
          paddingAngle={2}
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<ResponseTimeTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function MiniTrendChart({ data, color = '#3b82f6' }: MiniTrendChartProps) {
  return (
    <ResponsiveContainer width="100%" height={60}>
      <LineChart data={data}>
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function ConversationsList({ conversations }: ConversationsListProps) {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (conversation: Conversation) => {
    if (conversation.hasErrors) {
      return <Badge variant="destructive" className="text-xs">Error</Badge>;
    }
    if (conversation.status === 'ACTIVE') {
      return <Badge variant="default" className="text-xs bg-green-100 text-green-800">Active</Badge>;
    }
    return <Badge variant="secondary" className="text-xs">Inactive</Badge>;
  };

  return (
    <>
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold">Recent Conversations</CardTitle>
          <p className="text-sm text-gray-600">Latest interactions with your AI assistants</p>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            <div className="space-y-1 p-4">
              {conversations.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No conversations yet</p>
                  <p className="text-sm">Start chatting with your assistants to see conversations here</p>
                </div>
              ) : (
                conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation)}
                    className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {conversation.assistantName}
                          </h4>
                          {getStatusBadge(conversation)}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                          <span>{conversation.totalMessages} messages</span>
                          <span>{conversation.platform}</span>
                          {conversation.avgResponseTime && (
                            <span>{conversation.avgResponseTime.toFixed(1)}s avg</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          {conversation.messages.length > 0 && (
                            <p className="truncate">
                              {conversation.messages[conversation.messages.length - 1].content}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0 ml-2">
                        <p className="text-xs text-gray-400">
                          {formatTime(conversation.lastMessageAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Conversation Detail Modal */}
      <Dialog open={!!selectedConversation} onOpenChange={() => setSelectedConversation(null)}>
        <DialogContent className="max-w-6xl max-h-[80vh] p-0 overflow-hidden">
          {/* Header */}
          <div className="border-b border-gray-200 bg-white px-6 py-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold text-gray-900 flex items-center justify-between">
                <span>Conversation Details</span>
                {selectedConversation && getStatusBadge(selectedConversation)}
              </DialogTitle>
              {selectedConversation && (
                <div className="text-sm text-gray-600 mt-2 space-y-1">
                  <div className="flex items-center gap-6">
                    <span><strong>Assistant:</strong> {selectedConversation.assistantName}</span>
                    <span><strong>Messages:</strong> {selectedConversation.totalMessages}</span>
                    <span><strong>Platform:</strong> {selectedConversation.platform}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <span><strong>Started:</strong> {formatTime(selectedConversation.createdAt)}</span>
                    {selectedConversation.avgResponseTime && (
                      <span><strong>Avg Response:</strong> {selectedConversation.avgResponseTime.toFixed(1)}s</span>
                    )}
                  </div>
                </div>
              )}
            </DialogHeader>
          </div>
          
          {/* Chat Messages */}
          <div className="flex-1 bg-gray-50">
            <ScrollArea className="h-[500px] px-6 py-4">
              <div className="space-y-4">
                {selectedConversation?.messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                    <p className="text-gray-600 mb-2">No messages in this conversation</p>
                    <p className="text-sm text-gray-500">The conversation log appears to be empty</p>
                  </div>
                ) : (
                  selectedConversation?.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'USER' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] ${message.role === 'USER' ? 'order-2' : 'order-1'}`}>
                        {/* Message Header */}
                        <div className={`flex items-center gap-2 mb-1 text-xs text-gray-500 ${
                          message.role === 'USER' ? 'justify-end' : 'justify-start'
                        }`}>
                          <span className="font-medium">
                            {message.role === 'USER' ? 'User' : selectedConversation.assistantName}
                          </span>
                          <span>{formatTime(message.timestamp)}</span>
                                                     {message.responseTime && (
                             <span className="text-purple-600">
                               {message.responseTime.toFixed(1)}s
                             </span>
                           )}
                          {message.hasError && (
                            <Badge variant="destructive" className="text-xs">Error</Badge>
                          )}
                        </div>

                        {/* Message Content */}
                                                 <div
                           className={`p-3 rounded-lg border ${
                             message.role === 'USER'
                               ? 'bg-purple-600 text-white border-purple-600'
                               : message.hasError
                               ? 'bg-red-50 border-red-200 text-red-900'
                               : 'bg-white border-gray-200 text-gray-900'
                           }`}
                         >
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">
                            {message.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 bg-white px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6 text-xs text-gray-500">
                <span>ID: {selectedConversation?.id.slice(-8)}</span>
                {selectedConversation?.userSatisfaction && (
                  <span>Rating: {selectedConversation.userSatisfaction.toFixed(1)}/5</span>
                )}
              </div>
              <button
                onClick={() => setSelectedConversation(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 