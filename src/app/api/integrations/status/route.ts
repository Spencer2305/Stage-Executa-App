import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's account
    const userAccount = await db.user.findUnique({
      where: { id: user.id },
      include: { account: true }
    });

    if (!userAccount?.account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Check for active integrations
    const integrations = {
      dropbox: false,
      // Add other integrations here as you build them
    };

    // Check Dropbox connection
    console.log('🔍 Checking Dropbox connection for accountId:', userAccount.account.id);
    
    const dropboxConnection = await db.dropboxConnection.findFirst({
      where: {
        accountId: userAccount.account.id, // Use internal database ID
        isActive: true
      }
    });

    console.log('📊 Dropbox connection result:', dropboxConnection ? 'FOUND' : 'NOT FOUND');

    if (dropboxConnection) {
      integrations.dropbox = true;
    }

    return NextResponse.json({
      success: true,
      integrations
    });

  } catch (error) {
    console.error('Integration status error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch integration status' },
      { status: 500 }
    );
  }
} 