#!/usr/bin/env node

const http = require('http');

const PORT = process.env.PORT || 3000;
const TIMEOUT = 3000;

const options = {
  hostname: 'localhost',
  port: PORT,
  path: '/health',
  method: 'GET',
  timeout: TIMEOUT,
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    console.log(`[health-check] Health check passed (${res.statusCode})`);
    process.exit(0);
  } else {
    console.error(`[health-check] Health check failed with status ${res.statusCode}`);
    process.exit(1);
  }
});

req.on('error', (err) => {
  console.error(`[health-check] Health check error: ${err.message}`);
  process.exit(1);
});

req.on('timeout', () => {
  console.error(`[health-check] Health check timeout after ${TIMEOUT}ms`);
  req.destroy();
  process.exit(1);
});

req.end();
