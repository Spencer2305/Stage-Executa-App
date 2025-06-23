import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { GmailIntegrationService } from '@/lib/emailIntegration';
import fs from 'fs';
import path from 'path';

const STORAGE_FILE = path.join(process.cwd(), '.gmail-integrations.json');

interface GmailIntegration {
  userId: string;
  email: string;
  accessToken?: string;
  refreshToken?: string;
  connectedAt: string;
  status: 'connected' | 'disconnected' | 'error';
  totalEmails?: number;
  lastSync?: string;
}

const loadIntegrations = (): Map<string, GmailIntegration> => {
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const data = fs.readFileSync(STORAGE_FILE, 'utf8');
      const parsed = JSON.parse(data);
      return new Map(Object.entries(parsed));
    }
  } catch (error) {
    console.error('Error loading Gmail integrations:', error);
  }
  return new Map();
};

const saveIntegrations = (integrations: Map<string, GmailIntegration>) => {
  try {
    const data = Object.fromEntries(integrations);
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving Gmail integrations:', error);
  }
};

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { assistantId } = await request.json();
    
    if (!assistantId) {
      return NextResponse.json({ error: 'Assistant ID is required' }, { status: 400 });
    }

    // Verify the assistant belongs to the user's account
    const assistant = await db.assistant.findFirst({
      where: {
        id: assistantId,
        accountId: user.account.id
      }
    });

    if (!assistant) {
      return NextResponse.json({ error: 'Assistant not found' }, { status: 404 });
    }

    // Load Gmail integrations from file
    const integrations = loadIntegrations();
    const gmailIntegration = integrations.get(user.id);

    if (!gmailIntegration || gmailIntegration.status !== 'connected') {
      return NextResponse.json(
        { error: 'Gmail not connected. Please connect Gmail first.' },
        { status: 400 }
      );
    }

    console.log(`🔄 Starting Gmail sync for account ${user.account.id} using email ${gmailIntegration.email}`);

    // Initialize Gmail service with credentials
    const gmailCredentials = {
      client_id: process.env.GMAIL_CLIENT_ID!,
      client_secret: process.env.GMAIL_CLIENT_SECRET!,
      redirect_uri: process.env.GMAIL_REDIRECT_URI!
    };

    if (!gmailCredentials.client_id || !gmailCredentials.client_secret) {
      return NextResponse.json(
        { error: 'Gmail integration not properly configured. Missing Google OAuth credentials.' },
        { status: 500 }
      );
    }
    
    const gmailService = new GmailIntegrationService(gmailCredentials);
    
    // Set up OAuth credentials
    gmailService.setCredentials({
      access_token: gmailIntegration.accessToken,
      refresh_token: gmailIntegration.refreshToken
    });

    try {
      // Get recent emails from Gmail API
      const { messages } = await gmailService.getAllMessages(undefined, 20);
      console.log(`📧 Found ${messages.length} recent emails to process`);

      let processedCount = 0;
      const maxEmails = 20; // Limit for testing

      for (const message of messages.slice(0, maxEmails)) {
        try {
          // Check if email already exists (using s3Key pattern for Gmail emails)
          const s3KeyPattern = `gmail/${gmailIntegration.email}/${message.id}`;
          const existingFile = await db.knowledgeFile.findFirst({
            where: {
              accountId: user.account.id,
              s3Key: s3KeyPattern
            }
          });

          if (existingFile) {
            console.log(`⏭️ Email ${message.id} already processed, skipping`);
            continue;
          }

          // Get message details
          const messageDetails = await gmailService.getMessageDetails(message.id);
          if (!messageDetails || !messageDetails.content.trim()) {
            console.log(`⏭️ Skipping email ${message.id} - no content`);
            continue;
          }

          // Filter out promotional emails
          const isPromotional = isPromotionalEmail(messageDetails);
          if (isPromotional) {
            console.log(`📧 Skipping promotional email: ${messageDetails.subject}`);
            continue;
          }

          // Clean email content
          const cleanedContent = cleanEmailContent(messageDetails.content);
          
          // Create email metadata text (since we don't have dedicated email fields)
          const emailMetadata = {
            messageId: messageDetails.id,
            from: messageDetails.from,
            to: messageDetails.to,
            subject: messageDetails.subject,
            date: messageDetails.date,
            labels: messageDetails.labels
          };

          const emailText = `EMAIL METADATA: ${JSON.stringify(emailMetadata, null, 2)}

EMAIL CONTENT:
${cleanedContent}`;

                    // Create knowledge file for email
          const emailFile = await db.knowledgeFile.create({
            data: {
              accountId: user.account.id,
              originalName: `Gmail: ${messageDetails.subject || 'No Subject'}`,
              s3Key: s3KeyPattern,
              s3Bucket: `executa-${user.account.accountId}`,
              fileType: 'email',
              fileSize: BigInt(emailText.length),
              mimeType: 'text/plain',
              checksum: require('crypto').createHash('md5').update(emailText).digest('hex'),
              status: 'PROCESSED',
              extractedText: emailText,
              textLength: emailText.length,
              processingStartedAt: new Date(),
              processingCompletedAt: new Date()
            }
          });

          // Link email to the assistant
          await db.assistantFile.create({
            data: {
              assistantId: assistantId,
              fileId: emailFile.id
            }
          });

          processedCount++;
          console.log(`✅ Processed email: ${messageDetails.subject}`);

          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));

        } catch (messageError) {
          console.error(`❌ Error processing message ${message.id}:`, messageError);
          continue;
        }
      }

      // Update integration status
      gmailIntegration.totalEmails = (gmailIntegration.totalEmails || 0) + processedCount;
      gmailIntegration.lastSync = new Date().toISOString();
      integrations.set(user.id, gmailIntegration);
      saveIntegrations(integrations);

      console.log(`🎉 Gmail sync completed! Processed ${processedCount} new emails`);

      return NextResponse.json({
        success: true,
        message: `Synced ${processedCount} emails from ${gmailIntegration.email}`,
        emailCount: processedCount,
        status: 'completed'
      });

    } catch (gmailError) {
      console.error('❌ Gmail API error:', gmailError);
      return NextResponse.json(
        { error: 'Failed to access Gmail. Please reconnect your Gmail account.' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Gmail sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync Gmail emails' },
      { status: 500 }
    );
  }
}

