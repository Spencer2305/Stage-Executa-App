"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, CheckCircle, AlertCircle, RefreshCw, Settings, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface GmailIntegrationProps {
  assistantId: string;
}

interface GmailStatus {
  connected: boolean;
  email?: string;
  connectedAt?: string;
  loading?: boolean;
  totalEmails?: number;
  lastSync?: string;
}

export default function GmailIntegration({ assistantId }: GmailIntegrationProps) {
  const [gmailStatus, setGmailStatus] = useState<GmailStatus>({ 
    connected: false, 
    loading: true 
  });
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    checkGmailStatus();
  }, []);

  const checkGmailStatus = async () => {
    try {
      const token = localStorage.getItem('executa-auth-token');
      const response = await fetch('/api/integrations/gmail/status', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setGmailStatus({
          connected: data.connected,
          email: data.email,
          connectedAt: data.connectedAt,
          loading: false,
          totalEmails: data.totalEmails || 0,
          lastSync: data.lastSync
        });
      } else {
        setGmailStatus({ connected: false, loading: false });
      }
    } catch (error) {
      console.error('Failed to check Gmail status:', error);
      setGmailStatus({ connected: false, loading: false });
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const token = localStorage.getItem('executa-auth-token');
      const response = await fetch('/api/integrations/gmail/sync', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assistantId })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Started syncing ${data.emailCount || 0} emails`);
        
        // Refresh status after a delay
        setTimeout(() => {
          checkGmailStatus();
        }, 2000);
      } else {
        throw new Error('Failed to sync emails');
      }
    } catch (error) {
      console.error('Gmail sync error:', error);
      toast.error('Failed to sync Gmail emails. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  if (gmailStatus.loading) {
    return (
      <div className="h-full flex flex-col space-y-4">
        <div>
          <h3 className="text-lg font-medium">Gmail Setup</h3>
          <p className="text-sm text-muted-foreground">
            Loading Gmail connection status...
          </p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!gmailStatus.connected) {
    return (
      <div className="h-full flex flex-col space-y-4">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg font-medium">Gmail Setup</h3>
            <Badge variant="secondary">Not Connected</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Connect your Gmail account to train your AI with email conversations and customer interactions.
          </p>
        </div>
        <div className="flex-1 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Why connect Gmail?</h4>
                <ul className="text-sm text-blue-700 mt-2 space-y-1">
                  <li>• Train your AI with real customer conversations</li>
                  <li>• Improve response quality based on email patterns</li>
                  <li>• Automatically process new important emails</li>
                  <li>• Maintain conversation context and history</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <Link href="/dashboard/settings?tab=integrations" target="_blank">
              <Button className="flex-1">
                <Settings className="h-4 w-4 mr-2" />
                Connect Gmail
                <ExternalLink className="h-3 w-3 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-4">
      <div>
        <div className="flex items-center space-x-2 mb-2">
          <h3 className="text-lg font-medium">Gmail Setup</h3>
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Connected
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Connected to {gmailStatus.email}
        </p>
      </div>
      <div className="flex-1 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-gray-600">Total Emails</div>
            <div className="text-2xl font-semibold text-gray-900">
              {gmailStatus.totalEmails?.toLocaleString() || '0'}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm text-gray-600">Last Sync</div>
            <div className="text-sm font-medium text-gray-900">
              {gmailStatus.lastSync 
                ? new Date(gmailStatus.lastSync).toLocaleDateString()
                : 'Never'
              }
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          <Button 
            onClick={handleSync}
            disabled={syncing}
            className="flex-1"
          >
            {syncing ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {syncing ? 'Syncing...' : 'Sync Now'}
          </Button>
          
          <Link href="/dashboard/settings?tab=integrations" target="_blank">
            <Button variant="outline">
              <ExternalLink className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </Link>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <strong>Free Tier:</strong> Only the last 30 days and 1,000 most recent emails will be processed. 
              Upgrade to Pro for unlimited history.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 