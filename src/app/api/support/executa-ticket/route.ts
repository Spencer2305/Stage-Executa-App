import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      subject,
      category,
      priority,
      description,
      userEmail,
      userName
    } = body;

    // Validate required fields
    if (!subject || !description || !userEmail || !userName || !category) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Generate ticket ID
    const ticketId = `EXEC-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    // Prepare email content for Executa support
    const supportEmailContent = formatSupportEmail({
      ticketId,
      userName,
      userEmail,
      subject,
      category,
      priority,
      description,
      user
    });

    // Send email to Executa support team
    await sendEmailToExecutaSupport(supportEmailContent);

    // Send confirmation email to user
    await sendConfirmationEmailToUser({
      userEmail,
      userName,
      ticketId,
      subject
    });

    return NextResponse.json({
      success: true,
      ticketId,
      message: 'Support ticket submitted successfully'
    });

  } catch (error) {
    console.error('Error submitting Executa support ticket:', error);
    return NextResponse.json(
      { error: 'Failed to submit support ticket' },
      { status: 500 }
    );
  }
}

function formatSupportEmail(data: {
  ticketId: string;
  userName: string;
  userEmail: string;
  subject: string;
  category: string;
  priority: string;
  description: string;
  user: any;
}) {
  const priorityEmoji: Record<string, string> = {
    'LOW': '🟢',
    'NORMAL': '🟡',
    'HIGH': '🟠',
    'URGENT': '🔴'
  };

  const categoryLabels: Record<string, string> = {
    'technical': 'Technical Issue',
    'billing': 'Billing & Plans',
    'feature-request': 'Feature Request',
    'account': 'Account Management',
    'integration': 'Integration Help',
    'general': 'General Question',
    'bug-report': 'Bug Report'
  };

  return {
    subject: `[${data.ticketId}] ${priorityEmoji[data.priority] || '⚪'} ${data.subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">New Support Ticket</h1>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">Ticket ID: ${data.ticketId}</p>
        </div>
        
        <div style="background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; border-top: none;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
            <div>
              <h3 style="margin: 0 0 8px 0; color: #374151; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Customer Information</h3>
              <p style="margin: 0; color: #6b7280;"><strong>Name:</strong> ${data.userName}</p>
              <p style="margin: 0; color: #6b7280;"><strong>Email:</strong> ${data.userEmail}</p>
              <p style="margin: 0; color: #6b7280;"><strong>Account ID:</strong> ${data.user.account?.id || 'N/A'}</p>
              <p style="margin: 0; color: #6b7280;"><strong>User ID:</strong> ${data.user.id}</p>
            </div>
            <div>
              <h3 style="margin: 0 0 8px 0; color: #374151; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Ticket Details</h3>
                             <p style="margin: 0; color: #6b7280;"><strong>Category:</strong> ${categoryLabels[data.category] || data.category}</p>
               <p style="margin: 0; color: #6b7280;"><strong>Priority:</strong> ${priorityEmoji[data.priority] || '⚪'} ${data.priority}</p>
              <p style="margin: 0; color: #6b7280;"><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
            </div>
          </div>
          
          <div style="margin-bottom: 20px;">
            <h3 style="margin: 0 0 8px 0; color: #374151; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Subject</h3>
            <p style="margin: 0; color: #111827; font-size: 16px; font-weight: 500;">${data.subject}</p>
          </div>
          
          <div>
            <h3 style="margin: 0 0 8px 0; color: #374151; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Description</h3>
            <div style="background: white; padding: 16px; border-radius: 6px; border: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #111827; line-height: 1.6; white-space: pre-wrap;">${data.description}</p>
            </div>
          </div>
        </div>
        
        <div style="background: #1f2937; color: white; padding: 16px; border-radius: 0 0 8px 8px; text-align: center;">
          <p style="margin: 0; font-size: 12px; opacity: 0.8;">
            This ticket was automatically generated from the Executa platform.
            Please respond directly to this email to assist the customer.
          </p>
        </div>
      </div>
    `,
    text: `
New Support Ticket: ${data.ticketId}

Customer Information:
- Name: ${data.userName}
- Email: ${data.userEmail}
- Account ID: ${data.user.account?.id || 'N/A'}
- User ID: ${data.user.id}

 Ticket Details:
 - Category: ${categoryLabels[data.category] || data.category}
 - Priority: ${data.priority}
- Submitted: ${new Date().toLocaleString()}

Subject: ${data.subject}

Description:
${data.description}

---
This ticket was automatically generated from the Executa platform.
Please respond directly to this email to assist the customer.
    `
  };
}

async function sendEmailToExecutaSupport(emailContent: { subject: string; html: string; text: string }) {
  try {
    // In a real implementation, you would use your email service (SendGrid, SES, etc.)
    // For now, we'll use a placeholder implementation
    
    const EXECUTA_SUPPORT_EMAIL = process.env.EXECUTA_SUPPORT_EMAIL || 'support@executa.ai';
    
    // If you're using SendGrid:
    if (process.env.SENDGRID_API_KEY) {
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      
      await sgMail.send({
        to: EXECUTA_SUPPORT_EMAIL,
        from: process.env.FROM_EMAIL || 'noreply@executa.ai',
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text
      });
    }
    // If you're using AWS SES:
    else if (process.env.AWS_SES_REGION) {
      const AWS = require('aws-sdk');
      const ses = new AWS.SES({ region: process.env.AWS_SES_REGION });
      
      await ses.sendEmail({
        Source: process.env.FROM_EMAIL || 'noreply@executa.ai',
        Destination: {
          ToAddresses: [EXECUTA_SUPPORT_EMAIL]
        },
        Message: {
          Subject: {
            Data: emailContent.subject
          },
          Body: {
            Html: {
              Data: emailContent.html
            },
            Text: {
              Data: emailContent.text
            }
          }
        }
      }).promise();
    }
    // Fallback: Log to console (for development)
    else {
      console.log('=== EXECUTA SUPPORT TICKET ===');
      console.log('To:', EXECUTA_SUPPORT_EMAIL);
      console.log('Subject:', emailContent.subject);
      console.log('Content:', emailContent.text);
      console.log('================================');
    }
    
  } catch (error) {
    console.error('Failed to send email to Executa support:', error);
    throw error;
  }
}

async function sendConfirmationEmailToUser(data: {
  userEmail: string;
  userName: string;
  ticketId: string;
  subject: string;
}) {
  try {
    const confirmationContent = {
      subject: `Ticket Received: ${data.subject} [${data.ticketId}]`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="margin: 0; font-size: 24px;">Support Ticket Received</h1>
            <p style="margin: 5px 0 0 0; opacity: 0.9;">We've got your message!</p>
          </div>
          
          <div style="background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; border-top: none;">
            <p style="margin: 0 0 16px 0; color: #111827;">Hi ${data.userName},</p>
            
            <p style="margin: 0 0 16px 0; color: #374151;">
              Thank you for contacting Executa support. We've received your support ticket and our team will review it shortly.
            </p>
            
            <div style="background: white; padding: 16px; border-radius: 6px; border: 1px solid #e2e8f0; margin: 16px 0;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;"><strong>Ticket ID:</strong> ${data.ticketId}</p>
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;"><strong>Subject:</strong> ${data.subject}</p>
              <p style="margin: 0; color: #6b7280; font-size: 14px;"><strong>Submitted:</strong> ${new Date().toLocaleString()}</p>
            </div>
            
            <p style="margin: 0 0 16px 0; color: #374151;">
              Our typical response time is within 24 hours for normal priority tickets. If you marked your ticket as urgent, we'll aim to respond within 4 hours.
            </p>
            
            <p style="margin: 0; color: #374151;">
              If you need to add additional information to your ticket, simply reply to this email.
            </p>
          </div>
          
          <div style="background: #1f2937; color: white; padding: 16px; border-radius: 0 0 8px 8px; text-align: center;">
            <p style="margin: 0; font-size: 12px; opacity: 0.8;">
              This is an automated confirmation. Please do not reply unless you need to add information to your ticket.
            </p>
          </div>
        </div>
      `,
      text: `
Hi ${data.userName},

Thank you for contacting Executa support. We've received your support ticket and our team will review it shortly.

Ticket Details:
- Ticket ID: ${data.ticketId}
- Subject: ${data.subject}
- Submitted: ${new Date().toLocaleString()}

Our typical response time is within 24 hours for normal priority tickets. If you marked your ticket as urgent, we'll aim to respond within 4 hours.

If you need to add additional information to your ticket, simply reply to this email.

Best regards,
The Executa Support Team
      `
    };

    // Send confirmation email using the same email service
    if (process.env.SENDGRID_API_KEY) {
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      
      await sgMail.send({
        to: data.userEmail,
        from: process.env.FROM_EMAIL || 'support@executa.ai',
        subject: confirmationContent.subject,
        html: confirmationContent.html,
        text: confirmationContent.text
      });
    } else if (process.env.AWS_SES_REGION) {
      const AWS = require('aws-sdk');
      const ses = new AWS.SES({ region: process.env.AWS_SES_REGION });
      
      await ses.sendEmail({
        Source: process.env.FROM_EMAIL || 'support@executa.ai',
        Destination: {
          ToAddresses: [data.userEmail]
        },
        Message: {
          Subject: {
            Data: confirmationContent.subject
          },
          Body: {
            Html: {
              Data: confirmationContent.html
            },
            Text: {
              Data: confirmationContent.text
            }
          }
        }
      }).promise();
    } else {
      console.log('=== USER CONFIRMATION EMAIL ===');
      console.log('To:', data.userEmail);
      console.log('Subject:', confirmationContent.subject);
      console.log('Content:', confirmationContent.text);
      console.log('==================================');
    }
    
  } catch (error) {
    console.error('Failed to send confirmation email to user:', error);
    // Don't throw here - ticket was still submitted successfully
  }
} 