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
    console.log('🚀 Starting assistant creation...');

    // Authenticate user
    const user = await authenticateRequest(request);
    if (!user) {
      console.log('❌ Authentication failed');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log(`✅ User authenticated: ${user.email}`);

    // Get user's account
    const userAccount = await db.user.findUnique({
      where: { id: user.id },
      include: { account: true }
    });

    if (!userAccount?.account) {
      console.log('❌ Account not found for user:', user.id);
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }
    console.log(`✅ Account found: ${userAccount.account.name} (${userAccount.account.accountId})`);

    // Parse request data
    console.log('📋 Parsing form data...');
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const instructions = formData.get('instructions') as string || 'You are a helpful AI assistant. Answer questions based on the provided knowledge base.';
    const files = formData.getAll('files') as File[];

    console.log(`📝 Assistant details:`, {
      name,
      description: description?.substring(0, 100) + '...',
      fileCount: files.length,
      hasInstructions: !!instructions
    });

    // Validate required fields
    if (!name || !name.trim()) {
      console.log('❌ Assistant name is required');
      return NextResponse.json({ error: 'Assistant name is required' }, { status: 400 });
    }

    if (!files || files.length === 0) {
      console.log('❌ At least one knowledge file is required');
      return NextResponse.json({ error: 'At least one knowledge file is required' }, { status: 400 });
    }

    // Check OpenAI API key
      console.log('❌ OpenAI API key not configured');
      return NextResponse.json({ 
        error: 'OpenAI API key not configured', 
        details: 'Please add your OpenAI API key to the .env file'
      }, { status: 500 });
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
      filesToProcess,
      undefined // No existing session ID
    );

    if (fileProcessingResult.status === 'ERROR' || fileProcessingResult.processedFiles === 0) {
      console.log('❌ File processing failed:', fileProcessingResult);
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

    console.log(`✅ Assistant created in database: ${assistant.id}`);

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

    console.log(`✅ Files linked: ${successfulFiles.length} files`);

    // Step 4: Upload files to OpenAI for direct attachment
    console.log(`⬆️ Uploading files to OpenAI for knowledge retrieval`);
    
    const openaiFileUploads = await uploadFilesToOpenAI(
      successfulFiles.map(r => r.fileId)
    );

    console.log(`✅ Files uploaded to OpenAI: ${openaiFileUploads.length} files`);
    
    // Initialize vector store ID
    let vectorStoreId = `direct_files_${userAccount.account.accountId}_${assistant.id}`;
    console.log(`📎 Using modern vector store method for knowledge retrieval`);
    
    if (openaiFileUploads.length > 0) {
      console.log(`📚 ${openaiFileUploads.length} files ready for direct attachment to assistant`);
    }

    // Step 5: Create OpenAI assistant
    console.log(`🧠 Creating OpenAI assistant`);
    
    try {
        // Create OpenAI assistant with direct file attachment for knowledge retrieval
        const assistantConfig: any = {
          name: `${name} (${userAccount.account.accountId})`,
          description: description || `AI assistant for ${name}`,
          instructions: `${instructions}

You are an AI assistant trained on the knowledge base for ${name}. You have access to uploaded documents and should use them to provide accurate, helpful responses. When answering questions:

1. **ALWAYS search through the uploaded files first** to find relevant information
2. **Quote specific information** from the documents when available
3. **Be specific and cite sources** when referencing uploaded knowledge
4. If information isn't in the uploaded files, clearly state this and provide general assistance
5. Maintain a professional but friendly tone
6. For integration data (emails, CRM, etc.), respect privacy and only share appropriate information

Your primary job is to be a knowledgeable assistant based on the uploaded documents. Use them extensively to provide accurate, contextual responses.`,
          model: 'gpt-4-turbo',
          tools: [{ type: 'file_search' }],
          metadata: {
            accountId: userAccount.account.accountId,
            assistantId: assistant.id,
            project: 'ExecutaApp'
          }
        };

        // Add file search with actual file attachment for knowledge retrieval
        if (openaiFileUploads.length > 0) {
          console.log(`📎 Configuring knowledge retrieval for ${openaiFileUploads.length} files`);
          
          // Create a vector store to hold the files
          try {
            console.log(`🗃️ Creating vector store for file attachment...`);
            
            // Use the new Vector Store API
            const vectorStore = await fetch('https://api.openai.com/v1/vector_stores', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'OpenAI-Beta': 'assistants=v2'
              },
              body: JSON.stringify({
                name: `${name} Knowledge Base`,
                metadata: {
                  accountId: userAccount.account.accountId,
                  assistantId: assistant.id
                }
              })
            });

            if (!vectorStore.ok) {
              throw new Error(`Vector store creation failed: ${vectorStore.status}`);
            }

            const vectorStoreData = await vectorStore.json();
            console.log(`✅ Vector store created: ${vectorStoreData.id}`);
            
            // Add files to vector store
            const fileAddPromises = openaiFileUploads.map(async (upload) => {
              const response = await fetch(`https://api.openai.com/v1/vector_stores/${vectorStoreData.id}/files`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'OpenAI-Beta': 'assistants=v2'
                },
                body: JSON.stringify({
                  file_id: upload.openaiFileId
                })
              });
              
              if (!response.ok) {
                console.warn(`Failed to add file ${upload.openaiFileId} to vector store`);
              } else {
                console.log(`📎 Added file ${upload.openaiFileId} to vector store`);
              }
            });

            await Promise.all(fileAddPromises);
            
            // Attach vector store to assistant
            assistantConfig.tool_resources = {
              file_search: {
                vector_store_ids: [vectorStoreData.id]
              }
            };
            
            console.log(`✅ Vector store configured with ${openaiFileUploads.length} files for knowledge retrieval`);
            
          } catch (vectorError) {
            console.warn(`⚠️ Vector store creation failed: ${vectorError}`);
            console.log(`📎 Falling back to enhanced instructions method`);
            
            // Fallback to enhanced instructions if vector store fails
            const linkedFiles = await db.assistantFile.findMany({
              where: { assistantId: assistant.id },
              include: {
                file: {
                  select: { originalName: true }
                }
              }
            });
            
            const filesList = linkedFiles.map(af => `- ${af.file.originalName}`).join('\n');
            
            assistantConfig.instructions = `${instructions}

You are an AI assistant for ${name} with access to uploaded knowledge files:

${filesList}

IMPORTANT: Search through these uploaded files for relevant information. When users ask questions, prioritize information from these documents and cite sources when possible.`;
          }
        }

        const openaiAssistant = await openai.beta.assistants.create(assistantConfig);

        console.log(`✅ OpenAI assistant created: ${openaiAssistant.id}`);

        // Step 8: Update assistant with OpenAI IDs
        await db.assistant.update({
          where: { id: assistant.id },
          data: {
            openaiAssistantId: openaiAssistant.id,
            vectorStoreId,
            status: 'ACTIVE',
            lastTrained: new Date(),
            apiKey: `exec_${uuidv4().replace(/-/g, '')}`,
            embedUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/embed/${assistant.id}`
          }
        });

        console.log(`✅ Assistant updated with OpenAI IDs`);

      } catch (openaiError: any) {
        console.error('OpenAI assistant creation error:', openaiError);
        
        // Handle specific OpenAI errors
        if (openaiError?.error?.code === 'insufficient_quota') {
          console.log('💳 OpenAI quota exceeded - check your billing');
          throw new Error('OpenAI quota exceeded. Please check your billing and try again.');
        } else if (openaiError?.error?.code === 'invalid_api_key') {
          console.log('🔑 Invalid OpenAI API key');
          throw new Error('Invalid OpenAI API key. Please check your configuration.');
        }
        
        // For other errors, still create the assistant but mark it as needing attention
        await db.assistant.update({
          where: { id: assistant.id },
          data: {
            status: 'ERROR',
            apiKey: `exec_${uuidv4().replace(/-/g, '')}`,
            embedUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/embed/${assistant.id}`
          }
        });
        
        throw new Error(`Failed to create AI assistant: ${openaiError.message || 'Unknown error'}`);
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

    console.log(`🎉 Assistant creation completed successfully: ${assistant.id}`);

    return NextResponse.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('❌ Assistant creation error:', error);
    
    // Enhanced error response
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorDetails = {
      error: 'Failed to create assistant',
      message: errorMessage,
      timestamp: new Date().toISOString()
    };

    console.log('📤 Returning error response:', errorDetails);
    
    return NextResponse.json(errorDetails, { status: 500 });
  }
} 