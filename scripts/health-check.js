#!/usr/bin/env node

const http = require('http');
const url = process.env.HEALTH_CHECK_URL || 'http://localhost:3000/health';
const timeout = parseInt(process.env.HEALTH_CHECK_TIMEOUT || '5000', 10);

const makeRequest = () => {
  return new Promise((resolve, reject) => {
    const request = http.get(url, { timeout }, (response) => {
      if (response.statusCode === 200) {
        resolve(true);
      } else {
        reject(new Error(`Health check returned status ${response.statusCode}`));
      }
    });

    request.on('error', (error) => {
      reject(error);
    });

    request.on('timeout', () => {
      request.destroy();
      reject(new Error('Health check timeout'));
    });
  });
};

makeRequest()
  .then(() => {
    console.log('✓ Health check passed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('✗ Health check failed:', error.message);
    process.exit(1);
  });
