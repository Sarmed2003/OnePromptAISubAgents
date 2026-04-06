#!/usr/bin/env node

const http = require('http');

const port = process.env.PORT || 3000;
const timeout = 5000;

const options = {
  hostname: 'localhost',
  port: port,
  path: '/health',
  method: 'GET',
  timeout: timeout,
};

const request = http.request(options, (res) => {
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

request.on('error', () => {
  process.exit(1);
});

request.on('timeout', () => {
  request.destroy();
  process.exit(1);
});

request.end();
