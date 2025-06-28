#!/usr/bin/env python3
"""
Image Text Extraction Service
A Python service for extracting text from images using OCR
"""

import sys
import json
import base64
import argparse
from io import BytesIO
from typing import Dict, Any, List
import warnings

# Suppress warnings for cleaner output
warnings.filterwarnings('ignore')

def extract_text_with_tesseract(image_bytes: bytes, filename: str) -> Dict[str, Any]:
    """Extract text using Tesseract OCR - excellent for clean text"""
    try:
        import pytesseract
        from PIL import Image
        
        # Open image from bytes
        image = Image.open(BytesIO(image_bytes))
        
        # Convert to RGB if necessary (handles RGBA, etc.)
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Basic OCR
        text = pytesseract.image_to_string(image, lang='eng')
        
        # Also get confidence data
        data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT)
        
        # Calculate average confidence
        confidences = [int(conf) for conf in data['conf'] if int(conf) > 0]
        avg_confidence = sum(confidences) / len(confidences) if confidences else 0
        
        # Clean extracted text
        cleaned_text = text.strip()
        
        if cleaned_text and len(cleaned_text) > 3:
            return {
                'success': True,
                'text': cleaned_text,
                'char_count': len(cleaned_text),
                'confidence': round(avg_confidence, 2),
                'method': 'tesseract',
                'language': 'eng'
            }
        else:
            return {
                'success': False,
                'error': 'No text detected by Tesseract',
                'method': 'tesseract'
            }
            
    except Exception as e:
        return {
            'success': False,
            'error': f'Tesseract error: {str(e)}',
            'method': 'tesseract'
        }

def extract_text_with_easyocr(image_bytes: bytes, filename: str) -> Dict[str, Any]:
    """Extract text using EasyOCR - good for multiple languages and handwriting"""
    try:
        import easyocr
        import numpy as np
        from PIL import Image
        
        # Open image from bytes
        image = Image.open(BytesIO(image_bytes))
        
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Convert PIL image to numpy array
        image_array = np.array(image)
        
        # Initialize EasyOCR reader (English by default, can add more languages)
        reader = easyocr.Reader(['en'], gpu=False)  # Set gpu=True if you have CUDA
        
        # Extract text
        results = reader.readtext(image_array)
        
        # Process results
        text_segments = []
        confidences = []
        
        for (bbox, text, confidence) in results:
            if confidence > 0.3:  # Only include confident detections
                text_segments.append(text.strip())
                confidences.append(confidence)
        
        if text_segments:
            full_text = '\n'.join(text_segments)
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0
            
            return {
                'success': True,
                'text': full_text,
                'char_count': len(full_text),
                'confidence': round(avg_confidence * 100, 2),  # Convert to percentage
                'method': 'easyocr',
                'segments_found': len(text_segments)
            }
        else:
            return {
                'success': False,
                'error': 'No text detected by EasyOCR',
                'method': 'easyocr'
            }
            
    except Exception as e:
        return {
            'success': False,
            'error': f'EasyOCR error: {str(e)}',
            'method': 'easyocr'
        }

def extract_text_with_paddleocr(image_bytes: bytes, filename: str) -> Dict[str, Any]:
    """Extract text using PaddleOCR - good for various document types"""
    try:
        from paddleocr import PaddleOCR
        from PIL import Image
        import numpy as np
        
        # Open image from bytes
        image = Image.open(BytesIO(image_bytes))
        
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Convert PIL image to numpy array
        image_array = np.array(image)
        
        # Initialize PaddleOCR
        ocr = PaddleOCR(use_angle_cls=True, lang='en', show_log=False)
        
        # Extract text
        results = ocr.ocr(image_array, cls=True)
        
        # Process results
        text_segments = []
        confidences = []
        
        if results and results[0]:
            for line in results[0]:
                if len(line) >= 2:
                    text = line[1][0]
                    confidence = line[1][1]
                    
                    if confidence > 0.5:  # Only include confident detections
                        text_segments.append(text.strip())
                        confidences.append(confidence)
        
        if text_segments:
            full_text = '\n'.join(text_segments)
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0
            
            return {
                'success': True,
                'text': full_text,
                'char_count': len(full_text),
                'confidence': round(avg_confidence * 100, 2),
                'method': 'paddleocr',
                'segments_found': len(text_segments)
            }
        else:
            return {
                'success': False,
                'error': 'No text detected by PaddleOCR',
                'method': 'paddleocr'
            }
            
    except Exception as e:
        return {
            'success': False,
            'error': f'PaddleOCR error: {str(e)}',
            'method': 'paddleocr'
        }

