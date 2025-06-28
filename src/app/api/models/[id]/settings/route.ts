import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import OpenAI from 'openai';

const openai = new OpenAI({
});

// Update interface to include handoff settings
interface AssistantSettings {
  basicInfo?: {
    name?: string;
    description?: string;
    status?: string;
    welcomeMessage?: string;
  };
  
  behavior?: {
    systemInstructions?: string;
    responseStyle?: string;
    responseLength?: string;
    confidenceLevel?: string;
    allowGeneralKnowledge?: boolean;
    requireSourceCitation?: boolean;
    allowFollowUpQuestions?: boolean;
    enableContextMemory?: boolean;
  };
  
  knowledgeBase?: {
    searchSensitivity?: string;
    contextLength?: number;
    filePreferences?: string;
    maxContextLength?: string | number;
    prioritizeRecentFiles?: boolean;
    includeFileMetadata?: boolean;
    crossReferenceFiles?: boolean;
  };
  
  moderation?: {
    contentFiltering?: boolean;
    spamDetection?: boolean;
    rateLimiting?: {
      enabled: boolean;
      maxRequestsPerMinute: number;
    };
    contentFilterLevel?: string;
    privacyMode?: string;
    blockedTopics?: string;
    logConversations?: boolean;
    enableFeedback?: boolean;
  };
  
  integrations?: {
    webhooks?: Array<{
      url: string;
      events: string[];
      headers?: Record<string, string>;
    }>;
  };
  
  advanced?: {
    temperature?: string | number;
    maxTokens?: string | number;
    debugMode?: boolean;
    topP?: string | number;
    stopSequences?: string;
    enableStreaming?: boolean;
    enableRetry?: boolean;
  };
  
