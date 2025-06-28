import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { db } from '@/lib/db';
// Simple email function (replace with your email service)
async function sendEmail(options: { to: string; subject: string; text: string; html: string }) {
  console.log('Sending email:', options);
  // TODO: Implement actual email sending (SendGrid, Nodemailer, etc.)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ assistantId: string }> }
) {
  try {
    const { assistantId } = await params;
    const body = await request.json();
    const {
      sessionId,
      reason,
      priority = 'NORMAL',
      context,
      customerQuery,
      customerInfo
    } = body;

    // Get the assistant and its handoff settings
    const assistant = await db.assistant.findFirst({
      where: { id: assistantId },
      include: {
        account: true
      }
    });

    if (!assistant) {
      return NextResponse.json({ error: 'Assistant not found' }, { status: 404 });
    }

    if (!assistant.handoffEnabled || !assistant.handoffSettings) {
      return NextResponse.json({ error: 'Handoff not enabled for this assistant' }, { status: 400 });
    }

    const handoffSettings = assistant.handoffSettings as any;

    // Check if session exists, create if it doesn't
    let chatSession = await db.chatSession.findUnique({
      where: { id: sessionId }
    });

    if (!chatSession) {
      chatSession = await db.chatSession.create({
        data: {
          id: sessionId,
          accountId: assistant.accountId,
          assistantId: assistant.id,
          customerName: customerInfo?.name,
          customerEmail: customerInfo?.email,
          customerPhone: customerInfo?.phone,
          customerMetadata: customerInfo?.metadata,
          status: 'ACTIVE',
          channel: 'web'
        }
      });
    }

    // Check business hours if enabled
    if (handoffSettings.businessHours?.enabled) {
      const isBusinessHours = checkBusinessHours(handoffSettings.businessHours);
      if (!isBusinessHours) {
        return NextResponse.json({
          success: false,
          message: handoffSettings.offlineMessage || 'Our support team is currently offline. Please leave your message and we\'ll get back to you.',
          requiresContact: true,
          businessHours: handoffSettings.businessHours
        });
      }
    }

    // Create handoff request
    const handoffRequest = await db.handoffRequest.create({
      data: {
        accountId: assistant.accountId,
        sessionId: chatSession.id,
        assistantId: assistant.id,
        reason: reason as any,
        priority: priority as any,
        context,
        customerQuery,
        handoffSettings: handoffSettings,
        status: 'PENDING'
      }
    });

    // Update chat session
    await db.chatSession.update({
      where: { id: chatSession.id },
      data: {
        isHandedOff: true,
        status: 'TRANSFERRED'
      }
    });

    // Add system message about handoff
    await db.chatMessage.create({
      data: {
        sessionId: chatSession.id,
        content: handoffSettings.handoffMessage || 'I\'m connecting you with a human agent who can better assist you.',
        messageType: 'SYSTEM',
        sender: 'AI_ASSISTANT',
        assistantId: assistant.id
      }
    });

    // Handle different handoff methods
    switch (handoffSettings.handoffMethod) {
      case 'email':
        await handleEmailHandoff(assistant, handoffRequest, chatSession, handoffSettings.emailSettings);
        break;
        
      case 'internal_notification':
        await handleInternalNotification(assistant, handoffRequest, chatSession, handoffSettings.internalSettings);
        break;
        
      case 'integration':
        await handleIntegrationHandoff(assistant, handoffRequest, chatSession, handoffSettings.integrationSettings);
        break;
    }

    return NextResponse.json({
      success: true,
      handoffId: handoffRequest.id,
      message: handoffSettings.customerWaitMessage || 'Please wait while I connect you with a human agent.',
      estimatedWaitTime: handoffSettings.internalSettings?.maxWaitTime || 5
    });

  } catch (error) {
    console.error('Error creating handoff request:', error);
    return NextResponse.json(
      { error: 'Failed to process handoff request' },
      { status: 500 }
    );
  }
}

// Get handoff status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ assistantId: string }> }
) {
  try {
    const { assistantId } = await params;
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const handoffRequest = await db.handoffRequest.findFirst({
      where: {
        assistantId,
        sessionId
      },
      include: {
        assignedAgent: {
          include: {
            user: true
          }
        },
        session: true
      }
    });

    if (!handoffRequest) {
      return NextResponse.json({ error: 'Handoff request not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      status: handoffRequest.status,
      assignedAgent: handoffRequest.assignedAgent ? {
        name: handoffRequest.assignedAgent.name,
        email: handoffRequest.assignedAgent.email,
        isOnline: handoffRequest.assignedAgent.isOnline
      } : null,
      createdAt: handoffRequest.createdAt,
      assignedAt: handoffRequest.assignedAt,
      acceptedAt: handoffRequest.acceptedAt
    });

  } catch (error) {
    console.error('Error fetching handoff status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch handoff status' },
      { status: 500 }
    );
  }
}

