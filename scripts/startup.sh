#!/bin/sh
set -e

echo "[startup] Node environment: $NODE_ENV"
echo "[startup] Starting application on port $PORT"

# Wait for graceful shutdown signals
trap 'echo "[startup] Received SIGTERM, shutting down gracefully..."; exit 0' SIGTERM
trap 'echo "[startup] Received SIGINT, shutting down gracefully..."; exit 0' SIGINT

# Start the application
node dist/index.js &
PID=$!

echo "[startup] Application started with PID $PID"

# Wait for the application process
wait $PID
EXIT_CODE=$?

echo "[startup] Application exited with code $EXIT_CODE"
exit $EXIT_CODE
