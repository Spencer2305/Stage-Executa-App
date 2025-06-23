// Simple email sync using IMAP - works with any email provider
// This is a free alternative that doesn't require OAuth setup

interface EmailCredentials {
  email: string;
  password: string; // App password for Gmail, regular password for others
  host: string;     // imap.gmail.com, outlook.office365.com, etc.
  port: number;     // 993 for most providers
}

interface SimpleEmail {
  id: string;
  from: string;
  subject: string;
  date: Date;
  content: string;
}

export class SimpleEmailSync {
  
  /**
   * Extract emails using IMAP (works with Gmail app passwords)
   * This is completely free and doesn't need OAuth
   */
  async extractRecentEmails(credentials: EmailCredentials): Promise<SimpleEmail[]> {
    // For now, return mock data structure
    // In real implementation, you'd use 'imap' package
    console.log('📧 Would connect to:', credentials.host);
    
    // Mock recent emails structure
    return [
      {
        id: 'mock-1',
        from: 'example@gmail.com',
        subject: 'Sample Email 1',
        date: new Date(),
        content: 'This is sample email content for testing...'
      }
    ];
  }

  /**
   * Convert emails to knowledge base entries (free tier)
   */
  async processEmailsToKnowledge(
    accountId: string, 
    emails: SimpleEmail[]
  ): Promise<void> {
    console.log(`🔄 Processing ${emails.length} emails for account ${accountId}`);
    
    for (const email of emails) {
      // Create a simple text representation
      const emailText = `
From: ${email.from}
Subject: ${email.subject}
Date: ${email.date.toISOString()}

${email.content}
      `.trim();

      // In free version, just store in database without S3
      // You can implement this with your existing KnowledgeFile model
      console.log(`✅ Would process: ${email.subject}`);
    }
  }
}

/**
 * FREE TIER: Manual email upload
 * User can copy-paste important emails instead of full sync
 */
export class ManualEmailProcessor {
  
  static async processEmailText(
    accountId: string,
    emailText: string,
    fileName: string = 'Manual Email'
  ) {
    // Parse email headers and content
    const lines = emailText.split('\n');
    let from = '';
    let subject = '';
    let content = '';
    let inContent = false;

    for (const line of lines) {
      if (line.startsWith('From:')) {
        from = line.replace('From:', '').trim();
      } else if (line.startsWith('Subject:')) {
        subject = line.replace('Subject:', '').trim();
      } else if (line.trim() === '' && !inContent) {
        inContent = true;
      } else if (inContent) {
        content += line + '\n';
      }
    }

    // Create buffer for processing
    const emailBuffer = Buffer.from(emailText, 'utf-8');
    
    console.log(`📧 Processing manual email: ${subject || fileName}`);
    
    // Here you would integrate with your existing file processing
    // For now, just log what would happen
    return {
      success: true,
      from,
      subject,
      contentLength: content.length,
      fileName: `${subject || fileName}.txt`
    };
  }
}

/**
 * Get email provider settings for common providers
 */
export function getEmailProviderConfig(email: string): Partial<EmailCredentials> {
  const domain = email.split('@')[1]?.toLowerCase();
  
  const configs: Record<string, Partial<EmailCredentials>> = {
    'gmail.com': {
      host: 'imap.gmail.com',
      port: 993
    },
    'outlook.com': {
      host: 'outlook.office365.com', 
      port: 993
    },
    'hotmail.com': {
      host: 'outlook.office365.com',
      port: 993
    },
    'yahoo.com': {
      host: 'imap.mail.yahoo.com',
      port: 993
    }
  };

  return configs[domain] || {
    host: 'Unknown - needs manual configuration',
    port: 993
  };
} 