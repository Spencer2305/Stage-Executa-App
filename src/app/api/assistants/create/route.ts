import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { uploadAndProcessFiles, createOpenAIVectorStore, uploadFilesToOpenAI, addFilesToVectorStore, extractTextFromFile } from '@/lib/fileProcessing';
import { listDropboxFiles, downloadDropboxFile } from '@/lib/dropbox';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';

const openai = new OpenAI({
});

export async function POST(request: NextRequest) {
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

    // Parse request data
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const instructions = formData.get('instructions') as string || 'You are a helpful AI assistant. Answer questions based on the provided knowledge base.';
    const files = formData.getAll('files') as File[];
    const useDropboxSync = formData.get('useDropboxSync') === 'true';

    // Debug logging
    console.log(`📋 Form data received:`, {
      name,
      description,
      filesCount: files.length,
      useDropboxSync,
      useDropboxSyncRaw: formData.get('useDropboxSync')
    });
    
    // Write to debug log
    const fs = require('fs');
    fs.appendFileSync('/tmp/dropbox-sync.log', `${new Date().toISOString()} - Form data: name=${name}, files=${files.length}, useDropboxSync=${useDropboxSync}, raw=${formData.get('useDropboxSync')}\n`);

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Assistant name is required' }, { status: 400 });
    }

    // Allow creation without files if using Dropbox sync
    if (!useDropboxSync && (!files || files.length === 0)) {
      return NextResponse.json({ error: 'At least one knowledge file is required when not using Dropbox sync' }, { status: 400 });
    }

    // Step 1: Upload and process files (if any)
    let fileProcessingResult = null;
    let successfulFiles: Array<{fileId: string; success: boolean}> = [];

    if (files && files.length > 0) {
      console.log(`📁 Processing ${files.length} files for assistant: ${name}`);
      
      const filesToProcess = await Promise.all(
        files.map(async (file) => {
          const buffer = Buffer.from(await file.arrayBuffer());
          return {
            buffer,
            fileName: file.name,
            mimeType: file.type || 'application/octet-stream'
          };
        })
      );

      fileProcessingResult = await uploadAndProcessFiles(
        userAccount.account.id, // Use internal database ID for foreign key relationships
        filesToProcess
      );

      if (fileProcessingResult.status === 'ERROR' || fileProcessingResult.processedFiles === 0) {
        return NextResponse.json({ 
          error: 'Failed to process files', 
          details: `Processed ${fileProcessingResult.processedFiles}/${fileProcessingResult.totalFiles} files successfully` 
        }, { status: 500 });
      }

      successfulFiles = fileProcessingResult.results.filter(r => r.success);
    } else {
      console.log(`📁 Creating assistant without initial files (Dropbox sync enabled)`);
    }

    // Step 2: Create assistant in database
    console.log(`🤖 Creating assistant: ${name}`);
    
    const assistant = await db.assistant.create({
      data: {
        accountId: userAccount.account.id,
        name: name.trim(),
        description: description?.trim() || null,
        instructions,
        status: 'DRAFT',
        model: 'gpt-4-turbo',
        isPublic: false,
        totalSessions: 0,
        totalMessages: 0
      }
    });

    // Step 3: Link files to assistant
    if (successfulFiles.length > 0) {
      console.log(`🔗 Linking ${successfulFiles.length} files to assistant`);
      await db.assistantFile.createMany({
        data: successfulFiles.map(result => ({
          assistantId: assistant.id,
          fileId: result.fileId
        }))
      });
    } else {
      console.log(`🔗 No files to link to assistant (will sync later via Dropbox)`);
    }

    // Step 4: Create OpenAI vector store
    console.log(`📚 Creating OpenAI vector store for assistant`);
    
    try {
      const vectorStoreId = await createOpenAIVectorStore(
        userAccount.account.accountId,
        assistant.id,
        name
      );

      // Step 5: Upload files to OpenAI
      console.log(`⬆️ Uploading files to OpenAI`);
      
      const openaiFileUploads = await uploadFilesToOpenAI(
        successfulFiles.map(r => r.fileId)
      );

      // Step 6: Add files to vector store
      if (openaiFileUploads.length > 0) {
        await addFilesToVectorStore(
          vectorStoreId,
          openaiFileUploads.map(upload => upload.openaiFileId)
        );
      }

      // Step 7: Create OpenAI assistant (temporarily disabled due to SDK issues)
      console.log(`🧠 Creating OpenAI assistant`);
      
      const mockOpenAIAssistantId = `asst_mock_${uuidv4()}`;
      console.log(`Mock OpenAI assistant created: ${mockOpenAIAssistantId}`);

      /*
      const openaiAssistant = await openai.beta.assistants.create({
        name: `${name} (${userAccount.account.accountId})`,
        description: description || `AI assistant for ${name}`,
        instructions,
        model: 'gpt-4-turbo',
        tools: [{ type: 'file_search' }],
        tool_resources: {
          file_search: {
            vector_store_ids: [vectorStoreId]
          }
        },
        metadata: {
          accountId: userAccount.account.accountId,
          assistantId: assistant.id,
          project: 'ExecutaApp'
        }
      });
      */

      // Step 8: Update assistant with OpenAI IDs
      await db.assistant.update({
        where: { id: assistant.id },
        data: {
          openaiAssistantId: mockOpenAIAssistantId, // openaiAssistant.id when fixed
          vectorStoreId,
          status: 'ACTIVE',
          lastTrained: new Date(),
          apiKey: `exec_${uuidv4().replace(/-/g, '')}`,
          embedUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/embed/${assistant.id}`
        }
      });

      console.log(`✅ Assistant created successfully: ${assistant.id}`);

      // If using Dropbox sync, automatically sync files after creation
      if (useDropboxSync) {
        console.log(`🔄 Auto-syncing Dropbox files for assistant: ${assistant.id}`);
        
        // Write to a log file for debugging
        const fs = require('fs');
        fs.appendFileSync('/tmp/dropbox-sync.log', `${new Date().toISOString()} - Starting auto-sync for assistant: ${assistant.id}\n`);
        
        try {
          // Use the imported sync functionality
          console.log(`🔍 Checking for Dropbox connection for account: ${userAccount.account.id}`);
          fs.appendFileSync('/tmp/dropbox-sync.log', `${new Date().toISOString()} - Checking for account: ${userAccount.account.id}\n`);

          // Check if user has a Dropbox connection
          const dropboxConnectionsRaw = await db.$queryRaw`
            SELECT * FROM dropbox_connections 
            WHERE account_id = ${userAccount.account.id} AND is_active = true 
            LIMIT 1
          ` as any[];

          console.log(`🔎 Found ${dropboxConnectionsRaw.length} active Dropbox connections`);
          fs.appendFileSync('/tmp/dropbox-sync.log', `${new Date().toISOString()} - Found ${dropboxConnectionsRaw.length} connections\n`);

          if (dropboxConnectionsRaw && dropboxConnectionsRaw.length > 0) {
            const dropboxConnection = dropboxConnectionsRaw[0];
            console.log('✅ Dropbox connection found, syncing files...');
            fs.appendFileSync('/tmp/dropbox-sync.log', `${new Date().toISOString()} - Dropbox connection found, starting file sync\n`);

            // List and sync files from Dropbox
            console.log('📁 Calling listDropboxFiles...');
            fs.appendFileSync('/tmp/dropbox-sync.log', `${new Date().toISOString()} - About to call listDropboxFiles with token length: ${dropboxConnection.access_token?.length || 0}\n`);
            
            let dropboxFiles;
            try {
              const result = await listDropboxFiles(dropboxConnection.access_token);
              dropboxFiles = result.files;
              console.log('✅ listDropboxFiles successful');
              fs.appendFileSync('/tmp/dropbox-sync.log', `${new Date().toISOString()} - listDropboxFiles successful, found ${dropboxFiles.length} files\n`);
            } catch (listError: any) {
              console.error('❌ listDropboxFiles failed:', listError);
              fs.appendFileSync('/tmp/dropbox-sync.log', `${new Date().toISOString()} - listDropboxFiles failed: ${listError.message || listError}\n`);
              throw listError;
            }
            
            if (dropboxFiles && dropboxFiles.length > 0) {
              console.log(`📋 Found ${dropboxFiles.length} files in Dropbox, processing first 5...`);
              
              let syncedCount = 0;
              const filesToProcess = dropboxFiles.slice(0, 5);
              
              for (const dropboxFile of filesToProcess) {
                try {
                  // Check if file already exists in knowledge base
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
                      WHERE assistant_id = ${assistant.id} AND file_id = ${fileId}
                      LIMIT 1
                    ` as any[];
                    
                    if (existingAssociation && existingAssociation.length > 0) {
                      console.log(`⏭️ File ${dropboxFile.name} already associated with this assistant, skipping...`);
                      continue;
                    } else {
                      // File exists but not associated with this assistant - just create the association
                      console.log(`🔗 File ${dropboxFile.name} exists, associating with assistant...`);
                      
                      await db.$queryRaw`
                        INSERT INTO assistant_files (assistant_id, file_id, added_at)
                        VALUES (${assistant.id}, ${fileId}, NOW())
                      `;
                      
                      syncedCount++;
                      console.log(`✅ Successfully associated existing file: ${dropboxFile.name}`);
                      continue;
                    }
                  }

                  // Download and process file
                  const fileBuffer = await downloadDropboxFile(dropboxConnection.access_token, dropboxFile.path_lower);
                  const fileExtension = dropboxFile.name.split('.').pop() || 'txt';
                  const mimeType = dropboxFile.name.endsWith('.pdf') ? 'application/pdf' : 
                                 dropboxFile.name.endsWith('.docx') ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
                                 'text/plain';
                  
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

                  // Associate with the assistant
                  await db.$queryRaw`
                    INSERT INTO assistant_files (assistant_id, file_id, added_at)
                    VALUES (${assistant.id}, ${fileId}, NOW())
                  `;

                  syncedCount++;
                  console.log(`✅ Auto-synced file: ${dropboxFile.name}`);
                  
                } catch (fileError) {
                  console.error(`❌ Error auto-syncing file ${dropboxFile.name}:`, fileError);
                }
              }
              
              console.log(`🎉 Auto-sync completed: ${syncedCount} files synced from Dropbox`);
            } else {
              console.log(`📁 No files found in Dropbox to sync`);
            }
          } else {
            console.log(`⚠️ No active Dropbox connection found for auto-sync`);
          }
        } catch (syncError: any) {
          console.error('❌ Error during auto-sync:', syncError);
          fs.appendFileSync('/tmp/dropbox-sync.log', `${new Date().toISOString()} - SYNC ERROR: ${syncError.message || syncError}\n`);
          fs.appendFileSync('/tmp/dropbox-sync.log', `${new Date().toISOString()} - SYNC ERROR STACK: ${syncError.stack || 'No stack trace'}\n`);
          // Don't fail the assistant creation if sync fails
        }
      }

    } catch (openaiError) {
      console.error('OpenAI integration error:', openaiError);
      
      // Update assistant status to error but don't fail the request
      await db.assistant.update({
        where: { id: assistant.id },
        data: {
          status: 'ERROR',
          apiKey: `exec_${uuidv4().replace(/-/g, '')}`,
          embedUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/embed/${assistant.id}`
        }
      });
    }

    // Step 9: Fetch complete assistant data
    const completeAssistant = await db.assistant.findUnique({
      where: { id: assistant.id }
    });

    // Get all files associated with this assistant using raw query to include auto-synced files
    const assistantFilesRaw = await db.$queryRaw`
      SELECT kf.* FROM knowledge_files kf
      JOIN assistant_files af ON kf.id = af.file_id
      WHERE af.assistant_id = ${assistant.id}
      ORDER BY kf.created_at DESC
    ` as any[];

    // Transform response
    const responseData = {
      id: completeAssistant!.id,
      name: completeAssistant!.name,
      description: completeAssistant!.description,
      status: completeAssistant!.status,
      model: completeAssistant!.model,
      apiKey: completeAssistant!.apiKey,
      embedUrl: completeAssistant!.embedUrl,
      isPublic: completeAssistant!.isPublic,
      totalSessions: completeAssistant!.totalSessions,
      totalMessages: completeAssistant!.totalMessages,
      createdAt: completeAssistant!.createdAt,
      updatedAt: completeAssistant!.updatedAt,
      lastTrained: completeAssistant!.lastTrained,
      documents: assistantFilesRaw.map((file: any) => ({
        id: file.id,
        name: file.original_name,
        type: file.file_type || 'txt',
        size: file.file_size ? Number(file.file_size) : 0,
        status: file.status?.toLowerCase() === 'processed' ? 'completed' : file.status?.toLowerCase() || 'completed',
        uploadedAt: file.created_at || file.processing_completed_at
      })),
      owner: {
        id: user.id,
        email: user.email
      },
      // Debug info for Dropbox sync
      ...(useDropboxSync && {
        dropboxSync: {
          attempted: true,
          filesFound: assistantFilesRaw.length,
          syncedFromDropbox: assistantFilesRaw.filter((f: any) => f.s3_key?.includes('dropbox-sync')).length
        }
      })
    };

    return NextResponse.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Assistant creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create assistant', details: String(error) },
      { status: 500 }
    );
  }
} 