def preprocess_image_for_ocr(image_bytes: bytes) -> bytes:
    """Preprocess image to improve OCR accuracy"""
    try:
        from PIL import Image, ImageEnhance, ImageFilter
        import io
        
        # Open image
        image = Image.open(BytesIO(image_bytes))
        
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Resize if too large (OCR works better on medium-sized images)
        max_dimension = 2000
        if max(image.size) > max_dimension:
            ratio = max_dimension / max(image.size)
            new_size = tuple(int(dim * ratio) for dim in image.size)
            image = image.resize(new_size, Image.Resampling.LANCZOS)
        
        # Enhance contrast
        enhancer = ImageEnhance.Contrast(image)
        image = enhancer.enhance(1.2)
        
        # Enhance sharpness
        enhancer = ImageEnhance.Sharpness(image)
        image = enhancer.enhance(1.1)
        
        # Convert back to bytes
        output = io.BytesIO()
        image.save(output, format='PNG', quality=95)
        return output.getvalue()
        
    except Exception:
        # If preprocessing fails, return original
        return image_bytes

def extract_image_text(image_bytes: bytes, filename: str) -> Dict[str, Any]:
    """
    Extract text from image using multiple OCR strategies
    Returns the best result from available libraries
    """
    
    # Preprocess image for better OCR
    try:
        processed_bytes = preprocess_image_for_ocr(image_bytes)
    except Exception:
        processed_bytes = image_bytes
    
    # Strategy 1: Tesseract (most common and reliable)
    result = extract_text_with_tesseract(processed_bytes, filename)
    if result['success'] and len(result.get('text', '')) > 10:
        return result
    
    # Strategy 2: EasyOCR (good for complex text)
    result = extract_text_with_easyocr(processed_bytes, filename)
    if result['success'] and len(result.get('text', '')) > 10:
        return result
    
    # Strategy 3: PaddleOCR (disabled due to NumPy 2.x compatibility issues)
    # PaddleOCR has compatibility issues with NumPy 2.x, so we skip it for now
    
    # If all strategies failed, try original image with Tesseract
    if processed_bytes != image_bytes:
        result = extract_text_with_tesseract(image_bytes, filename)
        if result['success'] and len(result.get('text', '')) > 5:
            return result
    
    # If all strategies failed, return the last error
    return {
        'success': False,
        'error': 'All OCR methods failed to extract meaningful text from image',
        'method': 'all_failed',
        'suggestions': [
            'Ensure image has clear, readable text',
            'Try images with higher resolution',
            'Ensure good contrast between text and background',
            'Avoid heavily stylized fonts'
        ]
    }

def get_image_info(image_bytes: bytes) -> Dict[str, Any]:
    """Get basic information about the image"""
    try:
        from PIL import Image
        
        image = Image.open(BytesIO(image_bytes))
        
        return {
            'format': image.format,
            'mode': image.mode,
            'size': image.size,
            'width': image.width,
            'height': image.height
        }
    except Exception:
        return {}

def main():
    parser = argparse.ArgumentParser(description='Extract text from images using OCR')
    parser.add_argument('--file', help='Path to image file')
    parser.add_argument('--base64', help='Base64 encoded image content')
    parser.add_argument('--stdin', action='store_true', help='Read base64 image from stdin')
    parser.add_argument('--info', action='store_true', help='Include image information in output')
    
    args = parser.parse_args()
    
    try:
        if args.file:
            # Read from file
            with open(args.file, 'rb') as f:
                image_bytes = f.read()
            filename = args.file
        elif args.base64:
            # Decode from base64
            image_bytes = base64.b64decode(args.base64)
            filename = 'image_from_base64'
        elif args.stdin:
            # Read base64 from stdin
            base64_content = sys.stdin.read().strip()
            image_bytes = base64.b64decode(base64_content)
            filename = 'image_from_stdin'
        else:
            print(json.dumps({
                'success': False,
                'error': 'No input method specified. Use --file, --base64, or --stdin'
            }))
            sys.exit(1)
        
        # Get image info if requested
        image_info = get_image_info(image_bytes) if args.info else {}
        
        # Extract text
        result = extract_image_text(image_bytes, filename)
        
        # Add image info to result
        if image_info:
            result['image_info'] = image_info
        
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