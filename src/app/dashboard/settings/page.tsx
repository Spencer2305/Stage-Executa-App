"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar } from "@/components/ui/avatar";
import { 
  User, 
  Bell, 
  CreditCard, 
  Shield, 
  Key,
  Trash2,
  Save,
  Eye,
  EyeOff,
  Mail,
  Globe,
  Smartphone,
  Zap,
  Database,
  Settings as SettingsIcon,
  CheckCircle,
  XCircle,
  Plus,
  ExternalLink,
  HelpCircle,
  MessageSquare,
  FileText,
  Cloud,
  ShoppingCart,
  Users,
  Video,
  Calendar,
  Briefcase,
  BarChart3,
  Clock
} from "lucide-react";
import { useUserStore } from "@/state/userStore";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

// Integration logo component for better visual representation
function IntegrationLogo({ name, className = "w-8 h-8" }: { name: string, className?: string }) {
  const logoMap: { [key: string]: string } = {
    'gmail': '🔴', // Gmail red
    'drive': '🔵', // Google Drive blue
    'slack': '🟣', // Slack purple
    'notion': '⚫', // Notion black
    'intercom': '🔵', // Intercom blue
    'zapier': '🟠', // Zapier orange
    'discord': '🟣', // Discord purple
    'zendesk': '🟢', // Zendesk green
    'hubspot': '🟠', // HubSpot orange
    'salesforce': '🔵', // Salesforce blue
    'microsoft-teams': '🟣', // Microsoft Teams purple
    'dropbox': '🔵', // Dropbox blue
    'confluence': '🔵', // Confluence blue
    'jira': '🔵', // Jira blue
    'trello': '🔵', // Trello blue
    'shopify': '🟢', // Shopify green
    'stripe': '🟣', // Stripe purple
    'zoom': '🔵', // Zoom blue
    'calendly': '🟠', // Calendly orange
    'airtable': '🟡', // Airtable yellow
    'monday': '🟠', // Monday.com orange
    'asana': '🔴', // Asana red
  };

  // For now, using emoji placeholders - in production, these would be actual company logos
  const emoji = logoMap[name] || '⚡';
  
  return (
    <div className={`${className} rounded-lg flex items-center justify-center text-2xl bg-gray-50 border`}>
      {emoji}
    </div>
  );
}

