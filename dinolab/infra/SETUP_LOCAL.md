# Local Ask Server Setup Guide

This guide walks you through running the Ask Server locally on your machine before deploying to the cloud. Follow each step in order.

---

## 🛡️ Laptop First: Why Local Testing Matters

**Your laptop is your safest testing ground.** Before deploying to AWS, run everything locally first. This approach:

- **Saves money** — No AWS charges for local testing
- **Speeds up iteration** — Instant feedback without cloud latency
- **Prevents accidents** — Test breaking changes safely before they reach production
- **Enables offline work** — Develop without internet (except for initial setup)
- **Builds confidence** — Verify the entire stack works end-to-end before cloud deployment

**Golden Rule:** If it doesn't work locally, it won't work in the cloud. Always test locally first.

---

## Prerequisites

Before you begin, ensure your machine has the following installed:

### Python 3.9 or Higher

The Ask Server requires Python 3.9+.

**Check your version:**
```bash
python --version
# or
python3 --version
```

**Expected output:** `Python 3.9.x`, `3.10.x`, `3.11.x`, or higher.

**Install Python:**
- **macOS:** `brew install python@3.11` or visit https://www.python.org/
- **Windows:** Download from https://www.python.org/ (check "Add Python to PATH" during installation)
- **Linux (Ubuntu/Debian):** `sudo apt-get install python3.9 python3.9-venv python3-pip`
- **Linux (Fedora/RHEL):** `sudo dnf install python3.9 python3-pip`

### AWS CLI (v2)

Required for AWS credentials and configuration.

**Check if installed:**
```bash
aws --version
```

**Install AWS CLI v2:**
- **macOS:** `brew install awscli` or https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html
- **Windows:** https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html
- **Linux:** `curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && unzip awscliv2.zip && sudo ./aws/install`

**Configure AWS credentials:**
```bash
aws configure
```

You'll be prompted for:
- AWS Access Key ID
- AWS Secret Access Key
- Default region (e.g., `us-east-1`)
- Default output format (e.g., `json`)

### AWS SAM CLI

SAM (Serverless Application Model) CLI enables local Lambda testing.

**Check if installed:**
```bash
sam --version
```

**Install SAM CLI:**
- **macOS:** `brew install aws-sam-cli`
- **Windows:** Download from https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html or `choco install aws-sam-cli`
- **Linux:** `pip install aws-sam-cli`

**Verify installation:**
```bash
sam --version
# Expected output: SAM CLI, version 1.x.x or higher
```

### Docker (for SAM Local Emulation)

SAM uses Docker to run Lambda functions locally.

**Check if installed:**
```bash
docker --version
```

**Install Docker:**
- **macOS/Windows:** Download Docker Desktop from https://www.docker.com/products/docker-desktop
- **Linux:** `sudo apt-get install docker.io` (Ubuntu/Debian) or `sudo dnf install docker` (Fedora/RHEL)

**Verify Docker is running:**
```bash
docker ps
```

If you see a permission error, add your user to the docker group:
```bash
sudo usermod -aG docker $USER
newgrp docker
```

### Git

Required to clone the repository.

**Check if installed:**
```bash
git --version
```

**Install Git:** https://git-scm.com/downloads

### pip and Virtual Environment Support

**Verify pip:**
```bash
pip --version
# or
python -m pip --version
```

**Verify venv support:**
```bash
python -m venv --help
```

---

## Step 1: Clone and Navigate to the Infra Directory

```bash
git clone <repository-url>
cd dinolab/infra
```

**Expected output:** You're now in the `dinolab/infra/` directory.

---

## Step 2: Create and Activate Python Virtual Environment

A virtual environment isolates project dependencies from your system Python.

### On macOS/Linux:

```bash
python3 -m venv venv
source venv/bin/activate
```

You should see `(venv)` appear at the start of your terminal prompt.

### On Windows (Command Prompt):

```cmd
python -m venv venv
venv\Scripts\activate.bat
```

### On Windows (PowerShell):

```powershell
python -m venv venv
venv\Scripts\Activate.ps1
```

**Expected output:** Your prompt changes to show `(venv)` prefix.

**Deactivate later with:**
```bash
deactivate
```

---

## Step 3: Install Dependencies

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

**Troubleshooting:**
- If you see `ERROR: Could not find a version that satisfies the requirement`, check that `requirements.txt` exists in `dinolab/infra/` and contains valid package names.
- If installation hangs, try: `pip install --upgrade pip setuptools wheel` first.

---

## Step 4: Set Up Environment Variables

Environment variables configure the Ask Server behavior.

### Create `.env` file in `dinolab/infra/`:

**On macOS/Linux:**
```bash
cat > .env << 'EOF'
# Local Ask Server Configuration
FLASK_ENV=development
FLASK_DEBUG=True
ASK_SERVER_PORT=5000
ASK_SERVER_HOST=127.0.0.1
EOF
```

