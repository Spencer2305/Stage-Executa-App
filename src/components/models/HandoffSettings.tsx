'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  AlertTriangle, 
  Clock, 
  Mail, 
  Bell, 
  Webhook,
  Settings,
  User,
  Calendar
} from 'lucide-react';

interface HandoffSettingsProps {
  assistantId: string;
  enabled: boolean;
  settings: any;
  onUpdate: (enabled: boolean, settings: any) => void;
}

const defaultSettings = {
  // Basic keyword triggers
  triggerOnKeywords: [],
  
  // AI-powered detection
  triggerOnAutoDetect: true,
  autoDetectSensitivity: 'medium', // low, medium, high
  
  // Sentiment analysis
  triggerOnSentiment: false,
  sentimentThreshold: -0.5,
  
  // Conversation complexity and length
  triggerOnComplexity: false,
  maxConversationLength: 10,
  
  // Failed attempts and escalation
  triggerOnFailedAttempts: true,
  maxFailedAttempts: 3,
  
  // Escalation patterns
  triggerOnEscalation: true,
  escalationKeywords: ['manager', 'supervisor', 'complaint', 'refund', 'cancel'],
  
  // Question repetition
  triggerOnRepetition: true,
  maxRepetitions: 2,
  
  // Urgency detection
  triggerOnUrgency: true,
  urgencyKeywords: ['urgent', 'asap', 'emergency', 'immediately', 'critical'],
  
  // Customer effort indicators
  triggerOnHighEffort: true,
  effortIndicators: ['tried everything', 'nothing works', 'still not working', 'multiple times'],
  
  handoffMethod: 'email',
  emailSettings: {
    supportEmail: '',
    emailTemplate: 'New support request from customer',
    includeConversationHistory: true
  },
  integrationSettings: {
    slackWebhook: '',
    teamsWebhook: '',
    customWebhook: '',
    webhookHeaders: {}
  },
  handoffMessage: "I'm connecting you with our support team who can better assist you.",
  customerWaitMessage: "Please wait while we connect you with our support team.",
  offlineMessage: "Our support team will review your message and get back to you soon.",
  businessHours: {
    enabled: false,
    timezone: 'UTC',
    schedule: {
      monday: { start: '09:00', end: '17:00', enabled: true },
      tuesday: { start: '09:00', end: '17:00', enabled: true },
      wednesday: { start: '09:00', end: '17:00', enabled: true },
      thursday: { start: '09:00', end: '17:00', enabled: true },
      friday: { start: '09:00', end: '17:00', enabled: true },
      saturday: { start: '09:00', end: '17:00', enabled: false },
      sunday: { start: '09:00', end: '17:00', enabled: false }
    },
    holidayDates: []
  }
};