function isPromotionalEmail(messageDetails: any): boolean {
  const promotionalKeywords = [
    'newsletter', 'unsubscribe', 'promotional', 'marketing', 'deals', 
    'offer', 'sale', 'discount', 'coupon', 'spam', 'advertisement',
    'notification', 'alert', 'update', 'news', 'digest'
  ];

  const promotionalSenders = [
    'noreply@', 'no-reply@', 'donotreply@', 'marketing@', 'newsletter@',
    'notifications@', 'updates@', 'news@'
  ];

  const subject = messageDetails.subject?.toLowerCase() || '';
  const from = messageDetails.from?.toLowerCase() || '';
  const content = messageDetails.content?.toLowerCase() || '';

  // Check subject and content for promotional keywords
  const hasPromotionalContent = promotionalKeywords.some(keyword => 
    subject.includes(keyword) || content.includes(keyword)
  );

  // Check sender patterns
  const hasPromotionalSender = promotionalSenders.some(pattern => 
    from.includes(pattern)
  );

  return hasPromotionalContent || hasPromotionalSender;
}

function cleanEmailContent(content: string): string {
  if (!content) return '';

  // Remove HTML tags
  let cleaned = content.replace(/<[^>]*>/g, ' ');
  
  // Remove CSS and style blocks
  cleaned = cleaned.replace(/<style[^>]*>.*?<\/style>/gi, '');
  cleaned = cleaned.replace(/<script[^>]*>.*?<\/script>/gi, '');
  
  // Remove URLs
  cleaned = cleaned.replace(/https?:\/\/[^\s]+/g, '[URL]');
  
  // Remove excessive whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  // Remove common promotional text patterns
  const promotionalPatterns = [
    /unsubscribe/gi,
    /click here/gi,
    /view in browser/gi,
    /privacy policy/gi,
    /terms of service/gi
  ];
  
  promotionalPatterns.forEach(pattern => {
    cleaned = cleaned.replace(pattern, '');
  });
  
  // Truncate if too long
  if (cleaned.length > 2000) {
    cleaned = cleaned.substring(0, 2000) + '...';
  }
  
  return cleaned;
} 