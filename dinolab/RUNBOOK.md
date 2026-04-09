# Dinolab Development Runbook

Welcome to Dinolab! This runbook will guide you through setting up your development environment and running the project locally.

---

## Prerequisites

Before you start, ensure you have the following installed on your system:

- **Node.js 18+** — [Download here](https://nodejs.org/)
  - Verify: `node --version`
- **Python 3.9+** — [Download here](https://www.python.org/)
  - Verify: `python3 --version`
- **Git** — For cloning the repository
  - Verify: `git --version`

---

## Step 1: Clone and Setup

### 1.1 Clone the repository

```bash
git clone <repository-url>
cd dinolab
```

### 1.2 Install Node.js dependencies

```bash
npm install
```

**What to expect:** You'll see npm downloading packages. This may take 1–2 minutes. You should see a `node_modules` folder created and a `package-lock.json` file updated.

### 1.3 Set up Python virtual environment (optional but recommended)

```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

**What to expect:** Your terminal prompt will show `(venv)` at the beginning, indicating the virtual environment is active.

### 1.4 Install Python dependencies (if needed)

If there's a `requirements.txt` in the project:

```bash
pip install -r requirements.txt
```

---

## Step 2: Run the Web Dev Server

### 2.1 Start the Vite development server

```bash
npm run dev
```

**What to expect:**
- You'll see output like:
  ```
  VITE v4.x.x ready in xxx ms
  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
  ```
- The dev server is now running and watching for file changes.
- **Do not close this terminal** — keep it running while you develop.

---

## Step 3 (Optional): Start the Local Ask Server

If your project includes a Python backend server:

### 3.1 In a new terminal, activate the Python environment

```bash
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3.2 Run the local ask server

```bash
python local_ask_server.py
```

**What to expect:**
- You'll see output indicating the server is running (e.g., `Running on http://localhost:5000`)
- This server handles backend requests from your frontend.
- Keep this terminal open while developing.

---

## Step 4: Open in Browser

### 4.1 Open your browser

Navigate to:

```
http://localhost:5173/
```

**What to expect:**
- You should see the Dinolab application loaded in your browser.
- The page will auto-refresh whenever you save changes to your code (hot module replacement).
- Open your browser's Developer Tools (F12 or Cmd+Option+I) to check for any errors.

---

## Step 5: Development Workflow

- **Edit files** in your code editor (VS Code, WebStorm, etc.)
- **Save changes** — the browser automatically refreshes
- **Check the dev server terminal** for any build errors
- **Use browser DevTools** to debug JavaScript and inspect elements

---

## Step 6: Generate Gource Movie (After Development)

When you're ready to visualize your project history:

### 6.1 Ensure Gource is installed

```bash
# On macOS:
brew install gource

# On Ubuntu/Debian:
sudo apt-get install gource

# On Windows:
# Download from: https://gource.io/
```

### 6.2 Generate the Gource visualization

```bash
gource --output-framerate 60 --output-ppm-stream - . | ffmpeg -y -r 60 -f image2pipe -vcodec ppm -i - -vcodec libx264 -preset ultrafast -pix_fmt yuv420p -crf 1 -threads 0 -r 60 dinolab-history.mp4
```

**What to expect:**
- Gource will analyze your git history and generate a video file `dinolab-history.mp4`.
- This may take several minutes depending on your repository size.
- The output file will be in your project root directory.

### 6.3 View the movie

```bash
# On macOS:
open dinolab-history.mp4

# On Linux:
xdg-open dinolab-history.mp4

# On Windows:
start dinolab-history.mp4
```

---

## Troubleshooting

### Issue: "node_modules not found" or npm errors

**Solution:**
```bash
rm -rf node_modules package-lock.json  # On Windows: rmdir /s node_modules, del package-lock.json
npm install
```

**Why:** Corrupted dependencies or incomplete installation. A fresh install usually fixes it.

---

### Issue: Port 5173 already in use

**Solution 1:** Kill the process using port 5173
```bash
# On macOS/Linux:
lsof -i :5173
kill -9 <PID>

# On Windows:
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

**Solution 2:** Use a different port
```bash
npm run dev -- --port 5174
```

**Why:** Another application (or a previous dev server) is using the same port.

---

### Issue: Python venv not activating

**Solution:**
- **macOS/Linux:** Use `source venv/bin/activate`
- **Windows (PowerShell):** Use `venv\Scripts\Activate.ps1`
- **Windows (Command Prompt):** Use `venv\Scripts\activate.bat`

**Why:** Different shells use different activation scripts.

---

### Issue: Python module not found or import errors

**Solution:**
```bash
# Ensure venv is activated
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

**Why:** Dependencies may not be installed in the active environment.

---

### Issue: Browser shows blank page or "Cannot GET /"

**Solution:**
1. Check the dev server terminal for build errors
2. Hard refresh your browser: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (macOS)
3. Clear browser cache: Open DevTools → Application → Storage → Clear Site Data
4. Restart the dev server: Stop it with `Ctrl+C` and run `npm run dev` again

**Why:** Build errors, stale cache, or the dev server didn't start correctly.

---

### Issue: Changes not reflecting in browser

**Solution:**
1. Verify the dev server is running (check the terminal for the "ready" message)
2. Hard refresh: `Ctrl+Shift+R` or `Cmd+Shift+R`
3. Check for TypeScript/build errors in the dev server terminal
4. Restart the dev server if needed

**Why:** Hot module replacement may fail if there are syntax errors or the file wasn't saved properly.

---

### Issue: "Permission denied" when running scripts

**Solution:**
```bash
chmod +x local_ask_server.py
python local_ask_server.py
```

**Why:** The script file doesn't have execute permissions.

---

### Issue: Gource command not found

**Solution:**
- Reinstall Gource (see Step 6.1)
- Verify installation: `gource --version`
- On some systems, you may need to use the full path: `/usr/local/bin/gource`

**Why:** Gource isn't installed or not in your system PATH.

---

## Quick Reference

| Command | Purpose |
|---------|----------|
| `npm install` | Install Node.js dependencies |
| `npm run dev` | Start Vite dev server |
| `python local_ask_server.py` | Start Python backend server |
| `source venv/bin/activate` | Activate Python virtual environment |
| `gource ...` | Generate project history visualization |

---

## Need Help?

- Check the project's **README.md** for architecture overview
- Review **Contributing.md** for code style guidelines
- Open an issue on the project repository with:
  - Your OS and versions (`node --version`, `python3 --version`)
  - The exact error message
  - Steps to reproduce

---

**Happy coding! 🦕**
