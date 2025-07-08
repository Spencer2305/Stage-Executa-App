import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import OpenAI from 'openai';

const openai = new OpenAI({
});

// Complete settings interface matching the UI (removed welcomeMessage)
interface AssistantSettings {
  basicInfo?: {
    name?: string;
    description?: string;
    status?: string;
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
    maxContextLength?: string | number;
    prioritizeRecentFiles?: boolean;
    includeFileMetadata?: boolean;
    crossReferenceFiles?: boolean;
  };
  
  moderation?: {
    contentFilterLevel?: string;
    privacyMode?: string;
    blockedTopics?: string;
    logConversations?: boolean;
    enableFeedback?: boolean;
  };
  
  advanced?: {
    temperature?: string | number;
    topP?: string | number;
    maxTokens?: string | number;
    stopSequences?: string;
    enableStreaming?: boolean;
    enableRetry?: boolean;
  };
  
  // Handoff Configuration
  handoffEnabled?: boolean;
  handoffSettings?: HandoffSettings;
}

// Enhanced handoff settings interface
interface HandoffSettings {
  // Basic keyword triggers
  triggerOnKeywords: string[];
  
  // AI-powered detection
  triggerOnAutoDetect: boolean;
  autoDetectSensitivity: 'low' | 'medium' | 'high';
  
  // Sentiment analysis
  triggerOnSentiment: boolean;
  sentimentThreshold: number;
  
  // Conversation complexity and length
  triggerOnComplexity: boolean;
  maxConversationLength: number;
  
  // Failed attempts and escalation
  triggerOnFailedAttempts: boolean;
  maxFailedAttempts: number;
  
  // Escalation patterns
  triggerOnEscalation: boolean;
  escalationKeywords: string[];
  
  // Question repetition
  triggerOnRepetition: boolean;
  maxRepetitions: number;
  
  // Urgency detection
  triggerOnUrgency: boolean;
  urgencyKeywords: string[];
  
  // Customer effort indicators
  triggerOnHighEffort: boolean;
  effortIndicators: string[];
  
  // Handoff methods (simplified)
  handoffMethod: 'email' | 'integration';
  
  // Email method settings
  emailSettings?: {
    supportEmail: string;
    emailTemplate: string;
    includeConversationHistory: boolean;
  };
  
  // Integration settings
  integrationSettings?: {
    slackWebhook?: string;
    teamsWebhook?: string;
    customWebhook?: string;
    webhookHeaders?: Record<string, string>;
  };
  
  // Handoff behavior
  handoffMessage: string;
  customerWaitMessage: string;
  offlineMessage: string;
  
