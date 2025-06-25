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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: assistantId } = await params;
    const { integration } = await request.json();

    console.log(`🔄 Starting simple sync from ${integration} for assistant ${assistantId}`);

    // Write to log file for debugging
    const fs = require('fs');
    fs.appendFileSync('/tmp/dropbox-sync.log', `${new Date().toISOString()} - SIMPLE SYNC: Starting sync from ${integration} for assistant ${assistantId}\n`);

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
      // Check if user has a Dropbox connection using raw query
      console.log('🔍 Checking for Dropbox connection...');
      const dropboxConnectionsRaw = await db.$queryRaw`
        SELECT * FROM dropbox_connections 
        WHERE account_id = ${userAccount.account.id} AND is_active = true 
        LIMIT 1
      ` as any[];

      if (!dropboxConnectionsRaw || dropboxConnectionsRaw.length === 0) {
        console.log('❌ No Dropbox connections found');
        fs.appendFileSync('/tmp/dropbox-sync.log', `${new Date().toISOString()} - SIMPLE SYNC: No Dropbox connections found\n`);
        return NextResponse.json({ 
          error: 'No Dropbox connection found. Please connect your Dropbox account first.' 
        }, { status: 400 });
      }

      const dropboxConnection = dropboxConnectionsRaw[0];
      console.log('✅ Dropbox connection found:', dropboxConnection.id);
      fs.appendFileSync('/tmp/dropbox-sync.log', `${new Date().toISOString()} - SIMPLE SYNC: Dropbox connection found, token length: ${dropboxConnection.access_token?.length || 0}\n`);

      // List all files from Dropbox
      console.log('📁 Fetching file list from Dropbox...');
      fs.appendFileSync('/tmp/dropbox-sync.log', `${new Date().toISOString()} - SIMPLE SYNC: About to call listDropboxFiles\n`);
      
      let dropboxFiles;
      try {
        const result = await listDropboxFiles(dropboxConnection.access_token);
        dropboxFiles = result.files;
        console.log('✅ listDropboxFiles successful');
        fs.appendFileSync('/tmp/dropbox-sync.log', `${new Date().toISOString()} - SIMPLE SYNC: listDropboxFiles successful, found ${dropboxFiles.length} files\n`);
      } catch (listError: any) {
        console.error('❌ listDropboxFiles failed:', listError);
        fs.appendFileSync('/tmp/dropbox-sync.log', `${new Date().toISOString()} - SIMPLE SYNC: listDropboxFiles failed: ${listError.message || listError}\n`);
        throw listError;
      }
      
      if (!dropboxFiles || dropboxFiles.length === 0) {
        console.log('⚠️ No files found in Dropbox');
        fs.appendFileSync('/tmp/dropbox-sync.log', `${new Date().toISOString()} - SIMPLE SYNC: No files found in Dropbox\n`);
        return NextResponse.json({ 
          files: [], 
          syncedFiles: 0,
          message: 'No files found in Dropbox'
        });
      }

      console.log(`📋 Found ${dropboxFiles.length} files in Dropbox`);

      let syncedFiles = 0;
      const newDocuments = [];

      // Download and process each file (limit to 5 for testing)
      const filesToProcess = dropboxFiles.slice(0, 5);
      
      for (const dropboxFile of filesToProcess) {
        try {
          console.log(`⬇️ Downloading file: ${dropboxFile.name}`);
          
          // Check if file already exists in the knowledge base
          const existingFilesRaw = await db.$queryRaw`
            SELECT * FROM knowledge_files 
            WHERE account_id = ${userAccount.account.id} 
            AND original_name = ${dropboxFile.name}
            AND status != 'DELETED'
            LIMIT 1
          ` as any[];

          let fileId;
          
          if (existingFilesRaw && existingFilesRaw.length > 0) {
            // File exists in knowledge base, check if it's already associated with this assistant
            const existingFile = existingFilesRaw[0];
            fileId = existingFile.id;
            
            const existingAssociation = await db.$queryRaw`
              SELECT * FROM assistant_files 
              WHERE assistant_id = ${assistantId} AND file_id = ${fileId}
              LIMIT 1
            ` as any[];
            
            if (existingAssociation && existingAssociation.length > 0) {
              console.log(`⏭️ File ${dropboxFile.name} already associated with this assistant, skipping...`);
              fs.appendFileSync('/tmp/dropbox-sync.log', `${new Date().toISOString()} - SIMPLE SYNC: File ${dropboxFile.name} already associated with this assistant, skipping\n`);
              continue;
            } else {
              // File exists but not associated with this assistant - just create the association
              console.log(`🔗 File ${dropboxFile.name} exists, associating with assistant...`);
              fs.appendFileSync('/tmp/dropbox-sync.log', `${new Date().toISOString()} - SIMPLE SYNC: File ${dropboxFile.name} exists, associating with assistant\n`);
              
              await db.$queryRaw`
                INSERT INTO assistant_files (assistant_id, file_id, added_at)
                VALUES (${assistantId}, ${fileId}, NOW())
              `;
              
              syncedFiles++;
              console.log(`✅ Successfully associated existing file: ${dropboxFile.name}`);
              fs.appendFileSync('/tmp/dropbox-sync.log', `${new Date().toISOString()} - SIMPLE SYNC: Successfully associated existing file: ${dropboxFile.name}\n`);
              continue;
            }
          }

          // Download file from Dropbox
          const fileBuffer = await downloadDropboxFile(dropboxConnection.access_token, dropboxFile.path_lower);
          
          // Process the file
          const fileExtension = dropboxFile.name.split('.').pop() || 'txt';
          const mimeType = getMimeTypeFromExtension(fileExtension);
          
          const { text: extractedText, pageCount } = await extractTextFromFile(
            fileBuffer,
            dropboxFile.name,
            mimeType
          );

          // File doesn't exist, create new document
          fileId = `kf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const s3Key = `dropbox-sync/${dropboxFile.id}/${dropboxFile.name}`;
          const s3Bucket = 'executa-temp-bucket';
          
          await db.$queryRaw`
            INSERT INTO knowledge_files (
              id, account_id, original_name, file_type, file_size, mime_type,
              status, extracted_text, text_length, page_count, s3_key, s3_bucket,
              processing_completed_at, created_at, updated_at
            ) VALUES (
              ${fileId}, ${userAccount.account.id}, ${dropboxFile.name}, 
              ${fileExtension}, ${dropboxFile.size}, ${mimeType},
              'PROCESSED', ${extractedText}, ${extractedText.length}, ${pageCount || 1},
              ${s3Key}, ${s3Bucket}, NOW(), NOW(), NOW()
            )
          `;

          // Associate with the assistant using raw query
          await db.$queryRaw`
            INSERT INTO assistant_files (assistant_id, file_id, added_at)
            VALUES (${assistantId}, ${fileId}, NOW())
          `;

          newDocuments.push({
            id: fileId,
            name: dropboxFile.name,
            size: dropboxFile.size
          });
          syncedFiles++;
          
          console.log(`✅ Successfully processed file: ${dropboxFile.name}`);
          fs.appendFileSync('/tmp/dropbox-sync.log', `${new Date().toISOString()} - SIMPLE SYNC: Successfully processed file: ${dropboxFile.name}\n`);
          
        } catch (fileError) {
          console.error(`❌ Error processing file ${dropboxFile.name}:`, fileError);
          fs.appendFileSync('/tmp/dropbox-sync.log', `${new Date().toISOString()} - SIMPLE SYNC: Error processing file ${dropboxFile.name}: ${fileError}\n`);
          // Continue with other files even if one fails
        }
      }

      // Get updated files list for this assistant using raw query
      const updatedFilesRaw = await db.$queryRaw`
        SELECT kf.* FROM knowledge_files kf
        JOIN assistant_files af ON kf.id = af.file_id
        WHERE af.assistant_id = ${assistantId}
        ORDER BY kf.created_at DESC
      ` as any[];

      console.log(`✅ Simple sync completed. ${syncedFiles} new files added from Dropbox`);
      fs.appendFileSync('/tmp/dropbox-sync.log', `${new Date().toISOString()} - SIMPLE SYNC: Sync completed. ${syncedFiles} new files added from Dropbox\n`);

      // Convert BigInt values and map database fields to ModelDocument format
      const filesForResponse = updatedFilesRaw.map((file: any) => ({
        id: file.id,
        name: file.original_name,
        type: file.file_type || 'txt',
        size: file.file_size ? Number(file.file_size) : 0,
        uploadedAt: file.created_at || file.processing_completed_at,
        status: file.status?.toLowerCase() === 'processed' ? 'completed' : file.status?.toLowerCase() || 'completed',
        content: file.extracted_text
      }));

      return NextResponse.json({
        files: filesForResponse,
        syncedFiles,
        totalFiles: filesForResponse.length,
        message: syncedFiles > 0 ? `Successfully synced ${syncedFiles} files` : 'No new files to sync'
      });
    }

    return NextResponse.json({ error: 'Unsupported integration' }, { status: 400 });

  } catch (error) {
    console.error('❌ Error in simple sync endpoint:', error);
    const fs = require('fs');
    fs.appendFileSync('/tmp/dropbox-sync.log', `${new Date().toISOString()} - SIMPLE SYNC: ERROR: ${error instanceof Error ? error.message : error}\n`);
    fs.appendFileSync('/tmp/dropbox-sync.log', `${new Date().toISOString()} - SIMPLE SYNC: ERROR STACK: ${error instanceof Error ? error.stack : 'No stack trace'}\n`);
    return NextResponse.json({ 
      error: 'Failed to sync files',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 