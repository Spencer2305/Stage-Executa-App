'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save, RotateCcw, Download, Trash2 } from "lucide-react";
import { toast } from "sonner";
import HandoffSettings from "@/components/models/HandoffSettings";

interface SettingsState {
  basicInfo: {
    name: string;
    description: string;
    status: string;
    welcomeMessage: string;
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

export default function SettingsTab({ assistant, onUpdate }: SettingsTabProps) {
  const [settingsState, setSettingsState] = useState<SettingsState>({
    basicInfo: {
      name: assistant?.name || '',
      description: assistant?.description || '',
      status: assistant?.status || 'active',
      welcomeMessage: assistant?.welcomeMessage || ''
    },
    behavior: {
      systemInstructions: assistant?.systemInstructions || '',
      responseStyle: 'friendly',
      responseLength: 'medium',
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
      privacyMode: 'high',
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

  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [handoffEnabled, setHandoffEnabled] = useState(false);
  const [handoffSettings, setHandoffSettings] = useState({});

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

  const saveAllSettings = async () => {
    setIsSavingSettings(true);
    try {
      const token = localStorage.getItem('executa-auth-token');
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      const response = await fetch(`/api/models/${assistant?.id}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(settingsState),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save settings');
      }

      toast.success("Settings saved successfully!");
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
        status: 'active',
        welcomeMessage: ''
      },
      behavior: {
        systemInstructions: '',
        responseStyle: 'friendly',
        responseLength: 'medium',
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
        privacyMode: 'high',
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
    toast.success("Settings reset to defaults");
  };

  const handleHandoffUpdate = (enabled: boolean, settings: any) => {
    setHandoffEnabled(enabled);
    setHandoffSettings(settings);
  };

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            Configure your assistant's basic details and status
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Assistant Name</Label>
              <Input 
                value={settingsState.basicInfo.name}
                onChange={(e) => handleSettingsChange('basicInfo', 'name', e.target.value)}
                placeholder="Enter assistant name"
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <select 
                className="w-full p-2 border rounded-md bg-white"
                value={settingsState.basicInfo.status}
                onChange={(e) => handleSettingsChange('basicInfo', 'status', e.target.value)}
              >
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="training">Training</option>
              </select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea 
              value={settingsState.basicInfo.description}
              onChange={(e) => handleSettingsChange('basicInfo', 'description', e.target.value)}
              rows={3}
              placeholder="Describe what your assistant does and its purpose"
            />
          </div>

          <div className="space-y-2">
            <Label>Welcome Message</Label>
            <Textarea 
              value={settingsState.basicInfo.welcomeMessage}
              onChange={(e) => handleSettingsChange('basicInfo', 'welcomeMessage', e.target.value)}
              rows={2}
              placeholder="The first message users see when starting a conversation"
            />
          </div>
        </CardContent>
      </Card>

      {/* AI Behavior Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>AI Behavior & Personality</CardTitle>
          <CardDescription>
            Fine-tune how your assistant responds and behaves
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>System Instructions</Label>
            <Textarea 
              value={settingsState.behavior.systemInstructions}
              onChange={(e) => handleSettingsChange('behavior', 'systemInstructions', e.target.value)}
              rows={8}
              placeholder="Define how your assistant should behave, its personality, and specific instructions"
            />
            <p className="text-xs text-gray-500 mt-1">
              These instructions guide your assistant's behavior and responses. Be specific about tone, style, and capabilities.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Response Style</Label>
              <select 
                className="w-full p-2 border rounded-md bg-white"
                value={settingsState.behavior.responseStyle}
                onChange={(e) => handleSettingsChange('behavior', 'responseStyle', e.target.value)}
              >
                <option value="professional">Professional & Formal</option>
                <option value="friendly">Friendly & Conversational</option>
                <option value="casual">Casual & Relaxed</option>
                <option value="technical">Technical & Detailed</option>
                <option value="concise">Brief & Concise</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Response Length</Label>
              <select 
                className="w-full p-2 border rounded-md bg-white"
                value={settingsState.behavior.responseLength}
                onChange={(e) => handleSettingsChange('behavior', 'responseLength', e.target.value)}
              >
                <option value="short">Short (1-2 sentences)</option>
                <option value="medium">Medium (Paragraph)</option>
                <option value="long">Long (Detailed explanations)</option>
                <option value="adaptive">Adaptive to context</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Confidence Level</Label>
              <select 
                className="w-full p-2 border rounded-md bg-white"
                value={settingsState.behavior.confidenceLevel}
                onChange={(e) => handleSettingsChange('behavior', 'confidenceLevel', e.target.value)}
              >
                <option value="conservative">Conservative (Always cite sources)</option>
                <option value="balanced">Balanced (Moderate confidence)</option>
                <option value="confident">Confident (Direct answers)</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="allowGeneralKnowledge" 
                  checked={settingsState.behavior.allowGeneralKnowledge}
                  onChange={(e) => handleSettingsChange('behavior', 'allowGeneralKnowledge', e.target.checked)}
                  className="rounded" 
                />
                <Label htmlFor="allowGeneralKnowledge">Allow general knowledge responses</Label>
              </div>
              <p className="text-xs text-gray-500">
                When enabled, assistant can provide general answers when information isn't in uploaded files
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="requireSourceCitation" 
                  checked={settingsState.behavior.requireSourceCitation}
                  onChange={(e) => handleSettingsChange('behavior', 'requireSourceCitation', e.target.checked)}
                  className="rounded" 
                />
                <Label htmlFor="requireSourceCitation">Require source citations</Label>
              </div>
              <p className="text-xs text-gray-500">
                Always cite specific documents and page numbers when available
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="allowFollowUpQuestions" 
                  checked={settingsState.behavior.allowFollowUpQuestions}
                  onChange={(e) => handleSettingsChange('behavior', 'allowFollowUpQuestions', e.target.checked)}
                  className="rounded" 
                />
                <Label htmlFor="allowFollowUpQuestions">Suggest follow-up questions</Label>
              </div>
              <p className="text-xs text-gray-500">
                Assistant will suggest related questions users might want to ask
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="enableContextMemory" 
                  checked={settingsState.behavior.enableContextMemory}
                  onChange={(e) => handleSettingsChange('behavior', 'enableContextMemory', e.target.checked)}
                  className="rounded" 
                />
                <Label htmlFor="enableContextMemory">Remember conversation context</Label>
              </div>
              <p className="text-xs text-gray-500">
                Maintain context across messages in the same conversation
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Knowledge Base Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Knowledge Base Configuration</CardTitle>
          <CardDescription>
            Control how your assistant uses uploaded documents and files
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Search Sensitivity</Label>
              <select 
                className="w-full p-2 border rounded-md bg-white"
                value={settingsState.knowledgeBase.searchSensitivity}
                onChange={(e) => handleSettingsChange('knowledgeBase', 'searchSensitivity', e.target.value)}
              >
                <option value="strict">Strict (Exact matches only)</option>
                <option value="moderate">Moderate (Balanced relevance)</option>
                <option value="broad">Broad (Include similar topics)</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Max Context Window</Label>
              <select 
                className="w-full p-2 border rounded-md bg-white"
                value={settingsState.knowledgeBase.maxContextLength}
                onChange={(e) => handleSettingsChange('knowledgeBase', 'maxContextLength', e.target.value)}
              >
                <option value="2000">2,000 tokens (Short)</option>
                <option value="4000">4,000 tokens (Medium)</option>
                <option value="8000">8,000 tokens (Long)</option>
                <option value="16000">16,000 tokens (Extended)</option>
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2 mt-6">
                <input 
                  type="checkbox" 
                  id="prioritizeRecentFiles" 
                  checked={settingsState.knowledgeBase.prioritizeRecentFiles}
                  onChange={(e) => handleSettingsChange('knowledgeBase', 'prioritizeRecentFiles', e.target.checked)}
                  className="rounded" 
                />
                <Label htmlFor="prioritizeRecentFiles">Prioritize recent files</Label>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="includeFileMetadata" 
                  checked={settingsState.knowledgeBase.includeFileMetadata}
                  onChange={(e) => handleSettingsChange('knowledgeBase', 'includeFileMetadata', e.target.checked)}
                  className="rounded" 
                />
                <Label htmlFor="includeFileMetadata">Include file metadata in responses</Label>
              </div>
              <p className="text-xs text-gray-500">
                Show file names, upload dates, and other metadata
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="crossReferenceFiles" 
                  checked={settingsState.knowledgeBase.crossReferenceFiles}
                  onChange={(e) => handleSettingsChange('knowledgeBase', 'crossReferenceFiles', e.target.checked)}
                  className="rounded" 
                />
                <Label htmlFor="crossReferenceFiles">Cross-reference between files</Label>
              </div>
              <p className="text-xs text-gray-500">
                Find connections and contradictions across documents
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Moderation */}
      <Card>
        <CardHeader>
          <CardTitle>Content Moderation & Privacy</CardTitle>
          <CardDescription>
            Configure safety filters and privacy protection settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Content Filter Level</Label>
              <select 
                className="w-full p-2 border rounded-md bg-white"
                value={settingsState.moderation.contentFilterLevel}
                onChange={(e) => handleSettingsChange('moderation', 'contentFilterLevel', e.target.value)}
              >
                <option value="strict">Strict (Block sensitive content)</option>
                <option value="moderate">Moderate (Standard filtering)</option>
                <option value="permissive">Permissive (Minimal filtering)</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Privacy Mode</Label>
              <select 
                className="w-full p-2 border rounded-md bg-white"
                value={settingsState.moderation.privacyMode}
                onChange={(e) => handleSettingsChange('moderation', 'privacyMode', e.target.value)}
              >
                <option value="high">High (Redact personal info)</option>
                <option value="medium">Medium (Basic protection)</option>
                <option value="low">Low (Minimal redaction)</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Blocked Topics (one per line)</Label>
            <Textarea 
              value={settingsState.moderation.blockedTopics}
              onChange={(e) => handleSettingsChange('moderation', 'blockedTopics', e.target.value)}
              placeholder="Enter topics or keywords that should not be discussed..."
              rows={3}
            />
            <p className="text-xs text-gray-500">
              Assistant will avoid these topics and redirect conversations appropriately
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="logConversations" 
                  checked={settingsState.moderation.logConversations}
                  onChange={(e) => handleSettingsChange('moderation', 'logConversations', e.target.checked)}
                  className="rounded" 
                />
                <Label htmlFor="logConversations">Log conversations for improvement</Label>
              </div>
              <p className="text-xs text-gray-500">
                Store conversations to improve assistant performance
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="enableFeedback" 
                  checked={settingsState.moderation.enableFeedback}
                  onChange={(e) => handleSettingsChange('moderation', 'enableFeedback', e.target.checked)}
                  className="rounded" 
                />
                <Label htmlFor="enableFeedback">Enable user feedback collection</Label>
              </div>
              <p className="text-xs text-gray-500">
                Allow users to rate responses and provide feedback
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Advanced Configuration</CardTitle>
          <CardDescription>
            Expert-level settings for fine-tuning assistant behavior
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Temperature (Creativity)</Label>
              <div className="flex items-center space-x-2">
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.1" 
                  value={settingsState.advanced.temperature}
                  onChange={(e) => handleAdvancedSliderChange('temperature', parseFloat(e.target.value))}
                  className="flex-1" 
                />
                <span className="text-sm text-gray-500 w-8">{settingsState.advanced.temperature}</span>
              </div>
              <p className="text-xs text-gray-500">
                Higher = more creative, Lower = more focused
              </p>
            </div>

            <div className="space-y-2">
              <Label>Top-p (Response Focus)</Label>
              <div className="flex items-center space-x-2">
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.1" 
                  value={settingsState.advanced.topP}
                  onChange={(e) => handleAdvancedSliderChange('topP', parseFloat(e.target.value))}
                  className="flex-1" 
                />
                <span className="text-sm text-gray-500 w-8">{settingsState.advanced.topP}</span>
              </div>
              <p className="text-xs text-gray-500">
                Controls response diversity and focus
              </p>
            </div>

            <div className="space-y-2">
              <Label>Max Tokens per Response</Label>
              <select 
                className="w-full p-2 border rounded-md bg-white"
                value={settingsState.advanced.maxTokens}
                onChange={(e) => handleSettingsChange('advanced', 'maxTokens', e.target.value)}
              >
                <option value="150">150 (Very short)</option>
                <option value="300">300 (Short)</option>
                <option value="500">500 (Medium)</option>
                <option value="1000">1000 (Long)</option>
                <option value="2000">2000 (Very long)</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Custom Stop Sequences (comma-separated)</Label>
            <Input 
              value={settingsState.advanced.stopSequences}
              onChange={(e) => handleSettingsChange('advanced', 'stopSequences', e.target.value)}
              placeholder="e.g., [END], ###, STOP" 
            />
            <p className="text-xs text-gray-500">
              Sequences that will stop response generation
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="enableStreaming" 
                  checked={settingsState.advanced.enableStreaming}
                  onChange={(e) => handleSettingsChange('advanced', 'enableStreaming', e.target.checked)}
                  className="rounded" 
                />
                <Label htmlFor="enableStreaming">Enable response streaming</Label>
              </div>
              <p className="text-xs text-gray-500">
                Show responses as they're being generated
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="enableRetry" 
                  checked={settingsState.advanced.enableRetry}
                  onChange={(e) => handleSettingsChange('advanced', 'enableRetry', e.target.checked)}
                  className="rounded" 
                />
                <Label htmlFor="enableRetry">Auto-retry failed requests</Label>
              </div>
              <p className="text-xs text-gray-500">
                Automatically retry if requests fail
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Handoff Settings */}
      <HandoffSettings 
        assistantId={assistant?.id}
        enabled={handoffEnabled}
        settings={handoffSettings}
        onUpdate={handleHandoffUpdate}
      />

      {/* Action Buttons */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <div className="flex space-x-4">
              <Button 
                onClick={saveAllSettings}
                disabled={isSavingSettings}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSavingSettings ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button 
                variant="outline"
                onClick={resetSettingsToDefaults}
                disabled={isSavingSettings}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Defaults
              </Button>
              <Button variant="outline" disabled>
                <Download className="h-4 w-4 mr-2" />
                Export Configuration
              </Button>
            </div>
            
            <Button variant="destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Assistant
            </Button>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>💡 Pro Tip:</strong> Changes to AI behavior and personality take effect immediately. 
              Knowledge base changes require rebuilding the vector store, which happens automatically when you add or remove files.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
