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
function saveIntegrations(map: Map<string, any>) {
  fs.writeFileSync(STORAGE_FILE, JSON.stringify(Array.from(map.entries()), null, 2));
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const integrations = loadIntegrations();
    integrations.delete(user.id);
    saveIntegrations(integrations);
    return NextResponse.json({ success: true, message: 'Google Drive disconnected' });
  } catch (error) {
    console.error('Google Drive disconnect error:', error);
    return NextResponse.json({ error: 'Failed to disconnect Google Drive' }, { status: 500 });
  }
} 