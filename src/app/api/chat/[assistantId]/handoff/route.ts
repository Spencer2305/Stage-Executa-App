import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ assistantId: string }> }
) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { assistantId } = await params;
    const body = await request.json();
    const { sessionId, reason, priority, context, customerQuery, handoffSettings } = body;

    // Get assistant and verify ownership
    const assistant = await db.assistant.findUnique({
      where: { 
        id: assistantId,
        accountId: user.account.id 
      }
    });

    if (!assistant) {
      return NextResponse.json({ error: 'Assistant not found' }, { status: 404 });
    }

    // Check if handoff is enabled
    if (!assistant.handoffEnabled) {
      return NextResponse.json({ error: 'Handoff not enabled for this assistant' }, { status: 400 });
    }

    // Get or create chat session
    let chatSession = await db.chatSession.findUnique({
      where: { id: sessionId }
    });

    if (!chatSession) {
      chatSession = await db.chatSession.create({
        data: {
          id: sessionId,
          accountId: assistant.accountId,
          assistantId: assistant.id,
          status: 'ACTIVE',
          channel: 'web'
        }
      });
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
        content: handoffSettings.handoffMessage || 'I\'m connecting you with our support team who can better assist you.',
        messageType: 'SYSTEM',
        sender: 'AI_ASSISTANT',
        assistantId: assistant.id
      }
    });

    // Handle notification based on handoff method
    switch (handoffSettings.handoffMethod) {
      case 'email':
        await handleEmailHandoff(assistant, handoffRequest, chatSession, handoffSettings.emailSettings);
        break;
        
      case 'integration':
        await handleIntegrationHandoff(assistant, handoffRequest, chatSession, handoffSettings.integrationSettings);
        break;
    }

    return NextResponse.json({
      success: true,
      handoffId: handoffRequest.id,
      message: handoffSettings.customerWaitMessage || 'Please wait while we connect you with our support team.',
      estimatedWaitTime: 5
    });

  } catch (error) {
    console.error('Error creating handoff request:', error);
    return NextResponse.json(
      { error: 'Failed to create handoff request' },
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
        session: true,
        account: {
          include: {
            users: {
              where: {
                role: 'OWNER'
              },
              take: 1
            }
          }
        }
      }
    });

    if (!handoffRequest) {
      return NextResponse.json({ error: 'Handoff request not found' }, { status: 404 });
    }

    const accountOwner = handoffRequest.account.users[0];

    return NextResponse.json({
      success: true,
      status: handoffRequest.status,
      assignedTo: accountOwner ? {
        name: accountOwner.name,
        email: accountOwner.email
      } : {
        name: 'Account Owner',
        email: 'Not Available'
      },
      createdAt: handoffRequest.createdAt
    });

  } catch (error) {
    console.error('Error fetching handoff status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch handoff status' },
      { status: 500 }
    );
  }
}

// Simplified email handoff - send to account owner
async function handleEmailHandoff(assistant: any, handoffRequest: any, chatSession: any, emailSettings: any) {
  const supportEmail = emailSettings.supportEmail;
  
  if (!supportEmail) {
    console.log('No support email configured for handoff');
    return;
  }

  const emailData = {
    to: supportEmail,
    subject: `New Support Request - ${assistant.name}`,
    html: `
      <h2>New Support Request</h2>
      <p><strong>Assistant:</strong> ${assistant.name}</p>
      <p><strong>Reason:</strong> ${handoffRequest.reason}</p>
      <p><strong>Priority:</strong> ${handoffRequest.priority}</p>
      <p><strong>Customer Query:</strong> ${handoffRequest.customerQuery}</p>
      ${handoffRequest.context ? `<p><strong>Context:</strong> ${handoffRequest.context}</p>` : ''}
      <p><strong>Session ID:</strong> ${chatSession.id}</p>
      <p><strong>Request ID:</strong> ${handoffRequest.id}</p>
      <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
      
      ${emailSettings.includeConversationHistory ? '<p><em>Conversation history would be included here.</em></p>' : ''}
      
      <p>Please review and respond to this support request.</p>
    `,
    from: 'noreply@executa.app'
  };

  console.log('Would send email handoff notification:', emailData);
  // TODO: Implement actual email sending
}

// Simplified integration handoff
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

  // Send to Teams
  if (integrationSettings.teamsWebhook) {
    try {
      await fetch(integrationSettings.teamsWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          "@type": "MessageCard",
          "@context": "http://schema.org/extensions",
          "themeColor": handoffRequest.priority === 'HIGH' ? "FF0000" : "FFA500",
          "summary": "New Support Request",
          "sections": [{
            "activityTitle": "New Support Request",
            "activitySubtitle": `From ${assistant.name}`,
            "facts": [
              { "name": "Customer", "value": chatSession.customerEmail || 'Unknown' },
              { "name": "Reason", "value": handoffRequest.reason },
              { "name": "Priority", "value": handoffRequest.priority },
              { "name": "Assistant", "value": assistant.name }
            ]
          }]
        })
      });
    } catch (error) {
      console.error('Failed to send Teams notification:', error);
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
      console.error('Failed to send custom webhook notification:', error);
    }
  }
} 