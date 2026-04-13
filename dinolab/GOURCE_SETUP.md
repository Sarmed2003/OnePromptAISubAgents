# Gource Setup Guide

This guide walks you through installing and running Gource to generate a visualization of your repository's development history as a movie.

## Table of Contents

1. [Installation](#installation)
2. [Prerequisites](#prerequisites)
3. [Usage](#usage)
4. [Parameter Customization](#parameter-customization)
5. [Troubleshooting](#troubleshooting)
6. [Output Expectations](#output-expectations)

## Installation

Gource is available for macOS, Linux, and Windows. Follow the instructions for your operating system.

### macOS

#### Using Homebrew (Recommended)

If you have Homebrew installed, the easiest way to install Gource is:

```bash
brew install gource
```

#### Manual Installation

If you don't have Homebrew:

1. Visit the [Gource releases page](https://github.com/acaudwell/Gource/releases)
2. Download the macOS binary
3. Extract and move it to your `/Applications` folder
4. Add Gource to your PATH by adding this line to your `~/.bash_profile` or `~/.zshrc`:
   ```bash
   export PATH="/Applications/Gource.app/Contents/MacOS:$PATH"
   ```
5. Run `source ~/.bash_profile` or `source ~/.zshrc` to apply changes

### Linux

#### Ubuntu/Debian

```bash
sudo apt-get update
sudo apt-get install gource
```

#### Fedora/RHEL

```bash
sudo dnf install gource
```

#### Arch Linux

```bash
sudo pacman -S gource
```

#### From Source

If your distribution doesn't have Gource in its repositories:

```bash
# Install dependencies
sudo apt-get install build-essential libsdl2-dev libsdl2-image-dev libglew-dev libfreetype6-dev

# Clone and build
git clone https://github.com/acaudwell/Gource.git
cd Gource
mkdir build && cd build
cmake ..
make
sudo make install
```

### Windows

#### Using Chocolatey (Recommended)

If you have Chocolatey installed:

```powershell
choco install gource
```

#### Manual Installation

1. Visit the [Gource releases page](https://github.com/acaudwell/Gource/releases)
2. Download the Windows installer (.exe)
3. Run the installer and follow the on-screen instructions
4. Add Gource to your PATH:
   - Right-click "This PC" or "My Computer" and select "Properties"
   - Click "Advanced system settings"
   - Click "Environment Variables"
   - Under "System variables", click "New"
   - Variable name: `PATH`
   - Variable value: `C:\Program Files\Gource` (or your installation directory)
   - Click OK and restart your terminal

## Prerequisites

Before running the Gource movie generation script, ensure you have the following installed:

### Git

Gource reads your repository's git history. Verify git is installed:

```bash
git --version
```

If not installed, visit [git-scm.com](https://git-scm.com/) and follow their installation instructions.

### FFmpeg

FFmpeg is required to convert the Gource visualization into a video file. Check if it's installed:

```bash
ffmpeg -version
```

#### Installing FFmpeg

**macOS (Homebrew):**
```bash
brew install ffmpeg
```

**Ubuntu/Debian:**
```bash
sudo apt-get install ffmpeg
```

**Fedora/RHEL:**
```bash
sudo dnf install ffmpeg
```

**Windows (Chocolatey):**
```powershell
choco install ffmpeg
```

**Windows (Manual):**
1. Visit [ffmpeg.org/download.html](https://ffmpeg.org/download.html)
2. Download the Windows build
3. Extract to a folder (e.g., `C:\ffmpeg`)
4. Add the folder to your PATH following the same steps as Gource installation above

### Verify Prerequisites

Run this command to check all prerequisites:

```bash
gource --version && git --version && ffmpeg -version
```

You should see version information for all three tools.

## Usage

### Basic Usage

The `gource-movie.sh` script automates the process of generating a Gource visualization and converting it to a video.

#### Step 1: Navigate to Your Repository

```bash
cd /path/to/your/repository
```

#### Step 2: Run the Script

```bash
/path/to/dinolab/scripts/gource-movie.sh
```

Or, if the script is in your PATH:

```bash
gource-movie.sh
```

#### Step 3: Wait for Completion

The script will:
1. Generate a Gource visualization of your repository
2. Capture the output as a video
3. Save the video file in your repository directory

Processing time depends on repository size and history (see [Output Expectations](#output-expectations)).

### Running from Any Directory

To make the script accessible from any directory:

1. Add the script's directory to your PATH, or
2. Create a symbolic link:
   ```bash
   ln -s /path/to/dinolab/scripts/gource-movie.sh /usr/local/bin/gource-movie
   ```

## Parameter Customization

The `gource-movie.sh` script accepts several parameters to customize the visualization. Edit the script or pass parameters as environment variables.

### Common Parameters

#### Video Resolution

Set the output video resolution (default: 1920x1080):

```bash
export GOURCE_RESOLUTION="1280x720"
gource-movie.sh
```

Common resolutions:
- `1280x720` — HD (720p)
- `1920x1080` — Full HD (1080p)
- `3840x2160` — 4K

#### Video Duration

Set how long the video should be (in seconds). Gource will speed up or slow down the visualization accordingly:

```bash
export GOURCE_DURATION="120"
gource-movie.sh
```

#### Frame Rate

Set the video frame rate (default: 30 fps):

```bash
export GOURCE_FPS="60"
gource-movie.sh
```

#### Output File

Specify the output video filename:

```bash
export GOURCE_OUTPUT="my-repo-visualization.mp4"
gource-movie.sh
```

#### Repository Path

Visualize a different repository:

```bash
export GOURCE_REPO="/path/to/other/repo"
gource-movie.sh
```

### Advanced Customization

For more control, edit the `gource-movie.sh` script directly. Common Gource options include:

- `--hide dirnames,files,users` — Hide certain elements
- `--start-date` — Start visualization from a specific date
- `--stop-date` — End visualization at a specific date
- `--max-files` — Limit the number of files shown
- `--max-user-speed` — Limit user movement speed

Refer to `gource --help` for a complete list of options.

## Troubleshooting

### "gource: command not found"

**Problem:** Gource is not in your PATH.

**Solution:**
1. Verify Gource is installed: `which gource` or `gource --version`
2. If not found, reinstall Gource following the [Installation](#installation) section
3. If installed, add its directory to your PATH and restart your terminal

### "ffmpeg: command not found"

**Problem:** FFmpeg is not in your PATH.

**Solution:**
1. Verify FFmpeg is installed: `which ffmpeg` or `ffmpeg -version`
2. If not found, install FFmpeg following the [Prerequisites](#prerequisites) section
3. Restart your terminal after installation

### "fatal: not a git repository"

**Problem:** The script is not running in a git repository.

**Solution:**
1. Navigate to the root directory of your git repository: `cd /path/to/repo`
2. Verify it's a git repo: `git status`
3. Run the script again

### Script Hangs or Takes Too Long

**Problem:** The script is taking an unusually long time or appears to hang.

**Solution:**
1. Press `Ctrl+C` to stop the script
2. Try with a smaller repository or date range:
   ```bash
   export GOURCE_DURATION="60"
   export GOURCE_RESOLUTION="1280x720"
   gource-movie.sh
   ```
3. Check available disk space: `df -h`
4. Check available memory: `free -h` (Linux) or `vm_stat` (macOS)

### Video Quality Issues

**Problem:** The output video is pixelated or low quality.

**Solution:**
1. Increase the resolution:
   ```bash
   export GOURCE_RESOLUTION="1920x1080"
   gource-movie.sh
   ```
2. Increase the frame rate:
   ```bash
   export GOURCE_FPS="60"
   gource-movie.sh
   ```

### "Permission denied" Error

**Problem:** The script cannot be executed.

**Solution:**
Make the script executable:
```bash
chmod +x /path/to/dinolab/scripts/gource-movie.sh
```

### Output File Not Created

**Problem:** The script completes but no video file is generated.

**Solution:**
1. Check for error messages in the terminal output
2. Verify write permissions in the current directory: `touch test.txt` then `rm test.txt`
3. Try specifying an absolute path for the output file:
   ```bash
   export GOURCE_OUTPUT="/tmp/gource-output.mp4"
   gource-movie.sh
   ```

### macOS: "gource cannot be opened because the developer cannot be verified"

**Problem:** macOS security prevents running Gource.

**Solution:**
1. Open System Preferences → Security & Privacy
2. Click the lock icon to unlock
3. Look for Gource in the "Allow apps downloaded from" section
4. Click "Allow Anyway" next to Gource
5. Try running Gource again

Alternatively, install via Homebrew to avoid this issue.

## Output Expectations

### Video File

The script generates an MP4 video file named `gource-movie.mp4` (or your custom name) in the current directory.

### File Size

Expected file sizes vary by repository and settings:

- **Small repo** (< 100 commits): 10–50 MB at 1080p
- **Medium repo** (100–1000 commits): 50–200 MB at 1080p
- **Large repo** (> 1000 commits): 200–1000+ MB at 1080p

Higher resolutions and frame rates increase file size.

### Video Duration

The video duration depends on your repository's history and the `GOURCE_DURATION` setting:

- **Default:** Gource automatically calculates duration based on commit count
- **Custom:** Set `GOURCE_DURATION` to a specific number of seconds

### Processing Time

Expected processing time:

| Repository Size | Resolution | Expected Time |
|---|---|---|
| Small (< 100 commits) | 1280x720 | 2–5 minutes |
| Small (< 100 commits) | 1920x1080 | 3–8 minutes |
| Medium (100–1000 commits) | 1280x720 | 5–15 minutes |
| Medium (100–1000 commits) | 1920x1080 | 10–25 minutes |
| Large (> 1000 commits) | 1280x720 | 15–60 minutes |
| Large (> 1000 commits) | 1920x1080 | 30–120 minutes |

Processing time is affected by:
- Number of commits in history
- Number of files in the repository
- System performance (CPU, disk speed)
- Video resolution and frame rate

### Visualization Elements

The generated video shows:

- **Files:** Represented as dots that grow and shrink as they're modified
- **Directories:** Organized hierarchically; files cluster by directory
- **Users:** Each user has a unique color; lines show file modifications
- **Time:** Displayed in the bottom-right corner; shows repository timeline
- **Activity:** Speed of animation indicates commit frequency

### Playback

The video can be played with any standard video player:

```bash
# macOS
open gource-movie.mp4

# Linux
mpv gource-movie.mp4
# or
ffplay gource-movie.mp4

# Windows
start gource-movie.mp4
```

### Sharing

The generated MP4 file can be:
- Uploaded to video platforms (YouTube, Vimeo)
- Embedded in presentations or documentation
- Shared via email or file transfer services
- Used in project portfolios or team presentations
