#!/bin/bash

set -e

echo "Starting application..."

# Graceful shutdown handler
trap 'echo "Shutting down..."; exit 0' SIGTERM SIGINT

# Start the application
node dist/index.js
