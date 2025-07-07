import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';

// Email webhook handler for processing replies to support tickets
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Verify webhook signature if configured
    const signature = request.headers.get('x-webhook-signature');
    if (process.env.EMAIL_WEBHOOK_SECRET && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.EMAIL_WEBHOOK_SECRET)
        .update(JSON.stringify(body))
        .digest('hex');
      
      if (signature !== `sha256=${expectedSignature}`) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    // Extract email data (format depends on email service provider)
    const {
      from,
      to,
      subject,
      text,
      html,
      inReplyTo,
      messageId,
      references
    } = body;

    // Extract ticket ID from email subject or references
    let ticketId = null;
    
    // Try to extract from subject line (format: "Re: [TKT-001] ...")
    const subjectMatch = subject?.match(/\[([A-Z]+-\d+)\]/);
    if (subjectMatch) {
      ticketId = subjectMatch[1];
    }
    
    // Try to extract from custom reference header
    if (!ticketId && references) {
      const refMatch = references.match(/ticket-([a-zA-Z0-9]+)@/);
      if (refMatch) {
        ticketId = refMatch[1];
      }
    }

    if (!ticketId) {
      console.error('Could not extract ticket ID from email:', { subject, references });
      return NextResponse.json({ error: 'Could not identify ticket' }, { status: 400 });
    }

    // Find the ticket
    const ticket = await db.handoffRequest.findUnique({
      where: { id: ticketId },
      include: {
        session: true,
        assignedAgent: {
          include: {
            user: true
          }
        }
      }
    });

    if (!ticket) {
      console.error('Ticket not found:', ticketId);
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Verify the sender is authorized (assigned agent or support email)
    const isAuthorizedSender = 
      ticket.assignedAgent?.user.email === from ||
      from === process.env.SUPPORT_EMAIL_ADDRESS ||
      from.endsWith('@' + process.env.COMPANY_DOMAIN);

    if (!isAuthorizedSender) {
      console.error('Unauthorized email sender:', from);
      return NextResponse.json({ error: 'Unauthorized sender' }, { status: 403 });
    }

    // Clean up email content (remove quoted text, signatures)
    const cleanContent = cleanEmailContent(text || html);

    // Create chat message from email
    const message = await db.chatMessage.create({
      data: {
        sessionId: ticket.sessionId,
        content: cleanContent,
        messageType: 'TEXT',
        sender: 'HUMAN_AGENT',
        humanAgentId: ticket.assignedAgent?.id,
        metadata: {
          source: 'email',
          originalFrom: from,
          originalSubject: subject,
          messageId,
          timestamp: new Date().toISOString()
        }
      }
    });

    // Update ticket status if needed
    if (ticket.status === 'PENDING' || ticket.status === 'ASSIGNED') {
      await db.handoffRequest.update({
        where: { id: ticketId },
        data: {
          status: 'IN_PROGRESS',
          acceptedAt: new Date()
        }
      });
    }

    // Update session activity
    await db.chatSession.update({
      where: { id: ticket.sessionId },
      data: {
        totalMessages: { increment: 1 }
      }
    });

    // TODO: Send email to customer with agent's response
    await sendEmailToCustomer(ticket, cleanContent);

    return NextResponse.json({
      success: true,
      message: 'Email processed successfully',
      ticketId,
      messageId: message.id
    });

  } catch (error) {
    console.error('Error processing email reply:', error);
    return NextResponse.json(
      { error: 'Failed to process email reply' },
      { status: 500 }
    );
  }
}

