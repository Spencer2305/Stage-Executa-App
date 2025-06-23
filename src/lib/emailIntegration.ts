import { google } from 'googleapis';
import { db } from './db';
import { uploadAndProcessFiles } from './fileProcessing';

// Gmail API Setup
const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.labels'
];

const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';
const FREE_TIER_LIMITS = {
  maxEmailsPerAccount: 1000,
  maxDaysBack: 90, // Expanded to 90 days to find more emails
  batchSize: 50 // Increased batch size
};

export interface GmailOAuthCredentials {
  client_id: string;
  client_secret: string;
  redirect_uri: string;
}

export interface EmailMessage {
  id: string;
  threadId: string;
  from: string;
  to: string[];
  subject: string;
  date: Date;
  content: string;
  labels: string[];
  attachments?: {
    filename: string;
    data: Buffer;
    mimeType: string;
  }[];
}

export class GmailIntegrationService {
  private oauth2Client: any;
  
  constructor(credentials: GmailOAuthCredentials) {
    this.oauth2Client = new google.auth.OAuth2(
      credentials.client_id,
      credentials.client_secret,
      credentials.redirect_uri
    );
  }

  /**
   * Generate OAuth URL for user authorization
   */
  generateAuthUrl(): string {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: GMAIL_SCOPES,
      prompt: 'consent'
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokens(code: string) {
    const { tokens } = await this.oauth2Client.getToken(code);
    return tokens;
  }

  /**
   * Set credentials for API calls
   */
  setCredentials(tokens: any) {
    this.oauth2Client.setCredentials(tokens);
  }

  /**
   * Get Gmail service instance
   */
  getGmailService() {
    return google.gmail({ version: 'v1', auth: this.oauth2Client });
  }

  /**
   * Get all messages from Gmail account (with free tier limits)
   */
  async getAllMessages(
    pageToken?: string,
    maxResults = FREE_TIER_LIMITS.batchSize
  ): Promise<{ messages: any[]; nextPageToken?: string }> {
    const gmail = this.getGmailService();
    
    // Calculate date 30 days ago for free tier
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - FREE_TIER_LIMITS.maxDaysBack);
    const dateFilter = `after:${thirtyDaysAgo.getFullYear()}/${thirtyDaysAgo.getMonth() + 1}/${thirtyDaysAgo.getDate()}`;
    
    try {
      const response = await gmail.users.messages.list({
        userId: 'me',
        maxResults,
        pageToken,
        q: `${dateFilter} -in:chat -in:draft -in:spam -in:trash` // Only recent emails
      });

      return {
        messages: response.data.messages || [],
        nextPageToken: response.data.nextPageToken
      };
    } catch (error) {
      console.error('Error fetching Gmail messages:', error);
      throw error;
    }
  }

  /**
   * Get detailed message content
   */
  async getMessageDetails(messageId: string): Promise<EmailMessage | null> {
    const gmail = this.getGmailService();
    
    try {
      const response = await gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full'
      });

      const message = response.data;
      if (!message.payload) return null;

      // Extract headers
      const headers = message.payload.headers || [];
      const getHeader = (name: string) => 
        headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

      // Extract message content
      const content = this.extractMessageContent(message.payload);
      
      // Parse recipients
      const toHeader = getHeader('to');
      const to = toHeader ? toHeader.split(',').map((email: string) => email.trim()) : [];

