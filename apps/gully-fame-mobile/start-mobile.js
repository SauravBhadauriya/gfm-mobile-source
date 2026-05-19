#!/usr/bin/env node

const path = require('path');
const { execSync } = require('child_process');

// Set NODE_OPTIONS to disable ESM loader for this specific issue
process.env.NODE_OPTIONS = '--no-warnings';

// Disable the problematic ESM loader
process.env.NODE_NO_WARNINGS = '1';

try {
  // Run expo start with shell: true to handle Windows paths better
  execSync('npx expo start --clear', {
    stdio: 'inherit',
    cwd: __dirname,
    shell: true,
    env: {
      ...process.env,
      NODE_OPTIONS: '--no-warnings',
    },
  });
} catch (error) {
  process.exit(1);
}