// Clean email content by removing quoted text and signatures
function cleanEmailContent(content: string): string {
  if (!content) return '';

  // Remove HTML tags if present
  let cleanContent = content.replace(/<[^>]*>/g, '');
  
  // Remove common email signatures and quoted text
  const patterns = [
    /^On .* wrote:[\s\S]*/m,  // "On [date] [person] wrote:"
    /^From:.*[\s\S]*/m,       // Email headers
    /^>.*$/gm,                // Quoted lines starting with >
    /^--\s*$/m,               // Signature separator
    /Best regards[\s\S]*$/im, // Common signature patterns
    /Sent from my .*$/im,
    /-----Original Message-----[\s\S]*/im,
  ];

  patterns.forEach(pattern => {
    cleanContent = cleanContent.replace(pattern, '');
  });

  // Clean up extra whitespace
  cleanContent = cleanContent.trim();
  cleanContent = cleanContent.replace(/\n{3,}/g, '\n\n');

  return cleanContent;
}

// Send email response to customer
async function sendEmailToCustomer(ticket: any, agentMessage: string) {
  try {
    const emailData = {
      to: ticket.session.customerEmail,
      from: process.env.SUPPORT_EMAIL_ADDRESS || 'support@executasolutions.com',
      subject: `Re: [${ticket.id}] Your support request`,
      text: `${agentMessage}\n\n---\nTicket ID: ${ticket.id}\nAgent: ${ticket.assignedAgent?.name || 'Support Team'}\n\nTo continue this conversation, simply reply to this email.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <div style="white-space: pre-wrap; margin-bottom: 20px; line-height: 1.6;">
            ${agentMessage.replace(/\n/g, '<br>')}
          </div>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          
          <div style="color: #666; font-size: 12px;">
            <p><strong>Ticket ID:</strong> ${ticket.id}</p>
            <p><strong>Agent:</strong> ${ticket.assignedAgent?.name || 'Support Team'}</p>
            <p>To continue this conversation, simply reply to this email.</p>
          </div>
        </div>
      `,
      headers: {
        'References': `ticket-${ticket.id}@executasolutions.com`,
        'In-Reply-To': `ticket-${ticket.id}@executasolutions.com`
      }
    };

    // Implement actual email sending based on available service
    if (process.env.SENDGRID_API_KEY) {
      await sendWithSendGrid(emailData);
      await sendWithAWSSES(emailData);
    } else if (process.env.SMTP_HOST) {
      await sendWithSMTP(emailData);
    } else {
      // Fallback: log the email for development
      console.log('📧 Email would be sent (no email service configured):', emailData);
      return;
    }

    // Log successful email send
    console.log(`✅ Email sent to customer ${ticket.session.customerEmail} for ticket ${ticket.id}`);
    
  } catch (error) {
    console.error('❌ Failed to send email to customer:', error);
    // Don't throw error to prevent breaking the main flow
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

// Generate initial support email when ticket is created
export async function generateSupportEmail(ticket: any): Promise<void> {
  try {
    const emailContent = `
New support request from ${ticket.session.customerName || 'Customer'}

Ticket ID: ${ticket.id}
Priority: ${ticket.priority}
Assistant: ${ticket.assistant.name}

Customer Information:
- Name: ${ticket.session.customerName || 'Not provided'}
- Email: ${ticket.session.customerEmail || 'Not provided'}
- Phone: ${ticket.session.customerPhone || 'Not provided'}

Original Query:
${ticket.customerQuery || 'No specific query provided'}

Context:
${ticket.context || 'No additional context'}

--
To respond to this ticket, simply reply to this email.
Your response will be automatically added to the ticket and sent to the customer.

View ticket in Executa: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard/tickets/${ticket.id}
    `.trim();

    const emailData = {
      to: process.env.SUPPORT_EMAIL_ADDRESS,
              from: 'info@executasolutions.com',
      subject: `[${ticket.id}] ${ticket.reason.replace('_', ' ')} - ${ticket.priority} Priority`,
      text: emailContent,
      headers: {
                  'Message-ID': `ticket-${ticket.id}@executasolutions.com`,
          'References': `ticket-${ticket.id}@executasolutions.com`
      }
    };

    // TODO: Implement actual email sending
    console.log('Would send support email:', emailData);
    
  } catch (error) {
    console.error('Failed to send support email:', error);
  }
} 