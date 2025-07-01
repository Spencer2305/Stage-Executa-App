import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { uploadAndProcessFiles } from '@/lib/fileProcessing';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

const prisma = new PrismaClient();

// Initialize S3 client if AWS credentials are available
let s3Client: S3Client | null = null;
  s3Client = new S3Client({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
    },
  });
}

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
      // Helper function to convert BigInt fields recursively while preserving Date objects
      const sanitizeForJson = (obj: any): any => {
        if (obj === null || obj === undefined) return obj;
        if (typeof obj === 'bigint') return Number(obj);
        if (obj instanceof Date) return obj.toISOString(); // Convert Date to ISO string
        if (typeof obj === 'object') {
          if (Array.isArray(obj)) {
            return obj.map(sanitizeForJson);
          }
          const sanitized: any = {};
          for (const [key, value] of Object.entries(obj)) {
            sanitized[key] = sanitizeForJson(value);
          }
          return sanitized;
        }
        return obj;
      };

      return NextResponse.json({
        success: true,
        message: 'All files already exist in this assistant',
        data: sanitizeForJson({
          assistant: assistant,
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
        }),
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

    // Helper function to convert BigInt fields recursively while preserving Date objects
    const sanitizeForJson = (obj: any): any => {
      if (obj === null || obj === undefined) return obj;
      if (typeof obj === 'bigint') return Number(obj);
      if (obj instanceof Date) return obj.toISOString(); // Convert Date to ISO string
      if (typeof obj === 'object') {
        if (Array.isArray(obj)) {
          return obj.map(sanitizeForJson);
        }
        const sanitized: any = {};
        for (const [key, value] of Object.entries(obj)) {
          sanitized[key] = sanitizeForJson(value);
        }
        return sanitized;
      }
      return obj;
    };

    return NextResponse.json({
      success: true,
      message: totalNewFiles > 0 
        ? `Successfully added ${totalNewFiles} files to assistant` 
        : 'All files were already processed or linked to this assistant',
      data: sanitizeForJson({
        assistant: updatedAssistant,
        files: transformedFiles,
        newFiles: totalNewFiles,
      }),
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
    case 'PROCESSED':  // Add support for PROCESSED status
      return 'completed';
    case 'ERROR':
      return 'error';
    default:
      return 'uploading';
  }
}

// DELETE /api/assistants/[id]/files?fileId=xxx - Remove a file from an assistant (workaround)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('🚀 DELETE route reached for file deletion (workaround)');
  try {
    const { id: assistantId } = await params;
    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('fileId');

    if (!fileId) {
      return NextResponse.json({ error: 'fileId query parameter is required' }, { status: 400 });
    }

    console.log(`🗑️ DELETE /api/assistants/${assistantId}/files?fileId=${fileId}`);
    
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
    });

    if (!assistant) {
      return NextResponse.json({ error: 'Assistant not found' }, { status: 404 });
    }

    // Check if the file is linked to this assistant
    const assistantFile = await prisma.assistantFile.findUnique({
      where: {
        assistantId_fileId: {
          assistantId: assistantId,
          fileId: fileId,
        },
      },
      include: {
        file: true,
      },
    });

    if (!assistantFile) {
      return NextResponse.json({ error: 'File not found in this assistant' }, { status: 404 });
    }

    // Check if this file is used by other assistants
    const otherAssistantFiles = await prisma.assistantFile.findMany({
      where: {
        fileId: fileId,
        assistantId: {
          not: assistantId,
        },
      },
    });

    const isFileUsedElsewhere = otherAssistantFiles.length > 0;

    // Remove the association between assistant and file
    await prisma.assistantFile.delete({
      where: {
        assistantId_fileId: {
          assistantId: assistantId,
          fileId: fileId,
        },
      },
    });

    console.log(`🔗 Removed file ${fileId} from assistant ${assistantId}`);

    // If the file is not used by any other assistant, delete it completely
    if (!isFileUsedElsewhere) {
      console.log(`🗑️ File not used elsewhere, deleting completely...`);
      
      // Delete from S3 if available
      if (s3Client && assistantFile.file.s3Bucket && assistantFile.file.s3Key) {
        try {
          await s3Client.send(new DeleteObjectCommand({
            Bucket: assistantFile.file.s3Bucket,
            Key: assistantFile.file.s3Key,
          }));
          console.log(`✅ Deleted file from S3: ${assistantFile.file.s3Key}`);
        } catch (s3Error) {
          console.error('⚠️ Failed to delete from S3:', s3Error);
          // Continue with database deletion even if S3 deletion fails
        }
      }

      // Delete from database
      await prisma.knowledgeFile.delete({
        where: { id: fileId },
      });

      console.log(`✅ Deleted file ${fileId} from database`);
    } else {
      console.log(`📎 File ${fileId} is used by other assistants, keeping it`);
    }

    // Get updated file count for the assistant
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

    const remainingFiles = updatedAssistant?.files.map((af) => ({
      id: af.file.id,
      name: af.file.originalName,
      type: mapFileType(af.file.fileType),
      size: Number(af.file.fileSize), // Convert BigInt to number
      uploadedAt: af.file.createdAt,
      status: mapFileStatus(af.file.status),
      content: af.file.extractedText,
    })) || [];

    console.log(`✅ Successfully removed file from assistant. ${remainingFiles.length} files remaining.`);

    return NextResponse.json({
      success: true,
      message: isFileUsedElsewhere 
        ? 'File removed from assistant (kept for other assistants)'
        : 'File completely deleted',
      data: {
        remainingFiles,
        deletedCompletely: !isFileUsedElsewhere,
      },
    });

  } catch (error) {
    console.error('❌ Error removing file from assistant:', error);
    return NextResponse.json(
      { 
        error: 'Failed to remove file from assistant',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 