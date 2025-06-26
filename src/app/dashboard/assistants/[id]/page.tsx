"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useModelStore } from "@/state/modelStore";
import { useUserStore } from "@/state/userStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import KnowledgeBaseManager from "@/components/knowledge/KnowledgeBaseManager";
import GmailIntegration from "@/components/knowledge/GmailIntegration";
import EmailKnowledgeManager from "@/components/knowledge/EmailKnowledgeManager";
import DropboxIntegration from "@/components/integrations/DropboxIntegration";
import SlackConnection from "@/components/integrations/SlackConnection";
import TeamsConnection from "@/components/integrations/TeamsConnection";
import DiscordConnection from "@/components/integrations/DiscordConnection";
import IntegrationsManager from "@/components/integrations/IntegrationsManager";
import { Document as ModelDocument } from "@/types/model";
import { 
  ArrowLeft, 
  Bot, 
  MessageSquare, 
  FileText, 
  Users, 
  Activity,
  Send,
  Settings,
  Share,
  Copy,
  ExternalLink,
  BarChart3,
  Edit,
  Trash2,
  Download,
  Globe,
  Slack,
  Zap,
  Upload,
  Play,
  Pause,
  CheckCircle,
  Clock,
  TrendingUp,
  Eye,
  Mail,
  Database,
  Rocket,
  Monitor,
  Code,
  Palette,
  Smartphone,
  RotateCcw,
  ImageIcon,
  User,
  AlertTriangle,
  Cloud
} from "lucide-react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faRobot, 
  faUser, 
  faUserTie, 
  faHeadset, 
  faCog, 
  faLightbulb, 
  faHeart, 
  faStar, 
  faThumbsUp, 
  faShield, 
  faGraduationCap, 
  faBriefcase, 
  faHome, 
  faPhone, 
  faEnvelope,
  faComment,
  faComments,
  faInfoCircle,
  faQuestionCircle,
  faExclamationCircle
} from '@fortawesome/free-solid-svg-icons';

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date | string;
}

// Avatar icon options for Font Awesome
const avatarIcons = [
  { id: 'robot', icon: faRobot, label: 'Robot' },
  { id: 'user', icon: faUser, label: 'User' },
  { id: 'user-tie', icon: faUserTie, label: 'Professional' },
  { id: 'headset', icon: faHeadset, label: 'Support Agent' },
  { id: 'cog', icon: faCog, label: 'Technical' },
  { id: 'lightbulb', icon: faLightbulb, label: 'Ideas' },
  { id: 'heart', icon: faHeart, label: 'Friendly' },
  { id: 'star', icon: faStar, label: 'Premium' },
  { id: 'thumbs-up', icon: faThumbsUp, label: 'Helpful' },
  { id: 'shield', icon: faShield, label: 'Security' },
  { id: 'graduation-cap', icon: faGraduationCap, label: 'Education' },
  { id: 'briefcase', icon: faBriefcase, label: 'Business' },
  { id: 'home', icon: faHome, label: 'Home' },
  { id: 'phone', icon: faPhone, label: 'Contact' },
  { id: 'envelope', icon: faEnvelope, label: 'Messages' },
  { id: 'comment', icon: faComment, label: 'Chat' },
  { id: 'comments', icon: faComments, label: 'Discussion' },
  { id: 'info-circle', icon: faInfoCircle, label: 'Information' },
  { id: 'question-circle', icon: faQuestionCircle, label: 'Help' },
  { id: 'exclamation-circle', icon: faExclamationCircle, label: 'Important' },
];