export default function HandoffSettings({ assistantId, enabled, settings, onUpdate }: HandoffSettingsProps) {
  const [handoffEnabled, setHandoffEnabled] = useState(enabled);
  const [handoffSettings, setHandoffSettings] = useState({ ...defaultSettings, ...settings });
  const [newKeyword, setNewKeyword] = useState('');

  useEffect(() => {
    setHandoffEnabled(enabled);
    setHandoffSettings({ ...defaultSettings, ...settings });
  }, [enabled, settings]);

  const handleEnabledChange = (checked: boolean) => {
    setHandoffEnabled(checked);
    onUpdate(checked, handoffSettings);
  };

  const handleSettingChange = (path: string, value: any) => {
    const newSettings = { ...handoffSettings };
    const keys = path.split('.');
    let current = newSettings;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    setHandoffSettings(newSettings);
    onUpdate(handoffEnabled, newSettings);
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !handoffSettings.triggerOnKeywords.includes(newKeyword.trim())) {
      const updatedKeywords = [...handoffSettings.triggerOnKeywords, newKeyword.trim()];
      handleSettingChange('triggerOnKeywords', updatedKeywords);
      setNewKeyword('');
    }
  };

  const removeKeyword = (index: number) => {
    const updatedKeywords = handoffSettings.triggerOnKeywords.filter((_: any, i: number) => i !== index);
    handleSettingChange('triggerOnKeywords', updatedKeywords);
  };

  return (
    <div className="space-y-6">
      {/* Main Toggle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Live Chat & Support Handoff
              </CardTitle>
              <CardDescription>
                Enable support handoff when AI can't resolve customer issues. Requests will be sent directly to the account owner.
              </CardDescription>
            </div>
            <Switch
              checked={handoffEnabled}
              onCheckedChange={handleEnabledChange}
            />
          </div>
        </CardHeader>
        {handoffEnabled && (
          <CardContent>
            <Alert>
              <User className="h-4 w-4" />
              <AlertDescription>
                Support handoff is enabled. All requests will be forwarded to the account owner via the selected notification method.
              </AlertDescription>
            </Alert>
          </CardContent>
        )}
      </Card>

      {/* Configuration Tabs */}
      {handoffEnabled && (
        <Tabs defaultValue="triggers" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="triggers">Triggers</TabsTrigger>
            <TabsTrigger value="method">Notification</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="hours">Business Hours</TabsTrigger>
          </TabsList>

          {/* Trigger Configuration */}
          <TabsContent value="triggers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Handoff Triggers</CardTitle>
                <CardDescription>Configure when the AI should transfer conversations to support</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* AI Auto-Detection */}
                <div className="space-y-4 border rounded-lg p-4 bg-blue-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-blue-800 font-medium">🤖 AI Auto-Detection</Label>
                      <p className="text-sm text-blue-600">Automatically detect when customers want human assistance using AI</p>
                    </div>
                    <Switch
                      checked={handoffSettings.triggerOnAutoDetect}
                      onCheckedChange={(checked) => handleSettingChange('triggerOnAutoDetect', checked)}
                    />
                  </div>
                  
                  {handoffSettings.triggerOnAutoDetect && (
                    <div>
                      <Label className="text-blue-800">Detection Sensitivity</Label>
                      <Select 
                        value={handoffSettings.autoDetectSensitivity} 
                        onValueChange={(value) => handleSettingChange('autoDetectSensitivity', value)}
                      >
                        <SelectTrigger className="bg-white mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low - Only explicit requests ("I want to talk to a human")</SelectItem>
                          <SelectItem value="medium">Medium - Clear frustration and requests</SelectItem>
                          <SelectItem value="high">High - Subtle cues and potential needs</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Keyword Triggers */}
                <div className="space-y-3">
                  <Label>Custom Trigger Keywords</Label>
                  <p className="text-sm text-gray-500">Additional keywords that will trigger handoff</p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter keyword (e.g., 'billing', 'technical issue')"
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addKeyword();
                        }
                      }}
                    />
                    <Button onClick={addKeyword} variant="outline">Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {handoffSettings.triggerOnKeywords.map((keyword: string, index: number) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="cursor-pointer"
                        onClick={() => removeKeyword(index)}
                      >
                        {keyword} ×
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Escalation Patterns */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Escalation Pattern Detection</Label>
                      <p className="text-sm text-gray-500">Trigger on manager requests, complaints, cancellations</p>
                    </div>
                    <Switch
                      checked={handoffSettings.triggerOnEscalation}
                      onCheckedChange={(checked) => handleSettingChange('triggerOnEscalation', checked)}
                    />
                  </div>
                  {handoffSettings.triggerOnEscalation && (
                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                      <strong>Auto-detects:</strong> manager, supervisor, complaint, refund, cancel, escalate
                    </div>
                  )}
                </div>

                {/* Urgency Detection */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Urgency Detection</Label>
                      <p className="text-sm text-gray-500">Trigger on urgent or time-sensitive requests</p>
                    </div>
                    <Switch
                      checked={handoffSettings.triggerOnUrgency}
                      onCheckedChange={(checked) => handleSettingChange('triggerOnUrgency', checked)}
                    />
                  </div>
                  {handoffSettings.triggerOnUrgency && (
                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                      <strong>Auto-detects:</strong> urgent, asap, emergency, immediately, critical, time-sensitive
                    </div>
                  )}
                </div>

                {/* Failed Attempts */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Failed Resolution Attempts</Label>
                      <p className="text-sm text-gray-500">Trigger after AI fails to resolve the issue</p>
                    </div>
                    <Switch
                      checked={handoffSettings.triggerOnFailedAttempts}
                      onCheckedChange={(checked) => handleSettingChange('triggerOnFailedAttempts', checked)}
                    />
                  </div>
                  {handoffSettings.triggerOnFailedAttempts && (
                    <div>
                      <Label>Maximum Failed Attempts</Label>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={handoffSettings.maxFailedAttempts}
                        onChange={(e) => handleSettingChange('maxFailedAttempts', parseInt(e.target.value, 10))}
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Handoff after this many unsuccessful resolution attempts
                      </p>
                    </div>
                  )}
                </div>

                {/* High Customer Effort */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>High Customer Effort Detection</Label>
                      <p className="text-sm text-gray-500">Trigger when customer indicates high effort/frustration</p>
                    </div>
                    <Switch
                      checked={handoffSettings.triggerOnHighEffort}
                      onCheckedChange={(checked) => handleSettingChange('triggerOnHighEffort', checked)}
                    />
                  </div>
                  {handoffSettings.triggerOnHighEffort && (
                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                      <strong>Auto-detects:</strong> "tried everything", "nothing works", "still not working", "multiple times"
                    </div>
                  )}
                </div>

                {/* Question Repetition */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Question Repetition Detection</Label>
                      <p className="text-sm text-gray-500">Trigger when customer repeats similar questions</p>
                    </div>
                    <Switch
                      checked={handoffSettings.triggerOnRepetition}
                      onCheckedChange={(checked) => handleSettingChange('triggerOnRepetition', checked)}
                    />
                  </div>
                  {handoffSettings.triggerOnRepetition && (
                    <div>
                      <Label>Maximum Repetitions</Label>
                      <Input
                        type="number"
                        min="1"
                        max="5"
                        value={handoffSettings.maxRepetitions}
                        onChange={(e) => handleSettingChange('maxRepetitions', parseInt(e.target.value, 10))}
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Handoff after this many similar questions
                      </p>
                    </div>
                  )}
                </div>

                {/* Sentiment Analysis */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Negative Sentiment Detection</Label>
                      <p className="text-sm text-gray-500">Trigger when customer sentiment becomes negative</p>
                    </div>
                    <Switch
                      checked={handoffSettings.triggerOnSentiment}
                      onCheckedChange={(checked) => handleSettingChange('triggerOnSentiment', checked)}
                    />
                  </div>
                  {handoffSettings.triggerOnSentiment && (
                    <div>
                      <Label>Sentiment Threshold</Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <input 
                          type="range" 
                          min="-1" 
                          max="0" 
                          step="0.1" 
                          value={handoffSettings.sentimentThreshold}
                          onChange={(e) => handleSettingChange('sentimentThreshold', parseFloat(e.target.value))}
                          className="flex-1"
                        />
                        <span className="text-sm text-gray-500 w-16">
                          {handoffSettings.sentimentThreshold}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Lower values = more sensitive to negative sentiment
                      </p>
                    </div>
                  )}
                </div>

                {/* Conversation Length */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Long Conversation Detection</Label>
                      <p className="text-sm text-gray-500">Trigger after extended conversations</p>
                    </div>
                    <Switch
                      checked={handoffSettings.triggerOnComplexity}
                      onCheckedChange={(checked) => handleSettingChange('triggerOnComplexity', checked)}
                    />
                  </div>
                  {handoffSettings.triggerOnComplexity && (
                    <div>
                      <Label>Maximum Messages</Label>
                      <Input
                        type="number"
                        min="5"
                        max="50"
                        value={handoffSettings.maxConversationLength}
                        onChange={(e) => handleSettingChange('maxConversationLength', parseInt(e.target.value, 10))}
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Handoff after this many messages if unresolved
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Method */}
          <TabsContent value="method" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Method</CardTitle>
                <CardDescription>Choose how you want to be notified about support requests</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Notification Method</Label>
                  <Select value={handoffSettings.handoffMethod} onValueChange={(value) => handleSettingChange('handoffMethod', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email Notification
                        </div>
                      </SelectItem>
                      <SelectItem value="integration">
                        <div className="flex items-center gap-2">
                          <Webhook className="h-4 w-4" />
                          Integration (Slack/Teams/Webhook)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Email Settings */}
                {handoffSettings.handoffMethod === 'email' && (
                  <div className="space-y-4 border rounded-lg p-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email Configuration
                    </h4>
                    <div>
                      <Label>Support Email Address</Label>
                      <Input
                        type="email"
                        placeholder="support@yourcompany.com"
                        value={handoffSettings.emailSettings.supportEmail}
                        onChange={(e) => handleSettingChange('emailSettings.supportEmail', e.target.value)}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Email address where support requests will be sent
                      </p>
                    </div>
                    <div>
                      <Label>Email Template</Label>
                      <Textarea
                        placeholder="Custom email template for handoff notifications..."
                        value={handoffSettings.emailSettings.emailTemplate}
                        onChange={(e) => handleSettingChange('emailSettings.emailTemplate', e.target.value)}
                        rows={3}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Include Conversation History</Label>
                      <Switch
                        checked={handoffSettings.emailSettings.includeConversationHistory}
                        onCheckedChange={(checked) => handleSettingChange('emailSettings.includeConversationHistory', checked)}
                      />
                    </div>
                  </div>
                )}

                {/* Integration Settings */}
                {handoffSettings.handoffMethod === 'integration' && (
                  <div className="space-y-4 border rounded-lg p-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Webhook className="h-4 w-4" />
                      Integration Configuration
                    </h4>
                    <div>
                      <Label>Slack Webhook URL</Label>
                      <Input
                        placeholder="https://hooks.slack.com/services/..."
                        value={handoffSettings.integrationSettings.slackWebhook}
                        onChange={(e) => handleSettingChange('integrationSettings.slackWebhook', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Teams Webhook URL</Label>
                      <Input
                        placeholder="https://yourcompany.webhook.office.com/..."
                        value={handoffSettings.integrationSettings.teamsWebhook}
                        onChange={(e) => handleSettingChange('integrationSettings.teamsWebhook', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Custom Webhook URL</Label>
                      <Input
                        placeholder="https://your-api.com/webhook"
                        value={handoffSettings.integrationSettings.customWebhook}
                        onChange={(e) => handleSettingChange('integrationSettings.customWebhook', e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Messages */}
          <TabsContent value="messages" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Customer Messages</CardTitle>
                <CardDescription>Customize what customers see during the handoff process</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Handoff Message</Label>
                  <Textarea
                    placeholder="What the AI says when handing off to support..."
                    value={handoffSettings.handoffMessage}
                    onChange={(e) => handleSettingChange('handoffMessage', e.target.value)}
                    rows={2}
                  />
                </div>
                <div>
                  <Label>Customer Wait Message</Label>
                  <Textarea
                    placeholder="Message shown while waiting for support..."
                    value={handoffSettings.customerWaitMessage}
                    onChange={(e) => handleSettingChange('customerWaitMessage', e.target.value)}
                    rows={2}
                  />
                </div>
                <div>
                  <Label>Offline Message</Label>
                  <Textarea
                    placeholder="Message when support is offline..."
                    value={handoffSettings.offlineMessage}
                    onChange={(e) => handleSettingChange('offlineMessage', e.target.value)}
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Business Hours */}
          <TabsContent value="hours" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Business Hours</CardTitle>
                <CardDescription>Set when support is available (optional)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Business Hours</Label>
                  <Switch
                    checked={handoffSettings.businessHours.enabled}
                    onCheckedChange={(checked) => handleSettingChange('businessHours.enabled', checked)}
                  />
                </div>

                {handoffSettings.businessHours.enabled && (
                  <div className="space-y-4">
                    <div>
                      <Label>Timezone</Label>
                      <Select 
                        value={handoffSettings.businessHours.timezone} 
                        onValueChange={(value) => handleSettingChange('businessHours.timezone', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="America/New_York">Eastern Time</SelectItem>
                          <SelectItem value="America/Chicago">Central Time</SelectItem>
                          <SelectItem value="America/Denver">Mountain Time</SelectItem>
                          <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                          <SelectItem value="Europe/London">London</SelectItem>
                          <SelectItem value="Europe/Paris">Paris</SelectItem>
                          <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label>Weekly Schedule</Label>
                      {Object.entries(handoffSettings.businessHours.schedule).map(([day, schedule]: [string, any]) => (
                        <div key={day} className="flex items-center gap-4 p-2 border rounded">
                          <div className="w-20 capitalize">{day}</div>
                          <Switch
                            checked={schedule.enabled}
                            onCheckedChange={(checked) => 
                              handleSettingChange(`businessHours.schedule.${day}.enabled`, checked)
                            }
                          />
                          {schedule.enabled && (
                            <>
                              <Input
                                type="time"
                                value={schedule.start}
                                onChange={(e) => 
                                  handleSettingChange(`businessHours.schedule.${day}.start`, e.target.value)
                                }
                                className="w-24"
                              />
                              <span className="text-gray-500">to</span>
                              <Input
                                type="time"
                                value={schedule.end}
                                onChange={(e) => 
                                  handleSettingChange(`businessHours.schedule.${day}.end`, e.target.value)
                                }
                                className="w-24"
                              />
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
} 