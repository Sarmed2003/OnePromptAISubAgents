#!/bin/bash

set -e

echo "Starting application..."

# Handle graceful shutdown
trap 'echo "Shutting down gracefully..."; exit 0' SIGTERM SIGINT

# Wait for dependencies if needed
if [ -n "$WAIT_FOR_HOST" ]; then
  echo "Waiting for $WAIT_FOR_HOST to be ready..."
  timeout 30 bash -c "until nc -z $WAIT_FOR_HOST; do sleep 1; done" || exit 1
fi

# Run health check
echo "Running health check..."
node scripts/health-check.js || exit 1

# Start application
echo "Application started"
exec node dist/index.js
