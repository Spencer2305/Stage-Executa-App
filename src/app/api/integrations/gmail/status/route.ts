import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { db } from '@/lib/db';

// Simple storage for Gmail integrations (in production, this would be in a proper database)
// For now, we'll store it in a JSON file for persistence across restarts
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

const GMAIL_INTEGRATIONS = loadIntegrations();

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const assistantId = searchParams.get('assistantId');

    if (!assistantId) {
      return NextResponse.json({ error: 'Assistant ID is required' }, { status: 400 });
    }

    // Check if assistant belongs to user
    const assistant = await db.assistant.findFirst({
      where: {
        id: assistantId,
        accountId: user.account.id
      }
    });

    if (!assistant) {
      return NextResponse.json({ error: 'Assistant not found' }, { status: 404 });
    }

    // For Gmail, we'll check for any email files associated with the assistant
    // This is a simplified check - in a full implementation, you'd have a proper Gmail integration table
    const emailFiles = await db.knowledgeFile.count({
      where: {
        accountId: user.account.id,
        mimeType: {
          contains: 'message/'
        },
        assistantFiles: {
          some: {
            assistantId: assistantId
          }
        }
      }
    });

    const hasGmailIntegration = emailFiles > 0;

    if (!hasGmailIntegration) {
      return NextResponse.json({ 
        connected: false,
        message: 'No Gmail integration found'
      });
    }

    // Return connection info
    return NextResponse.json({
      connected: true,
      connection: {
        email: user.email, // Simplified - in real implementation, get from integration table
        totalEmails: emailFiles,
        lastSyncAt: new Date(),
        isActive: true
      }
    });

  } catch (error) {
    console.error('Error checking Gmail status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
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

    const { action, email, tokens } = await request.json();

    if (action === 'connect' && email && tokens) {
      // Store the integration
      GMAIL_INTEGRATIONS.set(user.id, {
        userId: user.id,
        email,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        connectedAt: new Date().toISOString(),
        status: 'connected'
      });
      
      // Persist to file
      saveIntegrations(GMAIL_INTEGRATIONS);

      return NextResponse.json({ success: true, message: 'Gmail connected successfully' });
    }

    if (action === 'disconnect') {
      // Remove the integration
      GMAIL_INTEGRATIONS.delete(user.id);
      
      // Persist to file
      saveIntegrations(GMAIL_INTEGRATIONS);
      
      return NextResponse.json({ success: true, message: 'Gmail disconnected successfully' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Gmail integration error:', error);
    return NextResponse.json(
      { error: 'Failed to manage Gmail integration' },
      { status: 500 }
    );
  }
} 