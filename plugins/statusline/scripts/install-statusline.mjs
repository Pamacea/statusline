#!/usr/bin/env node
/**
 * Statusline Installation Script
 *
 * Usage: node scripts/install-statusline.mjs
 *
 * This script will:
 * 1. Copy the statusline script to ~/.claude/statusline.mjs
 * 2. Update ~/.claude/settings.json with the statusLine configuration
 */

import { copyFileSync, existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = join(__dirname, '../..');

// Get Claude config directory
const CLAUDE_DIR = join(
  process.env.HOME || process.env.USERPROFILE,
  '.claude'
);

const STATUSLINE_SRC = join(__dirname, 'statusline.mjs');
const STATUSLINE_DST = join(CLAUDE_DIR, 'statusline.mjs');
const SETTINGS_PATH = join(CLAUDE_DIR, 'settings.json');

function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',   // cyan
    success: '\x1b[32m', // green
    warn: '\x1b[33m',    // yellow
    error: '\x1b[31m',   // red
    reset: '\x1b[0m'
  };
  const color = colors[type] || colors.info;
  console.log(`${color}${message}${colors.reset}`);
}

function ensureClaudeDir() {
  if (!existsSync(CLAUDE_DIR)) {
    log('Creating ~/.claude directory...', 'info');
    mkdirSync(CLAUDE_DIR, { recursive: true });
  }
}

function installStatuslineScript() {
  log('Installing statusline script...', 'info');

  try {
    copyFileSync(STATUSLINE_SRC, STATUSLINE_DST);
    log(`✓ Copied to: ${STATUSLINE_DST}`, 'success');

    // Make executable on Unix-like systems
    if (process.platform !== 'win32') {
      try {
        execSync(`chmod +x "${STATUSLINE_DST}"`, { stdio: 'ignore' });
        log('✓ Made executable', 'success');
      } catch {
        log('! Could not make executable (may need manual: chmod +x ~/.claude/statusline.mjs)', 'warn');
      }
    }
  } catch (error) {
    log(`✗ Failed to copy statusline script: ${error.message}`, 'error');
    throw error;
  }
}

function updateSettings() {
  log('Updating Claude settings...', 'info');

  let settings = {};

  // Read existing settings
  if (existsSync(SETTINGS_PATH)) {
    try {
      const content = readFileSync(SETTINGS_PATH, 'utf-8');
      settings = JSON.parse(content);
      log('✓ Read existing settings', 'success');
    } catch (error) {
      log(`! Could not parse existing settings: ${error.message}`, 'warn');
    }
  }

  // Add or update statusLine configuration
  const statusLineConfig = {
    type: 'command',
    // Use forward slashes for cross-platform compatibility
    command: process.platform === 'win32'
      ? `node ${STATUSLINE_DST.replace(/\\/g, '/')}`
      : `node ${STATUSLINE_DST}`
  };

  // Check if statusLine already exists
  if (settings.statusLine) {
    log('! statusLine configuration already exists', 'warn');
    log(`  Current: ${JSON.stringify(settings.statusLine)}`, 'info');
    log('  Skipping settings update. To override, edit manually.', 'warn');
    return;
  }

  settings.statusLine = statusLineConfig;

  // Write updated settings
  try {
    writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2) + '\n');
    log(`✓ Updated: ${SETTINGS_PATH}`, 'success');
  } catch (error) {
    log(`✗ Failed to write settings: ${error.message}`, 'error');
    log('! Please add manually to ~/.claude/settings.json:', 'warn');
    log(JSON.stringify({ statusLine: statusLineConfig }, null, 2), 'info');
    throw error;
  }
}

function printNextSteps() {
  console.log('\n' + '='.repeat(50));
  log('Installation complete!', 'success');
  console.log('='.repeat(50));
  console.log('\nNext steps:');
  console.log('  1. Restart Claude Code');
  console.log('  2. The statusline should appear at the top of your session');
  console.log('\nIf it doesn\'t appear, check:');
  console.log(`  - Script exists: ${STATUSLINE_DST}`);
  console.log(`  - Settings file: ${SETTINGS_PATH}`);
  console.log(`  - Run: node ${STATUSLINE_DST} (to test the script)`);
  console.log('\nTo uninstall, remove the statusLine entry from ~/.claude/settings.json');
  console.log('and delete ~/.claude/statusline.mjs\n');
}

function main() {
  console.log('\n🚀 Claude Code Statusline Installer\n');
  console.log(`Claude dir: ${CLAUDE_DIR}`);
  console.log(`Source: ${STATUSLINE_SRC}`);
  console.log(`Destination: ${STATUSLINE_DST}\n`);

  try {
    ensureClaudeDir();
    installStatuslineScript();
    updateSettings();
    printNextSteps();
  } catch (error) {
    log('\n✗ Installation failed!', 'error');
    process.exit(1);
  }
}

main();