// Helper functions
async function handleEmailHandoff(assistant: any, handoffRequest: any, chatSession: any, emailSettings: any) {
  if (!emailSettings?.supportEmail) return;

  const subject = `New Support Request - ${assistant.name}`;
  const body = `
New support request from ${chatSession.customerName || 'Customer'}:

Customer Information:
- Name: ${chatSession.customerName || 'Not provided'}
- Email: ${chatSession.customerEmail || 'Not provided'}
- Phone: ${chatSession.customerPhone || 'Not provided'}

Request Details:
- Reason: ${handoffRequest.reason}
- Priority: ${handoffRequest.priority}
- Context: ${handoffRequest.context || 'None provided'}
- Original Query: ${handoffRequest.customerQuery || 'None provided'}

Session ID: ${chatSession.id}
Created: ${new Date().toISOString()}

${emailSettings.includeConversationHistory ? 'Conversation history will be attached separately.' : ''}
  `;

  try {
    await sendEmail({
      to: emailSettings.supportEmail,
      subject,
      text: body,
      html: body.replace(/\n/g, '<br>')
    });
  } catch (error) {
    console.error('Failed to send handoff email:', error);
  }
}

async function handleInternalNotification(assistant: any, handoffRequest: any, chatSession: any, internalSettings: any) {
  if (!internalSettings?.notifyAgents?.length) return;

  // Find available agents
  const availableAgents = await db.humanAgent.findMany({
    where: {
      id: { in: internalSettings.notifyAgents },
      isOnline: true,
      isAvailable: true,
      accountId: assistant.accountId
    },
    orderBy: {
      lastActive: 'desc'
    }
  });

  if (availableAgents.length === 0) {
    console.log('No available agents found for handoff');
    return;
  }

  // Auto-assign if enabled
  if (internalSettings.autoAssign) {
    let selectedAgent;
    
    switch (internalSettings.assignmentMethod) {
      case 'least_busy':
        // Find agent with least active chats
        const agentChatCounts = await Promise.all(
          availableAgents.map(async (agent) => ({
            agent,
            activeChats: await db.chatSession.count({
              where: {
                humanAgentId: agent.id,
                status: { in: ['ACTIVE', 'TRANSFERRED'] }
              }
            })
          }))
        );
        selectedAgent = agentChatCounts
          .filter(({ activeChats, agent }) => activeChats < agent.maxChats)
          .sort((a, b) => a.activeChats - b.activeChats)[0]?.agent;
        break;
        
      case 'skills_based':
        // Simple implementation: first available agent
        selectedAgent = availableAgents[0];
        break;
        
      case 'round_robin':
      default:
        // Round robin by last assignment
        selectedAgent = availableAgents[0];
        break;
    }

    if (selectedAgent) {
      await db.handoffRequest.update({
        where: { id: handoffRequest.id },
        data: {
          assignedAgentId: selectedAgent.id,
          assignedAt: new Date(),
          status: 'ASSIGNED'
        }
      });

      await db.chatSession.update({
        where: { id: chatSession.id },
        data: {
          humanAgentId: selectedAgent.id
        }
      });
    }
  }

  // Send notifications to agents (implement real-time notifications here)
  console.log(`Notifying ${availableAgents.length} agents about new handoff request`);
}

async function handleIntegrationHandoff(assistant: any, handoffRequest: any, chatSession: any, integrationSettings: any) {
  const webhookData = {
    type: 'handoff_request',
    assistantId: assistant.id,
    assistantName: assistant.name,
    sessionId: chatSession.id,
    handoffId: handoffRequest.id,
    customer: {
      name: chatSession.customerName,
      email: chatSession.customerEmail,
      phone: chatSession.customerPhone
    },
    request: {
      reason: handoffRequest.reason,
      priority: handoffRequest.priority,
      context: handoffRequest.context,
      query: handoffRequest.customerQuery
    },
    timestamp: new Date().toISOString()
  };

  // Send to Slack
  if (integrationSettings.slackWebhook) {
    try {
      await fetch(integrationSettings.slackWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 New support request from ${chatSession.customerName || 'Customer'}`,
          attachments: [{
            color: handoffRequest.priority === 'HIGH' ? 'danger' : 'warning',
            fields: [
              { title: 'Assistant', value: assistant.name, short: true },
              { title: 'Reason', value: handoffRequest.reason, short: true },
              { title: 'Priority', value: handoffRequest.priority, short: true },
              { title: 'Customer', value: chatSession.customerEmail || 'Unknown', short: true }
            ]
          }]
        })
      });
    } catch (error) {
      console.error('Failed to send Slack notification:', error);
    }
  }

  // Send to custom webhook
  if (integrationSettings.customWebhook) {
    try {
      await fetch(integrationSettings.customWebhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...integrationSettings.webhookHeaders
        },
        body: JSON.stringify(webhookData)
      });
    } catch (error) {
      console.error('Failed to send custom webhook:', error);
    }
  }
}

function checkBusinessHours(businessHours: any): boolean {
  const now = new Date();
  const timezone = businessHours.timezone || 'UTC';
  
  // Convert to specified timezone
  const timeInZone = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(now);

  const dayName = timeInZone.find(part => part.type === 'weekday')?.value.toLowerCase();
  const hour = parseInt(timeInZone.find(part => part.type === 'hour')?.value || '0');
  const minute = parseInt(timeInZone.find(part => part.type === 'minute')?.value || '0');
  const currentTime = hour * 60 + minute; // minutes since midnight

  if (!dayName || !businessHours.schedule[dayName]?.enabled) {
    return false;
  }

  const schedule = businessHours.schedule[dayName];
  const [startHour, startMinute] = schedule.start.split(':').map(Number);
  const [endHour, endMinute] = schedule.end.split(':').map(Number);
  
  const startTime = startHour * 60 + startMinute;
  const endTime = endHour * 60 + endMinute;

  return currentTime >= startTime && currentTime <= endTime;
} 