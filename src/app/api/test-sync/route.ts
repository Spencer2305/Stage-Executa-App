import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { listDropboxFiles } from '@/lib/dropbox';
import { authenticateRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 Testing sync authentication and dropbox connection...');
    
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized', step: 'auth' }, { status: 401 });
    }

    console.log('✅ User authenticated:', user.email);

    // Check if user has a Dropbox connection
    const dropboxConnection = await db.dropboxConnection.findFirst({
      where: {
        accountId: user.account.id,
        isActive: true
      }
    });

    if (!dropboxConnection) {
      return NextResponse.json({ 
        error: 'No Dropbox connection found',
        step: 'dropbox_connection',
        accountId: user.account.id
      }, { status: 400 });
    }

    console.log('✅ Dropbox connection found:', dropboxConnection.id);

    // Test listing files
    try {
      const { files } = await listDropboxFiles(dropboxConnection.accessToken);
      console.log(`✅ Found ${files.length} files in Dropbox`);
      
      return NextResponse.json({
        success: true,
        user: user.email,
        accountId: user.account.id,
        dropboxConnectionId: dropboxConnection.id,
        filesCount: files.length,
        sampleFiles: files.slice(0, 3).map(f => ({
          name: f.name,
          size: f.size,
          path: f.path_lower
        }))
      });
    } catch (dropboxError) {
      console.error('❌ Dropbox files error:', dropboxError);
      return NextResponse.json({
        error: 'Failed to list Dropbox files',
        step: 'dropbox_files',
        details: dropboxError instanceof Error ? dropboxError.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Test sync error:', error);
    return NextResponse.json({ 
      error: 'Test failed',
      step: 'general',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 