# How to Watch the Build with Live Progress Dashboard

This guide walks you through running the dinolab build system with a live progress dashboard visible in your terminal. Follow each step exactly as written—all commands are copy-paste ready.

## 1. Setup Commands

First, ensure you have the required dependencies installed. Run these commands in order:

```bash
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt
```

If you encounter any permission errors, you may need to add `--user` flag:

```bash
pip install --user --upgrade pip setuptools wheel
pip install --user -r requirements.txt
```

## 2. Activate Python Virtual Environment

Activate your Python virtual environment before running the build. Choose the command for your operating system:

**On Linux/macOS:**

```bash
source venv/bin/activate
```

**On Windows (Command Prompt):**

```bash
venv\Scripts\activate.bat
```

**On Windows (PowerShell):**

```bash
venv\Scripts\Activate.ps1
```

You should see `(venv)` appear at the beginning of your terminal prompt, indicating the virtual environment is active.

## 3. Run the Build with Dashboard

Once your virtual environment is activated, run the build command with the `--dashboard` flag:

```bash
python build.py --dashboard
```

This command will start the build process and display a live progress dashboard in your terminal.

## 4. What to Expect in the Progress Screen

When the build starts with the `--dashboard` flag, you will see:

- **Real-time progress bar** showing overall build completion percentage
- **Task list** displaying all build tasks with their current status (pending, running, completed, failed)
- **Live log output** from the currently executing tasks
- **Elapsed time** counter showing how long the build has been running
- **Estimated time remaining** (if available)
- **Task execution details** including task name, start time, and duration

The dashboard updates automatically every second. Do not interrupt the process—let it run to completion. You will see a final summary when the build finishes successfully.

## 5. Next Steps: Run the Gource Movie

After the build completes successfully, you can visualize the build history as an animated movie using Gource. First, install Gource if you haven't already:

```bash
# On macOS (using Homebrew)
brew install gource

# On Ubuntu/Debian
sudo apt-get install gource

# On Windows (using Chocolatey)
choco install gource
```

Then generate and play the Gource visualization:

```bash
python build.py --gource
```

This will generate a Gource visualization of the build process and open it in your default media player.

## 6. Access the Local Site in Browser

After the build completes, the local development site is available at:

```
http://localhost:5173
```

Open this URL in your web browser to view the built site. If port 5173 is already in use, check the build output for an alternative port number (it will be displayed in the console output).

**Troubleshooting:**
- If the site doesn't load, ensure the build completed without errors
- Check that no firewall is blocking localhost connections
- Try clearing your browser cache (Ctrl+Shift+Delete or Cmd+Shift+Delete)
- If port 5173 is unavailable, the build system will automatically use the next available port (5174, 5175, etc.)

## Summary

You now have a complete workflow:

1. Install dependencies
2. Activate virtual environment
3. Run `python build.py --dashboard` to watch the live progress
4. Wait for build completion
5. Optionally run `python build.py --gource` to see the visualization
6. Visit `http://localhost:5173` in your browser to see the result

Happy building!
