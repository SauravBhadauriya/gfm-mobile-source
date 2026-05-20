#!/usr/bin/env node

const path = require('path');
const { spawn } = require('child_process');

// Convert Windows path to file:// URL for metro config
const metroConfigPath = path.resolve(__dirname, 'metro.config.js');
const fileUrl = 'file://' + metroConfigPath.replace(/\\/g, '/');

// Set environment variable
process.env.METRO_CONFIG = metroConfigPath;

// Start expo with the config
const expo = spawn('npx', ['expo', 'start', '--clear'], {
  stdio: 'inherit',
  cwd: __dirname,
  shell: true,
});

expo.on('error', (error) => {
  console.error('Failed to start expo:', error);
  process.exit(1);
});

expo.on('exit', (code) => {
  process.exit(code);
});
