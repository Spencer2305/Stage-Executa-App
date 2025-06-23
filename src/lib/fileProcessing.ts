import crypto from 'crypto';
import { db } from './db';
import { 
  uploadFileToAccountBucket, 
  sendFileProcessingMessage,
  ensureAccountBucket 
} from './aws';
import OpenAI from 'openai';

// Initialize OpenAI client with better error handling
const openai = new OpenAI({
});

// Development mode flag

// File type validation
const SUPPORTED_FILE_TYPES: Record<string, string[]> = {
  'application/pdf': ['pdf'],
  'application/msword': ['doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
  'text/plain': ['txt'],
  'text/markdown': ['md'],
  'application/json': ['json'],
  'text/csv': ['csv'],
};

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

// Generate file checksum for deduplication
export function generateFileChecksum(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

// Validate file size and type based on account plan
export function validateFile(
  buffer: Buffer, 
  fileName: string, 
  mimeType: string,
  accountPlan: 'FREE' | 'PRO' | 'ENTERPRISE'
): { valid: boolean; error?: string } {
  // Check file type
  const fileExtension = fileName.split('.').pop()?.toLowerCase();
  const isValidType = Object.entries(SUPPORTED_FILE_TYPES).some(([mime, extensions]) => {
    return mimeType === mime || (fileExtension && extensions.includes(fileExtension));
  });

  if (!isValidType) {
    return {
      valid: false,
      error: `Unsupported file type: ${mimeType}. Supported types: PDF, DOC, DOCX, TXT, MD, JSON, CSV`
    };
  }

  // Check file size based on plan
  let maxSize = MAX_FILE_SIZE_FREE;
  if (accountPlan === 'PRO') maxSize = MAX_FILE_SIZE_PRO;
  if (accountPlan === 'ENTERPRISE') maxSize = MAX_FILE_SIZE_ENTERPRISE;

  if (buffer.length > maxSize) {
    return {
      valid: false,
      error: `File too large: ${(buffer.length / 1024 / 1024).toFixed(1)}MB. Maximum allowed: ${(maxSize / 1024 / 1024)}MB for ${accountPlan} plan`
    };
  }

  return { valid: true };
}

// Extract text from various file types
export async function extractTextFromFile(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<{ text: string; pageCount?: number }> {
  try {
    const fileExtension = fileName.split('.').pop()?.toLowerCase();

    switch (mimeType) {
      case 'application/pdf':
        return await extractTextFromPDF(buffer, fileName);
      
      case 'application/msword':
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return await extractTextFromWord(buffer, fileName);
      
      case 'text/plain':
      case 'text/markdown':
      case 'application/json':
      case 'text/csv':
        return {
          text: buffer.toString('utf-8'),
          pageCount: 1
        };
      
      default:
        // Fallback: try to read as text
        if (fileExtension === 'txt' || fileExtension === 'md') {
          return {
            text: buffer.toString('utf-8'),
            pageCount: 1
          };
        }
        
        throw new Error(`Unsupported file type: ${mimeType}`);
    }
  } catch (error) {
    console.error(`Error extracting text from ${fileName}:`, error);
    
    // Fallback: try to read as plain text
    try {
      const text = buffer.toString('utf-8');
      if (text.length > 0) {
        return { text, pageCount: 1 };
      }
    } catch (fallbackError) {
      // Ignore fallback errors
    }
    
    throw new Error(`Failed to extract text from ${fileName}: ${error}`);
  }
}

// Extract text from PDF using dynamic import with better error handling
async function extractTextFromPDF(buffer: Buffer, fileName: string): Promise<{ text: string; pageCount?: number }> {
  try {
    // Try to import and use pdf-parse with better error isolation
    let pdfParse;
    try {
      const pdfParseModule = await import('pdf-parse');
      pdfParse = pdfParseModule.default;
    } catch (importError) {
      console.log(`⚠️ PDF parsing library not available: ${importError}`);
      throw new Error('PDF parsing library unavailable');
    }

    // Parse the PDF with the user's buffer, not any test files
    const data = await pdfParse(buffer, {
      // Ensure we only process the provided buffer
      max: 0, // No page limit
      version: 'v1.10.100' // Specify version to avoid compatibility issues
    });
    
    console.log(`✅ PDF parsed successfully: ${data.text.length} characters, ${data.numpages} pages`);
    
    return {
      text: data.text || `PDF Document: ${fileName}\n[No text content extracted]`,
      pageCount: data.numpages || 1
    };
  } catch (error) {
    console.error(`❌ PDF parsing failed for ${fileName}:`, error);
    
    // More informative fallback based on error type
    let fallbackText = `PDF Document: ${fileName}\n`;
    
    if (String(error).includes('ENOENT')) {
      fallbackText += '[PDF parsing library has configuration issues - text extraction skipped]';
    } else if (String(error).includes('Invalid PDF')) {
      fallbackText += '[Invalid PDF format - please check the file]';
    } else if (String(error).includes('password')) {
      fallbackText += '[Password-protected PDF - please provide an unlocked version]';
    } else {
      fallbackText += '[Text extraction failed - file uploaded but content not processed]';
    }
    
    return {
      text: fallbackText,
      pageCount: 1
    };
  }
}

// Extract text from Word documents using dynamic import
async function extractTextFromWord(buffer: Buffer, fileName: string): Promise<{ text: string; pageCount?: number }> {
  try {
    // Dynamic import to avoid initialization issues
    const mammoth = (await import('mammoth')).default;
    const result = await mammoth.extractRawText({ buffer });
    
    return {
      text: result.value,
      pageCount: 1
    };
  } catch (error) {
    console.error(`Error parsing Word document ${fileName}:`, error);
    
    // Fallback: return minimal text indicating Word content
    return {
      text: `Word Document: ${fileName}\n[Content could not be extracted - please ensure the document is not password protected or corrupted]`,
      pageCount: 1
    };
  }
}

// Create a file processing session
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
  accountId: string, // This is now the internal database ID
  files: Array<{
    buffer: Buffer;
    fileName: string;
    mimeType: string;
  }>,
  processingSessionId?: string
): Promise<ProcessingSessionResult> {
  try {
    console.log(`📁 Starting file processing for account ${accountId} with ${files.length} files`);
    
    // Get account details - accountId is now the internal database ID
    const account = await db.account.findUnique({
      where: { id: accountId },
      include: {
        users: {
          select: { id: true },
          take: 1
        }
      }
    });

    if (!account) {
      throw new Error('Account not found');
    }

    // Get the first user ID from the account for session creation
    const userId = account.users[0]?.id || 'system';

    console.log(`📊 Account plan: ${account.plan}`);

    // In development mode, skip S3 bucket creation
    if (!IS_DEVELOPMENT) {
      await ensureAccountBucket(account.accountId); // Use external accountId for AWS resources
    } else {
      console.log(`🧪 Development mode: Skipping S3 bucket creation`);
    }

    // Validate all files first
    const validationResults = files.map((file, index) => ({
      index,
      ...validateFile(file.buffer, file.fileName, file.mimeType, account.plan)
    }));

    const invalidFiles = validationResults.filter(result => !result.valid);
    if (invalidFiles.length > 0) {
      throw new Error(`Invalid files: ${invalidFiles.map(f => f.error).join(', ')}`);
    }

    console.log(`✅ All files validated successfully`);

    // Update processing session
    const sessionId = processingSessionId || await createProcessingSession(accountId, userId);
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
        console.log(`📄 Processing file ${index + 1}/${files.length}: ${file.fileName}`);
        
        const checksum = generateFileChecksum(file.buffer);
        
        // Check for duplicate files
        const existingFile = await db.knowledgeFile.findFirst({
          where: {
            accountId, // This uses internal database ID for database queries
            checksum,
            status: { not: 'DELETED' }
          }
        });

        if (existingFile) {
          console.log(`⚠️ Duplicate file detected: ${file.fileName}`);
          results.push({
            fileId: existingFile.id,
            success: true,
            error: 'File already exists (duplicate detected)'
          });
          continue;
        }

        // Extract text from file
        console.log(`🔍 Extracting text from: ${file.fileName}`);
        const { text, pageCount } = await extractTextFromFile(
          file.buffer,
          file.fileName,
          file.mimeType
        );

        console.log(`📝 Extracted ${text.length} characters from ${file.fileName}`);

        let s3Key = '';
        let s3Bucket = '';

        // Upload to S3 or store locally in development
        if (!IS_DEVELOPMENT) {
          console.log(`☁️ Uploading to S3: ${file.fileName}`);
          const uploadResult = await uploadFileToAccountBucket(
            account.accountId, // Use external accountId for AWS operations
            file.buffer,
            file.fileName,
            file.mimeType,
            checksum
          );
          s3Key = uploadResult.s3Key;
          s3Bucket = uploadResult.s3Bucket;
        } else {
          console.log(`💾 Development mode: Storing file locally in database: ${file.fileName}`);
          s3Key = `local://${Date.now()}-${file.fileName}`;
          s3Bucket = `development-${account.accountId}`;
        }

        // Create database record
        console.log(`💾 Creating database record for: ${file.fileName}`);
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

        console.log(`✅ Successfully processed: ${file.fileName}`);

        // Update session progress
        await db.fileProcessingSession.update({
          where: { id: sessionId },
          data: {
            processedFiles: { increment: 1 }
          }
        });

      } catch (error) {
        console.error(`❌ Error processing file ${file.fileName}:`, error);
        
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

    console.log(`🎉 File processing completed: ${processedCount} successful, ${errorCount} errors`);

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
    // TODO: Fix OpenAI SDK types for vectorStores
    // For now, return a mock ID to unblock development
    const mockVectorStoreId = `vs_mock_${accountId}_${assistantId}`;
    console.log(`Mock vector store created: ${mockVectorStoreId}`);
    return mockVectorStoreId;
    
    /*
    const vectorStore = await openai.beta.vectorStores.create({
      name: `${name} - ${accountId}`,
      metadata: {
        accountId,
        assistantId,
        project: 'ExecutaApp'
      }
    });

    return vectorStore.id;
    */
  } catch (error) {
    console.error('Error creating OpenAI vector store:', error);
    throw new Error(`Failed to create vector store: ${error}`);
  }
}

// Upload files to OpenAI and add them to vector store
export async function uploadFilesToOpenAI(
  fileIds: string[]
): Promise<{ fileId: string; openaiFileId: string }[]> {
  try {
    // Check if OpenAI API key is configured
      console.log('⚠️ OpenAI API key not configured - skipping file upload to OpenAI');
      
      // Return mock results for development
      return fileIds.map(fileId => ({
        fileId,
        openaiFileId: `mock_openai_file_${fileId.substring(0, 8)}`
      }));
    }

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
        
        // Create a blob for OpenAI file upload
        const fileBlob = new Blob([textBuffer], { type: 'text/plain' });
        const fileForUpload = new File([fileBlob], file.originalName, {
          type: 'text/plain'
        });

        console.log(`⬆️ Uploading ${file.originalName} to OpenAI (${textBuffer.length} bytes)`);

        const openaiFile = await openai.files.create({
          file: fileForUpload,
          purpose: 'assistants'
        });

        console.log(`✅ OpenAI file created: ${openaiFile.id} for ${file.originalName}`);

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
        console.error(`❌ Error uploading file ${file.originalName} to OpenAI:`, error);
        
        // Check for specific OpenAI errors
        if (String(error).includes('401') || String(error).includes('Incorrect API key')) {
          console.log('🔑 OpenAI API key issue detected - check your .env file');
          // Create mock file ID for development
          uploadResults.push({
            fileId: file.id,
            openaiFileId: `mock_openai_file_${file.id.substring(0, 8)}`
          });
        } else if (String(error).includes('insufficient_quota')) {
          console.log('💳 OpenAI quota exceeded - check your billing');
        }
        // Continue with other files
      }
    }

    return uploadResults;
  } catch (error) {
    console.error('❌ Error in OpenAI file upload process:', error);
    
    // Return mock results if there's a systematic error
    return fileIds.map(fileId => ({
      fileId,
      openaiFileId: `mock_openai_file_${fileId.substring(0, 8)}`
    }));
  }
}

// Add files to a vector store - TEMPORARILY DISABLED
export async function addFilesToVectorStore(
  vectorStoreId: string,
  openaiFileIds: string[]
): Promise<void> {
  try {
    // TODO: Fix OpenAI SDK types for vectorStores
    console.log(`Mock: Adding ${openaiFileIds.length} files to vector store ${vectorStoreId}`);
    return;
    
    /*
    // Create batch job to add files to vector store
    const batchJob = await openai.beta.vectorStores.fileBatches.create(vectorStoreId, {
      file_ids: openaiFileIds
    });

    // Poll for completion
    let status = batchJob.status;
    while (status === 'in_progress') {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      const updatedJob = await openai.beta.vectorStores.fileBatches.retrieve(vectorStoreId, batchJob.id);
      status = updatedJob.status;
    }

    if (status === 'failed') {
      throw new Error('Failed to add files to vector store');
    }
    */

  } catch (error) {
    console.error('Error adding files to vector store:', error);
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
      status: session.status as any,
      results
    };

  } catch (error) {
    console.error('Error getting processing session status:', error);
    return null;
  }
} 