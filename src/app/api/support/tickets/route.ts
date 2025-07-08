import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { notifyNewTicket } from '@/lib/websocket';

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {
      accountId: user.account.id
    };

    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }

    if (priority && priority !== 'all') {
      where.priority = priority.toUpperCase();
    }

    // Get tickets
    const tickets = await db.handoffRequest.findMany({
      where,
      include: {
        assistant: {
          select: {
            name: true,
            id: true
          }
        },
        session: {
          select: {
            id: true,
            customerName: true,
            customerEmail: true,
            customerPhone: true,
            totalMessages: true,
            createdAt: true
          }
        },
        account: {
          include: {
            users: {
              where: {
                role: 'OWNER'
              },
              select: {
                name: true,
                email: true
              },
              take: 1
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: offset,
      take: limit
    });

    // Get total count for pagination
    const totalCount = await db.handoffRequest.count({ where });

    // Format tickets
    const formattedTickets = tickets.map(ticket => {
      const accountOwner = ticket.account.users[0];
      
      return {
        id: ticket.id,
        status: ticket.status,
        priority: ticket.priority,
        reason: ticket.reason,
        customerQuery: ticket.customerQuery,
        createdAt: ticket.createdAt,
        resolvedAt: ticket.resolvedAt,
        assistant: ticket.assistant,
        assignedTo: accountOwner ? {
          name: accountOwner.name,
          email: accountOwner.email
        } : null,
        customer: {
          name: ticket.session.customerName,
          email: ticket.session.customerEmail,
          phone: ticket.session.customerPhone
        },
        session: {
          id: ticket.session.id,
          totalMessages: ticket.session.totalMessages,
          createdAt: ticket.session.createdAt
        }
      };
    });

    return NextResponse.json({
      success: true,
      tickets: formattedTickets,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      assistantId,
      sessionId,
      reason,
      priority = 'NORMAL',
      context,
      customerQuery,
      customerInfo
    } = body;

    // Validate required fields
    if (!assistantId || !sessionId || !reason) {
      return NextResponse.json(
        { error: 'Assistant ID, session ID, and reason are required' },
        { status: 400 }
      );
    }

    // Get the assistant and verify it belongs to the user's account
    const assistant = await db.assistant.findFirst({
      where: {
        id: assistantId,
        accountId: user.account.id
      }
    });

    if (!assistant) {
      return NextResponse.json({ error: 'Assistant not found' }, { status: 404 });
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
          customerName: customerInfo?.name,
          customerEmail: customerInfo?.email,
          customerPhone: customerInfo?.phone,
          customerMetadata: customerInfo?.metadata,
          status: 'ACTIVE',
          channel: 'web'
        }
      });
    }

    // Create the handoff request
    const ticket = await db.handoffRequest.create({
      data: {
        accountId: assistant.accountId,
        sessionId: chatSession.id,
        assistantId: assistant.id,
        reason: reason as any,
        priority: priority as any,
        context,
        customerQuery,
        handoffSettings: {}, // Empty since we don't use complex settings anymore
        status: 'PENDING'
      }
    });

    // Update chat session status
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
        content: 'Your conversation has been transferred to our support team. A human agent will be with you shortly.',
        messageType: 'SYSTEM',
        sender: 'AI_ASSISTANT',
        assistantId: assistant.id
      }
    });

    return NextResponse.json({
      success: true,
      ticket: {
        id: ticket.id,
        status: ticket.status,
        priority: ticket.priority,
        createdAt: ticket.createdAt,
        sessionId: ticket.sessionId
      }
    });

  } catch (error) {
    console.error('Error creating ticket:', error);
    return NextResponse.json(
      { error: 'Failed to create ticket' },
      { status: 500 }
    );
  }
}

// Helper functions for email notifications
async function sendSupportNotificationEmail(ticket: any, user: any) {
  try {
      const priorityLabels: Record<string, string> = {
    'LOW': 'LOW',
    'NORMAL': 'NORMAL',
    'HIGH': 'HIGH',
    'URGENT': 'URGENT'
  };

    const emailData = {
      to: process.env.EXECUTA_SUPPORT_EMAIL || 'info@executasolutions.com',
      from: process.env.SUPPORT_EMAIL_ADDRESS || 'support@executasolutions.com',
              subject: `[${ticket.id}] ${priorityLabels[ticket.priority] || 'NORMAL'} New Support Request`,
      text: `
New Support Ticket: ${ticket.id}

Customer Information:
- Name: ${ticket.session.customerName}
- Email: ${ticket.session.customerEmail}
- Account ID: ${user.account?.id}

Ticket Details:
- Priority: ${ticket.priority}
- Reason: ${ticket.reason.replace('_', ' ')}
- Created: ${new Date(ticket.createdAt).toLocaleString()}

Context:
${ticket.context || 'No additional context'}

Customer Query:
${ticket.customerQuery}

---
Reply to this email to respond to the customer.
Visit your dashboard to manage tickets: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard/tickets
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">New Support Ticket</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">Ticket ID: ${ticket.id}</p>
          </div>
          
          <div style="background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; border-top: none;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
              <div>
                <h3 style="margin: 0 0 8px 0; color: #374151;">Customer Information</h3>
                <p><strong>Name:</strong> ${ticket.session.customerName}</p>
                <p><strong>Email:</strong> ${ticket.session.customerEmail}</p>
                <p><strong>Account ID:</strong> ${user.account?.id}</p>
              </div>
              <div>
                <h3 style="margin: 0 0 8px 0; color: #374151;">Ticket Details</h3>
                <p><strong>Priority:</strong> ${ticket.priority}</p>
                <p><strong>Reason:</strong> ${ticket.reason.replace('_', ' ')}</p>
                <p><strong>Created:</strong> ${new Date(ticket.createdAt).toLocaleString()}</p>
              </div>
            </div>
            
            <div style="margin-bottom: 20px;">
              <h3 style="margin: 0 0 8px 0; color: #374151;">Context</h3>
              <p>${ticket.context || 'No additional context'}</p>
            </div>
            
            <div>
              <h3 style="margin: 0 0 8px 0; color: #374151;">Customer Query</h3>
              <div style="background: white; padding: 16px; border-radius: 6px; border: 1px solid #e2e8f0;">
                <p style="white-space: pre-wrap;">${ticket.customerQuery}</p>
              </div>
            </div>
          </div>
          
          <div style="background: #1f2937; color: white; padding: 16px; border-radius: 0 0 8px 8px; text-align: center;">
            <p style="margin: 0; font-size: 12px; opacity: 0.8;">
              Reply to this email to respond to the customer. Visit your <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/tickets" style="color: #60a5fa;">dashboard</a> to manage tickets.
            </p>
          </div>
        </div>
      `,
      headers: {
        'References': `ticket-${ticket.id}@executasolutions.com`,
        'In-Reply-To': `ticket-${ticket.id}@executasolutions.com`
      }
    };

    // Use the same email sending infrastructure as the reply handler
    await sendEmail(emailData);
    console.log(`✅ Support notification sent for ticket ${ticket.id}`);
    
  } catch (error) {
    console.error('❌ Failed to send support notification email:', error);
  }
}

