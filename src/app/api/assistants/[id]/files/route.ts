import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { uploadAndProcessFiles } from '@/lib/fileProcessing';

const prisma = new PrismaClient();

// GET /api/assistants/[id]/files - Get all files for an assistant
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assistantId } = await params;
    console.log(`🔍 GET /api/assistants/${assistantId}/files`);
    
    // Verify authentication
    const userAccount = await authenticateRequest(request);
    if (!userAccount) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify assistant exists and belongs to user's account
    const assistant = await prisma.assistant.findFirst({
      where: {
        id: assistantId,
        accountId: userAccount.account.id,
      },
      include: {
        files: {
          include: {
            file: true,
          },
        },
      },
    });

    if (!assistant) {
      return NextResponse.json({ error: 'Assistant not found' }, { status: 404 });
    }

    // Transform files to match frontend expectations
    const files = assistant.files.map((af) => ({
      id: af.file.id,
      name: af.file.originalName,
      type: mapFileType(af.file.fileType),
      size: Number(af.file.fileSize), // Convert BigInt to number
      uploadedAt: af.file.createdAt,
      status: mapFileStatus(af.file.status),
      content: af.file.extractedText,
      s3Key: af.file.s3Key,
      processingError: af.file.processingError,
    }));

    console.log(`✅ Found ${files.length} files for assistant ${assistantId}`);
    
    return NextResponse.json({
      success: true,
      data: files,
    });

  } catch (error) {
    console.error('❌ Error fetching assistant files:', error);
    return NextResponse.json(
      { error: 'Failed to fetch files' },
      { status: 500 }
    );
  }
}

// POST /api/assistants/[id]/files - Add files to an assistant
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assistantId } = await params;
    console.log(`📁 POST /api/assistants/${assistantId}/files - Adding files to assistant`);
    
    // Verify authentication
    const userAccount = await authenticateRequest(request);
    if (!userAccount) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify assistant exists and belongs to user's account
    const assistant = await prisma.assistant.findFirst({
      where: {
        id: assistantId,
        accountId: userAccount.account.id,
      },
      include: {
        files: {
          include: {
            file: true,
          },
        },
      },
    });

    if (!assistant) {
      return NextResponse.json({ error: 'Assistant not found' }, { status: 404 });
    }

    // Parse multipart form data
    const data = await request.formData();
    const files = data.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    console.log(`📄 Processing ${files.length} files for assistant ${assistantId}`);

    // Get existing files in this assistant to check for duplicates
    const existingFiles = assistant.files.map(af => af.file.originalName.toLowerCase());
    
    // Filter out files that are already in THIS assistant
    const newFiles = files.filter(file => {
      const isDuplicate = existingFiles.includes(file.name.toLowerCase());
      if (isDuplicate) {
        console.log(`⚠️ Skipping duplicate file in this assistant: ${file.name}`);
      }
      return !isDuplicate;
    });

    if (newFiles.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All files already exist in this assistant',
        data: {
          assistant,
          files: assistant.files.map((af) => ({
            id: af.file.id,
            name: af.file.originalName,
            type: mapFileType(af.file.fileType),
            size: Number(af.file.fileSize),
            uploadedAt: af.file.createdAt,
            status: mapFileStatus(af.file.status),
            content: af.file.extractedText,
          })),
          newFiles: 0,
        },
      });
    }

    console.log(`📄 Processing ${newFiles.length} new files (${files.length - newFiles.length} duplicates skipped)`);

    // Convert File objects to the format expected by uploadAndProcessFiles
    const fileData = await Promise.all(
      newFiles.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        return {
          buffer,
          fileName: file.name,
          mimeType: file.type,
        };
      })
    );

    // Process files using existing file processing system
    const processingResult = await uploadAndProcessFiles(
      userAccount.account.id, // Internal database account ID
      fileData
    );

    if (processingResult.status === 'ERROR') {
      return NextResponse.json(
        { 
          error: 'File processing failed',
          details: processingResult.results.filter(r => !r.success).map(r => r.error) 
        },
        { status: 500 }
      );
    }

    // Link processed files to the assistant
    const successfulFiles = processingResult.results.filter(r => r.success);
    
    // Check if any of the processed files already exist in this assistant
    const filesToLink = [];
    for (const result of successfulFiles) {
      // Check if this file is already linked to this assistant
      const existingLink = await prisma.assistantFile.findUnique({
        where: {
          assistantId_fileId: {
            assistantId: assistantId,
            fileId: result.fileId,
          },
        },
      });

      if (!existingLink) {
        filesToLink.push(result);
      } else {
        console.log(`🔗 File ${result.fileId} already linked to assistant ${assistantId}`);
      }
    }

    if (filesToLink.length > 0) {
      const linkPromises = filesToLink.map(result =>
        prisma.assistantFile.create({
          data: {
            assistantId: assistantId,
            fileId: result.fileId,
          },
        })
      );

      await Promise.all(linkPromises);
      console.log(`🔗 Linked ${filesToLink.length} new files to assistant ${assistantId}`);
    }

    // Get updated assistant with files
    const updatedAssistant = await prisma.assistant.findFirst({
      where: { id: assistantId },
      include: {
        files: {
          include: {
            file: true,
          },
        },
      },
    });

    const transformedFiles = updatedAssistant?.files.map((af) => ({
      id: af.file.id,
      name: af.file.originalName,
      type: mapFileType(af.file.fileType),
      size: Number(af.file.fileSize), // Convert BigInt to number
      uploadedAt: af.file.createdAt,
      status: mapFileStatus(af.file.status),
      content: af.file.extractedText,
    })) || [];

    const totalNewFiles = filesToLink.length;
    console.log(`✅ Successfully added ${totalNewFiles} files to assistant`);

    return NextResponse.json({
      success: true,
      message: totalNewFiles > 0 
        ? `Successfully added ${totalNewFiles} files to assistant` 
        : 'All files were already processed or linked to this assistant',
      data: {
        assistant: {
          ...updatedAssistant,
          // Convert any BigInt fields to numbers for serialization
          totalSessions: Number(updatedAssistant?.totalSessions || 0),
          totalMessages: Number(updatedAssistant?.totalMessages || 0),
        },
        files: transformedFiles,
        newFiles: totalNewFiles,
      },
    });

  } catch (error) {
    console.error('❌ Error adding files to assistant:', error);
    return NextResponse.json(
      { 
        error: 'Failed to add files to assistant',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper functions
function mapFileType(fileType: string): 'pdf' | 'txt' | 'docx' | 'gmail' | 'crm' {
  if (fileType.includes('pdf')) return 'pdf';
  if (fileType.includes('text')) return 'txt';
  if (fileType.includes('word') || fileType.includes('docx')) return 'docx';
  return 'txt';
}

function mapFileStatus(status: string): 'uploading' | 'processing' | 'completed' | 'error' {
  switch (status) {
    case 'UPLOADED':
      return 'completed';
    case 'PROCESSING':
      return 'processing';
    case 'COMPLETED':
      return 'completed';
    case 'ERROR':
      return 'error';
    default:
      return 'uploading';
  }
} 