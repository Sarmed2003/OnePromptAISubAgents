#!/bin/bash

# gource-movie.sh - Generate a git commit time-lapse visualization for DINOLAB
# Generates an MP4 video showing the evolution of the repository over time
#
# Usage:
#   ./gource-movie.sh [FRAME_RATE] [OUTPUT_FILE]
#
# Parameters:
#   FRAME_RATE   - Video frame rate in fps (default: 60)
#   OUTPUT_FILE  - Output MP4 filename (default: dinolab-gource.mp4)
#
# Example:
#   ./gource-movie.sh 30 my-timelapse.mp4

set -euo pipefail

# Script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Configuration with defaults
FRAME_RATE="${1:-60}"
OUTPUT_FILE="${2:-dinolab-gource.mp4}"

# Gource timing settings for reasonable playback
# 0.1 seconds per commit = 10 commits per second
SECONDS_PER_COMMIT="0.1"

# Color scheme and visual settings
GOURCE_TITLE="DINOLAB - Git Commit Evolution"
GOURCE_WIDTH="1920"
GOURCE_HEIGHT="1080"

# ============================================================================
# Helper Functions
# ============================================================================

log_info() {
    echo "[INFO] $*" >&2
}

log_error() {
    echo "[ERROR] $*" >&2
}

log_success() {
    echo "[SUCCESS] $*" >&2
}

exit_with_error() {
    local message="$1"
    local exit_code="${2:-1}"
    log_error "$message"
    exit "$exit_code"
}

# ============================================================================
# Validation Functions
# ============================================================================

check_gource_installed() {
    if ! command -v gource &> /dev/null; then
        exit_with_error "Gource is not installed. Please install it first.\n  Ubuntu/Debian: sudo apt-get install gource\n  macOS: brew install gource\n  Other: visit https://gource.io/" 1
    fi
    log_info "Gource found: $(gource --version)"
}

check_ffmpeg_installed() {
    if ! command -v ffmpeg &> /dev/null; then
        exit_with_error "FFmpeg is not installed. Please install it first.\n  Ubuntu/Debian: sudo apt-get install ffmpeg\n  macOS: brew install ffmpeg\n  Other: visit https://ffmpeg.org/" 1
    fi
    log_info "FFmpeg found: $(ffmpeg -version | head -1)"
}

check_git_repo() {
    if ! git -C "${PROJECT_ROOT}" rev-parse --git-dir > /dev/null 2>&1; then
        exit_with_error "Not a valid git repository at ${PROJECT_ROOT}" 1
    fi
    log_info "Git repository validated at ${PROJECT_ROOT}"
}

validate_frame_rate() {
    if ! [[ "${FRAME_RATE}" =~ ^[0-9]+$ ]] || [ "${FRAME_RATE}" -lt 1 ] || [ "${FRAME_RATE}" -gt 120 ]; then
        exit_with_error "Invalid frame rate: ${FRAME_RATE}. Must be a number between 1 and 120." 1
    fi
    log_info "Frame rate set to ${FRAME_RATE} fps"
}

validate_output_path() {
    # Ensure output directory is writable
    local output_dir
    output_dir="$(dirname "${OUTPUT_FILE}")"
    
    if [ ! -d "${output_dir}" ]; then
        exit_with_error "Output directory does not exist: ${output_dir}" 1
    fi
    
    if [ ! -w "${output_dir}" ]; then
        exit_with_error "Output directory is not writable: ${output_dir}" 1
    fi
    
    # Warn if file already exists
    if [ -f "${OUTPUT_FILE}" ]; then
        log_info "Output file already exists and will be overwritten: ${OUTPUT_FILE}"
    fi
    
    log_info "Output file will be saved to: ${OUTPUT_FILE}"
}

check_git_commits() {
    local commit_count
    commit_count="$(git -C "${PROJECT_ROOT}" rev-list --count HEAD 2>/dev/null || echo "0")"
    
    if [ "${commit_count}" -lt 1 ]; then
        exit_with_error "No commits found in repository. Cannot generate visualization." 1
    fi
    
    log_info "Found ${commit_count} commits in repository"
}

# ============================================================================
# Main Function
# ============================================================================

main() {
    log_info "=== DINOLAB Gource Movie Generator ==="
    log_info "Starting visualization generation..."
    
    # Validate all prerequisites
    check_gource_installed
    check_ffmpeg_installed
    check_git_repo
    validate_frame_rate
    validate_output_path
    check_git_commits
    
    log_info "All prerequisites validated. Generating visualization..."
    log_info "This may take a few minutes depending on repository size..."
    
    # Create temporary directory for intermediate files
    local temp_dir
    temp_dir="$(mktemp -d)"
    trap "rm -rf '${temp_dir}'" EXIT
    
    log_info "Using temporary directory: ${temp_dir}"
    
    # Generate the visualization using gource
    # Settings explanation:
    #   -1920x1080: Resolution
    #   --seconds-per-commit: Controls playback speed (0.1 = 10 commits/sec)
    #   --title: Display title
    #   --highlight-dirs: Highlight directory changes
    #   --file-idle-time: How long files stay highlighted
    #   --max-file-lag: Maximum lag for file updates
    #   --background: Background color
    #   --font-size: Text size
    #   --dir-colour: Directory color
    #   --user-scale: User avatar scale
    #   --bloom-multiplier: Visual bloom effect
    #   -o: Output ppm format for piping to ffmpeg
    
    if ! gource \
        -${GOURCE_WIDTH}x${GOURCE_HEIGHT} \
        --seconds-per-commit "${SECONDS_PER_COMMIT}" \
        --title "${GOURCE_TITLE}" \
        --highlight-dirs \
        --file-idle-time 3 \
        --max-file-lag 0.5 \
        --background 000000 \
        --font-size 18 \
        --dir-colour 00aa00 \
        --user-scale 1.5 \
        --bloom-multiplier 1.2 \
        -o - "${PROJECT_ROOT}" 2>/dev/null | \
        ffmpeg \
        -y \
        -r "${FRAME_RATE}" \
        -f image2pipe \
        -vcodec ppm \
        -i - \
        -vcodec libx264 \
        -preset medium \
        -pix_fmt yuv420p \
        -crf 18 \
        "${OUTPUT_FILE}" 2>/dev/null; then
        exit_with_error "Failed to generate MP4 file. Check that gource and ffmpeg are working correctly." 1
    fi
    
    # Verify output file was created and has reasonable size
    if [ ! -f "${OUTPUT_FILE}" ]; then
        exit_with_error "Output file was not created: ${OUTPUT_FILE}" 1
    fi
    
    local file_size
    file_size="$(stat -f%z "${OUTPUT_FILE}" 2>/dev/null || stat -c%s "${OUTPUT_FILE}" 2>/dev/null || echo "0")"
    
    if [ "${file_size}" -lt 1048576 ]; then
        exit_with_error "Output file is too small (${file_size} bytes). Generation may have failed." 1
    fi
    
    log_success "Visualization generated successfully!"
    log_info "Output file: ${OUTPUT_FILE}"
    log_info "File size: $(numfmt --to=iec-i --suffix=B "${file_size}" 2>/dev/null || echo "${file_size} bytes")"
    log_info "Frame rate: ${FRAME_RATE} fps"
    log_info "Resolution: ${GOURCE_WIDTH}x${GOURCE_HEIGHT}"
    log_info "Timing: ${SECONDS_PER_COMMIT} seconds per commit"
}

# ============================================================================
# Entry Point
# ============================================================================

main "$@"
