# Local Ask Server Setup Guide

This guide walks you through running the Ask Server locally on your machine before deploying to the cloud. Follow each step in order.

---

## Prerequisites

- Python 3.8 or higher installed
- `pip` package manager available
- Git repository cloned locally
- A terminal/command prompt

---

## Step 1: Create and Activate Python Virtual Environment

A virtual environment isolates project dependencies from your system Python.

### On macOS/Linux:

```bash
cd dinolab/infra
python3 -m venv venv
source venv/bin/activate
```

You should see `(venv)` appear at the start of your terminal prompt.

### On Windows (Command Prompt):

```cmd
cd dinolab\infra
python -m venv venv
venv\Scripts\activate.bat
```

### On Windows (PowerShell):

```powershell
cd dinolab\infra
python -m venv venv
venv\Scripts\Activate.ps1
```

**Expected output:** Your prompt changes to show `(venv)` prefix.

---

## Step 2: Install Dependencies

With the virtual environment activated, install all required packages.

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

**Expected output:**
```
Collecting flask
Collecting requests
...
Successfully installed flask-2.x.x requests-2.x.x ...
```

If you see `ERROR: Could not find a version that satisfies the requirement`, check that `requirements.txt` exists in `dinolab/infra/` and contains valid package names.

---

## Step 3: Run the Local Ask Server

Start the server with:

```bash
python local_ask_server.py
```

**Expected output:**
```
 * Running on http://127.0.0.1:5000
 * Debug mode: on
 * WARNING: This is a development server. Do not use it in production.
```

The server listens on **port 5000** by default (http://localhost:5000).

**Note:** The server will keep running. Open a new terminal tab/window for the next steps while keeping this one open.

---

## Step 4: Test the Local Server

Open a new terminal (keep the server running in the original one) and test the API.

### Test with curl (macOS/Linux/Windows PowerShell):

```bash
curl http://localhost:5000/health
```

**Expected output:**
```json
{"status":"ok"}
```

### Test with a POST request:

```bash
curl -X POST http://localhost:5000/ask \
  -H "Content-Type: application/json" \
  -d '{"question":"What is 2+2?"}'
```

**Expected output:**
```json
{"answer":"4","status":"success"}
```

### Test with Python (alternative):

Create a file `test_server.py` in your current directory:

```python
import requests

response = requests.get('http://localhost:5000/health')
print(f"Status: {response.status_code}")
print(f"Response: {response.json()}")

response = requests.post('http://localhost:5000/ask', 
                         json={"question": "What is 2+2?"})
print(f"Answer: {response.json()}")
```

Run it:

```bash
python test_server.py
```

**Expected output:**
```
Status: 200
Response: {'status': 'ok'}
Answer: {'answer': '4', 'status': 'success'}
```

---

## Step 5: Point the Web UI to the Local Server

The web UI needs to know where to send requests. Configure it via environment variables.

### Navigate to the web directory:

```bash
cd dinolab/web
```

### Create or edit `.env` file:

**On macOS/Linux:**

```bash
echo "REACT_APP_ASK_SERVER_URL=http://localhost:5000" > .env
```

**On Windows (Command Prompt):**

```cmd
echo REACT_APP_ASK_SERVER_URL=http://localhost:5000 > .env
```

### Verify the file was created:

```bash
cat .env        # macOS/Linux
type .env       # Windows
```

**Expected output:**
```
REACT_APP_ASK_SERVER_URL=http://localhost:5000
```

### Start the web UI (in a separate terminal):

Make sure you're in `dinolab/web/` directory:

```bash
npm start
```

The web UI should open in your browser at `http://localhost:3000` and connect to your local server.

---

## Troubleshooting

### Issue: `ModuleNotFoundError: No module named 'flask'`

**Cause:** Virtual environment not activated or dependencies not installed.

**Solution:**
1. Verify virtual environment is activated (you should see `(venv)` in your prompt)
2. Run `pip install -r requirements.txt` again
3. If still failing, try `pip install flask requests` explicitly

### Issue: `Address already in use` or `Port 5000 is already in use`

**Cause:** Another process is using port 5000.

**Solution (macOS/Linux):**
```bash
# Find what's using port 5000
lsof -i :5000
# Kill the process (replace PID with the number shown)
kill -9 <PID>
```

**Solution (Windows):**
```cmd
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

**Alternative:** Change the port in `local_ask_server.py` (look for `app.run(port=5000)`) and update `.env` to match.

### Issue: `Connection refused` when testing with curl

**Cause:** Server is not running or listening on the wrong port.

**Solution:**
1. Check that `python local_ask_server.py` is still running in its terminal
2. Verify the output shows `Running on http://127.0.0.1:5000`
3. Try `curl http://127.0.0.1:5000/health` (use 127.0.0.1 instead of localhost)

### Issue: Web UI shows "Cannot connect to server"

**Cause:** `.env` file not set correctly or web UI not restarted.

**Solution:**
1. Check `.env` file in `dinolab/web/` contains `REACT_APP_ASK_SERVER_URL=http://localhost:5000`
2. Stop the web UI (`Ctrl+C`)
3. Restart it: `npm start`
4. Check browser console for errors (F12 → Console tab)

### Issue: `command not found: python3` or `python`

**Cause:** Python is not installed or not in your PATH.

**Solution:**
1. Install Python 3.8+ from https://www.python.org/
2. Verify installation: `python --version` or `python3 --version`
3. On macOS, you may need to use `python3` instead of `python`

### Issue: `pip: command not found`

**Cause:** pip is not installed with Python.

**Solution:**
1. Reinstall Python (ensure "pip" is checked during installation)
2. Try: `python -m pip --version`
3. Use `python -m pip install` instead of `pip install`

---

## Quick Reference: Full Workflow

**Terminal 1 (Server):**
```bash
cd dinolab/infra
python3 -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
python local_ask_server.py
```

**Terminal 2 (Testing):**
```bash
curl http://localhost:5000/health
```

**Terminal 3 (Web UI):**
```bash
cd dinolab/web
echo "REACT_APP_ASK_SERVER_URL=http://localhost:5000" > .env
npm start
```

Visit `http://localhost:3000` in your browser.

---

## Next Steps

- Test the full workflow: ask questions via the web UI and verify responses
- Check logs in the server terminal for debugging
- Once working locally, refer to deployment documentation for cloud setup
- Keep the server running while developing the web UI

---

## Getting Help

If you encounter issues:
1. Read the error message carefully — it usually tells you what's wrong
2. Check the **Troubleshooting** section above
3. Verify all commands were copied exactly (watch for typos)
4. Ensure you're in the correct directory before running commands
5. Check that ports 5000 and 3000 are not blocked by a firewall
