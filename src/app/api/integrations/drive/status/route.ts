import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

const STORAGE_FILE = path.join(process.cwd(), '.drive-integrations.json');

function loadIntegrations() {
  if (fs.existsSync(STORAGE_FILE)) {
    return new Map(JSON.parse(fs.readFileSync(STORAGE_FILE, 'utf-8')));
  }
  return new Map();
}

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const integrations = loadIntegrations();
    const integration = integrations.get(user.id);
    if (!integration || integration.status !== 'connected') {
      return NextResponse.json({ connected: false });
    }
    return NextResponse.json({ connected: true, email: integration.email });
  } catch (error) {
    console.error('Google Drive status error:', error);
    return NextResponse.json({ error: 'Failed to check Google Drive status' }, { status: 500 });
  }
} 