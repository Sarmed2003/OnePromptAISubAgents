#!/usr/bin/env node

const http = require('http');
const port = process.env.PORT || 3000;
const host = process.env.HOST || 'localhost';

const options = {
  hostname: host,
  port: port,
  path: '/health',
  method: 'GET',
  timeout: 3000,
};

const request = http.request(options, (response) => {
  if (response.statusCode === 200) {
    console.log('[health-check] OK');
    process.exit(0);
  } else {
    console.error(`[health-check] FAIL: HTTP ${response.statusCode}`);
    process.exit(1);
  }
});

request.on('error', (error) => {
  console.error(`[health-check] ERROR: ${error.message}`);
  process.exit(1);
});

request.on('timeout', () => {
  console.error('[health-check] TIMEOUT');
  request.destroy();
  process.exit(1);
});

request.end();
