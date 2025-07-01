import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { db } from '@/lib/db';

// Zendesk integration for creating and syncing tickets
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, ticketId, zendeskTicketId, data } = body;

    switch (action) {
      case 'create_zendesk_ticket': {
        return await createZendeskTicket(user, ticketId, data);
      }
      
      case 'sync_from_zendesk': {
        return await syncFromZendesk(user, zendeskTicketId);
      }
      
      case 'sync_to_zendesk': {
        return await syncToZendesk(user, ticketId, data);
      }
      
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error with Zendesk integration:', error);
    return NextResponse.json(
      { error: 'Failed to process Zendesk integration' },
      { status: 500 }
    );
  }
}

async function createZendeskTicket(user: any, executaTicketId: string, data: any) {
  try {
    // Get the Executa ticket
    const ticket = await db.handoffRequest.findUnique({
      where: { 
        id: executaTicketId,
        accountId: user.account.id 
      },
      include: {
        session: true,
        assistant: true,
        assignedAgent: {
          include: {
            user: true
          }
        }
      }
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Get Zendesk configuration for account
    const zendeskConfig = await getZendeskConfig(user.account.id);
    if (!zendeskConfig) {
      return NextResponse.json({ error: 'Zendesk not configured' }, { status: 400 });
    }

    // Prepare Zendesk ticket data
    const zendeskTicketData = {
      ticket: {
        subject: `[Executa-${ticket.id}] ${ticket.reason.replace('_', ' ')} - ${ticket.priority} Priority`,
        description: buildZendeskDescription(ticket),
        priority: mapPriorityToZendesk(ticket.priority),
        status: mapStatusToZendesk(ticket.status),
        requester: {
          name: ticket.session.customerName || 'Customer',
                      email: ticket.session.customerEmail || 'info@executasolutions.com'
        },
        custom_fields: [
          {
            id: zendeskConfig.executaTicketIdField, // Custom field for Executa ticket ID
            value: ticket.id
          },
          {
            id: zendeskConfig.assistantNameField, // Custom field for assistant name
            value: ticket.assistant.name
          }
        ],
        tags: ['executa', 'ai-handoff', ticket.reason.toLowerCase()],
        ...(ticket.assignedAgent && {
          assignee_id: await getZendeskUserId(zendeskConfig, ticket.assignedAgent.user.email)
        })
      }
    };

    // Create ticket in Zendesk
    const zendeskResponse = await fetch(`${zendeskConfig.domain}/api/v2/tickets.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${zendeskConfig.email}/token:${zendeskConfig.apiToken}`).toString('base64')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(zendeskTicketData)
    });

    if (!zendeskResponse.ok) {
      const error = await zendeskResponse.text();
      throw new Error(`Zendesk API error: ${error}`);
    }

    const zendeskTicket = await zendeskResponse.json();

    // Store the Zendesk ticket ID in Executa
    await db.handoffRequest.update({
      where: { id: executaTicketId },
      data: {
        handoffSettings: {
          ...(ticket.handoffSettings as any),
          zendeskTicketId: zendeskTicket.ticket.id,
          zendeskUrl: zendeskTicket.ticket.url
        }
      }
    });

    return NextResponse.json({
      success: true,
      zendeskTicket: zendeskTicket.ticket,
      executaTicketId: ticket.id
    });

  } catch (error) {
    console.error('Error creating Zendesk ticket:', error);
    return NextResponse.json(
      { error: 'Failed to create Zendesk ticket' },
      { status: 500 }
    );
  }
}

