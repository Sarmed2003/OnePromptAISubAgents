#!/bin/bash

# Smoke test script for dinolab web app
# Verifies the web app builds and starts without errors
# Exit codes: 0 = success, 1 = failure

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PREVIEW_PORT=4173
PREVIEW_URL="http://localhost:${PREVIEW_PORT}"
MAX_WAIT_SECONDS=30
CHECK_INTERVAL=1

echo "${YELLOW}Starting dinolab web app smoke test...${NC}"
echo ""

# Step 1: Check Node.js installed
echo "${YELLOW}[1/7] Checking Node.js installation...${NC}"
if ! command -v node &> /dev/null; then
  echo "${RED}✗ Node.js is not installed${NC}"
  exit 1
fi
NODE_VERSION=$(node --version)
echo "${GREEN}✓ Node.js ${NODE_VERSION} found${NC}"
echo ""

# Step 2: Install dependencies (skip if node_modules exists)
echo "${YELLOW}[2/7] Checking dependencies...${NC}"
if [ -d "node_modules" ]; then
  echo "${GREEN}✓ node_modules exists, skipping npm install${NC}"
else
  echo "Installing dependencies with npm install..."
  if ! npm install; then
    echo "${RED}✗ npm install failed${NC}"
    exit 1
  fi
  echo "${GREEN}✓ Dependencies installed${NC}"
fi
echo ""

# Step 3: Production build
echo "${YELLOW}[3/7] Running production build...${NC}"
if ! npm run build; then
  echo "${RED}✗ Production build failed${NC}"
  exit 1
fi
echo "${GREEN}✓ Production build successful${NC}"
echo ""

# Step 4: Start preview server
echo "${YELLOW}[4/7] Starting preview server on port ${PREVIEW_PORT}...${NC}"
npm run preview > /tmp/dinolab-preview.log 2>&1 &
PREVIEW_PID=$!
echo "Preview server PID: ${PREVIEW_PID}"

# Wait for server to be ready
echo "Waiting for server to start..."
WAIT_COUNT=0
while [ $WAIT_COUNT -lt $MAX_WAIT_SECONDS ]; do
  if curl -s "${PREVIEW_URL}" > /dev/null 2>&1; then
    echo "${GREEN}✓ Preview server started${NC}"
    break
  fi
  WAIT_COUNT=$((WAIT_COUNT + CHECK_INTERVAL))
  sleep $CHECK_INTERVAL
done

if [ $WAIT_COUNT -ge $MAX_WAIT_SECONDS ]; then
  echo "${RED}✗ Preview server failed to start within ${MAX_WAIT_SECONDS} seconds${NC}"
  kill $PREVIEW_PID 2>/dev/null || true
  cat /tmp/dinolab-preview.log
  exit 1
fi
echo ""

# Step 5: Verify response
echo "${YELLOW}[5/7] Verifying HTTP response...${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" "${PREVIEW_URL}")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" != "200" ]; then
  echo "${RED}✗ Expected HTTP 200, got ${HTTP_CODE}${NC}"
  kill $PREVIEW_PID 2>/dev/null || true
  exit 1
fi
echo "${GREEN}✓ HTTP 200 response received${NC}"
echo ""

echo "${YELLOW}[6/7] Verifying HTML content...${NC}"
if echo "$BODY" | grep -q "dinolab"; then
  echo "${GREEN}✓ 'dinolab' found in HTML response${NC}"
else
  echo "${RED}✗ 'dinolab' not found in HTML response${NC}"
  kill $PREVIEW_PID 2>/dev/null || true
  exit 1
fi
echo ""

# Step 6: Kill preview server
echo "${YELLOW}[7/7] Stopping preview server...${NC}"
if kill $PREVIEW_PID 2>/dev/null; then
  # Give it a moment to shut down gracefully
  sleep 1
  # Check if process still exists and force kill if needed
  if ps -p $PREVIEW_PID > /dev/null 2>&1; then
    kill -9 $PREVIEW_PID 2>/dev/null || true
  fi
  echo "${GREEN}✓ Preview server stopped${NC}"
else
  echo "${RED}✗ Failed to stop preview server${NC}"
  exit 1
fi
echo ""

# Success
echo "${GREEN}========================================${NC}"
echo "${GREEN}✓ Smoke test PASSED${NC}"
echo "${GREEN}========================================${NC}"
exit 0
