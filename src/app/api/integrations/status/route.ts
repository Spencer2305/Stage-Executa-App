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
      googledrive: false,
      slack: false,
    };

    // Check Dropbox connection
    console.log('🔍 Checking Dropbox connection for accountId:', userAccount.account.id);
    
    const dropboxConnection = await db.dropboxConnection.findFirst({
      where: {
        accountId: userAccount.account.id,
        isActive: true
      }
    });

    console.log('📊 Dropbox connection result:', dropboxConnection ? 'FOUND' : 'NOT FOUND');

    if (dropboxConnection) {
      integrations.dropbox = true;
    }

    // Check Google Drive connection
    console.log('🔍 Checking Google Drive connection for accountId:', userAccount.account.id);
    
    // Note: This will cause a TypeScript error until Prisma migration is run
    const googleDriveConnection = await db.googleDriveConnection.findFirst({
      where: {
        accountId: userAccount.account.id,
        isActive: true
      }
    });

    console.log('📊 Google Drive connection result:', googleDriveConnection ? 'FOUND' : 'NOT FOUND');

    if (googleDriveConnection) {
      integrations.googledrive = true;
    }

    // Check Slack connection
    console.log('🔍 Checking Slack connection for accountId:', userAccount.account.id);
    
    const slackConnection = await db.slackConnection.findFirst({
      where: {
        accountId: userAccount.account.id,
        isActive: true
      }
    });

    console.log('📊 Slack connection result:', slackConnection ? 'FOUND' : 'NOT FOUND');

    if (slackConnection) {
      integrations.slack = true;
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