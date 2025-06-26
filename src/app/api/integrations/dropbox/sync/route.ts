import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { listDropboxFiles, downloadDropboxFile, refreshAccessToken } from '@/lib/dropbox';
import { uploadAndProcessFiles, generateFileChecksum } from '@/lib/fileProcessing';

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { assistantId } = body;

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

    // Check for Dropbox connection
    const dropboxConnection = await db.dropboxConnection.findFirst({
      where: {
        accountId: user.account.id,
        isActive: true
      }
    });

    if (!dropboxConnection) {
      return NextResponse.json({ error: 'No active Dropbox connection found' }, { status: 404 });
    }

    console.log('🔄 Starting Dropbox sync for assistant:', assistantId);

    // Refresh access token if needed
    let accessToken = dropboxConnection.accessToken;
    if (dropboxConnection.expiresAt && dropboxConnection.expiresAt < new Date()) {
      console.log('🔄 Refreshing expired Dropbox token...');
      try {
        const refreshResult = await refreshAccessToken(dropboxConnection.refreshToken!);
        accessToken = refreshResult.accessToken;
        
        // Update the connection with new token
        await db.dropboxConnection.update({
          where: { id: dropboxConnection.id },
          data: {
            accessToken: refreshResult.accessToken,
            expiresAt: new Date(Date.now() + refreshResult.expiresIn * 1000),
            updatedAt: new Date(),
          }
        });
        console.log('✅ Token refreshed successfully');
      } catch (error) {
        console.error('❌ Failed to refresh token:', error);
        return NextResponse.json({ error: 'Failed to refresh Dropbox token' }, { status: 401 });
      }
    }

    // List files from Dropbox
    console.log('📂 Listing files from Dropbox...');
    const dropboxFiles = await listDropboxFiles(accessToken, {
      includeExtensions: ['pdf', 'doc', 'docx', 'txt', 'md', 'json', 'csv'],
      maxFileSize: 50 * 1024 * 1024, // 50MB limit
    });

    console.log(`📋 Found ${dropboxFiles.files.length} files in Dropbox`);

    // Get existing files for this assistant to avoid duplicates
    const existingFiles = await db.knowledgeFile.findMany({
      where: {
        accountId: user.account.id,
        assistantFiles: {
          some: {
            assistantId: assistantId
          }
        }
      },
      select: {
        originalName: true,
        fileSize: true,
        checksum: true,
        updatedAt: true
      }
    });

    const existingFileMap = new Map(
      existingFiles.map(f => [`${f.originalName}-${f.fileSize}`, f])
    );

    // Filter out files that haven't changed
    const filesToSync = dropboxFiles.files.filter(file => {
      const key = `${file.name}-${file.size}`;
      const existing = existingFileMap.get(key);
      
      // If file doesn't exist or was modified, include it
      if (!existing) return true;
      
      // Check if modified date is newer
      const fileModified = new Date(file.server_modified);
      const existingModified = existing.updatedAt || new Date(0);
      
      return fileModified > existingModified;
    });

    console.log(`🔄 ${filesToSync.length} files need syncing (${existingFiles.length} already exist)`);

    if (filesToSync.length === 0) {
      // Update last sync time
      await db.dropboxConnection.update({
        where: { id: dropboxConnection.id },
        data: { lastSyncAt: new Date() }
      });

      return NextResponse.json({
        success: true,
        message: 'No new files to sync',
        totalFiles: dropboxFiles.files.length,
        syncedFiles: 0,
        skippedFiles: dropboxFiles.files.length,
        errorFiles: 0
      });
    }

    // Download and process files
    const filesToProcess: Array<{
      buffer: Buffer;
      fileName: string;
      mimeType: string;
    }> = [];

    let downloadErrors = 0;

    for (const file of filesToSync.slice(0, 10)) { // Limit to 10 files per sync
      try {
        console.log(`⬇️ Downloading: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
        const fileBuffer = await downloadDropboxFile(accessToken, file.path_lower);
        
        // Determine MIME type based on file extension
        const extension = file.name.split('.').pop()?.toLowerCase();
        let mimeType = 'application/octet-stream';
        
        switch (extension) {
          case 'pdf':
            mimeType = 'application/pdf';
            break;
          case 'doc':
            mimeType = 'application/msword';
            break;
          case 'docx':
            mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            break;
          case 'txt':
            mimeType = 'text/plain';
            break;
          case 'md':
            mimeType = 'text/markdown';
            break;
          case 'json':
            mimeType = 'application/json';
            break;
          case 'csv':
            mimeType = 'text/csv';
            break;
        }
        
        filesToProcess.push({
          buffer: fileBuffer,
          fileName: file.name,
          mimeType: mimeType,
        });
        
        console.log(`✅ Downloaded: ${file.name}`);
      } catch (error) {
        console.error(`❌ Failed to download ${file.name}:`, error);
        downloadErrors++;
      }
    }

    // Process the downloaded files
    let processedFiles = 0;
    let processingErrors = 0;

    if (filesToProcess.length > 0) {
      console.log(`🔄 Processing ${filesToProcess.length} files...`);
      
      try {
        const processingResult = await uploadAndProcessFiles(
          user.account.id,
          filesToProcess
        );

        processedFiles = processingResult.processedFiles;
        processingErrors = processingResult.errorFiles;

        // Associate processed files with the assistant
        if (processingResult.results.length > 0) {
          const successfulFiles = processingResult.results
            .filter(result => result.success)
            .map(result => result.fileId);

          if (successfulFiles.length > 0) {
            // Create assistant file associations
            await db.assistantFile.createMany({
              data: successfulFiles.map(fileId => ({
                assistantId: assistantId,
                fileId: fileId,
              })),
              skipDuplicates: true,
            });
            console.log(`🔗 Associated ${successfulFiles.length} files with assistant`);
          }
        }
      } catch (error) {
        console.error('❌ Error processing files:', error);
        processingErrors = filesToProcess.length;
      }
    }

    // Update last sync time
    await db.dropboxConnection.update({
      where: { id: dropboxConnection.id },
      data: { 
        lastSyncAt: new Date(),
      }
    });

    const totalFiles = dropboxFiles.files.length;
    const skippedFiles = totalFiles - filesToSync.length;
    const errorFiles = downloadErrors + processingErrors;

    console.log(`✅ Sync completed: ${processedFiles} processed, ${skippedFiles} skipped, ${errorFiles} errors`);

    return NextResponse.json({
      success: true,
      message: `Dropbox sync completed successfully`,
      totalFiles,
      syncedFiles: processedFiles,
      skippedFiles,
      errorFiles
    });

  } catch (error) {
    console.error('Error syncing Dropbox:', error);
    return NextResponse.json(
      { error: 'Internal server error during sync' },
      { status: 500 }
    );
  }
} 