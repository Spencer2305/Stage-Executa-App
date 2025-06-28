'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  MessageSquare, 
  Mail, 
  Bell, 
  Webhook, 
  Clock, 
  Users, 
  Settings, 
  AlertTriangle,
  Phone,
  Calendar,
  Globe
} from 'lucide-react';

interface HandoffSettingsProps {
  assistantId: string;
  enabled: boolean;
  settings: any;
  onUpdate: (enabled: boolean, settings: any) => void;
}

interface Department {
  name: string;
  keywords: string[];
  agentIds: string[];
}

const defaultSettings = {
  triggerOnKeywords: [],
  triggerOnSentiment: false,
  sentimentThreshold: -0.5,
  triggerOnComplexity: false,
  maxConversationLength: 10,
  handoffMethod: 'internal_notification',
  emailSettings: {
    supportEmail: '',
    emailTemplate: 'Default handoff notification',
    includeConversationHistory: true
  },
  internalSettings: {
    notifyAgents: [],
    autoAssign: true,
    assignmentMethod: 'least_busy',
    maxWaitTime: 5
  },
  integrationSettings: {
    slackWebhook: '',
    teamsWebhook: '',
    customWebhook: '',
    webhookHeaders: {}
  },
  handoffMessage: "I'm connecting you with a human agent who can better assist you.",
  customerWaitMessage: "Please wait while I connect you with a human agent.",
  offlineMessage: "Our support team is currently offline. Please leave your message and we'll get back to you.",
  departmentRouting: {
    enabled: false,
    departments: []
  },
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
  const [availableAgents, setAvailableAgents] = useState([]);
  const [newKeyword, setNewKeyword] = useState('');
  const [newDepartment, setNewDepartment] = useState({ name: '', keywords: '', agentIds: [] });

  // Mock agents for demo - replace with actual API call
  useEffect(() => {
    setAvailableAgents([
      { id: 'agent1', name: 'John Doe', email: 'john@example.com', skills: ['technical', 'billing'] },
      { id: 'agent2', name: 'Jane Smith', email: 'jane@example.com', skills: ['general', 'sales'] }
    ]);
  }, []);

  const handleSettingChange = (path: string, value: any) => {
    const keys = path.split('.');
    const updatedSettings = { ...handoffSettings };
    let current = updatedSettings;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    
    setHandoffSettings(updatedSettings);
    onUpdate(handoffEnabled, updatedSettings);
  };

  const handleEnabledChange = (enabled: boolean) => {
    setHandoffEnabled(enabled);
    onUpdate(enabled, handoffSettings);
  };

  const addTriggerKeyword = () => {
    if (newKeyword && !handoffSettings.triggerOnKeywords.includes(newKeyword)) {
      const updatedKeywords = [...handoffSettings.triggerOnKeywords, newKeyword];
      handleSettingChange('triggerOnKeywords', updatedKeywords);
      setNewKeyword('');
    }
  };

  const removeTriggerKeyword = (keyword: string) => {
    const updatedKeywords = handoffSettings.triggerOnKeywords.filter(k => k !== keyword);
    handleSettingChange('triggerOnKeywords', updatedKeywords);
  };

  const addDepartment = () => {
    if (newDepartment.name) {
      const department = {
        name: newDepartment.name,
        keywords: newDepartment.keywords.split(',').map(k => k.trim()).filter(k => k),
        agentIds: newDepartment.agentIds
      };
      const updatedDepartments = [...handoffSettings.departmentRouting.departments, department];
      handleSettingChange('departmentRouting.departments', updatedDepartments);
      setNewDepartment({ name: '', keywords: '', agentIds: [] });
    }
  };

  const removeDepartment = (index: number) => {
    const updatedDepartments = handoffSettings.departmentRouting.departments.filter((_, i) => i !== index);
    handleSettingChange('departmentRouting.departments', updatedDepartments);
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
                Live Chat & Human Handoff
              </CardTitle>
              <CardDescription>
                Enable human agent handoff when AI can't resolve customer issues
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
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Human handoff is enabled. Configure the settings below to customize the experience.
              </AlertDescription>
            </Alert>
          </CardContent>
        )}
      </Card>

      {handoffEnabled && (
        <Tabs defaultValue="triggers" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="triggers">Triggers</TabsTrigger>
            <TabsTrigger value="method">Method</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="routing">Routing</TabsTrigger>
            <TabsTrigger value="hours">Hours</TabsTrigger>
          </TabsList>

          {/* Trigger Conditions */}
          <TabsContent value="triggers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Handoff Triggers</CardTitle>
                <CardDescription>Configure when to hand off conversations to human agents</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Keywords */}
                <div>
                  <Label>Trigger Keywords</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      placeholder="Enter a keyword (e.g., 'human', 'agent', 'help')"
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addTriggerKeyword()}
                    />
                    <Button onClick={addTriggerKeyword}>Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {handoffSettings.triggerOnKeywords.map((keyword) => (
                      <Badge key={keyword} variant="secondary" className="cursor-pointer" onClick={() => removeTriggerKeyword(keyword)}>
                        {keyword} ×
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Sentiment Detection */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Negative Sentiment Detection</Label>
                    <p className="text-sm text-gray-500">Handoff when customer sentiment becomes negative</p>
                  </div>
                  <Switch
                    checked={handoffSettings.triggerOnSentiment}
                    onCheckedChange={(checked) => handleSettingChange('triggerOnSentiment', checked)}
                  />
                </div>

                {handoffSettings.triggerOnSentiment && (
                  <div>
                    <Label>Sentiment Threshold (-1 to 1)</Label>
                    <Input
                      type="number"
                      min="-1"
                      max="1"
                      step="0.1"
                      value={handoffSettings.sentimentThreshold}
                      onChange={(e) => handleSettingChange('sentimentThreshold', parseFloat(e.target.value))}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Trigger when sentiment score falls below this threshold (negative values = poor sentiment)
                    </p>
                  </div>
                )}

                {/* Conversation Length */}
                <div>
                  <Label>Maximum Conversation Length</Label>
                  <Input
                    type="number"
                    min="1"
                    value={handoffSettings.maxConversationLength}
                    onChange={(e) => handleSettingChange('maxConversationLength', parseInt(e.target.value))}
                  />
                  <p className="text-sm text-gray-500 mt-1">Auto-handoff after this many messages</p>
                </div>

                {/* Complexity Detection */}
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Complex Query Detection</Label>
                    <p className="text-sm text-gray-500">Handoff when AI detects complex issues</p>
                  </div>
                  <Switch
                    checked={handoffSettings.triggerOnComplexity}
                    onCheckedChange={(checked) => handleSettingChange('triggerOnComplexity', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Handoff Method */}
          <TabsContent value="method" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Handoff Method</CardTitle>
                <CardDescription>Choose how human agents are notified and assigned</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Notification Method</Label>
                  <Select value={handoffSettings.handoffMethod} onValueChange={(value) => handleSettingChange('handoffMethod', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="internal_notification">
                        <div className="flex items-center gap-2">
                          <Bell className="h-4 w-4" />
                          Internal Notification
                        </div>
                      </SelectItem>
                      <SelectItem value="email">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email
                        </div>
                      </SelectItem>
                      <SelectItem value="integration">
                        <div className="flex items-center gap-2">
                          <Webhook className="h-4 w-4" />
                          Integration (Slack/Teams)
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
                    </div>
                    <div>
                      <Label>Email Template</Label>
                      <Textarea
                        placeholder="Customize the email notification..."
                        value={handoffSettings.emailSettings.emailTemplate}
                        onChange={(e) => handleSettingChange('emailSettings.emailTemplate', e.target.value)}
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

                {/* Internal Notification Settings */}
                {handoffSettings.handoffMethod === 'internal_notification' && (
                  <div className="space-y-4 border rounded-lg p-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      Internal Notification Configuration
                    </h4>
                    <div>
                      <Label>Assignment Method</Label>
                      <Select 
                        value={handoffSettings.internalSettings.assignmentMethod} 
                        onValueChange={(value) => handleSettingChange('internalSettings.assignmentMethod', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="least_busy">Least Busy Agent</SelectItem>
                          <SelectItem value="round_robin">Round Robin</SelectItem>
                          <SelectItem value="skills_based">Skills Based</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Maximum Wait Time (minutes)</Label>
                      <Input
                        type="number"
                        min="1"
                        value={handoffSettings.internalSettings.maxWaitTime}
                        onChange={(e) => handleSettingChange('internalSettings.maxWaitTime', parseInt(e.target.value))}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Auto-assign to Available Agents</Label>
                      <Switch
                        checked={handoffSettings.internalSettings.autoAssign}
                        onCheckedChange={(checked) => handleSettingChange('internalSettings.autoAssign', checked)}
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
                        placeholder="https://yourapi.com/handoff-webhook"
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
                <CardTitle>Handoff Messages</CardTitle>
                <CardDescription>Customize messages shown during the handoff process</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Handoff Message (AI to Customer)</Label>
                  <Textarea
                    placeholder="Message shown when handing off to human..."
                    value={handoffSettings.handoffMessage}
                    onChange={(e) => handleSettingChange('handoffMessage', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Customer Wait Message</Label>
                  <Textarea
                    placeholder="Message while waiting for agent..."
                    value={handoffSettings.customerWaitMessage}
                    onChange={(e) => handleSettingChange('customerWaitMessage', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Offline Message</Label>
                  <Textarea
                    placeholder="Message when no agents are available..."
                    value={handoffSettings.offlineMessage}
                    onChange={(e) => handleSettingChange('offlineMessage', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Department Routing */}
          <TabsContent value="routing" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Department Routing</CardTitle>
                    <CardDescription>Route conversations to specific departments based on keywords</CardDescription>
                  </div>
                  <Switch
                    checked={handoffSettings.departmentRouting.enabled}
                    onCheckedChange={(checked) => handleSettingChange('departmentRouting.enabled', checked)}
                  />
                </div>
              </CardHeader>
              {handoffSettings.departmentRouting.enabled && (
                <CardContent className="space-y-4">
                  {/* Add Department */}
                  <div className="border rounded-lg p-4 space-y-4">
                    <h4 className="font-medium">Add New Department</h4>
                    <div>
                      <Label>Department Name</Label>
                      <Input
                        placeholder="e.g., Technical Support, Billing, Sales"
                        value={newDepartment.name}
                        onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Keywords (comma-separated)</Label>
                      <Input
                        placeholder="e.g., technical, bug, error, troubleshoot"
                        value={newDepartment.keywords}
                        onChange={(e) => setNewDepartment({ ...newDepartment, keywords: e.target.value })}
                      />
                    </div>
                    <Button onClick={addDepartment} disabled={!newDepartment.name}>
                      Add Department
                    </Button>
                  </div>

                  {/* Existing Departments */}
                  {handoffSettings.departmentRouting.departments.map((dept, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{dept.name}</h4>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => removeDepartment(index)}
                        >
                          Remove
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <Label className="text-sm">Keywords:</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {dept.keywords.map((keyword) => (
                              <Badge key={keyword} variant="outline" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>
          </TabsContent>

          {/* Business Hours */}
          <TabsContent value="hours" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Business Hours</CardTitle>
                    <CardDescription>Set when human agents are available for handoffs</CardDescription>
                  </div>
                  <Switch
                    checked={handoffSettings.businessHours.enabled}
                    onCheckedChange={(checked) => handleSettingChange('businessHours.enabled', checked)}
                  />
                </div>
              </CardHeader>
              {handoffSettings.businessHours.enabled && (
                <CardContent className="space-y-4">
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
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label>Weekly Schedule</Label>
                    {Object.entries(handoffSettings.businessHours.schedule).map(([day, schedule]) => (
                      <div key={day} className="flex items-center gap-4 p-3 border rounded">
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
                              className="w-32"
                            />
                            <span>to</span>
                            <Input
                              type="time"
                              value={schedule.end}
                              onChange={(e) => 
                                handleSettingChange(`businessHours.schedule.${day}.end`, e.target.value)
                              }
                              className="w-32"
                            />
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
} 