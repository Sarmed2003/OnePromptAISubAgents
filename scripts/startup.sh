#!/bin/sh
set -e

echo "[startup] Starting application..."
echo "[startup] NODE_ENV: $NODE_ENV"
echo "[startup] PORT: $PORT"

# Handle graceful shutdown
trap 'echo "[startup] Received SIGTERM, shutting down gracefully..."; exit 0' SIGTERM

# Start the application
node dist/index.js
