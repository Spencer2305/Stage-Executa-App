"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  Clock,
  Upload,
  Download,
  X,
  Check,
  Star,
  Zap as ZapIcon,
  AlertTriangle
} from "lucide-react";
import { useUserStore } from "@/state/userStore";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useNotification } from "@/components/ui/notification";
import { useRouter, useSearchParams } from "next/navigation";
import { SubscriptionPlans } from "@/components/stripe/SubscriptionPlans";

// Integration logo component with actual company logos
function IntegrationLogo({ name, className = "w-8 h-8" }: { name: string, className?: string }) {
  const logoMap: { [key: string]: string } = {
    // Communication & Collaboration
    'gmail': '/Gmail_icon_(2020).svg.png',
    'slack': '/Slack_icon_2019.svg.png',
    'discord': '/discord-logo.png',
    'microsoft-teams': '/Microsoft_Office_Teams_(2018–present).svg.webp',
    'zoom': '/download-round-blue-zoom-logo-icon-png-701751695039210sjnvxytv5d.png',
    'intercom': '/Intercom.png',
    
    // Productivity & Project Management  
    'notion': '/Notion_app_logo.png',
    'drive': '/Google_drive.png',
    'dropbox': '/Dropbox_Icon.svg.png',
    'confluence': '/Confluence.png',
    'jira': '/jira-icon-512x512-kkop6eik.png',
    'trello': '/Trello_icon-icons.webp',
    'monday': '/monday-icon.webp',
    'asana': '/asana-icon-2048x1893-0woxnfwz.png',
    'airtable': '/airtable-icon-512x428-olxouyvv.png',
    'calendly': '/Calendarly.png',
    
    // Sales & Marketing
    'hubspot': '/168_Hubspot_logo_logos-512.webp',
    'salesforce': '/Salesforce.com_logo.svg.png',
    'zendesk': '/zendesk-icon-2048x2048-q18vy4hu.png',
    
    // E-commerce & Payments
    'shopify': '/Shopify.png',
    'stripe': '/Stripe.webp',
    
    // Automation & Development
    'zapier': '/zapier-icon.svg',
    'api': '/Restapi.png',
    'website': '/Website_widget.png',
  };

  const logoSrc = logoMap[name];
  
  // If we have an actual image file, use it
  if (logoSrc && logoSrc.startsWith('/')) {
    return (
      <div className={`${className} rounded-lg flex items-center justify-center bg-white border overflow-hidden`}>
        <img 
          src={logoSrc} 
          alt={`${name} logo`}
          className="w-full h-full object-contain p-1"
          onError={(e) => {
            // Fallback to emoji if image fails to load
            const img = e.currentTarget;
            const fallback = img.nextElementSibling as HTMLElement;
            if (img && fallback) {
              img.style.display = 'none';
              fallback.style.display = 'flex';
            }
          }}
        />
        <div 
          className="w-full h-full hidden items-center justify-center text-white font-semibold"
          style={{ backgroundColor: '#6B7280' }}
        >
          {name.charAt(0).toUpperCase()}
        </div>
      </div>
    );
  }
  
  // Fallback to color-coded background with first letter for integrations without logos
  const color = logoSrc || '#6B7280';
  const firstLetter = name.charAt(0).toUpperCase();
  return (
    <div 
      className={`${className} rounded-lg flex items-center justify-center text-white font-semibold border shadow-sm`}
      style={{ backgroundColor: color }}
    >
      {firstLetter}
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
    <Card className="border border-gray-200 relative">
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
              <Button variant="outline" size="sm" onClick={onDisconnect}>
                Disconnect
              </Button>
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
  const searchParams = useSearchParams();
  const { user, updateUser, getCurrentUser } = useUserStore();
  const { showSuccess, showError } = useNotification();
  const [showApiKey, setShowApiKey] = useState(false);
  const [profile, setProfile] = useState({
    name: user?.name || "",
    email: user?.email || "",
    bio: user?.bio || "",
    company: user?.company || "",
    website: user?.website || "",
  });
  
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [passwordChanging, setPasswordChanging] = useState(false);
  const [showBillingDialog, setShowBillingDialog] = useState(false);
  const [showPlanChangeDialog, setShowPlanChangeDialog] = useState(false);
  
  // Tab management with URL sync
  const initialTab = searchParams.get('tab') || 'profile';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Update URL when tab changes
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', newTab);
    window.history.replaceState({}, '', url.toString());
  };

  // Update profile state when user changes
  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || "",
        email: user.email || "",
        bio: user.bio || "",
        company: user.company || "",
        website: user.website || "",
      });
    }
  }, [user]);

  // Check for success/error messages and fetch integration status
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const error = urlParams.get('error');
    const email = urlParams.get('email');

    if (success === 'dropbox_connected') {
      showSuccess('🎉 Dropbox connected successfully! Your files will be synced shortly.');
      // Clean up URL
      window.history.replaceState({}, '', '/dashboard/settings');
    } else if (success === 'gmail_connected') {
      showSuccess(`🎉 Gmail connected successfully! ${email ? `Connected as ${email}` : 'You can now sync emails.'}`);
      // Clean up URL
      window.history.replaceState({}, '', '/dashboard/settings');
    } else if (error) {
      const errorMessages: { [key: string]: string } = {
        dropbox_auth_denied: 'Dropbox connection was cancelled.',
        dropbox_missing_params: 'Invalid Dropbox response. Please try again.',
        dropbox_invalid_state: 'Security validation failed. Please try again.',
        dropbox_auth_mismatch: 'Authentication error. Please try again.',
        gmail_auth_failed: 'Gmail connection failed. Please try again.',
        account_not_found: 'Account not found. Please contact support.',
        dropbox_callback_failed: 'Dropbox connection failed. Please try again.'
      };
      showError(errorMessages[error] || 'Connection failed. Please try again.');
      // Clean up URL
      window.history.replaceState({}, '', '/dashboard/settings');
    }

    // Fetch current integration status
    fetchIntegrationStatus();
  }, []);

  const fetchIntegrationStatus = async () => {
    try {
      const token = localStorage.getItem('executa-auth-token');
      const response = await fetch('/api/integrations/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const connected = new Set(['slack']); // Keep demo integrations (except Gmail)
        
        // Check real Gmail integration status
        try {
          const gmailResponse = await fetch('/api/integrations/gmail/status', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          if (gmailResponse.ok) {
            const gmailData = await gmailResponse.json();
            if (gmailData.connected) {
              connected.add('gmail');
            }
          }
        } catch (gmailError) {
          console.log('Gmail status check failed:', gmailError);
        }
        
        // Add real connected integrations
        if (data.integrations.dropbox) {
          connected.add('dropbox');
        }
        
        // Check Discord integration status
        try {
          const discordResponse = await fetch('/api/integrations/discord/status', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({})
          });
          if (discordResponse.ok) {
            const discordData = await discordResponse.json();
            if (discordData.connected) {
              connected.add('discord');
            }
          }
        } catch (discordError) {
          console.log('Discord status check failed:', discordError);
        }
        
        setConnectedIntegrations(connected);
      }
    } catch (error) {
      console.error('Failed to fetch integration status:', error);
    }
  };

  const [notifications, setNotifications] = useState({
    emailUpdates: true,
    securityAlerts: true,
    marketingEmails: false,
    weeklyReports: true,
  });

  const apiKey = "exec_sk_1234567890abcdef";

  const [connectedIntegrations, setConnectedIntegrations] = useState(new Set(['slack']));

  const handleConnect = async (integration: string) => {
    if (integration === 'dropbox') {
      try {
        // Get auth URL from your API
        const token = localStorage.getItem('executa-auth-token');
        const response = await fetch('/api/integrations/dropbox/auth', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          if (response.status === 503) {
            showError('Dropbox integration not configured on this server');
            return;
          }
          throw new Error(errorData.message || 'Failed to initialize Dropbox connection');
        }
        
        const data = await response.json();
        
        // Redirect to Dropbox OAuth
        window.location.href = data.authUrl;
        
      } catch (error) {
        console.error('Dropbox connection error:', error);
        showError('Failed to connect to Dropbox. Please try again.');
      }
    } else if (integration === 'gmail') {
      try {
        const token = localStorage.getItem('executa-auth-token');
        const response = await fetch('/api/integrations/gmail/auth', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to initialize Gmail connection');
        }
        
        const data = await response.json();
        
        if (data.authUrl) {
          // Redirect to Google OAuth
          window.location.href = data.authUrl;
        } else {
          throw new Error('No auth URL received');
        }
        
      } catch (error) {
        console.error('Gmail connection error:', error);
        showError('Failed to connect to Gmail. Please try again.');
      }
    } else if (integration === 'discord') {
      try {
        // First, fetch user's assistants
        const token = localStorage.getItem('executa-auth-token');
        const assistantsResponse = await fetch('/api/assistants', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!assistantsResponse.ok) {
          throw new Error('Failed to fetch assistants');
        }
        
        const assistantsData = await assistantsResponse.json();
        
        if (!assistantsData.assistants || assistantsData.assistants.length === 0) {
          showError('Please create an AI assistant first before connecting Discord.');
          return;
        }
        
        // If user has multiple assistants, we should show a selection dialog
        // For now, let's use the first assistant
        const assistantId = assistantsData.assistants[0].id;
        
        const response = await fetch(`/api/integrations/discord/auth?assistantId=${assistantId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          if (response.status === 503) {
            showError('Discord integration not configured on this server');
            return;
          }
          throw new Error(errorData.message || 'Failed to initialize Discord connection');
        }
        
        const data = await response.json();
        
        // Redirect to Discord OAuth
        window.location.href = data.authUrl;
        
      } catch (error) {
        console.error('Discord connection error:', error);
        showError('Failed to connect to Discord. Please try again.');
      }
    } else {
      // For other integrations, just update local state for demo
      setConnectedIntegrations(prev => new Set([...prev, integration]));
    }
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
      console.log('📋 Response data:', { 
        success: data.success, 
        hasUser: !!data.user, 
        avatarLength: data.user?.avatar?.length || 0 
      });
      
      updateUser({ avatar: data.user.avatar });
      
      // Refresh user data from server to ensure consistency
      setTimeout(() => {
        console.log('♻️ Refreshing user data after avatar update');
        getCurrentUser();
      }, 500);
      
      showSuccess('Avatar updated successfully!');

    } catch (error) {
      console.error('Avatar upload error:', error);
      showError(error instanceof Error ? error.message : 'Failed to upload avatar');
    } finally {
      setAvatarUploading(false);
      // Reset the input
      event.target.value = '';
    }
  };

  const [showAvatarRemoveDialog, setShowAvatarRemoveDialog] = useState(false);

  const handleAvatarRemove = async () => {
    setShowAvatarRemoveDialog(true);
  };

  const confirmAvatarRemove = async () => {

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
      showSuccess('Avatar removed successfully!');

    } catch (error) {
      console.error('Avatar removal error:', error);
      showError(error instanceof Error ? error.message : 'Failed to remove avatar');
    } finally {
      setAvatarUploading(false);
      setShowAvatarRemoveDialog(false);
    }
  };

  const handleDisconnect = async (integration: string) => {
    if (integration === 'gmail') {
      try {
        const token = localStorage.getItem('executa-auth-token');
        const response = await fetch('/api/integrations/gmail/status', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'disconnect' })
        });

        if (response.ok) {
          setConnectedIntegrations(prev => {
            const newSet = new Set(prev);
            newSet.delete(integration);
            return newSet;
          });
          toast.success('Gmail disconnected successfully');
        } else {
          throw new Error('Failed to disconnect Gmail');
        }
      } catch (error) {
        console.error('Disconnect error:', error);
        toast.error('Failed to disconnect Gmail');
      }
    } else if (integration === 'discord') {
      try {
        const token = localStorage.getItem('executa-auth-token');
        const response = await fetch('/api/integrations/discord/status', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action: 'disconnect' })
        });

        if (response.ok) {
          setConnectedIntegrations(prev => {
            const newSet = new Set(prev);
            newSet.delete(integration);
            return newSet;
          });
          toast.success('Discord disconnected successfully');
        } else {
          throw new Error('Failed to disconnect Discord');
        }
      } catch (error) {
        console.error('Discord disconnect error:', error);
        toast.error('Failed to disconnect Discord');
      }
    } else {
      setConnectedIntegrations(prev => {
        const newSet = new Set(prev);
        newSet.delete(integration);
        return newSet;
      });
    }
  };

  const handleProfileSave = async () => {
    if (!profile.name.trim() || !profile.email.trim()) {
      toast.error('Name and email are required');
      return;
    }

    setProfileSaving(true);
    try {
      const token = localStorage.getItem('executa-auth-token');
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(profile),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      // Update user in store
      updateUser(data.user);
      showSuccess('Profile updated successfully!');

    } catch (error) {
      console.error('Profile update error:', error);
      showError(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const token = localStorage.getItem('executa-auth-token');
      if (!token) {
        toast.error('Please log in to manage subscription');
        return;
      }

      // Create customer portal session
      const response = await fetch('/api/stripe/customer-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to access billing portal');
      }

      // Redirect to Stripe Customer Portal
      window.location.href = data.url;
    } catch (error) {
      console.error('Customer portal error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to access billing portal');
    }
  };

  const handleChangePlan = () => {
    setShowBillingDialog(false);
    setShowPlanChangeDialog(true);
  };

  const handleSelectPlan = (planName: string, planPrice: string) => {
    // In a real app, this would make an API call to change the subscription
    toast.success(`Plan change initiated! You will be switched to ${planName} at your next billing cycle.`);
    setShowPlanChangeDialog(false);
  };

  const handlePasswordChange = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    setPasswordChanging(true);
    try {
      const token = localStorage.getItem('executa-auth-token');
      const response = await fetch('/api/user/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      toast.success('Password changed successfully! Please log in again.');
      setShowPasswordDialog(false);
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      
      // Redirect to login since all sessions are invalidated
      setTimeout(() => {
        localStorage.removeItem('executa-auth-token');
        router.push('/login');
      }, 2000);

    } catch (error) {
      console.error('Password change error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to change password');
    } finally {
      setPasswordChanging(false);
    }
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
        comingSoon: true,
        category: 'Chat'
      },
      {
        id: 'microsoft-teams',
        name: 'Microsoft Teams',
        description: 'Integrate with Teams for enterprise communication and collaboration',
        icon: MessageSquare,
        connected: connectedIntegrations.has('microsoft-teams'),
        comingSoon: true,
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
        comingSoon: true,
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
        comingSoon: true,
        category: 'CRM'
      },
      {
        id: 'salesforce',
        name: 'Salesforce',
        description: 'Connect to Salesforce for comprehensive customer relationship management',
        icon: BarChart3,
        connected: connectedIntegrations.has('salesforce'),
        comingSoon: true,
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
        comingSoon: true,
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
        comingSoon: true,
        category: 'Scheduling'
      },
      {
        id: 'trello',
        name: 'Trello',
        description: 'Manage boards, cards, and project workflows through AI assistance',
        icon: Briefcase,
        connected: connectedIntegrations.has('trello'),
        comingSoon: true,
        category: 'Project Management'
      },
      {
        id: 'asana',
        name: 'Asana',
        description: 'Connect to Asana for task management and team project coordination',
        icon: CheckCircle,
        connected: connectedIntegrations.has('asana'),
        comingSoon: true,
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
        comingSoon: true,
        category: 'E-commerce'
      },
      {
        id: 'stripe',
        name: 'Stripe',
        description: 'Handle payment inquiries and billing support through Stripe integration',
        icon: CreditCard,
        connected: connectedIntegrations.has('stripe'),
        comingSoon: true,
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
        comingSoon: true,
        category: 'Developer'
      },
      {
        id: 'website',
        name: 'Website Widget',
        description: 'Add a customizable chat widget to your website for visitor engagement',
        icon: Globe,
        connected: connectedIntegrations.has('website'),
        popular: true,
        comingSoon: true,
        category: 'Web'
      }
    ]
  };

  const allIntegrations = Object.values(integrations).flat();
  const connectedCount = allIntegrations.filter(i => i.connected).length;
  const availableCount = allIntegrations.filter(i => !(i as any).comingSoon).length;

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900 font-kanit tracking-wide">Settings</h1>
        <p className="text-gray-600 mt-2">Manage your account settings and preferences</p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your account profile information and avatar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center space-x-6">
                <div className="relative">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user?.name || 'User avatar'}
                      className="h-20 w-20 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-8 w-8 text-primary" />
                    </div>
                  )}
                  {avatarUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="avatar-upload" className="cursor-pointer">
                    <Button variant="outline" size="sm" disabled={avatarUploading} asChild>
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        {avatarUploading ? 'Uploading...' : 'Upload Avatar'}
                      </span>
                    </Button>
                  </Label>
                  <Input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={avatarUploading}
                  />
                  {user?.avatar && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleAvatarRemove}
                      disabled={avatarUploading}
                      className="ml-2"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove
                    </Button>
                  )}
                  <p className="text-xs text-gray-500">JPG, PNG, GIF up to 2MB</p>
                </div>
              </div>

              {/* Profile Form */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    placeholder="Enter your email"
                  />
                </div>
                <div>
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={profile.company}
                    onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                    placeholder="Enter your company name"
                  />
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={profile.website}
                    onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                    placeholder="Enter your website URL"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                  rows={3}
                />
              </div>
              
              <Button 
                className="w-full sm:w-auto" 
                onClick={handleProfileSave}
                disabled={profileSaving}
              >
                <Save className="h-4 w-4 mr-2" />
                {profileSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Connected Integrations</CardTitle>
                <CardDescription>
                  Connect your favorite tools and services to enhance your AI assistant
                  <div className="flex items-center space-x-4 mt-2">
                    <Badge variant="outline">
                      {connectedCount} connected
                    </Badge>
                    <Badge variant="outline">
                      {availableCount} available
                    </Badge>
                  </div>
                </CardDescription>
              </CardHeader>
            </Card>

            {Object.entries(integrations).map(([category, items]) => (
              <div key={category} className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 capitalize">
                  {category.replace(/([A-Z])/g, ' $1').trim()}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {items.map((integration) => (
                    <IntegrationCard
                      key={integration.id}
                      {...integration}
                      onConnect={() => handleConnect(integration.id)}
                      onDisconnect={() => handleDisconnect(integration.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose how you want to be notified about updates and activities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Email Updates</h4>
                    <p className="text-sm text-gray-600">Receive notifications about account activity</p>
                  </div>
                  <Button
                    variant={notifications.emailUpdates ? "default" : "outline"}
                    size="sm"
                    onClick={() => setNotifications({...notifications, emailUpdates: !notifications.emailUpdates})}
                  >
                    {notifications.emailUpdates ? "Enabled" : "Disabled"}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Security Alerts</h4>
                    <p className="text-sm text-gray-600">Get notified about security-related events</p>
                  </div>
                  <Button
                    variant={notifications.securityAlerts ? "default" : "outline"}
                    size="sm"
                    onClick={() => setNotifications({...notifications, securityAlerts: !notifications.securityAlerts})}
                  >
                    {notifications.securityAlerts ? "Enabled" : "Disabled"}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Marketing Emails</h4>
                    <p className="text-sm text-gray-600">Receive updates about new features and promotions</p>
                  </div>
                  <Button
                    variant={notifications.marketingEmails ? "default" : "outline"}
                    size="sm"
                    onClick={() => setNotifications({...notifications, marketingEmails: !notifications.marketingEmails})}
                  >
                    {notifications.marketingEmails ? "Enabled" : "Disabled"}
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Weekly Reports</h4>
                    <p className="text-sm text-gray-600">Get weekly summaries of your assistant's performance</p>
                  </div>
                  <Button
                    variant={notifications.weeklyReports ? "default" : "outline"}
                    size="sm"
                    onClick={() => setNotifications({...notifications, weeklyReports: !notifications.weeklyReports})}
                  >
                    {notifications.weeklyReports ? "Enabled" : "Disabled"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing">
          <div className="space-y-12">
            <SubscriptionPlans 
              currentPlan={user?.account?.plan as 'PRO' | 'ENTERPRISE'}
            />
            
            {/* Usage Statistics */}
            {user?.account?.plan && (
              <Card>
                <CardHeader className="pb-8">
                  <CardTitle className="text-xl font-kanit font-bold text-gray-900 uppercase tracking-wide">Usage This Month</CardTitle>
                  <CardDescription className="text-gray-600 text-base mt-3">
                    Track your current usage across all features
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="p-8 border rounded-lg bg-white hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-sm font-medium text-gray-900 font-kanit uppercase tracking-wide">AI Assistants</span>
                        <span className="text-sm text-gray-600 font-medium">1 / {user?.account?.plan === 'PRO' ? '10' : 'Unlimited'}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-gray-800 h-2.5 rounded-full transition-all" style={{ width: '10%' }}></div>
                      </div>
                    </div>
                    
                    <div className="p-8 border rounded-lg bg-white hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-sm font-medium text-gray-900 font-kanit uppercase tracking-wide">Messages</span>
                        <span className="text-sm text-gray-600 font-medium">1,247 / {user?.account?.plan === 'PRO' ? '10,000' : 'Unlimited'}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-green-600 h-2.5 rounded-full transition-all" style={{ width: '12%' }}></div>
                      </div>
                    </div>
                    
                    <div className="p-8 border rounded-lg bg-white hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-sm font-medium text-gray-900 font-kanit uppercase tracking-wide">Storage</span>
                        <span className="text-sm text-gray-600 font-medium">2.1 GB / {user?.account?.plan === 'PRO' ? '10 GB' : '100 GB'}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-orange-600 h-2.5 rounded-full transition-all" style={{ width: '21%' }}></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Password Change Dialog */}
      {showPasswordDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Change Password</h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  placeholder="Enter current password"
                />
              </div>
              
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  placeholder="Enter new password"
                />
              </div>
              
              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  placeholder="Confirm new password"
                />
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowPasswordDialog(false);
                  setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
                }}
                disabled={passwordChanging}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                onClick={handlePasswordChange}
                disabled={passwordChanging}
                className="flex-1"
              >
                {passwordChanging ? 'Changing...' : 'Change Password'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Billing Management Dialog */}
      {showBillingDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Manage Subscription</h3>
            
            <div className="space-y-4">
              <div className="p-4 border rounded-lg bg-blue-50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Current Plan: Pro</h4>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
                <p className="text-sm text-gray-600">$29/month • Billed monthly</p>
                <p className="text-sm text-gray-600 mt-1">Next billing date: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}</p>
              </div>

              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Update Payment Method
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Download Invoices
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={handleChangePlan}>
                  <SettingsIcon className="h-4 w-4 mr-2" />
                  Change Plan
                </Button>
                <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700">
                  <X className="h-4 w-4 mr-2" />
                  Cancel Subscription
                </Button>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> This is a demo. In a production app, this would redirect to your billing provider's customer portal (e.g., Stripe Customer Portal) for secure subscription management.
                </p>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setShowBillingDialog(false)}
                className="flex-1"
              >
                Close
              </Button>
              <Button 
                onClick={() => {
                  // In a real app, this would redirect to billing portal
                  window.open('https://billing.stripe.com/p/login/test_example', '_blank');
                  setShowBillingDialog(false);
                }}
                className="flex-1"
              >
                Open Billing Portal
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Plan Change Dialog */}
      {showPlanChangeDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-2">Choose Your Plan</h3>
            <p className="text-gray-600 mb-6">Select the plan that best fits your needs. Changes take effect at your next billing cycle.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Free Plan */}
              <div className="border rounded-lg p-6 relative">
                <div className="text-center">
                  <h4 className="text-xl font-semibold mb-2">Free</h4>
                  <div className="text-3xl font-bold mb-4">$0<span className="text-lg text-gray-500">/month</span></div>
                  <ul className="text-left space-y-2 mb-6">
                    <li className="flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" />1 AI Assistant</li>
                    <li className="flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" />100 messages/month</li>
                    <li className="flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" />Basic support</li>
                    <li className="flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" />1 GB storage</li>
                  </ul>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => handleSelectPlan('Free', '$0')}
                  >
                    Downgrade to Free
                  </Button>
                </div>
              </div>

              {/* Pro Plan - Current */}
              <div className="border-2 border-blue-500 rounded-lg p-6 relative bg-blue-50">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-500 text-white">Current Plan</Badge>
                </div>
                <div className="text-center">
                  <h4 className="text-xl font-semibold mb-2">Pro</h4>
                  <div className="text-3xl font-bold mb-4">$29<span className="text-lg text-gray-500">/month</span></div>
                  <ul className="text-left space-y-2 mb-6">
                    <li className="flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" />10 AI Assistants</li>
                    <li className="flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" />10,000 messages/month</li>
                    <li className="flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" />Priority support</li>
                    <li className="flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" />10 GB storage</li>
                    <li className="flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" />API access</li>
                    <li className="flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" />Custom branding</li>
                  </ul>
                  <Button 
                    disabled 
                    className="w-full bg-blue-500 text-white"
                  >
                    Current Plan
                  </Button>
                </div>
              </div>

              {/* Enterprise Plan */}
              <div className="border rounded-lg p-6 relative">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-purple-500 text-white flex items-center">
                    <Star className="h-3 w-3 mr-1" />
                    Popular
                  </Badge>
                </div>
                <div className="text-center">
                  <h4 className="text-xl font-semibold mb-2">Enterprise</h4>
                  <div className="text-3xl font-bold mb-4">$99<span className="text-lg text-gray-500">/month</span></div>
                  <ul className="text-left space-y-2 mb-6">
                    <li className="flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" />Unlimited AI Assistants</li>
                    <li className="flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" />Unlimited messages</li>
                    <li className="flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" />24/7 dedicated support</li>
                    <li className="flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" />100 GB storage</li>
                    <li className="flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" />Advanced API access</li>
                    <li className="flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" />White-label solution</li>
                    <li className="flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" />SSO integration</li>
                    <li className="flex items-center"><Check className="h-4 w-4 text-green-500 mr-2" />Custom integrations</li>
                  </ul>
                  <Button 
                    className="w-full bg-purple-500 hover:bg-purple-600 text-white"
                    onClick={() => handleSelectPlan('Enterprise', '$99')}
                  >
                    <ZapIcon className="h-4 w-4 mr-2" />
                    Upgrade to Enterprise
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 rounded-full p-2">
                  <HelpCircle className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h5 className="font-medium text-gray-900 mb-1">Need help choosing?</h5>
                  <p className="text-sm text-gray-600 mb-2">
                    Our team can help you find the perfect plan for your needs.
                  </p>
                  <Button variant="outline" size="sm">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Contact Sales
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end mt-6">
              <Button 
                variant="outline" 
                onClick={() => setShowPlanChangeDialog(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Avatar Remove Confirmation Dialog */}
      <Dialog open={showAvatarRemoveDialog} onOpenChange={setShowAvatarRemoveDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Remove Profile Picture
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove your profile picture? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowAvatarRemoveDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmAvatarRemove}
              disabled={avatarUploading}
              className="bg-red-600 hover:bg-red-700"
            >
              {avatarUploading ? 'Removing...' : 'Remove Picture'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 