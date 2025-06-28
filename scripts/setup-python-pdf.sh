#!/bin/bash

# Setup Python environment for PDF extraction and OCR
echo "🐍 Setting up Python environment for PDF extraction and image OCR..."

# Check if Python 3 is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3 first."
    echo "On macOS: brew install python3"
    exit 1
fi

echo "✅ Python 3 found: $(python3 --version)"

# Check if pip is available
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is not installed. Please install pip3 first."
    exit 1
fi

echo "✅ pip3 found: $(pip3 --version)"

# Check for Tesseract OCR (required for pytesseract)
echo "🔍 Checking for Tesseract OCR..."
if ! command -v tesseract &> /dev/null; then
    echo "⚠️ Tesseract OCR is not installed. Installing via Homebrew..."
    if command -v brew &> /dev/null; then
        brew install tesseract
        if [ $? -ne 0 ]; then
            echo "❌ Failed to install Tesseract via Homebrew."
            echo "Please install Tesseract manually:"
            echo "  macOS: brew install tesseract"
            echo "  Ubuntu: sudo apt install tesseract-ocr"
            exit 1
        fi
    else
        echo "❌ Homebrew not found. Please install Tesseract manually:"
        echo "  macOS: brew install tesseract"
        echo "  Ubuntu: sudo apt install tesseract-ocr"
        exit 1
    fi
fi

echo "✅ Tesseract OCR found: $(tesseract --version | head -n1)"

# Install dependencies
echo "📦 Installing Python dependencies..."
cd "$(dirname "$0")"

pip3 install -r requirements.txt

if [ $? -eq 0 ]; then
    echo "✅ Python dependencies installed successfully!"
    echo ""
    echo "📖 Testing PDF extraction..."
    
    # Test the PDF script
    echo "Testing PDF extraction..."
    python3 pdf_extractor.py --help
    
    if [ $? -eq 0 ]; then
        echo "✅ PDF extraction script is ready!"
    else
        echo "⚠️ PDF extraction script test failed. Check the installation."
        exit 1
    fi
    
    echo ""
    echo "📖 Testing image OCR extraction..."
    
    # Test the OCR script
    echo "Testing image OCR extraction..."
    python3 image_text_extractor.py --help
    
    if [ $? -eq 0 ]; then
        echo "✅ Image OCR extraction script is ready!"
        echo ""
        echo "🎉 Setup complete! You can now use Python-powered PDF extraction and image OCR."
    else
        echo "⚠️ Image OCR extraction script test failed. Check the installation."
        exit 1
    fi
else
    echo "❌ Failed to install Python dependencies. Check the error above."
    exit 1
fi 