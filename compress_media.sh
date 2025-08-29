#!/bin/bash

# Media Compression Script for SoniCity
# Compresses WAV and JPG files to target sizes
# Target: WAV < 300KB, JPG < 100KB

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if required tools are installed
check_dependencies() {
    echo -e "${BLUE}Checking dependencies...${NC}"
    
    if ! command -v ffmpeg &> /dev/null; then
        echo -e "${RED}Error: ffmpeg is not installed${NC}"
        echo "Install with: brew install ffmpeg (macOS) or sudo apt install ffmpeg (Ubuntu)"
        exit 1
    fi
    
    if ! command -v magick &> /dev/null; then
        echo -e "${RED}Error: ImageMagick is not installed${NC}"
        echo "Install with: brew install imagemagick (macOS) or sudo apt install imagemagick (Ubuntu)"
        exit 1
    fi
    
    echo -e "${GREEN}✓ All dependencies found${NC}"
}

# Compress WAV file to target size
compress_wav() {
    local input_file="$1"
    local output_file="$2"
    local target_size=300000  # 300KB in bytes
    
    echo -e "${YELLOW}Compressing WAV: $(basename "$input_file")${NC}"
    
    # Get original file size
    local original_size=$(stat -f%z "$input_file" 2>/dev/null || stat -c%s "$input_file" 2>/dev/null)
    echo "  Original size: $((original_size / 1024))KB"
    
    # Start with high quality and reduce if needed
    local quality=192
    local min_quality=32
    
    while [ $quality -ge $min_quality ]; do
        ffmpeg -i "$input_file" -c:a mp3 -b:a ${quality}k -y "$output_file" 2>/dev/null
        
        local compressed_size=$(stat -f%z "$output_file" 2>/dev/null || stat -c%s "$output_file" 2>/dev/null)
        
        if [ $compressed_size -le $target_size ]; then
            echo -e "  ${GREEN}✓ Compressed to: $((compressed_size / 1024))KB (quality: ${quality}k)${NC}"
            return 0
        fi
        
        # Reduce quality and try again
        quality=$((quality - 32))
    done
    
    # If we still can't reach target size, use lowest quality
    ffmpeg -i "$input_file" -c:a mp3 -b:a ${min_quality}k -y "$output_file" 2>/dev/null
    local final_size=$(stat -f%z "$output_file" 2>/dev/null || stat -c%s "$output_file" 2>/dev/null)
    echo -e "  ${YELLOW}⚠ Final size: $((final_size / 1024))KB (lowest quality)${NC}"
}

# Compress JPG file to target size
compress_jpg() {
    local input_file="$1"
    local output_file="$2"
    local target_size=100000  # 100KB in bytes
    
    echo -e "${YELLOW}Compressing JPG: $(basename "$input_file")${NC}"
    
    # Get original file size
    local original_size=$(stat -f%z "$input_file" 2>/dev/null || stat -c%s "$input_file" 2>/dev/null)
    echo "  Original size: $((original_size / 1024))KB"
    
    # Start with high quality and reduce if needed
    local quality=90
    local min_quality=10
    
    while [ $quality -ge $min_quality ]; do
        magick "$input_file" -quality $quality "$output_file"
        
        local compressed_size=$(stat -f%z "$output_file" 2>/dev/null || stat -c%s "$output_file" 2>/dev/null)
        
        if [ $compressed_size -le $target_size ]; then
            echo -e "  ${GREEN}✓ Compressed to: $((compressed_size / 1024))KB (quality: $quality)${NC}"
            # Replace original file with compressed version
            mv "$output_file" "$input_file"
            echo "  → Replaced original file"
            return 0
        fi
        
        # Reduce quality and try again
        quality=$((quality - 10))
    done
    
    # If we still can't reach target size, use lowest quality
    magick "$input_file" -quality $min_quality "$output_file"
    local final_size=$(stat -f%z "$output_file" 2>/dev/null || stat -c%s "$output_file" 2>/dev/null)
    echo -e "  ${YELLOW}⚠ Final size: $((final_size / 1024))KB (lowest quality)${NC}"
    # Replace original file with compressed version
    mv "$output_file" "$input_file"
    echo "  → Replaced original file"
}

# Process all media files in users directory
process_users_directory() {
    local users_dir="public/users"
    
    if [ ! -d "$users_dir" ]; then
        echo -e "${RED}Error: $users_dir directory not found${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}Processing media files in $users_dir...${NC}"
    
    # Find all WAV and JPG files
    local wav_files=$(find "$users_dir" -name "*.wav" -type f)
    local jpg_files=$(find "$users_dir" -name "*.jpg" -type f)
    
    local total_wav=$(echo "$wav_files" | wc -l)
    local total_jpg=$(echo "$jpg_files" | wc -l)
    
    echo "Found $total_wav WAV files and $total_jpg JPG files"
    
    # Process WAV files
    if [ -n "$wav_files" ]; then
        echo -e "\n${BLUE}=== Processing WAV files ===${NC}"
        for wav_file in $wav_files; do
            local dir=$(dirname "$wav_file")
            local filename=$(basename "$wav_file")
            local name_without_ext="${filename%.*}"
            local output_file="$dir/${name_without_ext}_compressed.mp3"
            
            compress_wav "$wav_file" "$output_file"
        done
    fi
    
    # Process JPG files
    if [ -n "$jpg_files" ]; then
        echo -e "\n${BLUE}=== Processing JPG files ===${NC}"
        for jpg_file in $jpg_files; do
            local dir=$(dirname "$jpg_file")
            local filename=$(basename "$jpg_file")
            local name_without_ext="${filename%.*}"
            local output_file="$dir/${name_without_ext}_temp.jpg"
            
            compress_jpg "$jpg_file" "$output_file"
        done
    fi
    
    echo -e "\n${GREEN}=== Compression Complete ===${NC}"
    echo "JPG files have been compressed and replaced"
    echo "WAV files converted to MP3 (original WAV preserved)"
}

# Main execution
main() {
    echo -e "${BLUE}🎵 SoniCity Media Compression Script${NC}"
    echo "=================================="
    
    check_dependencies
    process_users_directory
    
    echo -e "\n${GREEN}🎉 All done! Check the compressed files above.${NC}"
}

# Run main function
main "$@"
