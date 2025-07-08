'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, RotateCcw, Download, Trash2, ChevronDown, ChevronRight, Sparkles, Bot, Shield, Settings, MessageSquare, User } from "lucide-react";
import { toast } from "sonner";
import HandoffSettings from "@/components/models/HandoffSettings";
import { useModelStore } from '@/state/modelStore';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertTriangle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";

interface SettingsState {
  basicInfo: {
    name: string;
    description: string;
    status: string;
    // Removed welcomeMessage - handled in embed tab
  };
  behavior: {
    systemInstructions: string;
    responseStyle: string;
    responseLength: string;
    confidenceLevel: string;
    allowGeneralKnowledge: boolean;
    requireSourceCitation: boolean;
    allowFollowUpQuestions: boolean;
    enableContextMemory: boolean;
  };
  knowledgeBase: {
    searchSensitivity: string;
    maxContextLength: string;
    prioritizeRecentFiles: boolean;
    includeFileMetadata: boolean;
    crossReferenceFiles: boolean;
  };
  moderation: {
    contentFilterLevel: string;
    privacyMode: string;
    blockedTopics: string;
    logConversations: boolean;
    enableFeedback: boolean;
  };
  advanced: {
    temperature: number;
    topP: number;
    maxTokens: string;
    stopSequences: string;
    enableStreaming: boolean;
    enableRetry: boolean;
  };
}

interface SettingsTabProps {
  assistant: any;
  onUpdate?: (assistant: any) => void;
}

// Preset templates for quick setup
const PRESET_TEMPLATES = {
  'support-bot': {
    name: 'Customer Support Bot',
    description: 'A helpful customer support assistant that resolves issues efficiently',
    systemInstructions: `You are a professional customer support assistant. Your role is to:

• **Listen carefully** to customer concerns and provide empathetic responses
• **Solve problems efficiently** using the knowledge base and available resources  
• **Escalate when needed** - transfer complex issues to human agents
• **Stay professional** while being warm and understanding
• **Follow up** to ensure customer satisfaction

Always prioritize customer satisfaction and maintain a helpful, solution-focused attitude.`,
    behavior: {
      responseStyle: 'professional',
      responseLength: 'balanced',
      confidenceLevel: 'balanced',
      allowGeneralKnowledge: false,
      requireSourceCitation: true,
      allowFollowUpQuestions: true,
      enableContextMemory: true
    },
    moderation: {
      contentFilterLevel: 'moderate',
      privacyMode: 'maximum',
      blockedTopics: 'personal information, competitor details',
      logConversations: true,
      enableFeedback: true
    }
  },
  'creative-assistant': {
    name: 'Creative Assistant',
    description: 'An imaginative AI that helps with creative projects and brainstorming',
    systemInstructions: `You are a creative assistant designed to inspire and collaborate. Your approach:

• **Think outside the box** - offer unique and innovative ideas
• **Encourage experimentation** and creative risk-taking
• **Provide detailed creative guidance** with specific techniques and methods
• **Adapt to different creative fields** - writing, design, art, music, etc.
• **Build on user ideas** rather than replacing them

Be enthusiastic, inspiring, and always ready to explore new creative possibilities!`,
    behavior: {
      responseStyle: 'friendly',
      responseLength: 'detailed',
      confidenceLevel: 'assertive',
      allowGeneralKnowledge: true,
      requireSourceCitation: false,
      allowFollowUpQuestions: true,
      enableContextMemory: true
    },
    moderation: {
      contentFilterLevel: 'relaxed',
      privacyMode: 'standard',
      blockedTopics: '',
      logConversations: true,
      enableFeedback: true
    }
  },
  'technical-expert': {
    name: 'Technical Expert',
    description: 'A precise technical assistant for documentation and code help',
    systemInstructions: `You are a technical expert assistant focused on accuracy and precision. Your methodology:

• **Provide accurate technical information** backed by documentation
• **Use precise technical language** appropriate for the audience
• **Include code examples** and step-by-step instructions when relevant
• **Cite specific documentation** and version numbers
• **Acknowledge technical limitations** and suggest alternatives

Maintain technical accuracy while being clear and educational in your explanations.`,
    behavior: {
      responseStyle: 'technical',
      responseLength: 'detailed',
      confidenceLevel: 'conservative',
      allowGeneralKnowledge: false,
      requireSourceCitation: true,
      allowFollowUpQuestions: true,
      enableContextMemory: true
    },
    moderation: {
      contentFilterLevel: 'strict',
      privacyMode: 'maximum',
      blockedTopics: 'proprietary code, security vulnerabilities',
      logConversations: true,
      enableFeedback: true
    }
  }
};

