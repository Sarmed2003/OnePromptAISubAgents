#!/bin/bash

# Gource History Movie Generator for dinolab/
# Usage: bash scripts/gource-setup.sh
#
# This script generates a Gource visualization of the dinolab/ folder's git history
# and renders it as an MP4 movie file. It includes safety checks and sensible defaults
# for timing to create a watchable visualization.

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration variables
DINOLAB_DIR="dinolab"
OUTPUT_FILE="${DINO_LAB_DIR}/history-movie.mp4"
GOURCE_PPM_FILE="/tmp/gource-output.ppm"
LOG_FILE="/tmp/gource-setup.log"

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to cleanup temporary files on exit
cleanup() {
    local exit_code=$?
    if [[ -f "$GOURCE_PPM_FILE" ]]; then
        print_info "Cleaning up temporary PPM file..."
        rm -f "$GOURCE_PPM_FILE"
    fi
    if [[ $exit_code -ne 0 ]]; then
        print_error "Script failed with exit code $exit_code. Check $LOG_FILE for details."
    fi
    return $exit_code
}

trap cleanup EXIT

# Safety check: verify gource is installed
if ! command -v gource &> /dev/null; then
    print_error "gource is not installed. Please install it first:"
    echo "  Ubuntu/Debian: sudo apt-get install gource"
    echo "  macOS: brew install gource"
    echo "  Or visit: https://gource.io/"
    exit 1
fi

print_info "gource found at: $(command -v gource)"

# Safety check: verify ffmpeg is installed (needed for MP4 encoding)
if ! command -v ffmpeg &> /dev/null; then
    print_error "ffmpeg is not installed. Please install it first:"
    echo "  Ubuntu/Debian: sudo apt-get install ffmpeg"
    echo "  macOS: brew install ffmpeg"
    exit 1
fi

print_info "ffmpeg found at: $(command -v ffmpeg)"

# Safety check: verify dinolab directory exists
if [[ ! -d "$DINO_LAB_DIR" ]]; then
    print_error "Directory '$DINO_LAB_DIR' not found. Please run this script from the project root."
    exit 1
fi

print_info "Found dinolab directory at: $DINO_LAB_DIR"

# Check if git repository exists in dinolab
if [[ ! -d "$DINO_LAB_DIR/.git" ]]; then
    print_warn "No .git directory found in $DINO_LAB_DIR. Gource will still work but will show less history."
fi

# Create output directory if it doesn't exist
if [[ ! -d "$DINO_LAB_DIR" ]]; then
    mkdir -p "$DINO_LAB_DIR"
    print_info "Created output directory: $DINO_LAB_DIR"
fi

print_info "Starting Gource visualization generation..."
print_info "Logging to: $LOG_FILE"

# Run gource with sensible timing parameters:
# --seconds-per-day=0.5: Each day of history plays in 0.5 seconds (fast but readable)
# --auto-skip-seconds=2: Automatically skip to next action if nothing happens for 2 seconds
# --max-file-lag=0.5: Smooth file motion lag
# --file-idle-time=0: Don't hide files after they stop changing
# --background-colour=000000: Black background for better contrast
# --hide-filenames: Hide individual filenames to reduce clutter
# --hide-dirnames: Hide directory names for cleaner visualization
# --hide-users: Hide user names to focus on code changes
# --title="dinolab Repository History": Add a title to the visualization
# --output-ppm-stream: Output as PPM stream for piping to ffmpeg
# --1920x1080: Standard HD resolution

if gource \
    --seconds-per-day=0.5 \
    --auto-skip-seconds=2 \
    --max-file-lag=0.5 \
    --file-idle-time=0 \
    --background-colour=000000 \
    --hide-filenames \
    --hide-dirnames \
    --hide-users \
    --title="dinolab Repository History" \
    --output-ppm-stream="-" \
    --1920x1080 \
    "$DINO_LAB_DIR" 2>> "$LOG_FILE" | \
    ffmpeg \
    -y \
    -r 60 \
    -f image2pipe \
    -vcodec ppm \
    -i - \
    -vcodec libx264 \
    -preset medium \
    -pix_fmt yuv420p \
    -crf 18 \
    "$OUTPUT_FILE" 2>> "$LOG_FILE"; then
    print_info "Successfully generated: $OUTPUT_FILE"
    print_info "File size: $(du -h "$OUTPUT_FILE" | cut -f1)"
    print_info "You can now watch the history movie with: mpv $OUTPUT_FILE"
    exit 0
else
    print_error "Failed to generate MP4. Check $LOG_FILE for details."
    exit 1
fi
