import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { listGoogleDriveFiles, downloadGoogleDriveFile, refreshAccessToken } from '@/lib/googledrive';
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

    // Check for Google Drive connection
    // Note: This will cause a TypeScript error until Prisma migration is run
    const googleDriveConnection = await db.googleDriveConnection.findFirst({
      where: {
        accountId: user.account.id,
        isActive: true
      }
    });

    if (!googleDriveConnection) {
      return NextResponse.json({ error: 'No active Google Drive connection found' }, { status: 404 });
    }

    console.log('🔄 Starting Google Drive sync for assistant:', assistantId);

    // Refresh access token if needed
    let accessToken = googleDriveConnection.accessToken;
    if (googleDriveConnection.expiresAt && googleDriveConnection.expiresAt < new Date()) {
      console.log('🔄 Refreshing expired Google Drive token...');
      try {
        const refreshResult = await refreshAccessToken(googleDriveConnection.refreshToken!);
        accessToken = refreshResult.accessToken;
        
        // Update the connection with new token
        await db.googleDriveConnection.update({
          where: { id: googleDriveConnection.id },
          data: {
            accessToken: refreshResult.accessToken,
            expiresAt: new Date(Date.now() + refreshResult.expiresIn * 1000),
            updatedAt: new Date(),
          }
        });
        console.log('✅ Token refreshed successfully');
      } catch (error) {
        console.error('❌ Failed to refresh token:', error);
        return NextResponse.json({ error: 'Failed to refresh Google Drive token' }, { status: 401 });
      }
    }

    // List files from Google Drive
    console.log('📂 Listing files from Google Drive...');
    let googleDriveFiles = await listGoogleDriveFiles(accessToken, {
      includeExtensions: ['pdf', 'doc', 'docx', 'txt', 'md', 'json', 'csv', 'xlsx', 'xls', 'ppt', 'pptx', 'rtf', 'odt', 'ods', 'odp'],
      maxFileSize: 50 * 1024 * 1024, // 50MB limit
    });

    console.log(`📋 Found ${googleDriveFiles.files.length} files in Google Drive`);
    
    // Log the first few files found for debugging
    if (googleDriveFiles.files.length > 0) {
      console.log('📄 Sample files found:', googleDriveFiles.files.slice(0, 5).map(f => ({
        name: f.name,
        mimeType: f.mimeType,
        size: f.size
      })));
    } else {
      console.log('⚠️ No files found matching the supported extensions. Checking for any files...');
      
      // Try to get all files to see what's available
      const allFiles = await listGoogleDriveFiles(accessToken, {
        maxFileSize: 50 * 1024 * 1024, // 50MB limit
      });
      
      console.log(`📋 Total files in Google Drive: ${allFiles.files.length}`);
      if (allFiles.files.length > 0) {
        console.log('📄 Sample files in Google Drive:', allFiles.files.slice(0, 10).map(f => ({
          name: f.name,
          mimeType: f.mimeType,
          size: f.size
        })));
      }
      // Filter allFiles for supported MIME types
      const supportedMimeTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'text/markdown',
        'application/json',
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/rtf',
        'application/vnd.oasis.opendocument.text',
        'application/vnd.oasis.opendocument.spreadsheet',
        'application/vnd.oasis.opendocument.presentation'
      ];
      const filteredByMimeType = allFiles.files.filter(f => supportedMimeTypes.includes(f.mimeType));
      if (filteredByMimeType.length > 0) {
        console.log('📄 Files found by MIME type:', filteredByMimeType.map(f => ({ name: f.name, mimeType: f.mimeType, size: f.size })));
        googleDriveFiles.files = filteredByMimeType;
      }
    }

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

    // Process files
    const processedFiles: any[] = [];
    const skippedFiles: any[] = [];
    const errorFiles: any[] = [];

    for (const file of googleDriveFiles.files) {
      try {
        console.log(`📄 Processing file: ${file.name}`);

        const fileKey = `${file.name}-${file.size}`;
        const existingFile = existingFileMap.get(fileKey);

        // Skip if file already exists and hasn't been modified
        if (existingFile && new Date(file.modifiedTime) <= existingFile.updatedAt) {
          console.log(`⏭️ Skipping unchanged file: ${file.name}`);
          skippedFiles.push(file);
          continue;
        }

        // Download file content
        console.log(`⬇️ Downloading file: ${file.name}`);
        const fileBuffer = await downloadGoogleDriveFile(accessToken, file.id);
        
        // Generate checksum
        const checksum = generateFileChecksum(fileBuffer);

        // Check for duplicate files by checksum
        const existingFileByChecksum = await db.knowledgeFile.findFirst({
          where: {
            accountId: user.account.id,
            checksum,
            status: { not: 'DELETED' }
          },
          include: {
            assistantFiles: true
          }
        });

        if (existingFileByChecksum) {
          // Check if already associated with this assistant
          const alreadyAssociated = existingFileByChecksum.assistantFiles.some(af => af.assistantId === assistantId);
          if (!alreadyAssociated) {
            await db.assistantFile.create({
              data: {
                assistantId: assistantId,
                fileId: existingFileByChecksum.id
              }
            });
            console.log(`🔗 Associated existing file with assistant: ${file.name}`);
            processedFiles.push({
              googleDriveFile: file,
              knowledgeFile: { id: existingFileByChecksum.id }
            });
          } else {
            console.log(`⏭️ File already associated with this assistant: ${file.name}`);
            skippedFiles.push(file);
          }
          continue;
        }

        // Prepare file for upload
        const fileToUpload = {
          buffer: fileBuffer,
          fileName: file.name,
          mimeType: file.mimeType
        };

        // Upload and process file
        console.log(`📤 Uploading file: ${file.name}`);
        const uploadResult = await uploadAndProcessFiles(
          user.account.id,
          [fileToUpload]
        );

        if (uploadResult.results.length > 0 && uploadResult.results[0].success) {
          const uploadedFile = uploadResult.results[0];
          
          // Associate file with assistant
          await db.assistantFile.create({
            data: {
              assistantId: assistantId,
              fileId: uploadedFile.fileId
            }
          });

          processedFiles.push({
            googleDriveFile: file,
            knowledgeFile: { id: uploadedFile.fileId }
          });
          
          console.log(`✅ Successfully processed: ${file.name}`);
        } else {
          console.log(`❌ Failed to upload: ${file.name}`);
          errorFiles.push(file);
        }

      } catch (error) {
        console.error(`❌ Error processing file ${file.name}:`, error);
        errorFiles.push(file);
      }
    }

    // Update connection last sync time
    await db.googleDriveConnection.update({
      where: { id: googleDriveConnection.id },
      data: {
        lastSyncAt: new Date(),
        updatedAt: new Date(),
      }
    });

    const results = {
      success: true,
      totalFiles: googleDriveFiles.files.length,
      processedFiles: processedFiles.length,
      skippedFiles: skippedFiles.length,
      errorFiles: errorFiles.length,
      syncedFiles: processedFiles.length,
      message: `Google Drive sync completed. Processed ${processedFiles.length} files, skipped ${skippedFiles.length}, errors ${errorFiles.length}`
    };

    console.log('✅ Google Drive sync completed:', results);
    return NextResponse.json(results);

  } catch (error) {
    console.error('Error syncing Google Drive:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 