export default function SettingsTab({ assistant, onUpdate }: SettingsTabProps) {
  const [settingsState, setSettingsState] = useState<SettingsState>({
    basicInfo: {
      name: '',
      description: '',
      status: 'active'
      // Removed welcomeMessage - handled in embed tab
    },
    behavior: {
      systemInstructions: '',
      responseStyle: 'friendly',
      responseLength: 'balanced',
      confidenceLevel: 'balanced',
      allowGeneralKnowledge: true,
      requireSourceCitation: true,
      allowFollowUpQuestions: true,
      enableContextMemory: true
    },
    knowledgeBase: {
      searchSensitivity: 'moderate',
      maxContextLength: '4000',
      prioritizeRecentFiles: true,
      includeFileMetadata: true,
      crossReferenceFiles: true
    },
    moderation: {
      contentFilterLevel: 'moderate',
      privacyMode: 'maximum',
      blockedTopics: '',
      logConversations: true,
      enableFeedback: true
    },
    advanced: {
      temperature: 0.7,
      topP: 0.9,
      maxTokens: '500',
      stopSequences: '',
      enableStreaming: true,
      enableRetry: true
    }
  });

  // UI State
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [handoffEnabled, setHandoffEnabled] = useState(false);
  const [handoffSettings, setHandoffSettings] = useState({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalSettings, setOriginalSettings] = useState<SettingsState | null>(null);
  
  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    personality: true,
    knowledge: false,
    moderation: false,
    advanced: false,
    handoff: false
  });

  // Refs for scroll navigation
  const sectionRefs = {
    basic: useRef<HTMLDivElement>(null),
    personality: useRef<HTMLDivElement>(null),
    knowledge: useRef<HTMLDivElement>(null),
    moderation: useRef<HTMLDivElement>(null),
    advanced: useRef<HTMLDivElement>(null),
    handoff: useRef<HTMLDivElement>(null)
  };

  // Delete-related state
  const { deleteModel } = useModelStore();
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load settings from assistant when component mounts or assistant changes
  useEffect(() => {
    if (assistant) {
      const newSettings = {
        basicInfo: {
          name: assistant.name || '',
          description: assistant.description || '',
          status: assistant.status?.toLowerCase() || 'active'
          // Removed welcomeMessage - handled in embed tab
        },
        behavior: {
          systemInstructions: assistant.instructions || '',
          responseStyle: 'friendly',
          responseLength: 'balanced',
          confidenceLevel: 'balanced',
          allowGeneralKnowledge: true,
          requireSourceCitation: true,
          allowFollowUpQuestions: true,
          enableContextMemory: true
        },
        knowledgeBase: {
          searchSensitivity: 'moderate',
          maxContextLength: '4000',
          prioritizeRecentFiles: true,
          includeFileMetadata: true,
          crossReferenceFiles: true
        },
        moderation: {
          contentFilterLevel: 'moderate',
          privacyMode: 'maximum',
          blockedTopics: '',
          logConversations: true,
          enableFeedback: true
        },
        advanced: {
          temperature: 0.7,
          topP: 0.9,
          maxTokens: '500',
          stopSequences: '',
          enableStreaming: true,
          enableRetry: true
        }
      };
      
      setSettingsState(newSettings);
      setOriginalSettings(newSettings);
      
      // Load handoff settings
      setHandoffEnabled(assistant.handoffEnabled || false);
      setHandoffSettings(assistant.handoffSettings || {});
    }
  }, [assistant]);

  // Detect unsaved changes
  useEffect(() => {
    if (originalSettings) {
      const hasChanges = JSON.stringify(settingsState) !== JSON.stringify(originalSettings);
      setHasUnsavedChanges(hasChanges);
    }
  }, [settingsState, originalSettings]);

  const handleSettingsChange = (category: string, field: string, value: any) => {
    setSettingsState(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof SettingsState],
        [field]: value
      }
    }));
  };

  const handleAdvancedSliderChange = (field: string, value: number) => {
    setSettingsState(prev => ({
      ...prev,
      advanced: {
        ...prev.advanced,
        [field]: value
      }
    }));
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section as keyof typeof expandedSections]
    }));
  };

  const scrollToSection = (section: string) => {
    const ref = sectionRefs[section as keyof typeof sectionRefs];
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Expand the section if it's collapsed
      if (!expandedSections[section as keyof typeof expandedSections]) {
        toggleSection(section);
      }
    }
  };

  const applyPreset = (presetKey: string) => {
    const preset = PRESET_TEMPLATES[presetKey as keyof typeof PRESET_TEMPLATES];
    if (preset) {
      setSettingsState(prev => ({
        ...prev,
        basicInfo: {
          ...prev.basicInfo,
          name: preset.name,
          description: preset.description
        },
        behavior: {
          ...prev.behavior,
          systemInstructions: preset.systemInstructions,
          ...preset.behavior
        },
        moderation: {
          ...prev.moderation,
          ...preset.moderation
        }
      }));
      toast.success(`Applied ${preset.name} preset!`);
    }
  };

  const saveAllSettings = async () => {
    setIsSavingSettings(true);
    try {
      const token = localStorage.getItem('executa-auth-token');
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      // Include handoff settings in the payload
      const settingsPayload = {
        ...settingsState,
        handoffEnabled,
        handoffSettings
      };

      const response = await fetch(`/api/models/${assistant?.id}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(settingsPayload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save settings');
      }

      toast.success("Settings saved successfully!");
      setOriginalSettings({ ...settingsState });
      setHasUnsavedChanges(false);
      
      if (onUpdate) {
        onUpdate(data.assistant);
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const resetSettingsToDefaults = () => {
    setSettingsState({
      basicInfo: {
        name: assistant?.name || '',
        description: '',
        status: 'active'
        // Removed welcomeMessage - handled in embed tab
      },
      behavior: {
        systemInstructions: '',
        responseStyle: 'friendly',
        responseLength: 'balanced',
        confidenceLevel: 'balanced',
        allowGeneralKnowledge: true,
        requireSourceCitation: true,
        allowFollowUpQuestions: true,
        enableContextMemory: true
      },
      knowledgeBase: {
        searchSensitivity: 'moderate',
        maxContextLength: '4000',
        prioritizeRecentFiles: true,
        includeFileMetadata: true,
        crossReferenceFiles: true
      },
      moderation: {
        contentFilterLevel: 'moderate',
        privacyMode: 'maximum',
        blockedTopics: '',
        logConversations: true,
        enableFeedback: true
      },
      advanced: {
        temperature: 0.7,
        topP: 0.9,
        maxTokens: '500',
        stopSequences: '',
        enableStreaming: true,
        enableRetry: true
      }
    });
    
    // Reset handoff settings to defaults
    setHandoffEnabled(false);
    setHandoffSettings({});
    
    toast.success("Settings reset to defaults");
  };

  const handleHandoffUpdate = (enabled: boolean, settings: any) => {
    setHandoffEnabled(enabled);
    setHandoffSettings(settings);
  };

  const handleDeleteAssistant = async () => {
    if (!assistant?.id) return;
    
    setIsDeleting(true);
    try {
      await deleteModel(assistant.id);
      toast.success("Assistant deleted successfully");
      router.push('/dashboard');
    } catch (error) {
      console.error("Error deleting assistant:", error);
      toast.error("Failed to delete assistant");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  // Sidebar Navigation Component
  const SidebarNavigation = () => (
    <div className="sticky top-4 w-64 space-y-2">
      <div className="bg-white border rounded-lg p-4 shadow-sm">
        <h3 className="font-semibold text-sm text-gray-800 mb-3">Navigation</h3>
        <nav className="space-y-1">
          {[
            { key: 'basic', label: 'Basic Info', icon: User },
            { key: 'personality', label: 'AI Personality', icon: Bot },
            { key: 'knowledge', label: 'Knowledge Base', icon: MessageSquare },
            { key: 'moderation', label: 'Content & Privacy', icon: Shield },
            { key: 'advanced', label: 'Advanced Config', icon: Settings },
            { key: 'handoff', label: 'Human Handoff', icon: User }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => scrollToSection(key)}
              className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-left rounded-md hover:bg-gray-100 transition-colors"
            >
              <Icon className="h-4 w-4 text-gray-500" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Preset Templates */}
      <div className="bg-white border rounded-lg p-4 shadow-sm">
        <h3 className="font-semibold text-sm text-gray-800 mb-3 flex items-center">
          <Sparkles className="h-4 w-4 mr-2" />
          Quick Templates
        </h3>
        <div className="space-y-2">
          {Object.entries(PRESET_TEMPLATES).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => applyPreset(key)}
              className="w-full text-left p-2 text-xs bg-gray-50 hover:bg-gray-100 rounded border transition-colors"
            >
              <div className="font-medium">{preset.name}</div>
              <div className="text-gray-600 text-xs">{preset.description}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // Collapsible Section Component
  const CollapsibleSection = ({ 
    id, 
    title, 
    description, 
    icon: Icon, 
    children, 
    expanded 
  }: { 
    id: string;
    title: string;
    description: string;
    icon: any;
    children: React.ReactNode;
    expanded: boolean;
  }) => (
    <Card ref={sectionRefs[id as keyof typeof sectionRefs]} className="form-section">
      <div 
        className="cursor-pointer hover:bg-gray-50 transition-colors w-full px-6 py-6"
        onClick={() => toggleSection(id)}
        style={{ cursor: 'pointer' }}
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-3 flex-1">
            <Icon className="h-5 w-5 text-blue-600" />
            <div className="flex-1">
              <div className="text-lg font-semibold leading-none">{title}</div>
              <div className="text-muted-foreground text-sm mt-1.5">{description}</div>
            </div>
          </div>
          <div className="flex-shrink-0 ml-4">
            {expanded ? (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </div>
      </div>
      {expanded && (
        <CardContent className="space-y-6">
          {children}
        </CardContent>
      )}
    </Card>
  );

  return (
    <div className="flex gap-6 min-h-screen">
      {/* Sidebar Navigation */}
      <SidebarNavigation />

      {/* Main Content */}
      <div className="flex-1 space-y-6 pb-24">
        {/* Basic Information */}
        <CollapsibleSection
          id="basic"
          title="Basic Information"
          description="Configure your assistant's core details and status"
          icon={User}
          expanded={expandedSections.basic}
        >
          <div className="form-field">
            <Label htmlFor="name">Assistant Name</Label>
            <Input 
              id="name"
              value={settingsState.basicInfo.name}
              onChange={(e) => handleSettingsChange('basicInfo', 'name', e.target.value)}
              placeholder="e.g., Customer Support Bot, Creative Assistant, Technical Helper"
            />
          </div>

          <div className="form-field">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description"
              value={settingsState.basicInfo.description}
              onChange={(e) => handleSettingsChange('basicInfo', 'description', e.target.value)}
              placeholder="Briefly describe what this assistant does and how it helps users..."
              rows={3}
            />
          </div>

          <div className="form-field">
            <Label htmlFor="status">Status</Label>
            <Select 
              value={settingsState.basicInfo.status} 
              onValueChange={(value) => handleSettingsChange('basicInfo', 'status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active - Ready to chat</SelectItem>
                <SelectItem value="draft">Draft - Not yet published</SelectItem>
                <SelectItem value="training">Training - Being updated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CollapsibleSection>

        {/* AI Behavior & Personality */}
        <CollapsibleSection
          id="personality"
          title="AI Behavior & Personality"
          description="Define how your assistant responds and behaves"
          icon={Bot}
          expanded={expandedSections.personality}
        >
          <div className="form-field">
            <Label htmlFor="systemInstructions">System Instructions</Label>
            <Textarea 
              id="systemInstructions"
              value={settingsState.behavior.systemInstructions}
              onChange={(e) => handleSettingsChange('behavior', 'systemInstructions', e.target.value)}
              rows={8}
              placeholder={`Define your assistant's personality, role, and behavior. For example:

"You are a helpful customer support assistant. Your role is to:
• Listen carefully to customer concerns
• Provide clear, actionable solutions
• Escalate complex issues when needed
• Maintain a professional yet friendly tone

Always prioritize customer satisfaction and be solution-focused."`}
            />
            <p className="text-xs text-gray-500 mt-1">
              These instructions guide your assistant's behavior and responses. Be specific about tone, style, and capabilities.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="form-field">
              <Label>Response Style</Label>
              <Select 
                value={settingsState.behavior.responseStyle} 
                onValueChange={(value) => handleSettingsChange('behavior', 'responseStyle', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="friendly">Friendly & Approachable</SelectItem>
                  <SelectItem value="professional">Professional & Business</SelectItem>
                  <SelectItem value="casual">Casual & Conversational</SelectItem>
                  <SelectItem value="formal">Formal & Precise</SelectItem>
                  <SelectItem value="technical">Technical & Detailed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="form-field">
              <Label>Response Length</Label>
              <Select 
                value={settingsState.behavior.responseLength} 
                onValueChange={(value) => handleSettingsChange('behavior', 'responseLength', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="concise">Concise & Brief</SelectItem>
                  <SelectItem value="balanced">Balanced Detail</SelectItem>
                  <SelectItem value="detailed">Detailed & Comprehensive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="form-field">
            <Label>Confidence Level</Label>
            <Select 
              value={settingsState.behavior.confidenceLevel} 
              onValueChange={(value) => handleSettingsChange('behavior', 'confidenceLevel', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="conservative">Conservative - Always cite sources</SelectItem>
                <SelectItem value="balanced">Balanced - Moderate confidence</SelectItem>
                <SelectItem value="assertive">Assertive - Direct answers</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="allowGeneralKnowledge" 
                checked={settingsState.behavior.allowGeneralKnowledge}
                onCheckedChange={(checked) => handleSettingsChange('behavior', 'allowGeneralKnowledge', checked)}
              />
              <Label htmlFor="allowGeneralKnowledge" className="text-sm">
                Allow general knowledge beyond knowledge base
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="requireSourceCitation" 
                checked={settingsState.behavior.requireSourceCitation}
                onCheckedChange={(checked) => handleSettingsChange('behavior', 'requireSourceCitation', checked)}
              />
              <Label htmlFor="requireSourceCitation" className="text-sm">
                Require source citations in responses
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="allowFollowUpQuestions" 
                checked={settingsState.behavior.allowFollowUpQuestions}
                onCheckedChange={(checked) => handleSettingsChange('behavior', 'allowFollowUpQuestions', checked)}
              />
              <Label htmlFor="allowFollowUpQuestions" className="text-sm">
                Enable follow-up question suggestions
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="enableContextMemory" 
                checked={settingsState.behavior.enableContextMemory}
                onCheckedChange={(checked) => handleSettingsChange('behavior', 'enableContextMemory', checked)}
              />
              <Label htmlFor="enableContextMemory" className="text-sm">
                Remember context within conversations
              </Label>
            </div>
          </div>
        </CollapsibleSection>

        {/* Knowledge Base Settings */}
        <CollapsibleSection
          id="knowledge"
          title="Knowledge Base Settings"
          description="Configure how your assistant searches and uses uploaded documents"
          icon={MessageSquare}
          expanded={expandedSections.knowledge}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="form-field">
              <Label>Search Sensitivity</Label>
              <Select 
                value={settingsState.knowledgeBase.searchSensitivity} 
                onValueChange={(value) => handleSettingsChange('knowledgeBase', 'searchSensitivity', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - Exact matches only</SelectItem>
                  <SelectItem value="moderate">Moderate - Balanced matching</SelectItem>
                  <SelectItem value="high">High - Broader matching</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="form-field">
              <Label>Max Context Length</Label>
              <Select 
                value={settingsState.knowledgeBase.maxContextLength} 
                onValueChange={(value) => handleSettingsChange('knowledgeBase', 'maxContextLength', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2000">2,000 tokens (Short)</SelectItem>
                  <SelectItem value="4000">4,000 tokens (Medium)</SelectItem>
                  <SelectItem value="8000">8,000 tokens (Long)</SelectItem>
                  <SelectItem value="16000">16,000 tokens (Very Long)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="prioritizeRecentFiles" 
                checked={settingsState.knowledgeBase.prioritizeRecentFiles}
                onCheckedChange={(checked) => handleSettingsChange('knowledgeBase', 'prioritizeRecentFiles', checked)}
              />
              <Label htmlFor="prioritizeRecentFiles" className="text-sm">
                Prioritize recently uploaded files
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="includeFileMetadata" 
                checked={settingsState.knowledgeBase.includeFileMetadata}
                onCheckedChange={(checked) => handleSettingsChange('knowledgeBase', 'includeFileMetadata', checked)}
              />
              <Label htmlFor="includeFileMetadata" className="text-sm">
                Include file metadata in responses
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="crossReferenceFiles" 
                checked={settingsState.knowledgeBase.crossReferenceFiles}
                onCheckedChange={(checked) => handleSettingsChange('knowledgeBase', 'crossReferenceFiles', checked)}
              />
              <Label htmlFor="crossReferenceFiles" className="text-sm">
                Cross-reference information across files
              </Label>
            </div>
          </div>
        </CollapsibleSection>

        {/* Content Moderation & Privacy */}
        <CollapsibleSection
          id="moderation"
          title="Content Moderation & Privacy"
          description="Set content filtering and privacy preferences"
          icon={Shield}
          expanded={expandedSections.moderation}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="form-field">
              <Label>Content Filter Level</Label>
              <Select 
                value={settingsState.moderation.contentFilterLevel} 
                onValueChange={(value) => handleSettingsChange('moderation', 'contentFilterLevel', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relaxed">Relaxed - Minimal filtering</SelectItem>
                  <SelectItem value="moderate">Moderate - Balanced filtering</SelectItem>
                  <SelectItem value="strict">Strict - Maximum filtering</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="form-field">
              <Label>Privacy Mode</Label>
              <Select 
                value={settingsState.moderation.privacyMode} 
                onValueChange={(value) => handleSettingsChange('moderation', 'privacyMode', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard Privacy</SelectItem>
                  <SelectItem value="maximum">Maximum Privacy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="form-field">
            <Label htmlFor="blockedTopics">Blocked Topics (comma-separated)</Label>
            <Textarea 
              id="blockedTopics"
              value={settingsState.moderation.blockedTopics}
              onChange={(e) => handleSettingsChange('moderation', 'blockedTopics', e.target.value)}
              placeholder="e.g., politics, religion, medical advice, personal finance"
              rows={2}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="logConversations" 
                checked={settingsState.moderation.logConversations}
                onCheckedChange={(checked) => handleSettingsChange('moderation', 'logConversations', checked)}
              />
              <Label htmlFor="logConversations" className="text-sm">
                Log conversations for improvement
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="enableFeedback" 
                checked={settingsState.moderation.enableFeedback}
                onCheckedChange={(checked) => handleSettingsChange('moderation', 'enableFeedback', checked)}
              />
              <Label htmlFor="enableFeedback" className="text-sm">
                Enable user feedback collection
              </Label>
            </div>
          </div>
        </CollapsibleSection>

        {/* Advanced Configuration */}
        <CollapsibleSection
          id="advanced"
          title="Advanced Configuration"
          description="Expert-level settings for fine-tuning assistant behavior"
          icon={Settings}
          expanded={expandedSections.advanced}
        >
          <div className="grid gap-6 md:grid-cols-2">
            <div className="form-field">
              <Label>Temperature (Creativity)</Label>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={settingsState.advanced.temperature}
                  onChange={(e) => handleAdvancedSliderChange('temperature', parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="w-12 text-sm text-gray-600">{settingsState.advanced.temperature}</span>
              </div>
              <p className="text-xs text-gray-500">Higher = more creative, Lower = more focused</p>
            </div>

            <div className="form-field">
              <Label>Top-p (Response Focus)</Label>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settingsState.advanced.topP}
                  onChange={(e) => handleAdvancedSliderChange('topP', parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="w-12 text-sm text-gray-600">{settingsState.advanced.topP}</span>
              </div>
              <p className="text-xs text-gray-500">Controls response diversity and focus</p>
            </div>
          </div>

          <div className="form-field">
            <Label>Max Tokens per Response</Label>
            <Select 
              value={settingsState.advanced.maxTokens} 
              onValueChange={(value) => handleSettingsChange('advanced', 'maxTokens', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="150">150 (Very Short)</SelectItem>
                <SelectItem value="300">300 (Short)</SelectItem>
                <SelectItem value="500">500 (Medium)</SelectItem>
                <SelectItem value="1000">1,000 (Long)</SelectItem>
                <SelectItem value="2000">2,000 (Very Long)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="form-field">
            <Label htmlFor="stopSequences">Custom Stop Sequences (comma-separated)</Label>
            <Input 
              id="stopSequences"
              value={settingsState.advanced.stopSequences}
              onChange={(e) => handleSettingsChange('advanced', 'stopSequences', e.target.value)}
              placeholder="e.g., [END], ###, STOP"
            />
            <p className="text-xs text-gray-500">Sequences that will stop response generation</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="enableStreaming" 
                checked={settingsState.advanced.enableStreaming}
                onCheckedChange={(checked) => handleSettingsChange('advanced', 'enableStreaming', checked)}
              />
              <Label htmlFor="enableStreaming" className="text-sm">
                Enable response streaming
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="enableRetry" 
                checked={settingsState.advanced.enableRetry}
                onCheckedChange={(checked) => handleSettingsChange('advanced', 'enableRetry', checked)}
              />
              <Label htmlFor="enableRetry" className="text-sm">
                Auto-retry failed requests
              </Label>
            </div>
          </div>
        </CollapsibleSection>

        {/* Human Handoff */}
        <CollapsibleSection
          id="handoff"
          title="Human Handoff"
          description="Configure when and how to transfer conversations to human support"
          icon={User}
          expanded={expandedSections.handoff}
        >
          <HandoffSettings
            assistantId={assistant?.id || ''}
            enabled={handoffEnabled}
            settings={handoffSettings}
            onUpdate={handleHandoffUpdate}
          />
        </CollapsibleSection>

        {/* Action Buttons */}
        <Card className="form-section">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div className="flex space-x-3">
                <Button onClick={saveAllSettings} disabled={isSavingSettings}>
                  {isSavingSettings ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
                <Button onClick={resetSettingsToDefaults} variant="outline">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset to Defaults
                </Button>
              </div>

              <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Assistant
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center space-x-2 text-red-600">
                      <AlertTriangle className="h-5 w-5" />
                      <span>Delete Assistant</span>
                    </DialogTitle>
                    <DialogDescription>
                      This action cannot be undone. This will permanently delete the assistant
                      <strong> {assistant?.name}</strong> and all its associated data, conversations, and settings.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex justify-end space-x-2 mt-6">
                    <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                      Cancel
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={handleDeleteAssistant}
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Deleting...
                        </>
                      ) : (
                        'Delete Permanently'
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Floating Save Button */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button 
            onClick={saveAllSettings} 
            disabled={isSavingSettings}
            className="shadow-lg bg-blue-600 hover:bg-blue-700 text-white px-6 py-3"
            size="lg"
          >
            {isSavingSettings ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
