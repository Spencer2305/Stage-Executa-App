import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { listDropboxFiles, downloadDropboxFile } from '@/lib/dropbox';
import { extractTextFromFile } from '@/lib/fileProcessing';
import { authenticateRequest } from '@/lib/auth';

// Helper function to get MIME type from file extension
function getMimeTypeFromExtension(extension: string): string {
  const mimeTypes: Record<string, string> = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'txt': 'text/plain',
    'md': 'text/markdown',
    'json': 'application/json',
    'csv': 'text/csv'
  };
  return mimeTypes[extension.toLowerCase()] || 'text/plain';
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const assistantId = params.id;
    const { integration } = await request.json();

    console.log(`🔄 Starting sync from ${integration} for assistant ${assistantId}`);
    
    // Write to log file for debugging
    const fs = require('fs');
    fs.appendFileSync('/tmp/dropbox-sync.log', `${new Date().toISOString()} - MANUAL SYNC: Starting sync from ${integration} for assistant ${assistantId}\n`);

    // Get user's account  
    const userAccount = await db.user.findUnique({
      where: { id: user.id },
      include: { account: true }
    });

    if (!userAccount?.account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Verify the assistant belongs to this user
    const assistant = await db.assistant.findFirst({
      where: {
        id: assistantId,
        accountId: userAccount.account.id
      }
    });

    if (!assistant) {
      return NextResponse.json({ error: 'Assistant not found' }, { status: 404 });
    }

    if (integration === 'dropbox') {
      // Check if user has a Dropbox connection using raw query as fallback
      let dropboxConnection;
      try {
        dropboxConnection = await db.dropboxConnection.findFirst({
          where: {
            accountId: userAccount.account.id,
            isActive: true
          }
        });
      } catch (dbError) {
        console.log('❌ Prisma model issue, using raw query:', dbError);
        const rawResult = await db.$queryRaw`
          SELECT * FROM dropbox_connections 
          WHERE account_id = ${userAccount.account.id} AND is_active = true 
          LIMIT 1
        `;
        dropboxConnection = Array.isArray(rawResult) && rawResult.length > 0 ? rawResult[0] : null;
      }

      if (!dropboxConnection) {
        console.log('❌ No Dropbox connection found');
        fs.appendFileSync('/tmp/dropbox-sync.log', `${new Date().toISOString()} - MANUAL SYNC: No Dropbox connection found\n`);
        return NextResponse.json({ 
          error: 'No Dropbox connection found. Please connect your Dropbox account first.' 
        }, { status: 400 });
      }

      console.log('✅ Dropbox connection found');
      fs.appendFileSync('/tmp/dropbox-sync.log', `${new Date().toISOString()} - MANUAL SYNC: Dropbox connection found, token length: ${dropboxConnection.accessToken?.length || 0}\n`);

      // List all files from Dropbox
      console.log('📁 Fetching file list from Dropbox...');
      console.log('🔑 Using access token length:', dropboxConnection.accessToken?.length || 0);
      
      let dropboxFiles;
      try {
        const result = await listDropboxFiles(dropboxConnection.accessToken);
        dropboxFiles = result.files;
        console.log('✅ Dropbox API call successful');
      } catch (dropboxError) {
        console.error('❌ Dropbox API error:', dropboxError);
        return NextResponse.json({ 
          error: 'Failed to fetch files from Dropbox',
          details: dropboxError instanceof Error ? dropboxError.message : 'Unknown Dropbox error'
        }, { status: 500 });
      }
      
      if (!dropboxFiles || dropboxFiles.length === 0) {
        console.log('⚠️ No files found in Dropbox');
        fs.appendFileSync('/tmp/dropbox-sync.log', `${new Date().toISOString()} - MANUAL SYNC: No files found in Dropbox\n`);
        return NextResponse.json({ 
          files: [], 
          syncedFiles: 0,
          message: 'No files found in Dropbox'
        });
      }

      console.log(`📋 Found ${dropboxFiles.length} files in Dropbox`);
      fs.appendFileSync('/tmp/dropbox-sync.log', `${new Date().toISOString()} - MANUAL SYNC: Found ${dropboxFiles.length} files in Dropbox\n`);

      let syncedFiles = 0;
      const newDocuments = [];

      // Download and process each file
      for (const dropboxFile of dropboxFiles) {
        try {
          console.log(`⬇️ Downloading file: ${dropboxFile.name}`);
          
          // Check if file already exists
          const existingFile = await db.knowledgeFile.findFirst({
            where: {
              accountId: user.account.id,
              originalName: dropboxFile.name,
              status: { not: 'DELETED' }
            }
          });

          if (existingFile) {
            console.log(`⏭️ File ${dropboxFile.name} already exists, skipping...`);
            fs.appendFileSync('/tmp/dropbox-sync.log', `${new Date().toISOString()} - MANUAL SYNC: File ${dropboxFile.name} already exists, skipping\n`);
            continue;
          }

          // Download file from Dropbox
          const fileBuffer = await downloadDropboxFile(dropboxConnection.accessToken, dropboxFile.path_lower);
          
          // Process the file
          const fileExtension = dropboxFile.name.split('.').pop() || 'txt';
          const mimeType = getMimeTypeFromExtension(fileExtension);
          
          const { text: extractedText, pageCount } = await extractTextFromFile(
            fileBuffer,
            dropboxFile.name,
            mimeType
          );

          // Create document in database
          const document = await db.knowledgeFile.create({
            data: {
              originalName: dropboxFile.name,
              fileType: fileExtension,
              fileSize: BigInt(dropboxFile.size),
              mimeType: mimeType,
              accountId: user.account.id,
              status: 'PROCESSED',
              extractedText: extractedText,
              textLength: extractedText.length,
              pageCount: pageCount,
              s3Key: `dropbox-sync/${dropboxFile.id}/${dropboxFile.name}`,
              s3Bucket: 'executa-temp-bucket',
              processingCompletedAt: new Date()
            }
          });

          // Associate with the assistant
          await db.assistantFile.create({
            data: {
              assistantId: assistantId,
              fileId: document.id
            }
          });

          newDocuments.push(document);
          syncedFiles++;
          
          console.log(`✅ Successfully processed file: ${dropboxFile.name}`);
          fs.appendFileSync('/tmp/dropbox-sync.log', `${new Date().toISOString()} - MANUAL SYNC: Successfully processed file: ${dropboxFile.name}\n`);
          
        } catch (fileError) {
          console.error(`❌ Error processing file ${dropboxFile.name}:`, fileError);
          fs.appendFileSync('/tmp/dropbox-sync.log', `${new Date().toISOString()} - MANUAL SYNC: Error processing file ${dropboxFile.name}: ${fileError}\n`);
          // Continue with other files even if one fails
        }
      }

      // Get updated files list for this assistant
      const updatedFiles = await db.knowledgeFile.findMany({
        where: {
          assistantFiles: {
            some: {
              assistantId: assistantId
            }
          }
        },
        include: {
          assistantFiles: true
        }
      });

      console.log(`✅ Sync completed. ${syncedFiles} new files added from Dropbox`);
      fs.appendFileSync('/tmp/dropbox-sync.log', `${new Date().toISOString()} - MANUAL SYNC: Sync completed. ${syncedFiles} new files added from Dropbox\n`);

      return NextResponse.json({
        files: updatedFiles,
        syncedFiles,
        message: syncedFiles > 0 ? `Successfully synced ${syncedFiles} files` : 'No new files to sync'
      });
    }

    return NextResponse.json({ error: 'Unsupported integration' }, { status: 400 });

  } catch (error) {
    console.error('❌ Error in sync endpoint:', error);
    const fs = require('fs');
    fs.appendFileSync('/tmp/dropbox-sync.log', `${new Date().toISOString()} - MANUAL SYNC: ERROR: ${error instanceof Error ? error.message : error}\n`);
    fs.appendFileSync('/tmp/dropbox-sync.log', `${new Date().toISOString()} - MANUAL SYNC: ERROR STACK: ${error instanceof Error ? error.stack : 'No stack trace'}\n`);
    return NextResponse.json({ 
      error: 'Failed to sync files',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 