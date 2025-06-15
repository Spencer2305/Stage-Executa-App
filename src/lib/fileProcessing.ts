import crypto from 'crypto';
import { db } from './db';
import { 
  uploadFileToAccountBucket, 
  sendFileProcessingMessage,
  ensureAccountBucket 
} from './aws';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
});

// File type validation
const SUPPORTED_FILE_TYPES = {
  'application/pdf': ['pdf'],
  'application/msword': ['doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
  'text/plain': ['txt'],
  'text/markdown': ['md'],
  'application/json': ['json'],
  'text/csv': ['csv'],
} as const;

const MAX_FILE_SIZE_FREE = 10 * 1024 * 1024; // 10MB
const MAX_FILE_SIZE_PRO = 50 * 1024 * 1024; // 50MB
const MAX_FILE_SIZE_ENTERPRISE = 100 * 1024 * 1024; // 100MB

// Types
export interface FileProcessingResult {
  fileId: string;
  success: boolean;
  error?: string;
  extractedText?: string;
  textLength?: number;
  pageCount?: number;
}

export interface ProcessingSessionResult {
  sessionId: string;
  totalFiles: number;
  processedFiles: number;
  errorFiles: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'ERROR';
  results: FileProcessingResult[];
}

// Generate file checksum
export function generateFileChecksum(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

// Validate file type and size
export function validateFile(
  buffer: Buffer, 
  fileName: string, 
  mimeType: string,
  accountPlan: 'FREE' | 'PRO' | 'ENTERPRISE'
): { valid: boolean; error?: string } {
  // Check file type
  const supportedTypes = Object.keys(SUPPORTED_FILE_TYPES);
  if (!supportedTypes.includes(mimeType)) {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const isValidExtension = Object.values(SUPPORTED_FILE_TYPES)
      .flat()
      .includes(extension as any);
    
    if (!isValidExtension) {
      return {
        valid: false,
        error: `Unsupported file type. Supported formats: PDF, DOC, DOCX, TXT, MD, JSON, CSV`
      };
    }
  }

  // Check file size based on plan
  let maxSize: number;
  switch (accountPlan) {
    case 'FREE':
      maxSize = MAX_FILE_SIZE_FREE;
      break;
    case 'PRO':
      maxSize = MAX_FILE_SIZE_PRO;
      break;
    case 'ENTERPRISE':
      maxSize = MAX_FILE_SIZE_ENTERPRISE;
      break;
    default:
      maxSize = MAX_FILE_SIZE_FREE;
  }

  if (buffer.length > maxSize) {
    return {
      valid: false,
      error: `File size exceeds ${maxSize / (1024 * 1024)}MB limit for ${accountPlan} plan`
    };
  }

  return { valid: true };
}

// Extract text from different file types
export async function extractTextFromFile(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<{ text: string; pageCount?: number }> {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  try {
    switch (mimeType) {
      case 'text/plain':
      case 'text/markdown':
        return {
          text: buffer.toString('utf-8'),
          pageCount: 1
        };
      
      case 'application/json':
        try {
          const jsonData = JSON.parse(buffer.toString('utf-8'));
          return {
            text: JSON.stringify(jsonData, null, 2),
            pageCount: 1
          };
        } catch {
          return {
            text: buffer.toString('utf-8'),
            pageCount: 1
          };
        }
      
      case 'text/csv':
        return {
          text: buffer.toString('utf-8'),
          pageCount: 1
        };
      
      case 'application/pdf':
        // For now, we'll use a placeholder for PDF extraction
        // In production, you'd use a library like pdf-parse or pdf2pic
        return {
          text: `[PDF Document: ${fileName}]\n\nThis is a placeholder for PDF text extraction. In production, implement PDF parsing here.`,
          pageCount: 1
        };
      
      case 'application/msword':
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        // For now, we'll use a placeholder for Word document extraction
        // In production, you'd use a library like mammoth or docx-parser
        return {
          text: `[Word Document: ${fileName}]\n\nThis is a placeholder for Word document text extraction. In production, implement DOCX parsing here.`,
          pageCount: 1
        };
      
      default:
        // Try to extract as plain text
        return {
          text: buffer.toString('utf-8'),
          pageCount: 1
        };
    }
  } catch (error) {
    console.error(`Error extracting text from ${fileName}:`, error);
    throw new Error(`Failed to extract text from file: ${error}`);
  }
}

// Create processing session
export async function createProcessingSession(
  accountId: string,
  userId: string,
  sessionName?: string
): Promise<string> {
  try {
    const session = await db.fileProcessingSession.create({
      data: {
        accountId,
        userId,
        sessionName: sessionName || `Upload Session ${new Date().toISOString()}`,
        status: 'PENDING',
        totalFiles: 0,
        processedFiles: 0,
        errorFiles: 0
      }
    });

    return session.id;
  } catch (error) {
    console.error('Error creating processing session:', error);
    throw new Error(`Failed to create processing session: ${error}`);
  }
}

// Upload and process multiple files
export async function uploadAndProcessFiles(
  accountId: string,
  files: Array<{
    buffer: Buffer;
    fileName: string;
    mimeType: string;
  }>,
  processingSessionId?: string
): Promise<ProcessingSessionResult> {
  try {
    // Get account details
    const account = await db.account.findUnique({
      where: { accountId },
      select: { plan: true, s3BucketName: true }
    });

    if (!account) {
      throw new Error('Account not found');
    }

    // Ensure account has S3 bucket
    await ensureAccountBucket(accountId);

    // Validate all files first
    const validationResults = files.map((file, index) => ({
      index,
      ...validateFile(file.buffer, file.fileName, file.mimeType, account.plan)
    }));

    const invalidFiles = validationResults.filter(result => !result.valid);
    if (invalidFiles.length > 0) {
      throw new Error(`Invalid files: ${invalidFiles.map(f => f.error).join(', ')}`);
    }

    // Update processing session
    const sessionId = processingSessionId || await createProcessingSession(accountId, 'system');
    await db.fileProcessingSession.update({
      where: { id: sessionId },
      data: {
        totalFiles: files.length,
        status: 'PROCESSING',
        startedAt: new Date()
      }
    });

    const results: FileProcessingResult[] = [];

    // Process each file
    for (const [index, file] of files.entries()) {
      try {
        const checksum = generateFileChecksum(file.buffer);
        
        // Check for duplicate files
        const existingFile = await db.knowledgeFile.findFirst({
          where: {
            accountId,
            checksum,
            status: { not: 'DELETED' }
          }
        });

        if (existingFile) {
          results.push({
            fileId: existingFile.id,
            success: true,
            error: 'File already exists (duplicate detected)'
          });
          continue;
        }

        // Extract text from file
        const { text, pageCount } = await extractTextFromFile(
          file.buffer,
          file.fileName,
          file.mimeType
        );

        // Upload to S3
        const { s3Key, s3Bucket } = await uploadFileToAccountBucket(
          accountId,
          file.buffer,
          file.fileName,
          file.mimeType,
          checksum
        );

        // Create database record
        const knowledgeFile = await db.knowledgeFile.create({
          data: {
            accountId,
            processingSessionId: sessionId,
            originalName: file.fileName,
            s3Key,
            s3Bucket,
            fileType: file.fileName.split('.').pop()?.toLowerCase() || 'unknown',
            fileSize: BigInt(file.buffer.length),
            mimeType: file.mimeType,
            checksum,
            extractedText: text,
            textLength: text.length,
            pageCount,
            status: 'PROCESSED',
            processingStartedAt: new Date(),
            processingCompletedAt: new Date()
          }
        });

        results.push({
          fileId: knowledgeFile.id,
          success: true,
          extractedText: text,
          textLength: text.length,
          pageCount
        });

        // Update session progress
        await db.fileProcessingSession.update({
          where: { id: sessionId },
          data: {
            processedFiles: { increment: 1 }
          }
        });

      } catch (error) {
        console.error(`Error processing file ${file.fileName}:`, error);
        
        results.push({
          fileId: '',
          success: false,
          error: `Processing failed: ${error}`
        });

        // Update session error count
        await db.fileProcessingSession.update({
          where: { id: sessionId },
          data: {
            errorFiles: { increment: 1 }
          }
        });
      }
    }

    // Update session completion status
    const processedCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;
    
    await db.fileProcessingSession.update({
      where: { id: sessionId },
      data: {
        status: errorCount === 0 ? 'COMPLETED' : (processedCount > 0 ? 'COMPLETED' : 'ERROR'),
        completedAt: new Date()
      }
    });

    return {
      sessionId,
      totalFiles: files.length,
      processedFiles: processedCount,
      errorFiles: errorCount,
      status: errorCount === 0 ? 'COMPLETED' : (processedCount > 0 ? 'COMPLETED' : 'ERROR'),
      results
    };

  } catch (error) {
    console.error('Error in uploadAndProcessFiles:', error);
    throw error;
  }
}

// Create OpenAI vector store for account
export async function createOpenAIVectorStore(
  accountId: string,
  assistantId: string,
  name: string
): Promise<string> {
  try {
    const vectorStore = await openai.beta.vectorStores.create({
      name: `${name} - ${accountId}`,
      metadata: {
        accountId,
        assistantId,
        project: 'ExecutaApp'
      }
    });

    return vectorStore.id;
  } catch (error) {
    console.error('Error creating OpenAI vector store:', error);
    throw new Error(`Failed to create vector store: ${error}`);
  }
}

// Upload files to OpenAI for vector processing
export async function uploadFilesToOpenAI(
  fileIds: string[]
): Promise<{ fileId: string; openaiFileId: string }[]> {
  try {
    const files = await db.knowledgeFile.findMany({
      where: {
        id: { in: fileIds },
        status: 'PROCESSED'
      }
    });

    const uploadResults: { fileId: string; openaiFileId: string }[] = [];

    for (const file of files) {
      try {
        // Create a temporary buffer with the extracted text
        const textBuffer = Buffer.from(file.extractedText || '', 'utf-8');
        
        // Create a file-like object for OpenAI
        const fileForUpload = new File([textBuffer], file.originalName, {
          type: 'text/plain'
        });

        const openaiFile = await openai.files.create({
          file: fileForUpload,
          purpose: 'assistants'
        });

        // Update database with OpenAI file ID
        await db.knowledgeFile.update({
          where: { id: file.id },
          data: { openaiFileId: openaiFile.id }
        });

        uploadResults.push({
          fileId: file.id,
          openaiFileId: openaiFile.id
        });

      } catch (error) {
        console.error(`Error uploading file ${file.id} to OpenAI:`, error);
        // Continue with other files
      }
    }

    return uploadResults;
  } catch (error) {
    console.error('Error uploading files to OpenAI:', error);
    throw error;
  }
}

// Get processing session status
export async function getProcessingSessionStatus(sessionId: string): Promise<ProcessingSessionResult | null> {
  try {
    const session = await db.fileProcessingSession.findUnique({
      where: { id: sessionId },
      include: {
        files: {
          select: {
            id: true,
            originalName: true,
            status: true,
            processingError: true,
            textLength: true,
            pageCount: true
          }
        }
      }
    });

    if (!session) {
      return null;
    }

    const results: FileProcessingResult[] = session.files.map(file => ({
      fileId: file.id,
      success: file.status === 'PROCESSED',
      error: file.processingError || undefined,
      textLength: file.textLength || undefined,
      pageCount: file.pageCount || undefined
    }));

    return {
      sessionId: session.id,
      totalFiles: session.totalFiles,
      processedFiles: session.processedFiles,
      errorFiles: session.errorFiles,
      status: session.status,
      results
    };
  } catch (error) {
    console.error('Error getting processing session status:', error);
    return null;
  }
} 