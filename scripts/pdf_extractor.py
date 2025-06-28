#!/usr/bin/env python3
"""
PDF Text Extraction Service
A simple Python service for extracting text from PDF files
"""

import sys
import json
import base64
import argparse
from io import BytesIO
from typing import Dict, Any

def extract_text_with_pdfplumber(pdf_bytes: bytes) -> Dict[str, Any]:
    """Extract text using pdfplumber - excellent for text extraction"""
    try:
        import pdfplumber
        
        with pdfplumber.open(BytesIO(pdf_bytes)) as pdf:
            text_segments = []
            total_chars = 0
            
            for page_num, page in enumerate(pdf.pages, 1):
                page_text = page.extract_text()
                if page_text and page_text.strip():
                    cleaned_text = page_text.strip()
                    text_segments.append(cleaned_text)
                    total_chars += len(cleaned_text)
                    
                    # Limit extraction for very large documents
                    if page_num >= 50:  # Max 50 pages
                        break
            
            if text_segments:
                full_text = '\n\n'.join(text_segments)
                return {
                    'success': True,
                    'text': full_text,
                    'page_count': len(text_segments),
                    'char_count': total_chars,
                    'method': 'pdfplumber'
                }
            else:
                return {
                    'success': False,
                    'error': 'No text content found in PDF',
                    'method': 'pdfplumber'
                }
                
    except Exception as e:
        return {
            'success': False,
            'error': f'pdfplumber error: {str(e)}',
            'method': 'pdfplumber'
        }

def extract_text_with_pypdf(pdf_bytes: bytes) -> Dict[str, Any]:
    """Fallback extraction using PyPDF2"""
    try:
        import PyPDF2
        
        pdf_reader = PyPDF2.PdfReader(BytesIO(pdf_bytes))
        text_segments = []
        
        for page_num, page in enumerate(pdf_reader.pages):
            page_text = page.extract_text()
            if page_text and page_text.strip():
                text_segments.append(page_text.strip())
                
                # Limit extraction for very large documents
                if page_num >= 50:  # Max 50 pages
                    break
        
        if text_segments:
            full_text = '\n\n'.join(text_segments)
            return {
                'success': True,
                'text': full_text,
                'page_count': len(text_segments),
                'char_count': len(full_text),
                'method': 'PyPDF2'
            }
        else:
            return {
                'success': False,
                'error': 'No text content found in PDF',
                'method': 'PyPDF2'
            }
            
    except Exception as e:
        return {
            'success': False,
            'error': f'PyPDF2 error: {str(e)}',
            'method': 'PyPDF2'
        }

def extract_text_with_pymupdf(pdf_bytes: bytes) -> Dict[str, Any]:
    """High-quality extraction using PyMuPDF (fitz)"""
    try:
        import fitz  # PyMuPDF
        
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        text_segments = []
        
        for page_num in range(min(doc.page_count, 50)):  # Max 50 pages
            page = doc[page_num]
            page_text = page.get_text()
            
            if page_text and page_text.strip():
                text_segments.append(page_text.strip())
        
        doc.close()
        
        if text_segments:
            full_text = '\n\n'.join(text_segments)
            return {
                'success': True,
                'text': full_text,
                'page_count': len(text_segments),
                'char_count': len(full_text),
                'method': 'PyMuPDF'
            }
        else:
            return {
                'success': False,
                'error': 'No text content found in PDF',
                'method': 'PyMuPDF'
            }
            
    except Exception as e:
        return {
            'success': False,
            'error': f'PyMuPDF error: {str(e)}',
            'method': 'PyMuPDF'
        }

def extract_pdf_text(pdf_bytes: bytes) -> Dict[str, Any]:
    """
    Extract text from PDF using multiple strategies
    Returns the best result from available libraries
    """
    
    # Strategy 1: pdfplumber (best for text extraction)
    result = extract_text_with_pdfplumber(pdf_bytes)
    if result['success'] and len(result.get('text', '')) > 50:
        return result
    
    # Strategy 2: PyMuPDF (good for complex layouts)
    result = extract_text_with_pymupdf(pdf_bytes)
    if result['success'] and len(result.get('text', '')) > 50:
        return result
    
    # Strategy 3: PyPDF2 (fallback)
    result = extract_text_with_pypdf(pdf_bytes)
    if result['success'] and len(result.get('text', '')) > 50:
        return result
    
    # If all strategies failed, return the last error
    return {
        'success': False,
        'error': 'All PDF extraction methods failed to extract meaningful text',
        'method': 'all_failed'
    }

def main():
    parser = argparse.ArgumentParser(description='Extract text from PDF files')
    parser.add_argument('--file', help='Path to PDF file')
    parser.add_argument('--base64', help='Base64 encoded PDF content')
    parser.add_argument('--stdin', action='store_true', help='Read base64 PDF from stdin')
    
    args = parser.parse_args()
    
    try:
        if args.file:
            # Read from file
            with open(args.file, 'rb') as f:
                pdf_bytes = f.read()
        elif args.base64:
            # Decode from base64
            pdf_bytes = base64.b64decode(args.base64)
        elif args.stdin:
            # Read base64 from stdin
            base64_content = sys.stdin.read().strip()
            pdf_bytes = base64.b64decode(base64_content)
        else:
            print(json.dumps({
                'success': False,
                'error': 'No input method specified. Use --file, --base64, or --stdin'
            }))
            sys.exit(1)
        
        # Extract text
        result = extract_pdf_text(pdf_bytes)
        
        # Output JSON result
        print(json.dumps(result, ensure_ascii=False, indent=2))
        
    except Exception as e:
        print(json.dumps({
            'success': False,
            'error': f'Script error: {str(e)}'
        }))
        sys.exit(1)

if __name__ == '__main__':
    main() 