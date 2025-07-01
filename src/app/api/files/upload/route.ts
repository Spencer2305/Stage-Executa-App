import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { uploadAndProcessFiles } from '@/lib/fileProcessing';
import { db } from '@/lib/db';
import formidable from 'formidable';
import fs from 'fs';
import { Readable } from 'stream';
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/security';
import { validateFileSecurely, validateSessionLimits } from '@/lib/fileUploadSecurity';

async function handleFileUpload(request: NextRequest): Promise<NextResponse> {
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

    // Parse multipart form data
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const processingSessionId = formData.get('processingSessionId') as string | null;

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    // Get user's account plan for security validation
    const accountPlan = userAccount.account.plan as 'FREE' | 'PRO' | 'ENTERPRISE';

    // Validate session limits
    const sessionLimits = validateSessionLimits(
      files.map(f => ({ size: f.size })),
      0 // Could track existing session size if needed
    );
    
    if (!sessionLimits.isValid) {
      return NextResponse.json({ error: sessionLimits.error }, { status: 400 });
    }

    // Security validation for each file
    console.log('🔒 Running comprehensive security validation for file uploads');
    const securityResults = await Promise.all(
      files.map(async (file) => {
        const result = await validateFileSecurely(file, file.name, file.type, accountPlan);
        return { file, result };
      })
    );

    // Check if any files failed security validation
    const failedFiles = securityResults.filter(({ result }) => !result.isValid);
    if (failedFiles.length > 0) {
      const errors = failedFiles.map(({ file, result }) => ({
        fileName: file.name,
        errors: result.errors
      }));
      
      console.warn('🚫 File uploads rejected due to security issues:', errors);
      return NextResponse.json({ 
        error: 'File security validation failed',
        failedFiles: errors
      }, { status: 400 });
    }

    // Log security warnings
    securityResults.forEach(({ file, result }) => {
      if (result.warnings.length > 0) {
        console.warn(`⚠️ Security warnings for ${file.name}:`, result.warnings);
      }
    });

    // Convert files to processing format using sanitized names
    const filesToProcess = await Promise.all(
      securityResults.map(async ({ file, result }) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        return {
          buffer,
          fileName: result.sanitizedFileName || file.name,
          mimeType: file.type || 'application/octet-stream'
        };
      })
    );

    // Process files
    const result = await uploadAndProcessFiles(
      userAccount.account.accountId,
      filesToProcess,
      processingSessionId || undefined
    );

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { error: 'File upload failed' },
      { status: 500 }
    );
  }
}

async function handleGetFiles(request: NextRequest): Promise<NextResponse> {
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') as string | null;

    // Build where clause
    const whereClause: any = {
      accountId: userAccount.account.accountId
    };

    if (status) {
      whereClause.status = status;
    }

    // Get files
    const [files, totalCount] = await Promise.all([
      db.knowledgeFile.findMany({
        where: whereClause,
        select: {
          id: true,
          originalName: true,
          fileType: true,
          fileSize: true,
          status: true,
          textLength: true,
          pageCount: true,
          createdAt: true,
          processingCompletedAt: true,
          processingError: true
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      db.knowledgeFile.count({ where: whereClause })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        files: files.map(file => ({
          ...file,
          fileSize: file.fileSize.toString() // Convert BigInt to string for JSON
        })),
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get files error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch files' },
      { status: 500 }
    );
  }
}

// Apply rate limiting to file uploads
export const POST = withRateLimit(RATE_LIMIT_CONFIGS.UPLOAD, handleFileUpload);

// Apply general API rate limiting to file listing
export const GET = withRateLimit(RATE_LIMIT_CONFIGS.API, handleGetFiles); 