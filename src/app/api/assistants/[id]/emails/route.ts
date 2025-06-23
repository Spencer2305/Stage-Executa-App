import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: assistantId } = await params;

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

    console.log(`🔍 Fetching emails for assistant ${assistantId} and account ${user.account.id}`);
    
    // Get all email files associated with this assistant
    const emailFiles = await db.knowledgeFile.findMany({
      where: {
        accountId: user.account.id,
        fileType: 'email', // Updated to match new schema
        assistantFiles: {
          some: {
            assistantId: assistantId
          }
        }
      },
      select: {
        id: true,
        originalName: true,
        extractedText: true,
        textLength: true,
        fileSize: true,
        status: true,
        createdAt: true,
        s3Key: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📧 Found ${emailFiles.length} email files in database`);
    emailFiles.forEach(email => {
      console.log(`  - ${email.originalName} (${email.status})`);
    });

    // Parse email metadata from extractedText
    const formattedEmails = emailFiles.map(email => {
      let emailFrom = 'Unknown Sender';
      let emailSubject = 'No Subject';
      let emailDate = email.createdAt;
      let emailTo: string[] = [];
      let emailLabels: string[] = [];
      let actualContent = email.extractedText || '';

      // Try to parse EMAIL METADATA from extractedText
      const text = email.extractedText || '';
      const metadataIndex = text.indexOf('EMAIL METADATA:');
      const contentIndex = text.indexOf('EMAIL CONTENT:');
      
      if (metadataIndex !== -1 && contentIndex !== -1) {
        try {
          // Extract the JSON part between EMAIL METADATA: and EMAIL CONTENT:
          const metadataStart = metadataIndex + 'EMAIL METADATA:'.length;
          const metadataText = text.substring(metadataStart, contentIndex).trim();
          const metadata = JSON.parse(metadataText);
          
          emailFrom = metadata.from || emailFrom;
          emailSubject = metadata.subject || emailSubject;
          emailTo = metadata.to || [];
          emailLabels = metadata.labels || [];
          if (metadata.date) {
            emailDate = new Date(metadata.date);
          }
          
          // Extract just the content part (after EMAIL CONTENT:)
          actualContent = text.substring(contentIndex + 'EMAIL CONTENT:'.length).trim();
        } catch (e) {
          console.log('Failed to parse email metadata:', e);
        }
      }
      
      return {
        id: email.id,
        originalName: email.originalName,
        emailFrom: emailFrom,
        emailTo: emailTo,
        emailSubject: emailSubject,
        emailDate: emailDate,
        emailLabels: emailLabels,
        extractedText: actualContent,
        textLength: email.textLength || 0,
        fileSize: Number(email.fileSize || 0),
        status: email.status,
        createdAt: email.createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      emails: formattedEmails,
      count: formattedEmails.length
    });

  } catch (error) {
    console.error('Error fetching emails:', error);
    return NextResponse.json(
      { error: 'Failed to fetch emails' },
      { status: 500 }
    );
  }
} 