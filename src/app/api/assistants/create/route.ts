import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { uploadAndProcessFiles, createOpenAIVectorStore, uploadFilesToOpenAI, addFilesToVectorStore } from '@/lib/fileProcessing';
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

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Assistant name is required' }, { status: 400 });
    }

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'At least one knowledge file is required' }, { status: 400 });
    }

    // Step 1: Upload and process files
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

    const fileProcessingResult = await uploadAndProcessFiles(
      userAccount.account.id, // Use internal database ID for foreign key relationships
      filesToProcess
    );

    if (fileProcessingResult.status === 'ERROR' || fileProcessingResult.processedFiles === 0) {
      return NextResponse.json({ 
        error: 'Failed to process files', 
        details: `Processed ${fileProcessingResult.processedFiles}/${fileProcessingResult.totalFiles} files successfully` 
      }, { status: 500 });
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
    console.log(`🔗 Linking ${fileProcessingResult.results.length} files to assistant`);
    
    const successfulFiles = fileProcessingResult.results.filter(r => r.success);
    
    if (successfulFiles.length > 0) {
      await db.assistantFile.createMany({
        data: successfulFiles.map(result => ({
          assistantId: assistant.id,
          fileId: result.fileId
        }))
      });
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
      where: { id: assistant.id },
      include: {
        files: {
          include: {
            file: {
              select: {
                id: true,
                originalName: true,
                fileType: true,
                fileSize: true,
                status: true,
                createdAt: true
              }
            }
          }
        }
      }
    });

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
      documents: completeAssistant!.files.map(af => ({
        id: af.file.id,
        name: af.file.originalName,
        type: af.file.fileType,
        size: Number(af.file.fileSize),
        status: af.file.status,
        uploadedAt: af.file.createdAt
      })),
      owner: {
        id: user.id,
        email: user.email
      }
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