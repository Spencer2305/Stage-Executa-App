/**
 * Comprehensive File Upload Security Utility
 * Addresses vulnerabilities: MIME spoofing, path traversal, malware, DoS attacks
 */

import crypto from 'crypto';
import path from 'path';

// Security configuration
const SECURITY_CONFIG = {
  // Maximum file sizes by plan (bytes)
  MAX_FILE_SIZES: {
    FREE: 10 * 1024 * 1024,     // 10MB
    PRO: 50 * 1024 * 1024,      // 50MB
    ENTERPRISE: 100 * 1024 * 1024 // 100MB
  },
  
  // Maximum total upload size per session
  MAX_TOTAL_SESSION_SIZE: 500 * 1024 * 1024, // 500MB
  
  // Maximum number of files per upload
  MAX_FILES_PER_UPLOAD: 20,
  
  // Suspicious file patterns (potential malware indicators)
  SUSPICIOUS_PATTERNS: [
    /<script[\s\S]*?>[\s\S]*?<\/script>/gi,  // JavaScript
    /javascript:/gi,                          // JavaScript protocol
    /vbscript:/gi,                           // VBScript protocol
    /onload\s*=/gi,                          // Event handlers
    /onerror\s*=/gi,
    /onclick\s*=/gi,
    /%3cscript/gi,                           // URL encoded script
    /\.exe\s*$/gi,                           // Executable files
    /\.bat\s*$/gi,                           // Batch files
    /\.cmd\s*$/gi,                           // Command files
    /\.scr\s*$/gi,                           // Screen saver files
    /\.pif\s*$/gi,                           // Program information files
  ],
  
  // Known malicious file signatures (magic bytes)
  MALICIOUS_SIGNATURES: [
    'MZ',      // PE executable
    'PK\x03\x04', // ZIP (could contain malicious files)
    '\x7fELF', // ELF executable
  ],
  
  // Image dimension limits to prevent memory exhaustion
  MAX_IMAGE_DIMENSIONS: {
    width: 8192,   // 8K width max
    height: 8192,  // 8K height max
    pixels: 50 * 1024 * 1024 // 50MP max
  }
};

// File type definitions with strict validation
const SECURE_FILE_TYPES: Record<string, {
  mimeTypes: string[];
  extensions: string[];
  magicBytes: Array<{ offset: number; bytes: Buffer | string }>;
  maxSize?: number;
}> = {
  PDF: {
    mimeTypes: ['application/pdf'],
    extensions: ['pdf'],
    magicBytes: [{ offset: 0, bytes: '%PDF-' }],
    maxSize: SECURITY_CONFIG.MAX_FILE_SIZES.ENTERPRISE
  },
  JPEG: {
    mimeTypes: ['image/jpeg'],
    extensions: ['jpg', 'jpeg'],
    magicBytes: [
      { offset: 0, bytes: Buffer.from([0xFF, 0xD8, 0xFF]) },
      { offset: 6, bytes: 'JFIF' },
      { offset: 6, bytes: 'Exif' }
    ]
  },
  PNG: {
    mimeTypes: ['image/png'],
    extensions: ['png'],
    magicBytes: [{ offset: 0, bytes: Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]) }]
  },
  GIF: {
    mimeTypes: ['image/gif'],
    extensions: ['gif'],
    magicBytes: [
      { offset: 0, bytes: 'GIF87a' },
      { offset: 0, bytes: 'GIF89a' }
    ]
  },
  WEBP: {
    mimeTypes: ['image/webp'],
    extensions: ['webp'],
    magicBytes: [
      { offset: 0, bytes: 'RIFF' },
      { offset: 8, bytes: 'WEBP' }
    ]
  },
  TEXT: {
    mimeTypes: ['text/plain', 'text/markdown', 'text/csv'],
    extensions: ['txt', 'md', 'csv'],
    magicBytes: [] // Text files don't have magic bytes
  },
  DOCX: {
    mimeTypes: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    extensions: ['docx'],
    magicBytes: [{ offset: 0, bytes: 'PK' }] // DOCX is ZIP format
  },
  DOC: {
    mimeTypes: ['application/msword'],
    extensions: ['doc'],
    magicBytes: [{ offset: 0, bytes: Buffer.from([0xD0, 0xCF, 0x11, 0xE0, 0xA1, 0xB1, 0x1A, 0xE1]) }]
  },
  JSON: {
    mimeTypes: ['application/json'],
    extensions: ['json'],
    magicBytes: [] // JSON files don't have magic bytes
  }
};