export default function AssistantViewPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const assistantId = params.id as string;
  const initialTab = searchParams.get('tab') || 'overview';
  
  const { models, deleteModel, fetchModels, refreshModel, isLoading, updateModel } = useModelStore();
  const { user, isLoading: userLoading } = useUserStore();
  const assistant = models.find(m => m.id === assistantId);
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [message, setMessage] = useState("");
  const [chatThreadId, setChatThreadId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      content: "Hello! I'm ready to help you with any questions about the knowledge base. What would you like to know?",
      sender: "bot",
      timestamp: new Date()
    }
  ]);
  const [assistantFiles, setAssistantFiles] = useState<ModelDocument[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Embed styling state
  const [embedStyle, setEmbedStyle] = useState({
    bubbleColor: assistant?.embedBubbleColor || "#3B82F6",
    buttonShape: assistant?.embedButtonShape || "rounded",
    fontStyle: assistant?.embedFontStyle || "system",
    position: assistant?.embedPosition || "bottom-right",
    // Full chat UI styling
    chatBackgroundColor: assistant?.chatBackgroundColor || "#FFFFFF",
    userMessageBubbleColor: assistant?.userMessageBubbleColor || "#3B82F6",
    assistantMessageBubbleColor: assistant?.assistantMessageBubbleColor || "#F3F4F6",
    assistantFontStyle: assistant?.assistantFontStyle || "sans",
    messageBubbleRadius: assistant?.messageBubbleRadius || 12,
    showAssistantAvatar: assistant?.showAssistantAvatar !== false,
    assistantAvatarIcon: assistant?.assistantAvatarUrl || "robot",
    showChatHeader: assistant?.showChatHeader !== false,
    chatHeaderTitle: assistant?.chatHeaderTitle || "AI Assistant",
    welcomeMessage: assistant?.welcomeMessage || ""
  });
  const [embedCodeType, setEmbedCodeType] = useState<'styled' | 'raw' | 'wordpress'>('styled');
  const [isSavingStyles, setIsSavingStyles] = useState(false);
  const [integrationsStatus, setIntegrationsStatus] = useState({
    gmail: false,
    dropbox: false,
    slack: false
  });

  useEffect(() => {
    const loadAssistantData = async () => {
      try {
        setPageLoading(true);
        
        if (userLoading) {
          console.log('⏳ Waiting for user authentication...');
          return;
        }
        
        if (!user) {
          console.log('❌ User not authenticated, redirecting to login...');
          router.push('/login');
          return;
        }
        
        console.log('✅ User authenticated, proceeding with data fetch...');
        
        if (models.length === 0) {
          console.log('📋 No models in store, fetching all models...');
          await fetchModels();
        }
        
        const currentModels = useModelStore.getState().models;
        console.log('📋 After fetchModels, current models length:', currentModels.length);
        
        const foundAssistant = currentModels.find(m => m.id === assistantId);
        console.log(`🔍 Looking for assistant ${assistantId} in ${currentModels.length} models`);
        
        if (!foundAssistant && currentModels.length > 0) {
          console.log(`🔄 Assistant ${assistantId} not found in models, trying to refresh...`);
          try {
            await refreshModel(assistantId);
          } catch (error) {
            console.error('Failed to refresh assistant:', error);
            setNotFound(true);
          }
        } else if (currentModels.length === 0) {
          console.log('❌ No models found after fetch');
          setNotFound(true);
        }
      } catch (error) {
        console.error('Error loading assistant data:', error);
        setNotFound(true);
      } finally {
        setPageLoading(false);
      }
    };

    loadAssistantData();
    
    // Load integration status
    if (assistantId && user) {
      checkIntegrationsStatus();
    }
  }, [assistantId, fetchModels, refreshModel, user, userLoading, router]);

  const checkIntegrationsStatus = async () => {
    if (!assistantId) return;
    
    const token = localStorage.getItem('executa-auth-token');
    if (!token) return;

    try {
      const integrations = ['gmail', 'dropbox', 'slack'];
      const statusChecks = await Promise.all(
        integrations.map(async (integration) => {
          try {
            const response = await fetch(`/api/integrations/${integration}/status?assistantId=${assistantId}`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            const data = await response.json();
            return { [integration]: data.connected || false };
          } catch (error) {
            console.error(`Failed to check ${integration} status:`, error);
            return { [integration]: false };
          }
        })
      );

      const statusObj = statusChecks.reduce((acc, curr) => ({ ...acc, ...curr }), {
        gmail: false,
        dropbox: false,
        slack: false
      });
      setIntegrationsStatus(statusObj as typeof integrationsStatus);
    } catch (error) {
      console.error('Error checking integrations status:', error);
    }
  };

  useEffect(() => {
    if (assistant?.documents) {
      setAssistantFiles(assistant.documents);
    }
  }, [assistant?.documents]);

  // Load embed styles when assistant is loaded or when embed properties change
  useEffect(() => {
    if (assistant) {
      const newEmbedStyle = {
        bubbleColor: assistant.embedBubbleColor || "#3B82F6",
        buttonShape: assistant.embedButtonShape || "rounded",
        fontStyle: assistant.embedFontStyle || "system",
        position: assistant.embedPosition || "bottom-right",
        chatBackgroundColor: assistant.chatBackgroundColor || "#FFFFFF",
        userMessageBubbleColor: assistant.userMessageBubbleColor || "#3B82F6",
        assistantMessageBubbleColor: assistant.assistantMessageBubbleColor || "#F3F4F6",
        assistantFontStyle: assistant.assistantFontStyle || "sans",
        messageBubbleRadius: assistant.messageBubbleRadius || 12,
        showAssistantAvatar: assistant.showAssistantAvatar !== false,
        assistantAvatarIcon: assistant.assistantAvatarUrl || "robot",
        showChatHeader: assistant.showChatHeader !== false,
        chatHeaderTitle: assistant.chatHeaderTitle || "AI Assistant",
        welcomeMessage: assistant.welcomeMessage || ""
      };
      
      // Only update if the embed styles have actually changed
      // This prevents unnecessary state resets during saves
      const hasChanged = JSON.stringify(embedStyle) !== JSON.stringify(newEmbedStyle);
      if (hasChanged) {
        console.log('Updating embed styles from assistant data:', newEmbedStyle);
        setEmbedStyle(newEmbedStyle);
      }
    }
  }, [
    assistant?.embedBubbleColor, 
    assistant?.embedButtonShape, 
    assistant?.embedFontStyle, 
    assistant?.embedPosition,
    assistant?.chatBackgroundColor,
    assistant?.userMessageBubbleColor,
    assistant?.assistantMessageBubbleColor,
    assistant?.assistantFontStyle,
    assistant?.messageBubbleRadius,
    assistant?.showAssistantAvatar,
    assistant?.assistantAvatarUrl,
    assistant?.showChatHeader,
    assistant?.chatHeaderTitle,
    assistant?.welcomeMessage
  ]); // Only depend on the actual embed style properties

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: message,
      sender: "user",
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    const currentMessage = message;
    setMessage("");

    try {
      // Call real AI assistant API
      const token = localStorage.getItem('executa-auth-token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`/api/chat/${assistantId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: currentMessage,
          threadId: chatThreadId
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get response');
      }

      // Update thread ID if this is the first message
      if (data.threadId && !chatThreadId) {
        setChatThreadId(data.threadId);
      }

      const botResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        sender: "bot" as const,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, botResponse]);

    } catch (error) {
      console.error('Chat error:', error);
      const errorResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        sender: "bot" as const,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorResponse]);
    }
  };

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'training': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
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

  // Action handlers
  const handleCopyEmbedCode = async () => {
    const embedCode = `<script src="https://cdn.executa.ai/widget.js" data-assistant-id="${assistantId}"></script>`;
    try {
      await navigator.clipboard.writeText(embedCode);
      toast.success("Embed code copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy embed code");
    }
  };

  const handleToggleStatus = async () => {
    // Mock toggle between active/draft
    toast.success(assistant?.status === 'active' ? "Assistant paused" : "Assistant activated");
  };

  const handleShareAssistant = async () => {
    const shareUrl = `${window.location.origin}/chat/${assistantId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Share link copied to clipboard!");
    } catch (err) {
      toast.error("Failed to copy share link");
    }
  };

  const handleFilesUpdated = (updatedFiles: ModelDocument[]) => {
    setAssistantFiles(updatedFiles);
  };

  const simulateUpload = (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploading(false);
          toast.success(`${file.name} uploaded successfully!`);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  // Functions for embed functionality
  const saveEmbedStyles = async () => {
    setIsSavingStyles(true);
    try {
      const token = localStorage.getItem('executa-auth-token');
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      console.log('Saving embed styles:', embedStyle); // Debug log

      const response = await fetch(`/api/models/${assistantId}/embed-styles`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(embedStyle),
      });

      const data = await response.json();
      console.log('Save response:', data); // Debug log

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save embed styles');
      }

      toast.success("Embed styles saved successfully!");
      
      // Update the assistant in the store immediately with the saved values
      // This prevents the useEffect from overwriting our current state
      if (data.assistant) {
        updateModel(assistantId, {
          embedBubbleColor: data.assistant.embedBubbleColor,
          embedButtonShape: data.assistant.embedButtonShape,
          embedFontStyle: data.assistant.embedFontStyle,
          embedPosition: data.assistant.embedPosition,
          chatBackgroundColor: data.assistant.chatBackgroundColor,
          userMessageBubbleColor: data.assistant.userMessageBubbleColor,
          assistantMessageBubbleColor: data.assistant.assistantMessageBubbleColor,
          assistantFontStyle: data.assistant.assistantFontStyle,
          messageBubbleRadius: data.assistant.messageBubbleRadius,
          showAssistantAvatar: data.assistant.showAssistantAvatar,
          assistantAvatarUrl: data.assistant.assistantAvatarUrl,
          showChatHeader: data.assistant.showChatHeader,
          chatHeaderTitle: data.assistant.chatHeaderTitle,
          welcomeMessage: data.assistant.welcomeMessage,
          updatedAt: new Date(data.assistant.updatedAt)
        });
      }
      
      // No need to call refreshModel since we just updated the store directly
      // await refreshModel(assistantId);
    } catch (error) {
      console.error("Error saving embed styles:", error);
      toast.error("Failed to save embed styles");
    } finally {
      setIsSavingStyles(false);
    }
  };

  const resetToDefaults = () => {
    setEmbedStyle({
      bubbleColor: "#3B82F6",
      buttonShape: "rounded",
      fontStyle: "system",
      position: "bottom-right",
      // Full chat UI defaults
      chatBackgroundColor: "#FFFFFF",
      userMessageBubbleColor: "#3B82F6",
      assistantMessageBubbleColor: "#F3F4F6",
      assistantFontStyle: "sans",
      messageBubbleRadius: 12,
      showAssistantAvatar: true,
      assistantAvatarIcon: "robot",
      showChatHeader: true,
      chatHeaderTitle: "AI Assistant",
      welcomeMessage: ""
    });
    toast.success("Reset to default styling");
  };

  const generateStyledEmbedCode = () => {
    return `<!-- Executa AI Assistant Widget with Full Styling -->
<div id="executa-chat-widget"></div>
<script>
  (function() {
    var widget = document.createElement('div');
    widget.id = 'executa-chat-container';
    widget.style.cssText = \`
      position: fixed;
      ${embedStyle.position}: 20px;
      ${embedStyle.position.includes('bottom') ? 'bottom' : 'top'}: 20px;
      z-index: 9999;
      font-family: ${embedStyle.fontStyle === 'system' ? '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui' : 
        embedStyle.fontStyle === 'sans' ? '"Inter", sans-serif' :
        embedStyle.fontStyle === 'serif' ? 'Georgia, serif' : 
        '"JetBrains Mono", monospace'};
    \`;
    
    var button = document.createElement('button');
    button.style.cssText = \`
      width: 60px;
      height: 60px;
      border-radius: ${embedStyle.buttonShape === 'square' ? '8px' : 
        embedStyle.buttonShape === 'rounded' ? '16px' : '50%'};
      background-color: ${embedStyle.bubbleColor};
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
    \`;
    button.innerHTML = '<svg width="24" height="24" fill="white" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>';
    
    // Chat interface styles
    var chatStyles = \`
      .executa-chat-interface {
        display: none;
        position: fixed;
        ${embedStyle.position}: 20px;
        ${embedStyle.position.includes('bottom') ? 'bottom' : 'top'}: 90px;
        width: 350px;
        height: 500px;
        background-color: ${embedStyle.chatBackgroundColor};
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.12);
        font-family: ${embedStyle.assistantFontStyle === 'sans' ? '"Inter", sans-serif' :
          embedStyle.assistantFontStyle === 'serif' ? 'Georgia, serif' : 
          '"JetBrains Mono", monospace'};
        z-index: 10000;
      }
      .executa-chat-header {
        display: ${embedStyle.showChatHeader ? 'flex' : 'none'};
        padding: 16px;
        border-bottom: 1px solid #E5E7EB;
        align-items: center;
        background: linear-gradient(90deg, ${embedStyle.bubbleColor} 0%, ${embedStyle.userMessageBubbleColor} 100%);
        color: white;
        border-radius: 12px 12px 0 0;
      }
      .executa-user-message {
        background-color: ${embedStyle.userMessageBubbleColor};
        color: white;
        border-radius: ${embedStyle.messageBubbleRadius}px;
        padding: 8px 12px;
        margin: 8px;
        margin-left: auto;
        max-width: 80%;
      }
      .executa-assistant-message {
        background-color: ${embedStyle.assistantMessageBubbleColor};
        color: #374151;
        border-radius: ${embedStyle.messageBubbleRadius}px;
        padding: 8px 12px;
        margin: 8px;
        max-width: 80%;
        display: flex;
        align-items: flex-start;
        gap: 8px;
      }
      .executa-avatar {
        display: ${embedStyle.showAssistantAvatar ? 'block' : 'none'};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: ${embedStyle.bubbleColor};
      }
    \`;
    
    var styleSheet = document.createElement('style');
    styleSheet.textContent = chatStyles;
    document.head.appendChild(styleSheet);
    
    widget.appendChild(button);
    document.body.appendChild(widget);
    
    // Chat functionality
    button.addEventListener('click', function() {
      // Toggle chat interface
      var existingChat = document.querySelector('.executa-chat-interface');
      if (existingChat) {
        existingChat.style.display = existingChat.style.display === 'none' ? 'block' : 'none';
      } else {
        // Create chat interface
        var chatInterface = document.createElement('div');
        chatInterface.className = 'executa-chat-interface';
        chatInterface.style.display = 'block';
        
        var headerHTML = ${embedStyle.showChatHeader ? 
          `'<div class="executa-chat-header"><h3 style="margin: 0; font-size: 16px;">' + '${embedStyle.chatHeaderTitle}' + '</h3></div>'` : 
          "''"};
        
        var welcomeHTML = ${embedStyle.welcomeMessage ? 
          `'<div class="executa-assistant-message">' + ${embedStyle.showAssistantAvatar ? "'<div class=\"executa-avatar\"></div>'" : "''"} + '<div>${embedStyle.welcomeMessage}</div></div>'` : 
          "''"};
        
        chatInterface.innerHTML = headerHTML + 
          '<div style="flex: 1; overflow-y: auto; padding: 16px;">' + welcomeHTML + '</div>' +
          '<div style="padding: 16px; border-top: 1px solid #E5E7EB;">' +
          '<input type="text" placeholder="Type your message..." style="width: 100%; padding: 8px; border: 1px solid #D1D5DB; border-radius: 6px;">' +
          '</div>';
        
        document.body.appendChild(chatInterface);
      }
    });
  })();
</script>`;
  };

  const generateRawEmbedCode = () => {
    return `<!-- Executa AI Assistant Widget (Raw) -->
<div id="executa-chat" data-assistant-id="${assistant?.id}"></div>
<script src="https://cdn.executa.ai/widget.js"></script>
<script>
  ExecutaChat.init({
    assistantId: '${assistant?.id}',
    containerId: 'executa-chat'
  });
</script>`;
  };

  const copyEmbedCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Embed code copied to clipboard!");
    } catch (error) {
      console.error("Error copying embed code:", error);
      toast.error("Failed to copy embed code");
    }
  };

  const downloadWordPressPlugin = async () => {
    try {
      const token = localStorage.getItem('executa-auth-token');
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      toast.success("Generating WordPress plugin...");

      const response = await fetch(`/api/models/${assistantId}/wordpress-plugin`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to generate WordPress plugin');
      }

      // Get the filename from the response headers
      const contentDisposition = response.headers.get('content-disposition');
      const filename = contentDisposition 
        ? contentDisposition.split('filename=')[1]?.replace(/"/g, '')
        : `executa-ai-${assistant?.name?.toLowerCase().replace(/[^a-z0-9]/g, '-')}.zip`;

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("WordPress plugin downloaded successfully!");
    } catch (error) {
      console.error("Error downloading WordPress plugin:", error);
      toast.error("Failed to download WordPress plugin");
    }
  };

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Bot className="h-12 w-12 animate-pulse text-primary mx-auto mb-4" />
          <p className="text-lg font-medium">Loading assistant...</p>
        </div>
      </div>
    );
  }

  if (notFound || !assistant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Assistant Not Found</h3>
            <p className="text-gray-600 mb-4">The assistant you're looking for doesn't exist or has been deleted.</p>
            <Link href="/dashboard">
              <Button>Go to Dashboard</Button>
                </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
            </Button>
              <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold text-gray-900 font-kanit uppercase tracking-wide">{assistant.name}</h1>
              <Badge className={`border ${getStatusColor(assistant.status)}`}>
                    {getStatusText(assistant.status)}
                  </Badge>
                </div>
            {assistant.description && (
              <p className="text-gray-600 mt-1">{assistant.description}</p>
            )}
              </div>
            </div>
          </div>
          


      {/* Tabbed Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="embed">Embed</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
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
        </TabsContent>

        {/* Chat Tab */}
        <TabsContent value="chat" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Test Your Assistant</CardTitle>
                    <CardDescription>
                Try out conversations to see how your assistant responds
                    </CardDescription>
              </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <ScrollArea className="h-96 border rounded-lg p-4">
                  <div className="space-y-4">
                    {chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          msg.sender === 'user' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {formatDate(msg.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Type your message..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1"
                    />
                  <Button onClick={handleSendMessage} disabled={!message.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
        </TabsContent>

        {/* Knowledge Tab */}
        <TabsContent value="knowledge" className="h-[calc(100vh-200px)]">
          <Card className="h-full flex flex-col">
            <CardHeader className="flex-shrink-0">
              <CardTitle>Knowledge Base</CardTitle>
              <CardDescription>
                Manage documents and data sources that train your assistant
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              {/* Upload Progress */}
              {isUploading && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Upload className="h-5 w-5 text-blue-600 animate-pulse" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900">Uploading...</p>
                      <Progress value={uploadProgress} className="mt-2" />
                    </div>
                    <span className="text-sm text-blue-600">{uploadProgress}%</span>
                  </div>
                </div>
              )}
              
              {/* Knowledge Sub-tabs */}
              <Tabs defaultValue="documents" className="h-full flex flex-col">
                <TabsList className={`grid w-full mb-4 ${
                  integrationsStatus.gmail && integrationsStatus.dropbox 
                    ? 'grid-cols-4' 
                    : integrationsStatus.gmail || integrationsStatus.dropbox 
                    ? 'grid-cols-3' 
                    : 'grid-cols-2'
                }`}>
                  <TabsTrigger value="documents" className="flex items-center space-x-2">
                    <FileText className="h-4 w-4" />
                    <span>Documents</span>
                  </TabsTrigger>
                  <TabsTrigger value="gmail-setup" className="flex items-center space-x-2">
                    <Settings className="h-4 w-4" />
                    <span>Gmail Setup</span>
                  </TabsTrigger>
                  {integrationsStatus.gmail && (
                    <TabsTrigger value="gmail-emails" className="flex items-center space-x-2">
                      <Mail className="h-4 w-4" />
                      <span>Gmail Emails</span>
                    </TabsTrigger>
                  )}
                  {integrationsStatus.dropbox && (
                    <TabsTrigger value="dropbox-sync" className="flex items-center space-x-2">
                      <Cloud className="h-4 w-4" />
                      <span>Dropbox Sync</span>
                    </TabsTrigger>
                  )}
                </TabsList>

                {/* Documents Tab */}
                <TabsContent value="documents" className="flex-1 overflow-hidden">
                  <KnowledgeBaseManager
                    assistantId={assistantId}
                    files={assistantFiles}
                    onFilesUpdated={handleFilesUpdated}
                  />
                </TabsContent>

                {/* Gmail Setup Tab */}
                <TabsContent value="gmail-setup" className="flex-1 overflow-hidden">
                  <GmailIntegration assistantId={assistantId} />
                </TabsContent>

                {/* Gmail Emails Tab */}
                {integrationsStatus.gmail && (
                  <TabsContent value="gmail-emails" className="flex-1 overflow-hidden">
                    <EmailKnowledgeManager assistantId={assistantId} />
                  </TabsContent>
                )}

                {/* Dropbox Sync Tab */}
                {integrationsStatus.dropbox && (
                  <TabsContent value="dropbox-sync" className="flex-1 overflow-hidden">
                    <DropboxIntegration assistantId={assistantId} />
                  </TabsContent>
                )}
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5" />
                <span>Integrations</span>
              </CardTitle>
              <CardDescription>
                Connect your assistant to popular platforms and services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <IntegrationsManager assistantId={assistantId} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Embed Tab */}
        <TabsContent value="embed" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Chat UI Styler Section */}
          <div className="space-y-6">
              <Card>
              <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Palette className="h-5 w-5" />
                    <span>Chat UI Styler – Customise the Full Experience</span>
                  </CardTitle>
                  <CardDescription>
                    Visual controls for the complete AI chat interface
                  </CardDescription>
              </CardHeader>
                <CardContent className="space-y-6">
                  {/* Widget Button Settings */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-gray-700 border-b pb-2">Widget Button</h4>
                    
                    {/* Chat Bubble Color */}
                    <div className="space-y-2">
                      <Label>Chat Bubble Color</Label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="color"
                          value={embedStyle.bubbleColor}
                          onChange={(e) => setEmbedStyle(prev => ({ ...prev, bubbleColor: e.target.value }))}
                          className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                        />
                        <Input
                          value={embedStyle.bubbleColor}
                          onChange={(e) => setEmbedStyle(prev => ({ ...prev, bubbleColor: e.target.value }))}
                          placeholder="#3B82F6"
                          className="flex-1"
                        />
                      </div>
                </div>
                
                    {/* Button Shape */}
                    <div className="space-y-2">
                      <Label>Button Shape</Label>
                      <select
                        value={embedStyle.buttonShape}
                        onChange={(e) => setEmbedStyle(prev => ({ ...prev, buttonShape: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="square">Square</option>
                        <option value="rounded">Rounded</option>
                        <option value="pill">Pill</option>
                      </select>
                    </div>

                    {/* Position */}
                    <div className="space-y-2">
                      <Label>Position</Label>
                      <select
                        value={embedStyle.position}
                        onChange={(e) => setEmbedStyle(prev => ({ ...prev, position: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="bottom-left">Bottom Left</option>
                        <option value="bottom-right">Bottom Right</option>
                      </select>
                    </div>
                  </div>

                  {/* Chat Interface Settings */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-gray-700 border-b pb-2">Chat Interface</h4>

                    {/* Chat Background Color */}
                    <div className="space-y-2">
                      <Label>Chat Background Color</Label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="color"
                          value={embedStyle.chatBackgroundColor}
                          onChange={(e) => setEmbedStyle(prev => ({ ...prev, chatBackgroundColor: e.target.value }))}
                          className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                        />
                        <Input
                          value={embedStyle.chatBackgroundColor}
                          onChange={(e) => setEmbedStyle(prev => ({ ...prev, chatBackgroundColor: e.target.value }))}
                          placeholder="#FFFFFF"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    {/* User Message Bubble Color */}
                    <div className="space-y-2">
                      <Label>User Message Bubble Color</Label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="color"
                          value={embedStyle.userMessageBubbleColor}
                          onChange={(e) => setEmbedStyle(prev => ({ ...prev, userMessageBubbleColor: e.target.value }))}
                          className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                        />
                        <Input
                          value={embedStyle.userMessageBubbleColor}
                          onChange={(e) => setEmbedStyle(prev => ({ ...prev, userMessageBubbleColor: e.target.value }))}
                          placeholder="#3B82F6"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    {/* Assistant Message Bubble Color */}
                    <div className="space-y-2">
                      <Label>Assistant Message Bubble Color</Label>
                      <div className="flex items-center space-x-3">
                        <input
                          type="color"
                          value={embedStyle.assistantMessageBubbleColor}
                          onChange={(e) => setEmbedStyle(prev => ({ ...prev, assistantMessageBubbleColor: e.target.value }))}
                          className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                        />
                        <Input
                          value={embedStyle.assistantMessageBubbleColor}
                          onChange={(e) => setEmbedStyle(prev => ({ ...prev, assistantMessageBubbleColor: e.target.value }))}
                          placeholder="#F3F4F6"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    {/* Assistant Font Style */}
                    <div className="space-y-2">
                      <Label>Assistant Font Style</Label>
                      <select
                        value={embedStyle.assistantFontStyle}
                        onChange={(e) => setEmbedStyle(prev => ({ ...prev, assistantFontStyle: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="sans">Sans Serif</option>
                        <option value="serif">Serif</option>
                        <option value="monospace">Monospace</option>
                      </select>
                    </div>

                    {/* Message Bubble Border Radius */}
                    <div className="space-y-2">
                      <Label>Message Bubble Border Radius: {embedStyle.messageBubbleRadius}px</Label>
                      <input
                        type="range"
                        min="0"
                        max="24"
                        value={embedStyle.messageBubbleRadius}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmbedStyle(prev => ({ ...prev, messageBubbleRadius: parseInt(e.target.value) }))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>0px</span>
                        <span>24px</span>
                      </div>
                    </div>

                    {/* Assistant Avatar Toggle */}
                    <div className="flex items-center justify-between">
                      <Label>Show Assistant Avatar</Label>
                      <button
                        onClick={() => setEmbedStyle(prev => ({ ...prev, showAssistantAvatar: !prev.showAssistantAvatar }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          embedStyle.showAssistantAvatar ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            embedStyle.showAssistantAvatar ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Assistant Avatar Icon */}
                    {embedStyle.showAssistantAvatar && (
                      <div className="space-y-2">
                        <Label>Assistant Avatar Icon</Label>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full justify-start">
                              <div className="flex items-center space-x-2">
                                <FontAwesomeIcon 
                                  icon={avatarIcons.find(icon => icon.id === embedStyle.assistantAvatarIcon)?.icon || faRobot}
                                  className="w-4 h-4"
                                />
                                <span>Choose Icon</span>
                              </div>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-64 bg-white p-3">
                            <div className="grid grid-cols-4 gap-2">
                              {avatarIcons.map((iconOption) => (
                                <button
                                  key={iconOption.id}
                                  onClick={() => setEmbedStyle(prev => ({ ...prev, assistantAvatarIcon: iconOption.id }))}
                                  className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center transition-all hover:bg-gray-50 ${
                                    embedStyle.assistantAvatarIcon === iconOption.id 
                                      ? 'border-blue-500 bg-blue-50' 
                                      : 'border-gray-200'
                                  }`}
                                >
                                  <FontAwesomeIcon 
                                    icon={iconOption.icon}
                                    className="w-5 h-5 text-gray-600"
                                  />
                                </button>
                              ))}
                            </div>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        
                        {/* Icon Preview */}
                        <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded border">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                            style={{ backgroundColor: embedStyle.bubbleColor }}
                          >
                            <FontAwesomeIcon 
                              icon={avatarIcons.find(icon => icon.id === embedStyle.assistantAvatarIcon)?.icon || faRobot}
                              className="w-4 h-4"
                            />
                          </div>
                          <span className="text-sm text-gray-600">Preview of selected icon</span>
                        </div>
                      </div>
                    )}

                    {/* Chat Header Toggle */}
                    <div className="flex items-center justify-between">
                      <Label>Enable Chat Header</Label>
                      <button
                        onClick={() => setEmbedStyle(prev => ({ ...prev, showChatHeader: !prev.showChatHeader }))}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          embedStyle.showChatHeader ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            embedStyle.showChatHeader ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                </div>
                
                    {/* Header Title */}
                    {embedStyle.showChatHeader && (
                      <div className="space-y-2">
                        <Label>Header Title Text</Label>
                        <Input
                          value={embedStyle.chatHeaderTitle}
                          onChange={(e) => setEmbedStyle(prev => ({ ...prev, chatHeaderTitle: e.target.value }))}
                          placeholder="AI Assistant"
                          className="w-full"
                        />
                      </div>
                    )}

                    {/* Welcome Message */}
                    <div className="space-y-2">
                      <Label>Welcome Message Override</Label>
                      <Textarea
                        value={embedStyle.welcomeMessage}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEmbedStyle(prev => ({ ...prev, welcomeMessage: e.target.value }))}
                        placeholder="Enter a custom welcome message (optional)"
                        className="w-full min-h-[80px]"
                      />
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <Button onClick={saveEmbedStyles} disabled={isSavingStyles} className="flex-1">
                      {isSavingStyles ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        'Save Style Settings'
                      )}
                    </Button>
                    <Button onClick={resetToDefaults} variant="outline" className="flex items-center space-x-2">
                      <RotateCcw className="h-4 w-4" />
                      <span>Reset</span>
                    </Button>
                </div>
              </CardContent>
            </Card>
            </div>

            {/* Live Preview Section */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Eye className="h-5 w-5" />
                    <span>Live Preview</span>
                  </CardTitle>
                  <CardDescription>
                    See how your AI assistant will appear to visitors
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Preview Tabs */}
                  <Tabs defaultValue="mock" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="mock">Mock Website</TabsTrigger>
                      <TabsTrigger value="live">Your Website</TabsTrigger>
                    </TabsList>

                    {/* Mock Website Preview */}
                    <TabsContent value="mock" className="space-y-4">
                      <div className="text-sm font-medium text-gray-700 mb-3">Mock Website with Chatbot:</div>
                      <div className="relative w-full h-96 bg-gradient-to-b from-gray-50 to-gray-100 border rounded-lg overflow-hidden">
                        {/* Mock website content */}
                        <div className="p-6 space-y-4">
                          <div className="h-8 bg-gray-300 rounded w-1/3"></div>
                          <div className="space-y-2">
                            <div className="h-4 bg-gray-300 rounded w-full"></div>
                            <div className="h-4 bg-gray-300 rounded w-5/6"></div>
                            <div className="h-4 bg-gray-300 rounded w-4/5"></div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 mt-6">
                            <div className="h-20 bg-gray-300 rounded"></div>
                            <div className="h-20 bg-gray-300 rounded"></div>
                          </div>
                        </div>
                        
                        {/* Chatbot widget overlay */}
                        <div 
                          className={`absolute ${
                            embedStyle.position === 'bottom-left' ? 'bottom-4 left-4' : 'bottom-4 right-4'
                          } z-10`}
                        >
                          <button
                            className={`w-14 h-14 flex items-center justify-center border-none cursor-pointer shadow-lg transition-all duration-300 hover:scale-105`}
                            style={{
                              backgroundColor: embedStyle.bubbleColor,
                              borderRadius: embedStyle.buttonShape === 'square' ? '8px' : 
                                embedStyle.buttonShape === 'rounded' ? '16px' : '50%'
                            }}
                          >
                            <MessageSquare className="h-6 w-6 text-white" />
                          </button>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Live Website Preview */}
                    <TabsContent value="live" className="space-y-4">
                      {user?.website ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium text-gray-700">
                              Preview on: {user.website}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(user.website, '_blank')}
                              className="flex items-center space-x-1"
                            >
                              <ExternalLink className="h-3 w-3" />
                              <span>Open</span>
                            </Button>
                          </div>
                          
                          <div className="relative w-full h-96 border rounded-lg overflow-hidden bg-white">
                            <iframe
                              src={user.website}
                              className="w-full h-full border-0"
                              style={{ 
                                transform: 'scale(0.4)', 
                                transformOrigin: 'top left',
                                width: '250%',
                                height: '250%'
                              }}
                              sandbox="allow-scripts allow-same-origin"
                              loading="lazy"
                            />
                            
                            {/* Chatbot widget overlay */}
                            <div 
                              className={`absolute ${
                                embedStyle.position === 'bottom-left' ? 'bottom-4 left-4' : 'bottom-4 right-4'
                              } z-20`}
                            >
                              <button
                                className={`w-14 h-14 flex items-center justify-center border-none cursor-pointer shadow-xl transition-all duration-300 hover:scale-105`}
                                style={{
                                  backgroundColor: embedStyle.bubbleColor,
                                  borderRadius: embedStyle.buttonShape === 'square' ? '8px' : 
                                    embedStyle.buttonShape === 'rounded' ? '16px' : '50%'
                                }}
                              >
                                <MessageSquare className="h-6 w-6 text-white" />
                              </button>
                            </div>
                          </div>

                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                            <p className="text-xs text-blue-800">
                              <strong>Live Preview:</strong> This shows how your chatbot widget will appear on your actual website. 
                              The iframe is scaled to fit the preview area.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-12 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
                          <Globe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">No Website URL Found</h3>
                          <p className="text-gray-600 mb-4">Add your website URL in settings to see the live preview</p>
                          <Button
                            variant="outline"
                            onClick={() => window.open('/dashboard/settings', '_blank')}
                            className="flex items-center space-x-2"
                          >
                            <Settings className="h-4 w-4" />
                            <span>Go to Settings</span>
                          </Button>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Separate Chat Interface Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>Chat Interface Preview</CardTitle>
                  <CardDescription>
                    How the chat window will look when opened
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div 
                    className="w-full max-w-sm mx-auto rounded-xl shadow-lg border overflow-hidden"
                    style={{ 
                      backgroundColor: embedStyle.chatBackgroundColor,
                      fontFamily: embedStyle.assistantFontStyle === 'sans' ? '"Inter", sans-serif' :
                        embedStyle.assistantFontStyle === 'serif' ? 'Georgia, serif' : 
                        '"JetBrains Mono", monospace'
                    }}
                  >
                    {/* Chat Header */}
                    {embedStyle.showChatHeader && (
                      <div 
                        className="p-4 text-white flex items-center"
                        style={{ 
                          background: `linear-gradient(90deg, ${embedStyle.bubbleColor} 0%, ${embedStyle.userMessageBubbleColor} 100%)` 
                        }}
                      >
                        <h3 className="text-base font-medium">{embedStyle.chatHeaderTitle}</h3>
                      </div>
                    )}

                    {/* Chat Messages */}
                    <div className="p-4 space-y-3 min-h-[300px] max-h-[300px] overflow-y-auto">
                      {/* Welcome Message */}
                      {embedStyle.welcomeMessage && (
                        <div className="flex items-start space-x-2">
                          {embedStyle.showAssistantAvatar && (
                            <div 
                              className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center"
                              style={{ backgroundColor: embedStyle.bubbleColor }}
                            >
                                                          <FontAwesomeIcon 
                              icon={avatarIcons.find(icon => icon.id === embedStyle.assistantAvatarIcon)?.icon || faRobot}
                              className="w-4 h-4 text-white"
                            />
                            </div>
                          )}
                          <div 
                            className="max-w-[80%] px-3 py-2 text-sm text-gray-800"
                            style={{ 
                              backgroundColor: embedStyle.assistantMessageBubbleColor,
                              borderRadius: `${embedStyle.messageBubbleRadius}px`
                            }}
                          >
                            {embedStyle.welcomeMessage}
                          </div>
                        </div>
                      )}

                      {/* Sample User Message */}
                      <div className="flex justify-end">
                        <div 
                          className="max-w-[80%] px-3 py-2 text-sm text-white"
                          style={{ 
                            backgroundColor: embedStyle.userMessageBubbleColor,
                            borderRadius: `${embedStyle.messageBubbleRadius}px`
                          }}
                        >
                          Hello! How can you help me?
                        </div>
                      </div>

                      {/* Sample Assistant Response */}
                      <div className="flex items-start space-x-2">
                        {embedStyle.showAssistantAvatar && (
                          <div 
                            className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center"
                            style={{ backgroundColor: embedStyle.bubbleColor }}
                          >
                                                      <FontAwesomeIcon 
                            icon={avatarIcons.find(icon => icon.id === embedStyle.assistantAvatarIcon)?.icon || faRobot}
                            className="w-4 h-4 text-white"
                          />
                          </div>
                        )}
                        <div 
                          className="max-w-[80%] px-3 py-2 text-sm text-gray-800"
                          style={{ 
                            backgroundColor: embedStyle.assistantMessageBubbleColor,
                            borderRadius: `${embedStyle.messageBubbleRadius}px`
                          }}
                        >
                          I'm here to help! Feel free to ask me anything about our services.
                        </div>
                      </div>

                      {/* Another sample exchange */}
                      <div className="flex justify-end">
                        <div 
                          className="max-w-[80%] px-3 py-2 text-sm text-white"
                          style={{ 
                            backgroundColor: embedStyle.userMessageBubbleColor,
                            borderRadius: `${embedStyle.messageBubbleRadius}px`
                          }}
                        >
                          What are your business hours?
                        </div>
                      </div>

                      <div className="flex items-start space-x-2">
                        {embedStyle.showAssistantAvatar && (
                          <div 
                            className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center"
                            style={{ backgroundColor: embedStyle.bubbleColor }}
                          >
                            <FontAwesomeIcon 
                              icon={avatarIcons.find(icon => icon.id === embedStyle.assistantAvatarIcon)?.icon || faRobot}
                              className="w-4 h-4 text-white"
                            />
                          </div>
                        )}
                        <div 
                          className="max-w-[80%] px-3 py-2 text-sm text-gray-800"
                          style={{ 
                            backgroundColor: embedStyle.assistantMessageBubbleColor,
                            borderRadius: `${embedStyle.messageBubbleRadius}px`
                          }}
                        >
                          We're open Monday to Friday, 9 AM to 6 PM EST. Feel free to reach out anytime!
                        </div>
                      </div>
                    </div>

                    {/* Chat Input */}
                    <div className="p-4 border-t border-gray-200">
                      <div className="flex items-center space-x-2">
                        <input 
                          type="text" 
                          placeholder="Type your message..."
                          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value="Type your message..."
                          readOnly
                        />
                        <button 
                          className="p-2 rounded-lg"
                          style={{ backgroundColor: embedStyle.userMessageBubbleColor }}
                        >
                          <Send className="h-4 w-4 text-white" />
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Embed Code Generator Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Code className="h-5 w-5" />
                    <span>Embed Generator</span>
                  </CardTitle>
                  <CardDescription>
                    Copy and paste this code into your website to add the styled chat widget
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button onClick={resetToDefaults} variant="outline" size="sm" className="flex items-center space-x-2">
                    <RotateCcw className="h-4 w-4" />
                    <span>Reset to Default Style</span>
                </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Code Type Tabs */}
              <Tabs value={embedCodeType} onValueChange={(value) => setEmbedCodeType(value as 'styled' | 'raw' | 'wordpress')}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="styled">Styled Embed</TabsTrigger>
                  <TabsTrigger value="raw">Raw Embed</TabsTrigger>
                  <TabsTrigger value="wordpress">WordPress Plugin</TabsTrigger>
                </TabsList>

                {/* Styled Embed Content */}
                <TabsContent value="styled" className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600">
                        Working styled embed snippet that includes all UI settings
                      </p>
                      <Button
                        onClick={() => copyEmbedCode(generateStyledEmbedCode())}
                        className="flex items-center space-x-2"
                      >
                        <Copy className="h-4 w-4" />
                        <span>Copy Code</span>
                </Button>
                    </div>
                    <ScrollArea className="h-64 w-full border rounded-md">
                      <pre className="p-4 text-xs overflow-x-auto">
                        <code>{generateStyledEmbedCode()}</code>
                      </pre>
                    </ScrollArea>
                  </div>
                </TabsContent>

                {/* Raw Embed Content */}
                <TabsContent value="raw" className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600">
                        Minimal version without styles for full customization
                      </p>
                      <Button
                        onClick={() => copyEmbedCode(generateRawEmbedCode())}
                        className="flex items-center space-x-2"
                      >
                        <Copy className="h-4 w-4" />
                        <span>Copy Code</span>
                </Button>
                    </div>
                    <ScrollArea className="h-32 w-full border rounded-md">
                      <pre className="p-4 text-xs overflow-x-auto">
                        <code>{generateRawEmbedCode()}</code>
                      </pre>
                    </ScrollArea>
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-xs text-blue-800">
                        <strong>Note:</strong> This embed includes no styling. You can target <code className="bg-blue-100 px-1 rounded">.executa-chat</code> via your own stylesheet for full customization.
                      </p>
                    </div>
                  </div>
                </TabsContent>

                {/* WordPress Plugin Content */}
                <TabsContent value="wordpress" className="space-y-4">
                  <div className="space-y-4">
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <svg className="h-8 w-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M21.469 0.298c-0.328-0.298-0.844-0.298-1.172 0l-1.797 1.625c-0.328 0.297-0.328 0.781 0 1.078l2.5 2.266c0.164 0.148 0.375 0.223 0.586 0.223s0.422-0.074 0.586-0.223c0.328-0.297 0.328-0.781 0-1.078l-0.414-0.375 0.711-0.641c0.328-0.297 0.328-0.781 0-1.078zM12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75-4.365-9.75-9.75-9.75zM12 19.5c-4.273 0-7.75-3.477-7.75-7.75s3.477-7.75 7.75-7.75 7.75 3.477 7.75 7.75-3.477 7.75-7.75 7.75z"/>
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            WordPress Plugin Export
                          </h3>
                          <p className="text-sm text-gray-600 mb-3">
                            Generate a complete WordPress plugin that adds your AI assistant to any WordPress site. 
                            The plugin includes all your current styling and settings.
                          </p>
                          <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex items-center space-x-2">
                              <span className="text-green-600">✓</span>
                              <span>Includes all your current styling and configuration</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-green-600">✓</span>
                              <span>WordPress admin panel for basic settings</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-green-600">✓</span>
                              <span>No dashboard needed - uses your Executa.ai account</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-green-600">✓</span>
                              <span>Mobile responsive and SEO friendly</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">Ready to Download</h4>
                        <p className="text-sm text-gray-600">
                          Plugin Name: <code className="bg-gray-100 px-1 rounded text-xs">executa-ai-{assistant?.name?.toLowerCase().replace(/[^a-z0-9]/g, '-')}.zip</code>
                        </p>
                      </div>
                      <Button
                        onClick={downloadWordPressPlugin}
                        className="flex items-center space-x-2"
                        size="lg"
                      >
                        <Download className="h-4 w-4" />
                        <span>Download Plugin</span>
                      </Button>
                    </div>

                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-amber-800">
                          <p className="font-medium mb-1">Installation Instructions:</p>
                          <ol className="list-decimal list-inside space-y-1">
                            <li>Download the plugin ZIP file</li>
                            <li>Go to your WordPress admin → Plugins → Add New → Upload Plugin</li>
                            <li>Upload the ZIP file and activate the plugin</li>
                            <li>Visit Settings → {assistant?.name} AI to configure display options</li>
                            <li>The chat widget will appear on your site automatically</li>
                          </ol>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-xs text-blue-800">
                        <strong>Note:</strong> The plugin connects to your Executa.ai assistant. To modify AI responses, training, or view analytics, 
                        use your <a href={`https://app.executa.ai/dashboard/assistants/${assistantId}`} target="_blank" rel="noopener noreferrer" className="underline">Executa.ai dashboard</a>.
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Conversations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{assistant.totalSessions || 0}</div>
                <p className="text-xs text-green-600">+12% from last week</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Satisfaction Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4.8/5</div>
                <p className="text-xs text-green-600">+0.2 from last week</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Avg Response Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1.2s</div>
                <p className="text-xs text-green-600">15% faster than average</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">47</div>
                <p className="text-xs text-blue-600">This month</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Usage Analytics</CardTitle>
              <CardDescription>
                {assistant.totalSessions === 0 
                  ? "No analytics data yet - start chatting to see insights!" 
                  : "Performance metrics and user engagement data"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">Analytics Chart</p>
                  <p className="text-sm text-gray-500">Interactive analytics coming soon</p>
        </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assistant Settings</CardTitle>
              <CardDescription>
                Configure your assistant's behavior and appearance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Assistant Name</Label>
                  <Input defaultValue={assistant.name} />
      </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <select className="w-full p-2 border rounded-md">
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="paused">Paused</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea defaultValue={assistant.description || ""} rows={3} />
              </div>

              <div className="flex space-x-4 pt-4">
                <Button>Save Changes</Button>
                <Button variant="outline">Cancel</Button>
                <Button variant="destructive" className="ml-auto">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Assistant
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

 