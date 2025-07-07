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
    const assignedToMe = searchParams.get('assignedToMe') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause: any = {
      accountId: user.account.id
    };

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    if (priority && priority !== 'all') {
      whereClause.priority = priority;
    }

    if (assignedToMe) {
      // Find human agent record for current user
      const humanAgent = await db.humanAgent.findUnique({
        where: { userId: user.id }
      });
      
      if (humanAgent) {
        whereClause.assignedAgentId = humanAgent.id;
      } else {
        // User is not a human agent, return empty results
        return NextResponse.json({
          tickets: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0
          }
        });
      }
    }

    // Get tickets with related data
    const [tickets, totalCount] = await Promise.all([
      db.handoffRequest.findMany({
        where: whereClause,
        include: {
          session: {
            include: {
              messages: {
                take: 1,
                orderBy: { createdAt: 'desc' }
              }
            }
          },
          assistant: {
            select: {
              name: true,
              id: true
            }
          },
          assignedAgent: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      }),
      db.handoffRequest.count({ where: whereClause })
    ]);

    // Transform tickets to include additional data
    const transformedTickets = await Promise.all(
      tickets.map(async (ticket) => {
        // Get message count for session
        const messageCount = await db.chatMessage.count({
          where: { sessionId: ticket.sessionId }
        });

        // Get last activity timestamp
        const lastMessage = await db.chatMessage.findFirst({
          where: { sessionId: ticket.sessionId },
          orderBy: { createdAt: 'desc' }
        });

        return {
          id: ticket.id,
          status: ticket.status,
          priority: ticket.priority,
          reason: ticket.reason,
          customerName: ticket.session.customerName,
          customerEmail: ticket.session.customerEmail,
          customerPhone: ticket.session.customerPhone,
          assistantName: ticket.assistant.name,
          assistantId: ticket.assistant.id,
          assignedAgent: ticket.assignedAgent ? {
            id: ticket.assignedAgent.id,
            name: ticket.assignedAgent.name,
            email: ticket.assignedAgent.email,
            isOnline: ticket.assignedAgent.isOnline,
            user: ticket.assignedAgent.user
          } : null,
          context: ticket.context,
          customerQuery: ticket.customerQuery,
          createdAt: ticket.createdAt,
          assignedAt: ticket.assignedAt,
          acceptedAt: ticket.acceptedAt,
          resolvedAt: ticket.resolvedAt,
          channel: ticket.session.channel,
          messageCount,
          lastActivity: lastMessage?.createdAt || ticket.createdAt,
          sessionId: ticket.sessionId
        };
      })
    );

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      tickets: transformedTickets,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages
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
    
    // Handle both AI handoff requests and direct support requests
    if (body.ticketType === 'direct_support') {
      // Handle direct support requests (like the old executa-ticket system)
      const {
        subject,
        category,
        priority = 'NORMAL',
        description,
        userEmail,
        userName
      } = body;

      // Validate required fields
      if (!subject || !description || !userEmail || !userName || !category) {
        return NextResponse.json(
          { error: 'All fields are required for direct support requests' },
          { status: 400 }
        );
      }

             // Find or create a system assistant for direct support requests
       let systemAssistant = await db.assistant.findFirst({
         where: {
           accountId: user.account.id,
           name: 'Direct Support System'
         }
       });

       if (!systemAssistant) {
         systemAssistant = await db.assistant.create({
           data: {
             accountId: user.account.id,
             name: 'Direct Support System',
             description: 'System assistant for handling direct support requests',
             status: 'ACTIVE',
             welcomeMessage: 'Thank you for contacting support. Your request has been received.',
             handoffEnabled: true,
             handoffSettings: {
               handoffMethod: 'email',
               emailSettings: {
                 supportEmail: process.env.EXECUTA_SUPPORT_EMAIL || 'info@executasolutions.com'
               }
             }
           }
         });
       }

       // Create a virtual session for direct support requests
       const sessionId = `support-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
       
       const chatSession = await db.chatSession.create({
         data: {
           id: sessionId,
           accountId: user.account.id,
           assistantId: systemAssistant.id,
           customerName: userName,
           customerEmail: userEmail,
           status: 'ACTIVE',
           channel: 'support_form',
           isHandedOff: true
         }
       });

       // Create handoff request for direct support
       const ticket = await db.handoffRequest.create({
         data: {
           accountId: user.account.id,
           sessionId: chatSession.id,
           assistantId: systemAssistant.id,
           reason: 'CUSTOMER_REQUESTED',
           priority: priority as any,
           context: `Direct support request - Category: ${category}`,
           customerQuery: `${subject}\n\n${description}`,
           handoffSettings: {
             handoffMethod: 'email',
             emailSettings: {
               supportEmail: process.env.EXECUTA_SUPPORT_EMAIL || 'info@executasolutions.com',
               includeConversationHistory: false
             }
           },
           status: 'PENDING'
         },
         include: {
           session: true
         }
       });

             // Send email notification to support team
       await sendSupportNotificationEmail(ticket, user);

       // Send confirmation to user
       await sendUserConfirmationEmail({
         userEmail,
         userName,
         ticketId: ticket.id,
         subject
       });

       // Send real-time notification
       await notifyNewTicket({
         ...ticket,
         accountId: user.account.id,
         customerName: userName,
         assistant: { name: 'Direct Support System' }
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
    } else {
      // Handle AI handoff requests (existing logic)
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
      if (!assistantId || !sessionId) {
        return NextResponse.json(
          { error: 'assistantId and sessionId are required' },
          { status: 400 }
        );
      }

      // Get the assistant
      const assistant = await db.assistant.findUnique({
        where: { id: assistantId }
      });

      if (!assistant) {
        return NextResponse.json({ error: 'Assistant not found' }, { status: 404 });
      }

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
            channel: customerInfo?.channel || 'web'
          }
        });
      }

      // Create handoff request (ticket)
      const ticket = await db.handoffRequest.create({
        data: {
          accountId: assistant.accountId,
          sessionId: chatSession.id,
          assistantId: assistant.id,
          reason: reason as any,
          priority: priority as any,
          context,
          customerQuery,
          handoffSettings: assistant.handoffSettings || {},
          status: 'PENDING'
        },
        include: {
          session: true,
          assistant: {
            select: {
              name: true
            }
          }
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

       // Send real-time notification
       await notifyNewTicket({
         ...ticket,
         accountId: assistant.accountId,
         customerName: chatSession.customerName,
         assistant: { name: assistant.name }
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
    }

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
    const priorityEmoji: Record<string, string> = {
      'LOW': '🟢',
      'NORMAL': '🟡', 
      'HIGH': '🟠',
      'URGENT': '🔴'
    };

    const emailData = {
      to: process.env.EXECUTA_SUPPORT_EMAIL || 'info@executasolutions.com',
      from: process.env.SUPPORT_EMAIL_ADDRESS || 'support@executasolutions.com',
      subject: `[${ticket.id}] ${priorityEmoji[ticket.priority] || '⚪'} New Support Request`,
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
                <p><strong>Priority:</strong> ${priorityEmoji[ticket.priority]} ${ticket.priority}</p>
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