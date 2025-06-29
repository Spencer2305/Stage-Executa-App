'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe } from "lucide-react";

interface Assistant {
  id: string;
  name: string;
  status: string;
  totalSessions?: number;
  documents?: any[];
  updatedAt?: string | Date;
  createdAt: string | Date;
}

interface OverviewTabProps {
  assistant: Assistant;
}

export default function OverviewTab({ assistant }: OverviewTabProps) {
  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) return 'Invalid Date';
    
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(dateObj);
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Live';
      case 'training': return 'Training';
      case 'draft': return 'Draft';
      case 'error': return 'Error';
      default: return 'Unknown';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Status Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${assistant.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <span className="font-medium">{getStatusText(assistant.status)}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {assistant.status === 'active' ? 'Responding to queries' : 'Not accepting queries'}
            </p>
          </CardContent>
        </Card>
        
        {/* Conversations Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Conversations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assistant.totalSessions || 0}</div>
            <p className="text-xs text-gray-500">Total sessions</p>
          </CardContent>
        </Card>
        
        {/* Knowledge Sources */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Knowledge Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assistant.documents?.length || 0}</div>
            <p className="text-xs text-gray-500">Documents uploaded</p>
          </CardContent>
        </Card>

        {/* Last Updated */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Last Updated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">{formatDate(assistant.updatedAt || assistant.createdAt)}</div>
            <p className="text-xs text-gray-500">Knowledge base</p>
          </CardContent>
        </Card>

        {/* Deployment Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Deployment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {assistant.status === 'active' ? (
                <div className="flex items-center space-x-2">
                  <Globe className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Website Embed</span>
                </div>
              ) : (
                <span className="text-sm text-gray-500">Not deployed</span>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Response Time */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.2s</div>
            <p className="text-xs text-green-600">⬇ 15% faster this week</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Knowledge base updated</p>
                <p className="text-xs text-gray-500">2 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">New conversation started</p>
                <p className="text-xs text-gray-500">5 hours ago</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium">Assistant deployed</p>
                <p className="text-xs text-gray-500">1 day ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 