      return {
        id: message.id!,
        threadId: message.threadId!,
        from: getHeader('from'),
        to,
        subject: getHeader('subject'),
        date: new Date(parseInt(message.internalDate!) || Date.now()),
        content,
        labels: message.labelIds || []
      };
    } catch (error) {
      console.error(`Error fetching message ${messageId}:`, error);
      return null;
    }
  }

  /**
   * Extract text content from message payload
   */
  private extractMessageContent(payload: any): string {
    let content = '';

    if (payload.body?.data) {
      // Simple message body
      content = Buffer.from(payload.body.data, 'base64').toString('utf-8');
    } else if (payload.parts) {
      // Multipart message
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' || part.mimeType === 'text/html') {
          if (part.body?.data) {
            const partContent = Buffer.from(part.body.data, 'base64').toString('utf-8');
            content += partContent + '\n';
          }
        } else if (part.parts) {
          // Nested parts
          content += this.extractMessageContent(part) + '\n';
        }
      }
    }

    // Clean up HTML tags if present
    content = content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    
    return content;
  }

  /**
   * Free tier email sync with local storage option
   */
  async syncEmails(accountId: string, emailIntegrationId: string): Promise<void> {
    console.log(`🔄 Starting FREE TIER email sync for account ${accountId}`);

    // Update sync status
    await db.emailIntegration.update({
      where: { id: emailIntegrationId },
      data: { 
        syncStatus: 'SYNCING',
        syncError: null 
      }
    });

    try {
      let processedCount = 0;
      let pageToken: string | undefined;
      const maxEmails = FREE_TIER_LIMITS.maxEmailsPerAccount;

      do {
        // Get batch of messages
        const { messages, nextPageToken } = await this.getAllMessages(pageToken);
        pageToken = nextPageToken;

        if (messages.length === 0 || processedCount >= maxEmails) break;

        console.log(`📧 Processing batch of ${messages.length} emails (${processedCount}/${maxEmails} total)`);

        // Process each message
        for (const message of messages) {
          if (processedCount >= maxEmails) break;

          try {
            // Check if message already processed
            const existingFile = await db.knowledgeFile.findFirst({
              where: {
                accountId,
                emailIntegrationId,
                emailMessageId: message.id
              }
            });

            if (existingFile) {
              console.log(`⏭️ Message ${message.id} already processed, skipping`);
              continue;
            }

            // Get message details
            const messageDetails = await this.getMessageDetails(message.id);
            if (!messageDetails || !messageDetails.content.trim()) {
              continue;
            }

            // Convert email to file format for processing
            const emailBuffer = Buffer.from(
              `From: ${messageDetails.from}\n` +
              `To: ${messageDetails.to.join(', ')}\n` +
              `Subject: ${messageDetails.subject}\n` +
              `Date: ${messageDetails.date.toISOString()}\n\n` +
              messageDetails.content,
              'utf-8'
            );

            if (IS_DEVELOPMENT) {
              // FREE VERSION: Store in database directly, skip S3
              await this.processEmailDirectly(
                accountId,
                emailIntegrationId,
                messageDetails,
                emailBuffer
              );
            } else {
              // Use existing file processing pipeline
              const result = await uploadAndProcessFiles(
                accountId,
                [{
                  buffer: emailBuffer,
                  fileName: `${messageDetails.subject || 'No Subject'} - ${messageDetails.date.toISOString().split('T')[0]}.txt`,
                  mimeType: 'text/plain'
                }]
              );

              if (result.success && result.results.length > 0) {
                const fileResult = result.results[0];
                
                // Update the created file with email metadata
                await db.knowledgeFile.update({
                  where: { id: fileResult.fileId },
                  data: {
                    emailIntegrationId,
                    emailMessageId: messageDetails.id,
                    emailThreadId: messageDetails.threadId,
                    emailFrom: messageDetails.from,
                    emailTo: JSON.stringify(messageDetails.to),
                    emailSubject: messageDetails.subject,
                    emailDate: messageDetails.date,
                    emailLabels: JSON.stringify(messageDetails.labels),
                    fileType: 'gmail'
                  }
                });
              }
            }

            processedCount++;
            console.log(`✅ Processed email: ${messageDetails.subject}`);

            // Rate limiting - be nice to Gmail API
            await new Promise(resolve => setTimeout(resolve, 200)); // Slower for free tier

          } catch (messageError) {
            console.error(`❌ Error processing message ${message.id}:`, messageError);
            // Continue with next message
          }
        }

        // Update progress
        await db.emailIntegration.update({
          where: { id: emailIntegrationId },
          data: { 
            processedEmails: { increment: Math.min(messages.length, maxEmails - (processedCount - messages.length)) },
            lastSyncAt: new Date()
          }
        });

        console.log(`📊 Processed ${processedCount} emails so far`);

      } while (pageToken && processedCount < maxEmails);

      // Mark sync as completed
      await db.emailIntegration.update({
        where: { id: emailIntegrationId },
        data: { 
          syncStatus: 'COMPLETED',
          lastSyncAt: new Date()
        }
      });

      console.log(`🎉 FREE TIER email sync completed! Processed ${processedCount} emails total`);

    } catch (error) {
      console.error('❌ Error during email sync:', error);
      
      // Mark sync as failed
      await db.emailIntegration.update({
        where: { id: emailIntegrationId },
        data: { 
          syncStatus: 'ERROR',
          syncError: String(error)
        }
      });

      throw error;
    }
  }

  /**
   * Process email directly without S3 (for free tier)
   */
  private async processEmailDirectly(
    accountId: string,
    emailIntegrationId: string,
    messageDetails: EmailMessage,
    emailBuffer: Buffer
  ) {
    // Create knowledge file record directly
    await db.knowledgeFile.create({
      data: {
        accountId,
        emailIntegrationId,
        originalName: `${messageDetails.subject || 'No Subject'} - ${messageDetails.date.toISOString().split('T')[0]}.txt`,
        s3Key: `local://email-${messageDetails.id}`, // Local reference
        s3Bucket: `dev-${accountId}`,
        fileType: 'gmail',
        fileSize: BigInt(emailBuffer.length),
        mimeType: 'text/plain',
        checksum: require('crypto').createHash('md5').update(emailBuffer).digest('hex'),
        status: 'PROCESSED',
        extractedText: emailBuffer.toString('utf-8'),
        textLength: emailBuffer.length,
        emailMessageId: messageDetails.id,
        emailThreadId: messageDetails.threadId,
        emailFrom: messageDetails.from,
        emailTo: JSON.stringify(messageDetails.to),
        emailSubject: messageDetails.subject,
        emailDate: messageDetails.date,
        emailLabels: JSON.stringify(messageDetails.labels),
        processingStartedAt: new Date(),
        processingCompletedAt: new Date()
      }
    });
  }
}

/**
 * Create or update Gmail integration for an account
 */
export async function createGmailIntegration(
  accountId: string,
  email: string,
  refreshToken: string,
  accessToken?: string
) {
  return await db.emailIntegration.upsert({
    where: {
      accountId_email_provider: {
        accountId,
        email,
        provider: 'GMAIL'
      }
    },
    update: {
      refreshToken,
      accessToken,
      tokenExpiresAt: accessToken ? new Date(Date.now() + 3600 * 1000) : null, // 1 hour
      isActive: true,
      syncError: null
    },
    create: {
      accountId,
      provider: 'GMAIL',
      email,
      refreshToken,
      accessToken,
      tokenExpiresAt: accessToken ? new Date(Date.now() + 3600 * 1000) : null,
      syncStatus: 'IDLE'
    }
  });
}

/**
 * Get Gmail credentials from environment
 */
export function getGmailCredentials(): GmailOAuthCredentials {
  return {
    redirect_uri: process.env.GMAIL_REDIRECT_URL || 'http://localhost:3000/api/integrations/gmail/callback'
  };
} 