  // Business hours (optional)
  businessHours: {
    enabled: boolean;
    timezone: string;
    schedule: Record<string, { start: string; end: string; enabled: boolean }>;
    holidayDates: string[];
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

    console.log(`Updating settings for assistant ${assistantId}:`, settings);

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

    // Prepare the database update with proper field mapping
    const dbUpdateData: any = {
      updatedAt: new Date()
    };

    // Map basicInfo to database fields (removed welcomeMessage)
    if (settings.basicInfo) {
      if (settings.basicInfo.name) dbUpdateData.name = settings.basicInfo.name;
      if (settings.basicInfo.description !== undefined) dbUpdateData.description = settings.basicInfo.description;
      if (settings.basicInfo.status) {
        // Convert to uppercase enum value
        const statusMap: { [key: string]: string } = {
          'active': 'ACTIVE',
          'draft': 'DRAFT',
          'training': 'TRAINING'
        };
        dbUpdateData.status = statusMap[settings.basicInfo.status.toLowerCase()] || 'DRAFT';
      }
    }

    // Map behavior settings to instructions field and store advanced settings
    if (settings.behavior?.systemInstructions !== undefined) {
      dbUpdateData.instructions = settings.behavior.systemInstructions;
    }

    // Store all settings in handoffSettings temporarily until migration is applied
    // We'll extend the handoffSettings to include all advanced configuration
    const existingHandoffSettings = assistant.handoffSettings as any || {};
    const updatedSettings = {
      ...existingHandoffSettings,
      // Keep existing handoff configuration
      ...(settings.handoffSettings || {}),
      // Add new advanced settings
      _advancedConfig: {
        behavior: settings.behavior,
        knowledgeBase: settings.knowledgeBase,
        moderation: settings.moderation,
        advanced: settings.advanced,
        lastUpdated: new Date().toISOString()
      }
    };

    // Handle handoff settings
    if (settings.handoffEnabled !== undefined) {
      dbUpdateData.handoffEnabled = settings.handoffEnabled;
    }
    
    dbUpdateData.handoffSettings = updatedSettings;

    console.log('Database update data:', dbUpdateData);

    // Update the assistant in the database
    const updatedAssistant = await db.assistant.update({
      where: { id: assistantId },
      data: dbUpdateData
    });

    console.log(`Assistant settings updated successfully`);

    // Update OpenAI assistant with comprehensive settings
    if (assistant.openaiAssistantId) {
      try {
        console.log(`Updating OpenAI assistant with advanced settings...`);
        
        // Build enhanced instructions with behavior settings
        let enhancedInstructions = dbUpdateData.instructions || assistant.instructions || '';
        
        if (settings.behavior) {
          const b = settings.behavior;
          enhancedInstructions += `\n\nBehavior Guidelines:`;
          
          if (b.responseStyle) {
            const styleMap = {
              'friendly': 'Use a warm, friendly, and approachable tone.',
              'professional': 'Maintain a professional and business-appropriate tone.',
              'casual': 'Use a relaxed and conversational tone.',
              'formal': 'Use formal language and proper etiquette.',
              'technical': 'Use precise technical language when appropriate.'
            };
            enhancedInstructions += `\n- Tone: ${styleMap[b.responseStyle as keyof typeof styleMap] || b.responseStyle}`;
          }
          
          if (b.responseLength) {
            const lengthMap = {
              'concise': 'Keep responses brief and to the point.',
              'detailed': 'Provide comprehensive and thorough responses.',
              'balanced': 'Balance brevity with necessary detail.'
            };
            enhancedInstructions += `\n- Length: ${lengthMap[b.responseLength as keyof typeof lengthMap] || b.responseLength}`;
          }
          
          if (b.confidenceLevel) {
            const confidenceMap = {
              'conservative': 'Only provide information you are highly confident about. Acknowledge uncertainty when appropriate.',
              'balanced': 'Balance confidence with appropriate caution. Clarify limitations when needed.',
              'assertive': 'Provide confident responses while maintaining accuracy.'
            };
            enhancedInstructions += `\n- Confidence: ${confidenceMap[b.confidenceLevel as keyof typeof confidenceMap] || b.confidenceLevel}`;
          }
          
          if (b.allowGeneralKnowledge === false) {
            enhancedInstructions += `\n- Only use information from your knowledge base. Do not use general knowledge.`;
          }
          
          if (b.requireSourceCitation) {
            enhancedInstructions += `\n- Always cite sources from your knowledge base when providing information.`;
          }
          
          if (b.allowFollowUpQuestions) {
            enhancedInstructions += `\n- Suggest relevant follow-up questions to help users.`;
          }
          
          if (b.enableContextMemory) {
            enhancedInstructions += `\n- Remember context and references from earlier in the conversation.`;
          }
        }
        
        // Add moderation guidelines
        if (settings.moderation) {
          if (settings.moderation.blockedTopics) {
            enhancedInstructions += `\n\nContent Guidelines:\n- Avoid discussing: ${settings.moderation.blockedTopics}`;
          }
          
          if (settings.moderation.contentFilterLevel) {
            const filterMap = {
              'strict': 'Apply strict content filtering. Avoid any potentially sensitive topics.',
              'moderate': 'Apply moderate content filtering. Use good judgment.',
              'relaxed': 'Apply minimal content filtering while staying professional.'
            };
            enhancedInstructions += `\n- Content Filter: ${filterMap[settings.moderation.contentFilterLevel as keyof typeof filterMap] || settings.moderation.contentFilterLevel}`;
          }
        }

        // Prepare OpenAI update parameters
        const openaiUpdateParams: any = {
          instructions: enhancedInstructions
        };

        // Apply advanced settings if available
        if (settings.advanced) {
          console.log('Advanced settings will be applied during chat interactions:', settings.advanced);
        }
        
        await openai.beta.assistants.update(assistant.openaiAssistantId, openaiUpdateParams);
        
        console.log(`OpenAI assistant updated with enhanced instructions`);
      } catch (openaiError) {
        console.warn(`Failed to update OpenAI assistant: ${openaiError}`);
        // Don't fail the entire request if OpenAI update fails
      }
    }

    return NextResponse.json({ 
      success: true, 
      assistant: updatedAssistant,
      message: 'Assistant settings updated successfully' 
    });

  } catch (error) {
    console.error('Error updating assistant settings:', error);
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

    // Extract advanced settings from handoffSettings temporarily
    const handoffSettings = assistant.handoffSettings as any || {};
    const advancedConfig = handoffSettings._advancedConfig || {};

    // Build settings response from stored data
    const settings = {
      basicInfo: {
        name: assistant.name,
        description: assistant.description,
        status: assistant.status.toLowerCase(),
      },
      behavior: advancedConfig.behavior || {
        systemInstructions: assistant.instructions,
        responseStyle: 'friendly',
        responseLength: 'balanced',
        confidenceLevel: 'balanced',
        allowGeneralKnowledge: true,
        requireSourceCitation: false,
        allowFollowUpQuestions: true,
        enableContextMemory: true,
      },
      knowledgeBase: advancedConfig.knowledgeBase || {
        searchSensitivity: 'moderate',
        maxContextLength: '4000',
        prioritizeRecentFiles: true,
        includeFileMetadata: true,
        crossReferenceFiles: true,
      },
      moderation: advancedConfig.moderation || {
        contentFilterLevel: 'moderate',
        privacyMode: 'maximum',
        blockedTopics: '',
        logConversations: true,
        enableFeedback: true,
      },
      advanced: advancedConfig.advanced || {
        temperature: 0.7,
        topP: 0.9,
        maxTokens: 500,
        stopSequences: '',
        enableStreaming: true,
        enableRetry: true,
      },
      handoffEnabled: assistant.handoffEnabled,
      handoffSettings: {
        ...handoffSettings,
        // Remove internal config from response
        _advancedConfig: undefined
      },
    };

    // Clean up the response
    if (settings.handoffSettings && settings.handoffSettings._advancedConfig !== undefined) {
      delete settings.handoffSettings._advancedConfig;
    }

    return NextResponse.json({
      success: true,
      data: settings,
    });

  } catch (error) {
    console.error('Error fetching assistant settings:', error);
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