import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';

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

    // Reload integrations from file to ensure we have the latest data
    const freshIntegrations = loadIntegrations();
    
    // Check if user has Gmail integration
    const integration = freshIntegrations.get(user.id);
    
    return NextResponse.json({
      connected: !!integration && integration.status === 'connected',
      email: integration?.email,
      connectedAt: integration?.connectedAt,
      totalEmails: integration?.totalEmails || 0,
      lastSync: integration?.lastSync
    });

  } catch (error) {
    console.error('Gmail status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check Gmail status' },
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