// Email sending utility function
async function sendEmail(emailData: any) {
  // Implement actual email sending based on available service
  if (process.env.SENDGRID_API_KEY) {
    await sendWithSendGrid(emailData);
    await sendWithAWSSES(emailData);
  } else if (process.env.SMTP_HOST) {
    await sendWithSMTP(emailData);
  } else {
    // Fallback: log the email for development
    console.log('📧 Email would be sent (no email service configured):', emailData);
  }
}

// SendGrid implementation
async function sendWithSendGrid(emailData: any) {
  const sgMail = require('@sendgrid/mail');
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  
  await sgMail.send({
    to: emailData.to,
    from: emailData.from,
    subject: emailData.subject,
    text: emailData.text,
    html: emailData.html,
    headers: emailData.headers
  });
}

// AWS SES implementation
async function sendWithAWSSES(emailData: any) {
  const AWS = require('aws-sdk');
  
  const ses = new AWS.SES({
    region: process.env.AWS_SES_REGION,
  });

  const params = {
    Source: emailData.from,
    Destination: {
      ToAddresses: [emailData.to]
    },
    Message: {
      Subject: {
        Data: emailData.subject,
        Charset: 'UTF-8'
      },
      Body: {
        Text: {
          Data: emailData.text,
          Charset: 'UTF-8'
        },
        Html: {
          Data: emailData.html,
          Charset: 'UTF-8'
        }
      }
    },
    ReplyToAddresses: [emailData.from]
  };

  await ses.sendEmail(params).promise();
}

// SMTP implementation (using nodemailer)
async function sendWithSMTP(emailData: any) {
  const nodemailer = require('nodemailer');
  
  const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });

  await transporter.sendMail({
    from: emailData.from,
    to: emailData.to,
    subject: emailData.subject,
    text: emailData.text,
    html: emailData.html,
    headers: emailData.headers
  });
}

async function sendUserConfirmationEmail(data: {
  userEmail: string;
  userName: string;
  ticketId: string;
  subject: string;
}) {
  try {
    const emailData = {
      to: data.userEmail,
      from: process.env.SUPPORT_EMAIL_ADDRESS || 'support@executasolutions.com',
      subject: `[${data.ticketId}] Support Request Received - ${data.subject}`,
      text: `
Hi ${data.userName},

Thank you for contacting Executa support. We've received your request and assigned it ticket ID ${data.ticketId}.

Subject: ${data.subject}
Ticket ID: ${data.ticketId}

Our support team will review your request and respond within 24 hours. You can reply directly to this email to add more information to your ticket.

Best regards,
The Executa Team
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">Support Request Received</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">We'll get back to you soon!</p>
          </div>
          
          <div style="background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
            <p>Hi ${data.userName},</p>
            <p>Thank you for contacting Executa support. We've received your request and assigned it ticket ID <strong>${data.ticketId}</strong>.</p>
            
            <div style="background: white; padding: 16px; border-radius: 6px; border: 1px solid #e2e8f0; margin: 20px 0;">
              <p style="margin: 0;"><strong>Subject:</strong> ${data.subject}</p>
              <p style="margin: 8px 0 0 0;"><strong>Ticket ID:</strong> ${data.ticketId}</p>
            </div>
            
            <p>Our support team will review your request and respond within 24 hours. You can reply directly to this email to add more information to your ticket.</p>
            
            <p>Best regards,<br>The Executa Team</p>
          </div>
        </div>
      `,
      headers: {
        'References': `ticket-${data.ticketId}@executasolutions.com`,
        'In-Reply-To': `ticket-${data.ticketId}@executasolutions.com`
      }
    };

    await sendEmail(emailData);
    console.log(`✅ Confirmation email sent to ${data.userEmail} for ticket ${data.ticketId}`);
    
  } catch (error) {
    console.error('❌ Failed to send user confirmation email:', error);
  }
} 