async function syncFromZendesk(user: any, zendeskTicketId: string) {
  try {
    const zendeskConfig = await getZendeskConfig(user.account.id);
    if (!zendeskConfig) {
      return NextResponse.json({ error: 'Zendesk not configured' }, { status: 400 });
    }

    // Get ticket from Zendesk
    const response = await fetch(`${zendeskConfig.domain}/api/v2/tickets/${zendeskTicketId}.json`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${zendeskConfig.email}/token:${zendeskConfig.apiToken}`).toString('base64')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Zendesk ticket');
    }

    const zendeskData = await response.json();
    const zendeskTicket = zendeskData.ticket;

    // Find corresponding Executa ticket
    const executaTicket = await db.handoffRequest.findFirst({
      where: {
        accountId: user.account.id,
        handoffSettings: {
          path: ['zendeskTicketId'],
          equals: zendeskTicketId
        }
      }
    });

    if (!executaTicket) {
      return NextResponse.json({ error: 'Corresponding Executa ticket not found' }, { status: 404 });
    }

    // Update Executa ticket with Zendesk status
    const executaStatus = mapStatusFromZendesk(zendeskTicket.status);
    const executaPriority = mapPriorityFromZendesk(zendeskTicket.priority);

    await db.handoffRequest.update({
      where: { id: executaTicket.id },
      data: {
        status: executaStatus as any,
        priority: executaPriority as any,
        ...(zendeskTicket.status === 'solved' && {
          resolvedAt: new Date(zendeskTicket.updated_at)
        })
      }
    });

    return NextResponse.json({
      success: true,
      executaTicket: executaTicket.id,
      syncedStatus: executaStatus,
      syncedPriority: executaPriority
    });

  } catch (error) {
    console.error('Error syncing from Zendesk:', error);
    return NextResponse.json(
      { error: 'Failed to sync from Zendesk' },
      { status: 500 }
    );
  }
}

async function syncToZendesk(user: any, executaTicketId: string, data: any) {
  try {
    const ticket = await db.handoffRequest.findUnique({
      where: { 
        id: executaTicketId,
        accountId: user.account.id 
      }
    });

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    const zendeskTicketId = (ticket.handoffSettings as any)?.zendeskTicketId;
    if (!zendeskTicketId) {
      return NextResponse.json({ error: 'Ticket not linked to Zendesk' }, { status: 400 });
    }

    const zendeskConfig = await getZendeskConfig(user.account.id);
    if (!zendeskConfig) {
      return NextResponse.json({ error: 'Zendesk not configured' }, { status: 400 });
    }

    // Update Zendesk ticket
    const updateData = {
      ticket: {
        status: mapStatusToZendesk(ticket.status),
        priority: mapPriorityToZendesk(ticket.priority),
        ...data
      }
    };

    const response = await fetch(`${zendeskConfig.domain}/api/v2/tickets/${zendeskTicketId}.json`, {
      method: 'PUT',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${zendeskConfig.email}/token:${zendeskConfig.apiToken}`).toString('base64')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      throw new Error('Failed to update Zendesk ticket');
    }

    return NextResponse.json({
      success: true,
      zendeskTicketId,
      executaTicketId
    });

  } catch (error) {
    console.error('Error syncing to Zendesk:', error);
    return NextResponse.json(
      { error: 'Failed to sync to Zendesk' },
      { status: 500 }
    );
  }
}

// Helper functions
async function getZendeskConfig(accountId: string) {
  // This would fetch Zendesk configuration from your database
  // For now, return environment variables
  return {
    domain: process.env.ZENDESK_DOMAIN,
    email: process.env.ZENDESK_EMAIL,
    apiToken: process.env.ZENDESK_API_TOKEN,
    executaTicketIdField: process.env.ZENDESK_EXECUTA_TICKET_ID_FIELD,
    assistantNameField: process.env.ZENDESK_ASSISTANT_NAME_FIELD
  };
}

async function getZendeskUserId(config: any, email: string): Promise<number | null> {
  try {
    const response = await fetch(`${config.domain}/api/v2/users/search.json?query=${encodeURIComponent(email)}`, {
      headers: {
        'Authorization': `Basic ${Buffer.from(`${config.email}/token:${config.apiToken}`).toString('base64')}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      return data.users?.[0]?.id || null;
    }
    return null;
  } catch {
    return null;
  }
}

function buildZendeskDescription(ticket: any): string {
  return `
Support request transferred from Executa AI Assistant

Customer Information:
- Name: ${ticket.session.customerName || 'Not provided'}
- Email: ${ticket.session.customerEmail || 'Not provided'}
- Phone: ${ticket.session.customerPhone || 'Not provided'}

AI Assistant: ${ticket.assistant.name}
Handoff Reason: ${ticket.reason.replace('_', ' ')}
Priority: ${ticket.priority}

Original Customer Query:
${ticket.customerQuery || 'No specific query provided'}

Context:
${ticket.context || 'No additional context'}

---
This ticket was automatically created from Executa AI handoff system.
Original ticket ID: ${ticket.id}
  `.trim();
}

function mapPriorityToZendesk(executaPriority: string): string {
  const mapping: Record<string, string> = {
    'LOW': 'low',
    'NORMAL': 'normal', 
    'HIGH': 'high',
    'URGENT': 'urgent'
  };
  return mapping[executaPriority] || 'normal';
}

function mapPriorityFromZendesk(zendeskPriority: string): string {
  const mapping: Record<string, string> = {
    'low': 'LOW',
    'normal': 'NORMAL',
    'high': 'HIGH', 
    'urgent': 'URGENT'
  };
  return mapping[zendeskPriority] || 'NORMAL';
}

function mapStatusToZendesk(executaStatus: string): string {
  const mapping: Record<string, string> = {
    'PENDING': 'new',
    'ASSIGNED': 'open',
    'ACCEPTED': 'open', 
    'IN_PROGRESS': 'pending',
    'RESOLVED': 'solved',
    'EXPIRED': 'closed'
  };
  return mapping[executaStatus] || 'open';
}

function mapStatusFromZendesk(zendeskStatus: string): string {
  const mapping: Record<string, string> = {
    'new': 'PENDING',
    'open': 'ASSIGNED',
    'pending': 'IN_PROGRESS',
    'solved': 'RESOLVED',
    'closed': 'RESOLVED'
  };
  return mapping[zendeskStatus] || 'PENDING';
} 