  // Handoff Configuration
  handoffEnabled?: boolean;
  handoffSettings?: {
    // Trigger conditions
    triggerOnKeywords: string[];
    triggerOnSentiment: boolean;
    sentimentThreshold: number; // -1 to 1, negative = poor sentiment
    triggerOnComplexity: boolean;
    maxConversationLength: number; // Auto-handoff after X messages
    
    // Handoff methods
    handoffMethod: 'email' | 'internal_notification' | 'integration';
    
    // Email method settings
    emailSettings?: {
      supportEmail: string;
      emailTemplate: string;
      includeConversationHistory: boolean;
    };
    
    // Internal notification settings
    internalSettings?: {
      notifyAgents: string[]; // Agent IDs to notify
      autoAssign: boolean;
      assignmentMethod: 'round_robin' | 'least_busy' | 'skills_based';
      maxWaitTime: number; // Minutes before escalation
    };
    
    // Integration settings
    integrationSettings?: {
      slackWebhook?: string;
      teamsWebhook?: string;
      customWebhook?: string;
      webhookHeaders?: Record<string, string>;
    };
    
    // Handoff behavior
    handoffMessage: string; // What AI says when handing off
    customerWaitMessage: string; // Message while waiting for human
    offlineMessage: string; // When no agents available
    
    // Department routing
    departmentRouting: {
      enabled: boolean;
      departments: Array<{
        name: string;
        keywords: string[];
        agentIds: string[];
      }>;
    };
    
    // Business hours
    businessHours: {
      enabled: boolean;
      timezone: string;
      schedule: Record<string, { start: string; end: string; enabled: boolean }>; // Mon-Sun
      holidayDates: string[]; // ISO dates
    };
  };
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: assistantId } = await params;
    const settings: AssistantSettings = await request.json();

    console.log(`🔧 Updating settings for assistant ${assistantId}:`, settings);

    // Verify the assistant belongs to the user's account
    const assistant = await db.assistant.findFirst({
      where: {
        id: assistantId,
        accountId: user.account.id,
      },
    });

    if (!assistant) {
      return NextResponse.json({ error: 'Assistant not found' }, { status: 404 });
    }

    // Validate handoff settings if enabled
    if (settings.handoffEnabled && settings.handoffSettings) {
      const handoffSettings = settings.handoffSettings;
      
      // Validate handoff method configuration
      if (handoffSettings.handoffMethod === 'email' && !handoffSettings.emailSettings?.supportEmail) {
        return NextResponse.json(
          { error: 'Support email is required when using email handoff method' },
          { status: 400 }
        );
      }
      
      if (handoffSettings.handoffMethod === 'internal_notification' && 
          (!handoffSettings.internalSettings?.notifyAgents || 
           handoffSettings.internalSettings.notifyAgents.length === 0)) {
        return NextResponse.json(
          { error: 'At least one agent must be configured for internal notifications' },
          { status: 400 }
        );
      }
      
      // Validate business hours format
      if (handoffSettings.businessHours?.enabled) {
        const schedule = handoffSettings.businessHours.schedule;
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        
        for (const day of days) {
          if (schedule[day]?.enabled) {
            const { start, end } = schedule[day];
            if (!start || !end || !isValidTimeFormat(start) || !isValidTimeFormat(end)) {
              return NextResponse.json(
                { error: `Invalid time format for ${day}. Use HH:MM format.` },
                { status: 400 }
              );
            }
          }
        }
      }
    }

    // Prepare update data based on what settings are provided
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Basic Information
    if (settings.basicInfo) {
      const { name, description, status, welcomeMessage } = settings.basicInfo;
      if (name) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (status) updateData.status = status.toUpperCase();
      if (welcomeMessage !== undefined) updateData.welcomeMessage = welcomeMessage;
    }

    // AI Behavior & Personality
    if (settings.behavior) {
      const { 
        systemInstructions, 
        responseStyle, 
        responseLength, 
        confidenceLevel,
        allowGeneralKnowledge,
        requireSourceCitation,
        allowFollowUpQuestions,
        enableContextMemory
      } = settings.behavior;
      
      if (systemInstructions) updateData.instructions = systemInstructions;
      
      // Store behavior settings as JSON in a new field (you may need to add this to schema)
      const behaviorSettings = {
        responseStyle: responseStyle || 'friendly',
        responseLength: responseLength || 'medium',
        confidenceLevel: confidenceLevel || 'balanced',
        allowGeneralKnowledge: allowGeneralKnowledge !== false,
        requireSourceCitation: requireSourceCitation !== false,
        allowFollowUpQuestions: allowFollowUpQuestions !== false,
        enableContextMemory: enableContextMemory !== false,
      };
      
      // For now, we'll include these in the instructions until we add a behaviorSettings field
      const enhancedInstructions = `${systemInstructions || updateData.instructions || assistant.instructions || ''}

BEHAVIOR CONFIGURATION:
- Response Style: ${behaviorSettings.responseStyle}
- Response Length: ${behaviorSettings.responseLength}
- Confidence Level: ${behaviorSettings.confidenceLevel}
- General Knowledge: ${behaviorSettings.allowGeneralKnowledge ? 'Enabled' : 'Disabled'}
- Source Citations: ${behaviorSettings.requireSourceCitation ? 'Required' : 'Optional'}
- Follow-up Questions: ${behaviorSettings.allowFollowUpQuestions ? 'Enabled' : 'Disabled'}
- Context Memory: ${behaviorSettings.enableContextMemory ? 'Enabled' : 'Disabled'}`;

      updateData.instructions = enhancedInstructions;
    }

    // Advanced Settings
    if (settings.advanced) {
      const { 
        temperature, 
        topP, 
        maxTokens, 
        stopSequences,
        enableStreaming,
        enableRetry 
      } = settings.advanced;
      
      // Store advanced settings as metadata (you may want to add dedicated fields)
      const advancedSettings = {
        temperature: temperature !== undefined ? parseFloat(temperature) : 0.7,
        topP: topP !== undefined ? parseFloat(topP) : 0.9,
        maxTokens: maxTokens ? parseInt(maxTokens) : 500,
        stopSequences: stopSequences ? stopSequences.split(',').map((s: string) => s.trim()) : [],
        enableStreaming: enableStreaming !== false,
        enableRetry: enableRetry !== false,
      };
      
      // Store in a JSON field if available, or encode in instructions
      updateData.model = `gpt-4-turbo`; // Keep model consistent
    }

    // Knowledge Base Configuration
    if (settings.knowledgeBase) {
      const {
        searchSensitivity,
        maxContextLength,
        prioritizeRecentFiles,
        includeFileMetadata,
        crossReferenceFiles
      } = settings.knowledgeBase;
      
      // These would ideally be stored as assistant-specific settings
      // For now, we'll include them in instructions
      const knowledgeSettings = {
        searchSensitivity: searchSensitivity || 'moderate',
        maxContextLength: maxContextLength || '4000',
        prioritizeRecentFiles: prioritizeRecentFiles !== false,
        includeFileMetadata: includeFileMetadata !== false,
        crossReferenceFiles: crossReferenceFiles !== false,
      };
      
      // Append to instructions
      if (updateData.instructions) {
        updateData.instructions += `

KNOWLEDGE BASE SETTINGS:
- Search Sensitivity: ${knowledgeSettings.searchSensitivity}
- Context Length: ${knowledgeSettings.maxContextLength} tokens
- Prioritize Recent Files: ${knowledgeSettings.prioritizeRecentFiles}
- Include Metadata: ${knowledgeSettings.includeFileMetadata}
- Cross-reference Files: ${knowledgeSettings.crossReferenceFiles}`;
      }
    }

    // Response Moderation
    if (settings.moderation) {
      const {
        contentFilterLevel,
        privacyMode,
        blockedTopics,
        logConversations,
        enableFeedback
      } = settings.moderation;
      
      const moderationSettings = {
        contentFilterLevel: contentFilterLevel || 'moderate',
        privacyMode: privacyMode || 'high',
        blockedTopics: blockedTopics ? blockedTopics.split('\n').filter((t: string) => t.trim()) : [],
        logConversations: logConversations !== false,
        enableFeedback: enableFeedback !== false,
      };
      
      // Append moderation settings to instructions
      if (updateData.instructions) {
        updateData.instructions += `

MODERATION SETTINGS:
- Content Filter: ${moderationSettings.contentFilterLevel}
- Privacy Mode: ${moderationSettings.privacyMode}
- Blocked Topics: ${moderationSettings.blockedTopics.join(', ') || 'None'}
- Log Conversations: ${moderationSettings.logConversations}
- Enable Feedback: ${moderationSettings.enableFeedback}`;
      }
    }

    // Update the assistant in the database
    const updatedAssistant = await db.assistant.update({
      where: { id: assistantId },
      data: {
        name: settings.basicInfo.name,
        description: settings.basicInfo.description,
        instructions: settings.behavior?.systemInstructions,
        status: settings.basicInfo.status,
        welcomeMessage: settings.basicInfo.welcomeMessage,
        handoffEnabled: settings.handoffEnabled,
        handoffSettings: settings.handoffSettings,
        settings: {
          basicInfo: settings.basicInfo,
          behavior: settings.behavior,
          knowledgeBase: settings.knowledgeBase,
          responseSettings: settings.moderation,
          integrations: settings.integrations,
          advanced: settings.advanced,
          handoff: {
            enabled: settings.handoffEnabled,
            configuration: settings.handoffSettings
          }
        },
        updatedAt: new Date()
      }
    });

    console.log(`✅ Assistant settings updated successfully`);

    // Update OpenAI assistant if needed and if systemInstructions changed
    if (settings.behavior?.systemInstructions && assistant.openaiAssistantId) {
      try {
        console.log(`🤖 Updating OpenAI assistant instructions...`);
        
        await openai.beta.assistants.update(assistant.openaiAssistantId, {
          instructions: updateData.instructions,
          // Add any other OpenAI-specific settings here
        });
        
        console.log(`✅ OpenAI assistant instructions updated`);
      } catch (openaiError) {
        console.warn(`⚠️ Failed to update OpenAI assistant: ${openaiError}`);
        // Don't fail the entire request if OpenAI update fails
      }
    }

    return NextResponse.json({ 
      success: true, 
      assistant: updatedAssistant,
      message: 'Assistant settings updated successfully' 
    });

  } catch (error) {
    console.error('❌ Error updating assistant settings:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update assistant settings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch current settings
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: assistantId } = await params;

    // Verify the assistant belongs to the user's account
    const assistant = await db.assistant.findFirst({
      where: {
        id: assistantId,
        accountId: user.account.id,
      },
    });

    if (!assistant) {
      return NextResponse.json({ error: 'Assistant not found' }, { status: 404 });
    }

    // Parse settings from instructions and other fields
    // This is a simplified version - you'd want to parse the actual structured data
    const settings = {
      basicInfo: {
        name: assistant.name,
        description: assistant.description,
        status: assistant.status.toLowerCase(),
        welcomeMessage: assistant.welcomeMessage,
      },
      behavior: {
        systemInstructions: assistant.instructions,
        // Extract other settings from instructions if structured
      },
      // Add other setting categories as needed
    };

    return NextResponse.json({
      success: true,
      data: settings,
    });

  } catch (error) {
    console.error('❌ Error fetching assistant settings:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch assistant settings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper function to validate time format (HH:MM)
function isValidTimeFormat(time: string): boolean {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
} 