export interface SecurityValidationResult {
  isValid: boolean;
  fileType?: string;
  errors: string[];
  warnings: string[];
  sanitizedFileName?: string;
}

export interface FileSecurityInfo {
  checksum: string;
  size: number;
  actualMimeType?: string;
  detectedType?: string;
  isImage: boolean;
  imageDimensions?: { width: number; height: number };
}

/**
 * Comprehensive file security validation
 */
export async function validateFileSecurely(
  file: File | Buffer,
  fileName: string,
  declaredMimeType: string,
  accountPlan: 'FREE' | 'PRO' | 'ENTERPRISE' = 'FREE'
): Promise<SecurityValidationResult> {
  const result: SecurityValidationResult = {
    isValid: false,
    errors: [],
    warnings: []
  };

  try {
    // Get file buffer
    let buffer: Buffer;
    if (file instanceof Buffer) {
      buffer = file;
    } else {
      // File object - cast to File type
      const fileObj = file as File;
      buffer = Buffer.from(await fileObj.arrayBuffer());
    }
    
    // 1. Sanitize file name to prevent path traversal
    const sanitizedFileName = sanitizeFileName(fileName);
    result.sanitizedFileName = sanitizedFileName;
    
    if (sanitizedFileName !== fileName) {
      result.warnings.push('File name was sanitized for security');
    }

    // 2. Validate file size
    const maxSize = SECURITY_CONFIG.MAX_FILE_SIZES[accountPlan];
    if (buffer.length > maxSize) {
      result.errors.push(`File too large: ${(buffer.length / 1024 / 1024).toFixed(1)}MB. Maximum: ${(maxSize / 1024 / 1024)}MB`);
      return result;
    }

    if (buffer.length === 0) {
      result.errors.push('File is empty');
      return result;
    }

    // 3. Detect actual file type by content (not trusting declared MIME type)
    const detectedType = detectFileTypeByContent(buffer, sanitizedFileName);
    if (!detectedType) {
      result.errors.push('Unknown or unsupported file type detected');
      return result;
    }

    // 4. Validate MIME type matches content
    const typeConfig = SECURE_FILE_TYPES[detectedType];
    if (!typeConfig.mimeTypes.includes(declaredMimeType)) {
      result.warnings.push(`Declared MIME type (${declaredMimeType}) doesn't match detected type (${detectedType})`);
    }

    // 5. Validate file extension
    const fileExtension = path.extname(sanitizedFileName).toLowerCase().replace('.', '');
    if (!typeConfig.extensions.includes(fileExtension)) {
      result.errors.push(`File extension (.${fileExtension}) doesn't match detected type (${detectedType})`);
      return result;
    }

    // 6. Scan for malicious content
    const malwareResult = scanForMaliciousContent(buffer, sanitizedFileName);
    if (!malwareResult.isSafe) {
      result.errors.push(`Security threat detected: ${malwareResult.threat}`);
      return result;
    }

    // 7. Additional validation for images
    if (['JPEG', 'PNG', 'GIF', 'WEBP'].includes(detectedType)) {
      const imageValidation = validateImageSecurity(buffer);
      if (!imageValidation.isValid) {
        result.errors.push(...imageValidation.errors);
        return result;
      }
      result.warnings.push(...imageValidation.warnings);
    }

    // 8. PDF-specific security validation
    if (detectedType === 'PDF') {
      const pdfValidation = validatePDFSecurity(buffer);
      if (!pdfValidation.isValid) {
        result.errors.push(...pdfValidation.errors);
        return result;
      }
      result.warnings.push(...pdfValidation.warnings);
    }

    // If we reach here, file passed all security checks
    result.isValid = true;
    result.fileType = detectedType;

  } catch (error) {
    result.errors.push(`Security validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

/**
 * Sanitize file name to prevent path traversal and other attacks
 */
export function sanitizeFileName(fileName: string): string {
  // Remove path components
  let sanitized = path.basename(fileName);
  
  // Remove or replace dangerous characters
  sanitized = sanitized.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_');
  
  // Remove leading/trailing dots and spaces
  sanitized = sanitized.replace(/^[.\s]+|[.\s]+$/g, '');
  
  // Prevent reserved names on Windows
  const reservedNames = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
  const nameWithoutExt = sanitized.split('.')[0].toUpperCase();
  if (reservedNames.includes(nameWithoutExt)) {
    sanitized = `file_${sanitized}`;
  }
  
  // Ensure reasonable length
  if (sanitized.length > 255) {
    const ext = path.extname(sanitized);
    const nameOnly = path.basename(sanitized, ext);
    sanitized = nameOnly.substring(0, 255 - ext.length) + ext;
  }
  
  // Fallback if sanitization resulted in empty name
  if (!sanitized || sanitized === '.') {
    sanitized = `file_${Date.now()}.txt`;
  }
  
  return sanitized;
}

/**
 * Detect file type by examining file content (magic bytes)
 */
function detectFileTypeByContent(buffer: Buffer, fileName: string): string | null {
  for (const [typeName, config] of Object.entries(SECURE_FILE_TYPES)) {
    // Check magic bytes
    for (const magic of config.magicBytes) {
      const slice = buffer.subarray(magic.offset, magic.offset + (magic.bytes.length));
      if (typeof magic.bytes === 'string') {
        if (slice.toString('ascii').startsWith(magic.bytes)) {
          return typeName;
        }
      } else {
        if (Buffer.compare(slice, magic.bytes.subarray(0, slice.length)) === 0) {
          return typeName;
        }
      }
    }
    
    // For types without magic bytes, check extension
    if (config.magicBytes.length === 0) {
      const fileExtension = path.extname(fileName).toLowerCase().replace('.', '');
      if (config.extensions.includes(fileExtension)) {
        // Additional validation for text files
        if (typeName === 'TEXT' || typeName === 'JSON') {
          if (isValidTextFile(buffer)) {
            return typeName;
          }
        } else {
          return typeName;
        }
      }
    }
  }
  
  return null;
}

/**
 * Scan for malicious content patterns
 */
function scanForMaliciousContent(buffer: Buffer, fileName: string): { isSafe: boolean; threat?: string } {
  // Check for malicious file signatures
  const bufferStart = buffer.subarray(0, 10).toString('ascii');
  for (const signature of SECURITY_CONFIG.MALICIOUS_SIGNATURES) {
    if (bufferStart.startsWith(signature)) {
      return { isSafe: false, threat: `Malicious file signature detected: ${signature}` };
    }
  }
  
  // Check for suspicious patterns in file content
  const contentStr = buffer.toString('utf8', 0, Math.min(buffer.length, 64 * 1024)); // First 64KB
  for (const pattern of SECURITY_CONFIG.SUSPICIOUS_PATTERNS) {
    if (pattern.test(contentStr)) {
      return { isSafe: false, threat: 'Suspicious code pattern detected' };
    }
  }
  
  // Check for executable file extensions
  const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.pdb', '.dll', '.so'];
  const fileExtension = path.extname(fileName).toLowerCase();
  if (suspiciousExtensions.includes(fileExtension)) {
    return { isSafe: false, threat: `Suspicious file extension: ${fileExtension}` };
  }
  
  return { isSafe: true };
}

/**
 * Validate image file security
 */
function validateImageSecurity(buffer: Buffer): { isValid: boolean; errors: string[]; warnings: string[] } {
  const result: { isValid: boolean; errors: string[]; warnings: string[] } = { isValid: true, errors: [], warnings: [] };
  
  try {
    // Basic dimension validation (we'd need an image library for full validation)
    // For now, we check file size as a proxy for dimensions
    if (buffer.length > 20 * 1024 * 1024) { // 20MB threshold for images
      result.warnings.push('Large image file detected - may cause memory issues');
    }
    
    // Check for embedded scripts in image metadata (basic check)
    const bufferStr = buffer.toString('binary');
    if (bufferStr.includes('<script') || bufferStr.includes('javascript:')) {
      result.errors.push('Suspicious script content detected in image metadata');
      result.isValid = false;
    }
    
  } catch (error) {
    result.errors.push('Failed to validate image security');
    result.isValid = false;
  }
  
  return result;
}

/**
 * Validate PDF file security
 */
function validatePDFSecurity(buffer: Buffer): { isValid: boolean; errors: string[]; warnings: string[] } {
  const result: { isValid: boolean; errors: string[]; warnings: string[] } = { isValid: true, errors: [], warnings: [] };
  
  try {
    const pdfContent = buffer.toString('binary');
    
    // Check for JavaScript in PDF
    if (pdfContent.includes('/JavaScript') || pdfContent.includes('/JS')) {
      result.warnings.push('PDF contains JavaScript - will be processed with caution');
    }
    
    // Check for suspicious PDF actions
    const suspiciousActions = ['/Launch', '/URI', '/SubmitForm', '/ImportData'];
    for (const action of suspiciousActions) {
      if (pdfContent.includes(action)) {
        result.warnings.push(`PDF contains potentially suspicious action: ${action}`);
      }
    }
    
    // Check for excessively large PDFs that might be zip bombs
    if (buffer.length > 100 * 1024 * 1024) { // 100MB
      result.errors.push('PDF file is suspiciously large');
      result.isValid = false;
    }
    
  } catch (error) {
    result.errors.push('Failed to validate PDF security');
    result.isValid = false;
  }
  
  return result;
}

/**
 * Validate if buffer contains valid text
 */
function isValidTextFile(buffer: Buffer): boolean {
  try {
    const text = buffer.toString('utf8');
    // Check for non-printable characters (excluding common whitespace)
    const nonPrintableRegex = /[^\x20-\x7E\t\n\r]/g;
    const nonPrintableCount = (text.match(nonPrintableRegex) || []).length;
    
    // Allow some non-printable characters but not too many
    return nonPrintableCount < text.length * 0.1; // Less than 10% non-printable
  } catch {
    return false;
  }
}

/**
 * Generate secure file checksum
 */
export function generateSecureChecksum(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Validate session-level upload limits
 */
export function validateSessionLimits(
  files: Array<{ size: number }>,
  existingSessionSize: number = 0
): { isValid: boolean; error?: string } {
  // Check number of files
  if (files.length > SECURITY_CONFIG.MAX_FILES_PER_UPLOAD) {
    return {
      isValid: false,
      error: `Too many files. Maximum ${SECURITY_CONFIG.MAX_FILES_PER_UPLOAD} files per upload`
    };
  }
  
  // Check total session size
  const totalNewSize = files.reduce((sum, file) => sum + file.size, 0);
  const totalSessionSize = existingSessionSize + totalNewSize;
  
  if (totalSessionSize > SECURITY_CONFIG.MAX_TOTAL_SESSION_SIZE) {
    return {
      isValid: false,
      error: `Total upload session size too large: ${(totalSessionSize / 1024 / 1024).toFixed(1)}MB. Maximum: ${(SECURITY_CONFIG.MAX_TOTAL_SESSION_SIZE / 1024 / 1024)}MB`
    };
  }
  
  return { isValid: true };
} 