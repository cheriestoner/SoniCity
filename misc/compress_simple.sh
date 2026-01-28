#!/bin/bash

# Simple Media Compression Script for SoniCity
# Converts WAV to MP3 and compresses JPG files
# Target: MP3 < 300KB, JPG < 100KB

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🎵 SoniCity Simple Media Compression${NC}"
echo "======================================"

# Check dependencies
if ! command -v ffmpeg &> /dev/null; then
    echo "❌ ffmpeg not found. Install with: brew install ffmpeg"
    exit 1
fi

if ! command -v magick &> /dev/null; then
    echo "❌ ImageMagick not found. Install with: brew install imagemagick"
    exit 1
fi

echo "✅ Dependencies found"

# Process WAV files
echo -e "\n${BLUE}Processing WAV files...${NC}"
find public/users -name "*.wav" -type f | while read -r wav_file; do
    echo "Converting: $(basename "$wav_file")"
    
    # Convert to MP3 with 128kbps (should be under 300KB)
    output_file="${wav_file%.wav}.mp3"
    ffmpeg -i "$wav_file" -c:a mp3 -b:a 128k -y "$output_file" 2>/dev/null
    
    # Check file size
    size=$(stat -f%z "$output_file" 2>/dev/null || stat -c%s "$output_file" 2>/dev/null)
    size_kb=$((size / 1024))
    echo "  → $(basename "$output_file") (${size_kb}KB)"
done

# Process JPG files
echo -e "\n${BLUE}Processing JPG files...${NC}"
find public/users -name "*.jpg" -type f | while read -r jpg_file; do
    echo "Compressing: $(basename "$jpg_file")"
    
    # Compress JPG to target size (will replace original)
    temp_file="${jpg_file%.jpg}_temp.jpg"
    
    # Try different quality levels
    for quality in 80 60 40 20; do
        magick "$jpg_file" -quality $quality "$temp_file"
        
        size=$(stat -f%z "$temp_file" 2>/dev/null || stat -c%s "$temp_file" 2>/dev/null)
        size_kb=$((size / 1024))
        
        if [ $size -le 100000 ]; then  # 100KB
            # Replace original with compressed version
            mv "$temp_file" "$jpg_file"
            echo "  → $(basename "$jpg_file") (${size_kb}KB, quality: $quality) - REPLACED"
            break
        fi
    done
    
    # Clean up temp file if it still exists
    if [ -f "$temp_file" ]; then
        mv "$temp_file" "$jpg_file"
        echo "  → $(basename "$jpg_file") (lowest quality) - REPLACED"
    fi
done

echo -e "\n${GREEN}🎉 Compression complete!${NC}"
echo "• WAV files converted to MP3 (128kbps)"
echo "• JPG files compressed and replaced (original JPGs overwritten)"
echo "• Original WAV files preserved"
