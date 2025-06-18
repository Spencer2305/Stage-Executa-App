import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
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

// DELETE /api/assistants/[id]/files/[fileId] - Remove a file from an assistant
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  try {
    const { id: assistantId, fileId } = await params;
    console.log(`🗑️ DELETE /api/assistants/${assistantId}/files/${fileId}`);
    
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