**On Windows (Command Prompt):**
```cmd
(
  echo # Local Ask Server Configuration
  echo FLASK_ENV=development
  echo FLASK_DEBUG=True
  echo ASK_SERVER_PORT=5000
  echo ASK_SERVER_HOST=127.0.0.1
) > .env
```

### Create `.env.local` for sensitive overrides (optional):

If you need environment-specific overrides (e.g., different API keys), create `.env.local` in the same directory. This file is typically gitignored and not committed.

```bash
echo "AWS_PROFILE=local" > .env.local
```

**Verify the file:**
```bash
cat .env        # macOS/Linux
type .env       # Windows
```

**Expected output:**
```
# Local Ask Server Configuration
FLASK_ENV=development
FLASK_DEBUG=True
ASK_SERVER_PORT=5000
ASK_SERVER_HOST=127.0.0.1
```

---

## Step 5: Build the SAM Template

SAM uses a template file (usually `template.yaml`) to define Lambda functions and APIs.

### Build the template:

```bash
sam build
```

**Expected output:**
```
Building resources
Building the package
Built artifacts are stored under the .aws-sam directory
```

This creates a `.aws-sam/` directory with optimized code ready for local execution.

**Troubleshooting:**
- If you see `template.yaml not found`, ensure `dinolab/infra/template.yaml` exists.
- If build fails with Python errors, verify your code has no syntax errors: `python -m py_compile src/*.py`

---

## Step 6: Start the Local API Gateway and Lambda Emulator

Use SAM to run the API and Lambda functions locally.

```bash
sam local start-api
```

**Expected output:**
```
Mounting HelloWorldFunction at http://127.0.0.1:3001/ask [POST]
You can now browse to http://127.0.0.1:3001 to invoke your functions.
WARNING: This is a development server. Do not use it in production.
```

The local API Gateway listens on **http://127.0.0.1:3001** by default.

**Note:** The server will keep running. Open a new terminal tab/window for the next steps while keeping this one open.

**Custom port:**
If port 3001 is in use, specify a different port:
```bash
sam local start-api --port 3002
```

---

## Step 7: Test the Local Ask Endpoint

Open a new terminal (keep the SAM server running in the original one) and test the API.

### Test with curl (macOS/Linux/Windows PowerShell):

**Health check:**
```bash
curl http://127.0.0.1:3001/health
```

**Expected output:**
```json
{"status":"ok"}
```

**POST request to /ask endpoint:**
```bash
curl -X POST http://127.0.0.1:3001/ask \
  -H "Content-Type: application/json" \
  -d '{"question":"What is 2+2?"}'
```

**Expected output:**
```json
{"answer":"4","status":"success"}
```

**With verbose output (for debugging):**
```bash
curl -v -X POST http://127.0.0.1:3001/ask \
  -H "Content-Type: application/json" \
  -d '{"question":"What is 2+2?"}'
```

### Test with Postman:

