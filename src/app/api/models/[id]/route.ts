import { authenticateRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log(`🔍 GET /api/models/${id} - Fetching assistant`);
    
    const auth = await authenticateRequest(request);
    if (!auth) {
      console.log(`❌ Unauthorized request to /api/models/${id}`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the specific assistant with its files
    const assistant = await db.assistant.findFirst({
      where: {
        id: id,
        accountId: auth.account.id,
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
      console.log(`❌ Assistant ${id} not found for account ${auth.account.id}`);
      return NextResponse.json({ error: 'Assistant not found' }, { status: 404 });
    }

    // Transform to match frontend Model interface
    const transformedAssistant = {
      id: assistant.id,
      name: assistant.name,
      description: assistant.description || '',
      status: assistant.status === 'ACTIVE' ? 'active' : 
              assistant.status === 'TRAINING' ? 'training' : 
              assistant.status === 'ERROR' ? 'error' : 'draft',
      type: 'assistant' as const,
      capabilities: ['chat', 'search'],
      
      // Document/file information
      documents: assistant.files.map((af: any) => ({
        id: af.file.id,
        name: af.file.originalName,
        size: Number(af.file.fileSize), // Convert BigInt to number
        type: af.file.mimeType || 'application/octet-stream',
        status: af.file.status === 'PROCESSED' ? 'completed' :
                af.file.status === 'PROCESSING' ? 'processing' : 
                af.file.status === 'ERROR' ? 'error' : 'pending',
        uploadedAt: af.file.createdAt,
        content: af.file.extractedText || undefined,
        url: af.file.s3Key ? `https://s3.amazonaws.com/bucket/${af.file.s3Key}` : undefined,
      })),
      
      // Metadata
      createdAt: assistant.createdAt,
      updatedAt: assistant.updatedAt,
      lastTrained: assistant.lastTrained,
      
      // Stats (mock for now)
      totalSessions: Math.floor(Math.random() * 1000) + 100,
      
      // API info (mock for now)  
      apiKey: assistant.id.startsWith('asst_') ? assistant.id : `sk_${assistant.id.slice(0, 8)}`,
      embedUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3008'}/chat/${assistant.id}`,
    };

    console.log(`✅ Successfully fetched assistant ${id} with ${transformedAssistant.documents.length} documents`);

    return NextResponse.json({
      data: transformedAssistant,
      success: true,
    });

  } catch (error) {
    console.error('❌ Error fetching assistant:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
} 