// Enhanced integration card component with logos
function IntegrationCard({ 
  id,
  name, 
  description, 
  icon: Icon, 
  connected = false, 
  comingSoon = false,
  popular = false,
  category,
  onConnect,
  onDisconnect
}: {
  id: string;
  name: string;
  description: string;
  icon: any;
  connected?: boolean;
  comingSoon?: boolean;
  popular?: boolean;
  category?: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
}) {
  return (
    <Card className="border border-gray-200 hover:shadow-md transition-shadow relative">
      {popular && (
        <div className="absolute -top-2 -right-2">
          <Badge className="bg-green-500 text-white text-xs px-2 py-1">Popular</Badge>
        </div>
      )}
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="relative">
              <IntegrationLogo name={id} className="w-12 h-12" />
              {connected && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-3 w-3 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-semibold text-gray-900">{name}</h3>
                {category && (
                  <Badge variant="outline" className="text-xs text-gray-500">
                    {category}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-3">{description}</p>
              {connected && (
                <div className="flex items-center space-x-1 text-xs text-green-600">
                  <CheckCircle className="h-3 w-3" />
                  <span>Connected and syncing</span>
                </div>
              )}
              {comingSoon && (
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <Clock className="h-3 w-3" />
                  <span>Coming Q1 2024</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col space-y-2">
            {comingSoon ? (
              <Button variant="outline" size="sm" disabled>
                Coming Soon
              </Button>
            ) : connected ? (
              <>
                <Button variant="outline" size="sm" onClick={onDisconnect}>
                  Disconnect
                </Button>
                <Button variant="ghost" size="sm">
                  <SettingsIcon className="h-4 w-4 mr-1" />
                  Configure
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={onConnect} className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-1" />
                Connect
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to main dashboard
    router.push('/dashboard');
  }, []);

  const { user, updateUser } = useUserStore();
  const [showApiKey, setShowApiKey] = useState(false);
  const [profile, setProfile] = useState({
    name: user?.name || "",
    email: user?.email || "",
    bio: "",
    company: "",
    website: "",
  });
  
  const [avatarUploading, setAvatarUploading] = useState(false);

  const [notifications, setNotifications] = useState({
    emailUpdates: true,
    securityAlerts: true,
    marketingEmails: false,
    weeklyReports: true,
  });

  const apiKey = "exec_sk_1234567890abcdef";

  const [connectedIntegrations, setConnectedIntegrations] = useState(new Set(['gmail', 'slack']));

  const handleConnect = (integration: string) => {
    setConnectedIntegrations(prev => new Set([...prev, integration]));
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.');
      return;
    }

    // Validate file size (2MB max)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      toast.error('File too large. Maximum size is 2MB.');
      return;
    }

    setAvatarUploading(true);

    try {
      console.log('🚀 Starting avatar upload for file:', file.name, file.type, file.size);
      
      const formData = new FormData();
      formData.append('avatar', file);

      const token = localStorage.getItem('executa-auth-token');
      console.log('🔑 Token available:', !!token);
      
      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      console.log('📡 Response status:', response.status);
      const data = await response.json();
      console.log('📋 Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload avatar');
      }

      // Update user in store
      console.log('🔄 Updating user store with avatar:', data.user.avatar ? 'present' : 'missing');
      updateUser({ avatar: data.user.avatar });
      toast.success('Avatar updated successfully!');

    } catch (error) {
      console.error('Avatar upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload avatar');
    } finally {
      setAvatarUploading(false);
      // Reset the input
      event.target.value = '';
    }
  };

  const handleAvatarRemove = async () => {
    if (!confirm('Are you sure you want to remove your profile picture?')) {
      return;
    }

    setAvatarUploading(true);

    try {
      const token = localStorage.getItem('executa-auth-token');
      const response = await fetch('/api/user/avatar', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove avatar');
      }

      // Update user in store
      updateUser({ avatar: undefined });
      toast.success('Avatar removed successfully!');

    } catch (error) {
      console.error('Avatar removal error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to remove avatar');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleDisconnect = (integration: string) => {
    setConnectedIntegrations(prev => {
      const newSet = new Set(prev);
      newSet.delete(integration);
      return newSet;
    });
  };

  // Comprehensive integrations organized by category
  const integrations = {
    communication: [
      {
        id: 'gmail',
        name: 'Gmail',
        description: 'Import emails and conversations to train your AI assistant with real customer interactions',
        icon: Mail,
        connected: connectedIntegrations.has('gmail'),
        popular: true,
        category: 'Email'
      },
      {
        id: 'slack',
        name: 'Slack',
        description: 'Deploy your AI assistant directly in Slack channels and DMs for team collaboration',
        icon: MessageSquare,
        connected: connectedIntegrations.has('slack'),
        popular: true,
        category: 'Chat'
      },
      {
        id: 'discord',
        name: 'Discord',
        description: 'Add your AI assistant to Discord servers for community support and engagement',
        icon: MessageSquare,
        connected: connectedIntegrations.has('discord'),
        category: 'Chat'
      },
      {
        id: 'microsoft-teams',
        name: 'Microsoft Teams',
        description: 'Integrate with Teams for enterprise communication and collaboration',
        icon: MessageSquare,
        connected: connectedIntegrations.has('microsoft-teams'),
        category: 'Enterprise'
      },
      {
        id: 'zoom',
        name: 'Zoom',
        description: 'Provide meeting summaries and follow-up assistance for video conferences',
        icon: Video,
        connected: connectedIntegrations.has('zoom'),
        comingSoon: true,
        category: 'Video'
      }
    ],
    knowledge: [
      {
        id: 'drive',
        name: 'Google Drive',
        description: 'Access documents, spreadsheets, and files from your Google Drive workspace',
        icon: Database,
        connected: connectedIntegrations.has('drive'),
        popular: true,
        category: 'Cloud Storage'
      },
      {
        id: 'notion',
        name: 'Notion',
        description: 'Connect your Notion workspace, databases, and knowledge base for comprehensive training',
        icon: Database,
        connected: connectedIntegrations.has('notion'),
        comingSoon: true,
        category: 'Knowledge Base'
      },
      {
        id: 'confluence',
        name: 'Confluence',
        description: 'Import team documentation and wikis from Atlassian Confluence',
        icon: FileText,
        connected: connectedIntegrations.has('confluence'),
        comingSoon: true,
        category: 'Documentation'
      },
      {
        id: 'dropbox',
        name: 'Dropbox',
        description: 'Access and train on documents stored in your Dropbox account',
        icon: Cloud,
        connected: connectedIntegrations.has('dropbox'),
        category: 'Cloud Storage'
      },
      {
        id: 'airtable',
        name: 'Airtable',
        description: 'Connect to Airtable databases for structured data and workflows',
        icon: Database,
        connected: connectedIntegrations.has('airtable'),
        comingSoon: true,
        category: 'Database'
      }
    ],
    crm: [
      {
        id: 'hubspot',
        name: 'HubSpot',
        description: 'Integrate with HubSpot CRM for customer data and sales pipeline assistance',
        icon: Users,
        connected: connectedIntegrations.has('hubspot'),
        popular: true,
        category: 'CRM'
      },
      {
        id: 'salesforce',
        name: 'Salesforce',
        description: 'Connect to Salesforce for comprehensive customer relationship management',
        icon: BarChart3,
        connected: connectedIntegrations.has('salesforce'),
        category: 'Enterprise CRM'
      },
      {
        id: 'intercom',
        name: 'Intercom',
        description: 'Integrate with your customer support platform for seamless ticket handling',
        icon: MessageSquare,
        connected: connectedIntegrations.has('intercom'),
        comingSoon: true,
        category: 'Support'
      },
      {
        id: 'zendesk',
        name: 'Zendesk',
        description: 'Connect to Zendesk for customer support ticket management and automation',
        icon: HelpCircle,
        connected: connectedIntegrations.has('zendesk'),
        category: 'Support'
      }
    ],
    productivity: [
      {
        id: 'calendly',
        name: 'Calendly',
        description: 'Help users schedule meetings and manage appointments through your assistant',
        icon: Calendar,
        connected: connectedIntegrations.has('calendly'),
        category: 'Scheduling'
      },
      {
        id: 'trello',
        name: 'Trello',
        description: 'Manage boards, cards, and project workflows through AI assistance',
        icon: Briefcase,
        connected: connectedIntegrations.has('trello'),
        category: 'Project Management'
      },
      {
        id: 'asana',
        name: 'Asana',
        description: 'Connect to Asana for task management and team project coordination',
        icon: CheckCircle,
        connected: connectedIntegrations.has('asana'),
        category: 'Project Management'
      },
      {
        id: 'monday',
        name: 'Monday.com',
        description: 'Integrate with Monday.com for work management and team collaboration',
        icon: Calendar,
        connected: connectedIntegrations.has('monday'),
        comingSoon: true,
        category: 'Work Management'
      },
      {
        id: 'jira',
        name: 'Jira',
        description: 'Connect to Atlassian Jira for issue tracking and agile project management',
        icon: Briefcase,
        connected: connectedIntegrations.has('jira'),
        comingSoon: true,
        category: 'Issue Tracking'
      }
    ],
    ecommerce: [
      {
        id: 'shopify',
        name: 'Shopify',
        description: 'Provide customer support and product recommendations for your Shopify store',
        icon: ShoppingCart,
        connected: connectedIntegrations.has('shopify'),
        category: 'E-commerce'
      },
      {
        id: 'stripe',
        name: 'Stripe',
        description: 'Handle payment inquiries and billing support through Stripe integration',
        icon: CreditCard,
        connected: connectedIntegrations.has('stripe'),
        category: 'Payments'
      }
    ],
    automation: [
      {
        id: 'zapier',
        name: 'Zapier',
        description: 'Connect to 5000+ apps through Zapier automations and workflows',
        icon: Zap,
        connected: connectedIntegrations.has('zapier'),
        popular: true,
        comingSoon: true,
        category: 'Automation'
      },
      {
        id: 'api',
        name: 'REST API',
        description: 'Integrate your AI assistant with custom applications using our REST API',
        icon: Globe,
        connected: connectedIntegrations.has('api'),
        category: 'Developer'
      },
      {
        id: 'website',
        name: 'Website Widget',
        description: 'Add a customizable chat widget to your website for visitor engagement',
        icon: Globe,
        connected: connectedIntegrations.has('website'),
        popular: true,
        category: 'Web'
      }
    ]
  };

  const allIntegrations = Object.values(integrations).flat();
  const connectedCount = allIntegrations.filter(i => i.connected).length;
  const availableCount = allIntegrations.filter(i => !(i as any).comingSoon).length;

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Redirecting...</h1>
        <p className="text-gray-600">Taking you to the dashboard.</p>
      </div>
    </div>
  );
} 