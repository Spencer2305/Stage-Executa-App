/**
 * Utility functions for PDF text processing and cleanup
 */

/**
 * Clean and normalize extracted PDF text
 * @param text Raw text extracted from PDF
 * @returns Cleaned and normalized text
 */
export function cleanPDFText(text: string): string {
  if (!text) return '';

  return text
    // Remove excessive whitespace
    .replace(/\s+/g, ' ')
    // Remove empty lines (but preserve paragraph breaks)
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    // Remove weird characters that sometimes appear in PDFs
    .replace(/[^\x20-\x7E\n\r]/g, ' ')
    // Fix common PDF extraction issues
    .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space between camelCase
    .replace(/(\w)(\d)/g, '$1 $2') // Add space between word and number
    .replace(/(\d)(\w)/g, '$1 $2') // Add space between number and word
    // Clean up multiple spaces again after fixes
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extract metadata from PDF text (like titles, headers)
 * @param text Cleaned PDF text
 * @returns Object with extracted metadata
 */
export function extractPDFMetadata(text: string): {
  possibleTitle?: string;
  sections?: string[];
  wordCount: number;
  hasImages: boolean;
  hasTables: boolean;
} {
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  
  // Try to find a title (usually the first substantial line)
  const possibleTitle = lines.find(line => 
    line.length > 5 && 
    line.length < 100 && 
    !line.includes('.')
  );

  // Look for section headers (lines that are short and might be titles)
  const sections = lines.filter(line => 
    line.length > 3 && 
    line.length < 50 && 
    (line.match(/^[A-Z]/) || line.includes('Chapter') || line.includes('Section'))
  );

  const wordCount = text.split(/\s+/).length;
  const hasImages = text.includes('Image') || text.includes('Figure') || text.includes('Chart');
  const hasTables = text.includes('Table') || text.includes('|') || /\t{2,}/.test(text);

  return {
    possibleTitle,
    sections: sections.slice(0, 5), // Limit to first 5 sections
    wordCount,
    hasImages,
    hasTables
  };
}

/**
 * Split PDF text into logical chunks for better processing
 * @param text Clean PDF text
 * @param maxChunkSize Maximum size per chunk
 * @returns Array of text chunks
 */
export function chunkPDFText(text: string, maxChunkSize: number = 1000): string[] {
  if (text.length <= maxChunkSize) {
    return [text];
  }

  const chunks: string[] = [];
  const paragraphs = text.split('\n\n');
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length > maxChunkSize) {
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = paragraph;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Validate if extracted text seems reasonable
 * @param text Extracted text
 * @param fileName Original file name
 * @returns Validation result with issues if any
 */
export function validateExtractedText(text: string, fileName: string): {
  isValid: boolean;
  issues: string[];
  confidence: 'high' | 'medium' | 'low';
} {
  const issues: string[] = [];
  
  if (!text || text.trim().length === 0) {
    issues.push('No text extracted');
  }

  if (text.length < 50) {
    issues.push('Very little text extracted');
  }

  // Check for garbled text (too many special characters)
  const specialCharRatio = (text.match(/[^\w\s]/g) || []).length / text.length;
  if (specialCharRatio > 0.3) {
    issues.push('Text may be garbled (many special characters)');
  }

  // Check for repeated characters (OCR issue)
  if (/(.)\1{10,}/.test(text)) {
    issues.push('Repeated characters detected (possible OCR issue)');
  }

  // Check if text is mostly numbers (might be a scan)
  const numberRatio = (text.match(/\d/g) || []).length / text.length;
  if (numberRatio > 0.8) {
    issues.push('Mostly numbers (might be a scanned document)');
  }

  let confidence: 'high' | 'medium' | 'low' = 'high';
  if (issues.length > 0) {
    confidence = issues.length > 2 ? 'low' : 'medium';
  }

  return {
    isValid: issues.length === 0,
    issues,
    confidence
  };
} 