1. **Open Postman** (download from https://www.postman.com/downloads/ if needed)
2. **Create a new POST request:**
   - URL: `http://127.0.0.1:3001/ask`
   - Method: POST
   - Headers: `Content-Type: application/json`
   - Body (raw JSON):
     ```json
     {"question":"What is 2+2?"}
     ```
3. **Click Send**
4. **Verify response:** You should see the answer in the response body

### Test with Python:

Create a file `test_local_ask.py` in a new terminal:

```python
import requests
import json

BASE_URL = "http://127.0.0.1:3001"

# Test health endpoint
print("Testing /health endpoint...")
response = requests.get(f"{BASE_URL}/health")
print(f"Status: {response.status_code}")
print(f"Response: {response.json()}")
print()

# Test ask endpoint
print("Testing /ask endpoint...")
payload = {"question": "What is 2+2?"}
response = requests.post(f"{BASE_URL}/ask", json=payload)
print(f"Status: {response.status_code}")
print(f"Response: {response.json()}")
print()

# Test with different question
print("Testing /ask with another question...")
payload = {"question": "What is the capital of France?"}
response = requests.post(f"{BASE_URL}/ask", json=payload)
print(f"Status: {response.status_code}")
print(f"Response: {response.json()}")
```

**Run it:**
```bash
python test_local_ask.py
```

**Expected output:**
```
Testing /health endpoint...
Status: 200
Response: {'status': 'ok'}

Testing /ask endpoint...
Status: 200
Response: {'answer': '4', 'status': 'success'}

Testing /ask with another question...
Status: 200
Response: {'answer': 'Paris', 'status': 'success'}
```

---

## Step 8: Configure the Web UI to Use Local Ask Server

The web UI needs to know where to send requests.

### Navigate to the web directory:

```bash
cd dinolab/web
```

### Create or edit `.env` file:

**On macOS/Linux:**
```bash
echo "REACT_APP_ASK_SERVER_URL=http://127.0.0.1:3001" > .env
```

**On Windows (Command Prompt):**
```cmd
echo REACT_APP_ASK_SERVER_URL=http://127.0.0.1:3001 > .env
```

### Verify the file:

```bash
cat .env        # macOS/Linux
type .env       # Windows
```

**Expected output:**
```
REACT_APP_ASK_SERVER_URL=http://127.0.0.1:3001
```

### Install web dependencies (if not already done):

```bash
npm install
```

### Start the web UI (in a separate terminal):

```bash
npm start
```

**Expected output:**
```
Compiled successfully!
You can now view dinolab in the browser.

Local:            http://localhost:3000
```

The web UI opens automatically in your browser at `http://localhost:3000`.

---

## Step 9: Test the Full Workflow

With the SAM server running and the web UI open, test end-to-end:

1. **Navigate to http://localhost:3000** in your browser
2. **Enter a question** in the web UI (e.g., "What is 2+2?")
3. **Submit the question**
4. **Verify the response** appears from the local Ask Server
5. **Check the SAM terminal** for logs showing the request was processed

**Success indicators:**
- Web UI displays the answer
- No CORS errors in browser console (F12 → Console tab)
- SAM terminal shows `POST /ask` request log

---

## Switching Between Local and Production Ask Servers

Easily switch your web UI between local development and production without code changes.

### Use Local Server (Development):

**In `dinolab/web/.env`:**
```
REACT_APP_ASK_SERVER_URL=http://127.0.0.1:3001
```

**Then restart the web UI:**
```bash
npm start
```

### Use Production Server (After Deployment):

**In `dinolab/web/.env`:**
```
REACT_APP_ASK_SERVER_URL=https://your-production-domain.com
```

**Then restart the web UI:**
```bash
npm start
```

### Create Environment-Specific Files:

For convenience, create separate `.env` files:

**`.env.local` (development):**
```
REACT_APP_ASK_SERVER_URL=http://127.0.0.1:3001
```

**`.env.production` (production):**
```
REACT_APP_ASK_SERVER_URL=https://your-production-domain.com
```

**Switch by copying:**
```bash
cp .env.local .env        # Use local
cp .env.production .env   # Use production
npm start
```

---

## Troubleshooting

### Issue: `SAM: command not found`

**Cause:** SAM CLI is not installed or not in your PATH.

**Solution:**
1. Install SAM CLI: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html
2. Verify installation: `sam --version`
3. On macOS, ensure `/usr/local/bin` is in your PATH: `echo $PATH`

### Issue: `Address already in use` or `Port 3001 is already in use`

**Cause:** Another process is using port 3001 (or your chosen port).

**Solution (macOS/Linux):**
```bash
# Find what's using port 3001
lsof -i :3001
# Kill the process (replace PID with the number shown)
kill -9 <PID>
```

**Solution (Windows):**
```cmd
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

**Alternative:** Use a different port:
```bash
sam local start-api --port 3002
```

Then update `.env` in `dinolab/web/`:
```
REACT_APP_ASK_SERVER_URL=http://127.0.0.1:3002
```

### Issue: `Docker daemon is not running`

**Cause:** Docker is not started. SAM requires Docker to emulate Lambda.

**Solution:**
1. Start Docker:
   - **macOS/Windows:** Open Docker Desktop
   - **Linux:** `sudo systemctl start docker`
2. Verify Docker is running: `docker ps`
3. Retry: `sam local start-api`

### Issue: `Lambda runtime error` or `Task failed with exit code 1`

**Cause:** Error in your Lambda function code or dependencies.

**Solution:**
1. Check SAM logs for detailed error message
2. Verify syntax: `python -m py_compile src/*.py`
3. Check `requirements.txt` for missing dependencies
4. Rebuild: `sam build --use-container`
5. Retry: `sam local start-api`

**Example error message:**
```
SyntaxError in lambda_function.py line 42
ModuleNotFoundError: No module named 'requests'
```

### Issue: `Connection refused` when testing with curl

**Cause:** SAM server is not running or listening on wrong port.

**Solution:**
1. Check that `sam local start-api` is still running in its terminal
2. Verify the output shows `Mounting ... at http://127.0.0.1:3001`
3. Try `curl http://127.0.0.1:3001/health`
4. Check if port 3001 is in use: `lsof -i :3001` (macOS/Linux) or `netstat -ano | findstr :3001` (Windows)

### Issue: Web UI shows "Cannot connect to server"

**Cause:** `.env` file not set correctly, web UI not restarted, or CORS issue.

**Solution:**
1. Verify `.env` in `dinolab/web/` contains correct URL: `REACT_APP_ASK_SERVER_URL=http://127.0.0.1:3001`
2. Stop the web UI: `Ctrl+C`
3. Restart it: `npm start`
4. Check browser console for errors: F12 → Console tab
5. Verify SAM server is running and accessible: `curl http://127.0.0.1:3001/health`

**CORS error example:**
```
Access to XMLHttpRequest at 'http://127.0.0.1:3001/ask' from origin 'http://localhost:3000' 
has been blocked by CORS policy
```

**Fix:** Ensure your SAM template includes CORS headers in the Lambda response.

### Issue: `ModuleNotFoundError: No module named 'flask'`

**Cause:** Virtual environment not activated or dependencies not installed.

**Solution:**
1. Verify virtual environment is activated: You should see `(venv)` in your prompt
2. Run `pip install -r requirements.txt` again
3. If still failing, try `pip install flask requests` explicitly
4. Ensure you're in `dinolab/infra/` directory

### Issue: `command not found: python3` or `python`

**Cause:** Python is not installed or not in your PATH.

**Solution:**
1. Install Python 3.9+ from https://www.python.org/
2. Verify installation: `python --version` or `python3 --version`
3. On macOS, you may need to use `python3` instead of `python`
4. Add Python to PATH (Windows): https://docs.python.org/3/using/windows.html#finding-the-python-executable

### Issue: `pip: command not found`

**Cause:** pip is not installed with Python or not in your PATH.

**Solution:**
1. Reinstall Python (ensure "pip" is checked during installation)
2. Try: `python -m pip --version`
3. Use `python -m pip install` instead of `pip install`
4. On macOS: `python3 -m pip install --upgrade pip`

### Issue: AWS credentials not found or `Unable to locate credentials`

**Cause:** AWS CLI not configured with credentials.

**Solution:**
1. Configure AWS credentials: `aws configure`
2. Enter your AWS Access Key ID and Secret Access Key
3. Verify configuration: `aws sts get-caller-identity`
4. For local testing, you can use dummy credentials (SAM doesn't validate them locally)

### Issue: `template.yaml not found`

**Cause:** SAM template file is missing from `dinolab/infra/`.

**Solution:**
1. Verify `dinolab/infra/template.yaml` exists: `ls -la dinolab/infra/template.yaml`
2. If missing, check if it has a different name (e.g., `sam.yaml`)
3. Ensure you're in the correct directory: `pwd` should show `.../dinolab/infra`

---

## Quick Reference: Full Workflow

**Terminal 1 (SAM Local API):**
```bash
cd dinolab/infra
python3 -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install --upgrade pip
pip install -r requirements.txt
echo "REACT_APP_ASK_SERVER_URL=http://127.0.0.1:3001" > .env
sam build
sam local start-api
```

**Terminal 2 (Testing):**
```bash
# Wait for SAM to start, then:
curl http://127.0.0.1:3001/health
curl -X POST http://127.0.0.1:3001/ask \
  -H "Content-Type: application/json" \
  -d '{"question":"What is 2+2?"}'
```

**Terminal 3 (Web UI):**
```bash
cd dinolab/web
echo "REACT_APP_ASK_SERVER_URL=http://127.0.0.1:3001" > .env
npm install
npm start
```

Visit `http://localhost:3000` in your browser and test asking questions.

---

## Next Steps

1. **Test the full workflow:** Ask questions via the web UI and verify responses from the local server
2. **Check logs:** Review the SAM terminal for request/response logs and any errors
3. **Iterate locally:** Make code changes, rebuild (`sam build`), and restart (`sam local start-api`)
4. **Once working locally:** Refer to the cloud deployment documentation for AWS setup
5. **Keep local running:** The local server is your development environment — keep it running while developing

---

## Getting Help

If you encounter issues:

1. **Read the error message carefully** — It usually tells you exactly what's wrong
2. **Check the Troubleshooting section** above for your specific error
3. **Verify all commands** were copied exactly (watch for typos and spacing)
4. **Ensure correct directory:** Use `pwd` (macOS/Linux) or `cd` (Windows) to verify your location
5. **Check ports:** Verify ports 3000, 3001 are not blocked by a firewall
6. **Verify prerequisites:** Run all prerequisite checks again (`python --version`, `aws --version`, `sam --version`, `docker ps`)
7. **Check logs:** Always look at the full error output, not just the first line

---

## Additional Resources

- **SAM Documentation:** https://docs.aws.amazon.com/serverless-application-model/
- **AWS CLI Documentation:** https://docs.aws.amazon.com/cli/
- **Flask Documentation:** https://flask.palletsprojects.com/
- **Docker Documentation:** https://docs.docker.com/
- **Python Virtual Environments:** https://docs.python.org/3/tutorial/venv.html
