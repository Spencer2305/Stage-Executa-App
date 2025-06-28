import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromFile } from '@/lib/fileProcessing';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert File to Buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Extract text using the existing fileProcessing function
    const result = await extractTextFromFile(buffer, file.name, file.type);
    
    // Import PDF utilities for additional analysis
    const { validateExtractedText, extractPDFMetadata } = await import('@/lib/pdfUtils');
    const validation = validateExtractedText(result.text, file.name);
    const metadata = extractPDFMetadata(result.text);

    return NextResponse.json({ 
      text: result.text,
      pageCount: result.pageCount,
      fileName: file.name,
      fileSize: buffer.length,
      fileType: file.type,
      success: true,
      // Additional analysis
      validation: {
        isValid: validation.isValid,
        issues: validation.issues,
        confidence: validation.confidence
      },
      metadata: {
        wordCount: metadata.wordCount,
        possibleTitle: metadata.possibleTitle,
        sections: metadata.sections,
        hasImages: metadata.hasImages,
        hasTables: metadata.hasTables
      },
      stats: {
        characterCount: result.text.length,
        lineCount: result.text.split('\n').length,
        paragraphCount: result.text.split('\n\n').length
      }
    });

  } catch (error) {
    console.error('Text extraction error:', error);
    return NextResponse.json(
      { error: 'Text extraction failed', details: String(error) },
      { status: 500 }
    );
  }
} 