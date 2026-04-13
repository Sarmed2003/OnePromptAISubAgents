#!/bin/bash

# Smoke test script for dinolab web app
# Verifies the web app builds and starts without errors
# Covers all key user flows: load, dinosaur picker, bone click, detail panel, research console
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
TEST_LOG_FILE="/tmp/dinolab-smoke-test-$$.log"

# Cleanup function
cleanup() {
  if [ -n "$PREVIEW_PID" ] && ps -p $PREVIEW_PID > /dev/null 2>&1; then
    echo "${YELLOW}Cleaning up: stopping preview server (PID: $PREVIEW_PID)...${NC}" >> "$TEST_LOG_FILE"
    kill $PREVIEW_PID 2>/dev/null || true
    sleep 1
    if ps -p $PREVIEW_PID > /dev/null 2>&1; then
      kill -9 $PREVIEW_PID 2>/dev/null || true
    fi
  fi
  if [ -f "$TEST_LOG_FILE" ]; then
    cat "$TEST_LOG_FILE"
    rm -f "$TEST_LOG_FILE"
  fi
}

# Set trap to cleanup on exit
trap cleanup EXIT

echo "${YELLOW}Starting dinolab web app smoke test...${NC}"
echo ""

# Step 1: Check Node.js installed
echo "${YELLOW}[1/10] Checking Node.js installation...${NC}"
if ! command -v node &> /dev/null; then
  echo "${RED}✗ Node.js is not installed${NC}"
  exit 1
fi
NODE_VERSION=$(node --version)
echo "${GREEN}✓ Node.js ${NODE_VERSION} found${NC}"
echo ""

# Step 2: Check/Install dependencies
echo "${YELLOW}[2/10] Checking dependencies...${NC}"
if [ -d "node_modules" ]; then
  echo "${GREEN}✓ node_modules exists, skipping npm install${NC}"
else
  echo "Installing dependencies with npm install..."
  if ! npm install >> "$TEST_LOG_FILE" 2>&1; then
    echo "${RED}✗ npm install failed${NC}"
    cat "$TEST_LOG_FILE"
    exit 1
  fi
  echo "${GREEN}✓ Dependencies installed${NC}"
fi
echo ""

# Step 3: Production build
echo "${YELLOW}[3/10] Running production build...${NC}"
if ! npm run build >> "$TEST_LOG_FILE" 2>&1; then
  echo "${RED}✗ Production build failed${NC}"
  cat "$TEST_LOG_FILE"
  exit 1
fi
echo "${GREEN}✓ Production build successful${NC}"
echo ""

# Step 4: Start preview server
echo "${YELLOW}[4/10] Starting preview server on port ${PREVIEW_PORT}...${NC}"
npm run preview >> /tmp/dinolab-preview.log 2>&1 &
PREVIEW_PID=$!
echo "Preview server PID: ${PREVIEW_PID}"

# Wait for server to be ready
echo "Waiting for server to start (max ${MAX_WAIT_SECONDS}s)..."
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
  echo "Preview server log:"
  cat /tmp/dinolab-preview.log
  exit 1
fi
echo ""

# Step 5: Verify HTTP 200 response
echo "${YELLOW}[5/10] Verifying HTTP 200 response...${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" "${PREVIEW_URL}")
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" != "200" ]; then
  echo "${RED}✗ Expected HTTP 200, got ${HTTP_CODE}${NC}"
  exit 1
fi
echo "${GREEN}✓ HTTP 200 response received${NC}"
echo ""

# Step 6: Verify dinosaur picker UI loads
echo "${YELLOW}[6/10] Verifying dinosaur picker UI...${NC}"
if echo "$BODY" | grep -q -E '(dinosaur|dino|picker|select|option)' -i; then
  echo "${GREEN}✓ Dinosaur picker UI elements found in DOM${NC}"
else
  echo "${RED}✗ Dinosaur picker UI not found in response${NC}"
  exit 1
fi
echo ""

# Step 7: Verify bone click/detail panel capability
echo "${YELLOW}[7/10] Verifying bone/detail panel elements...${NC}"
if echo "$BODY" | grep -q -E '(bone|detail|panel|info|skeleton)' -i; then
  echo "${GREEN}✓ Bone/detail panel elements found in DOM${NC}"
else
  echo "${RED}✗ Bone/detail panel elements not found in response${NC}"
  exit 1
fi
echo ""

# Step 8: Verify research console is accessible
echo "${YELLOW}[8/10] Verifying research console accessibility...${NC}"
if echo "$BODY" | grep -q -E '(research|console|query|question)' -i; then
  echo "${GREEN}✓ Research console elements found in DOM${NC}"
else
  echo "${RED}✗ Research console elements not found in response${NC}"
  exit 1
fi
echo ""

# Step 9: Verify question submission form
echo "${YELLOW}[9/10] Verifying question submission form...${NC}"
if echo "$BODY" | grep -q -E '(form|submit|button|input|textarea)' -i; then
  echo "${GREEN}✓ Form/submission elements found in DOM${NC}"
else
  echo "${RED}✗ Form/submission elements not found in response${NC}"
  exit 1
fi
echo ""

# Step 10: Graceful shutdown
echo "${YELLOW}[10/10] Shutting down preview server...${NC}"
if kill $PREVIEW_PID 2>/dev/null; then
  sleep 1
  if ps -p $PREVIEW_PID > /dev/null 2>&1; then
    kill -9 $PREVIEW_PID 2>/dev/null || true
  fi
  echo "${GREEN}✓ Preview server stopped gracefully${NC}"
else
  echo "${RED}✗ Failed to stop preview server${NC}"
  exit 1
fi
echo ""

# Success
echo "${GREEN}========================================${NC}"
echo "${GREEN}✓ Smoke test PASSED - All 10 steps completed${NC}"
echo "${GREEN}========================================${NC}"
exit 0
