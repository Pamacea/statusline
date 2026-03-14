#!/usr/bin/env node
/**
 * PostToolUse Hook for Statusline plugin
 * Cross-platform Node.js script
 * Updates the statusline AFTER each tool use for real-time token tracking
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const PLUGIN_ROOT = dirname(__filename);

function getGitInfo() {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD 2>/dev/null || echo ""', {
      cwd: process.cwd(),
      encoding: 'utf-8',
      shell: true
    }).trim();

    const root = execSync('git rev-parse --show-toplevel 2>/dev/null || echo .', {
      cwd: process.cwd(),
      encoding: 'utf-8',
      shell: true
    }).trim();

    const relative = execSync(`git rev-parse --show-prefix 2>/dev/null || echo .`, {
      cwd: process.cwd(),
      encoding: 'utf-8',
      shell: true
    }).trim().replace(/\/$/, '') || '.';

    // Get detailed git stats
    let insertions = 0, deletions = 0, modifications = 0;
    try {
      const numstat = execSync('git diff --numstat 2>/dev/null || echo ""', {
        cwd: process.cwd(),
        encoding: 'utf-8',
        shell: true
      }).trim();

      for (const line of numstat.split('\n')) {
        if (!line.trim()) continue;
        const [add, del] = line.split('\t').map(n => parseInt(n, 10) || 0);
        insertions += add;
        deletions += del;
        modifications++;
      }
    } catch { }

    const dirty = execSync('git status --porcelain 2>/dev/null | head -1', {
      encoding: 'utf-8',
      shell: true
    }).trim().length > 0;

    return { branch, root, relative, dirty, insertions, deletions, modifications };
  } catch {
    return { branch: '', root: '.', relative: '.', dirty: false, insertions: 0, deletions: 0, modifications: 0 };
  }
}

/**
 * Get token usage from transcript file (real-time data)
 */
function getTokenUsageFromTranscript(transcriptPath, maxTokens) {
  if (!transcriptPath || !existsSync(transcriptPath)) {
    return { current: 0, max: maxTokens, percentage: 0, cachePercentage: null };
  }

  try {
    const content = readFileSync(transcriptPath, 'utf-8');
    const lines = content.trim().split('\n');

    if (lines.length === 0) {
      return { current: 0, max: maxTokens, percentage: 0, cachePercentage: null };
    }

    // Find most recent main-chain entry with usage data
    let mostRecentEntry = null;
    let mostRecentTimestamp = null;

    for (const line of lines) {
      try {
        const data = JSON.parse(line);

        if (!data.message?.usage) continue;
        if (data.isSidechain === true) continue;
        if (data.isApiErrorMessage === true) continue;
        if (!data.timestamp) continue;

        const entryTime = new Date(data.timestamp);
        if (!mostRecentTimestamp || entryTime > mostRecentTimestamp) {
          mostRecentTimestamp = entryTime;
          mostRecentEntry = data;
        }
      } catch { }
    }

    if (!mostRecentEntry?.message?.usage) {
      return { current: 0, max: maxTokens, percentage: 0, cachePercentage: null };
    }

    const usage = mostRecentEntry.message.usage;
    const inputTokens = usage.input_tokens || 0;
    const cacheReadTokens = usage.cache_read_input_tokens || 0;
    const cacheCreationTokens = usage.cache_creation_input_tokens || 0;

    const current = inputTokens + cacheReadTokens + cacheCreationTokens;
    const percentage = Math.min(100, Math.round((current / maxTokens) * 100));

    // Calculate cache percentage
    let cachePercentage = null;
    const totalCacheTokens = cacheReadTokens + cacheCreationTokens;
    if (totalCacheTokens > 0 && current > 0) {
      cachePercentage = ((totalCacheTokens / current) * 100);
    }

    return { current, max: maxTokens, percentage, cachePercentage };
  } catch {
    return { current: 0, max: maxTokens, percentage: 0, cachePercentage: null };
  }
}

/**
 * Fallback: estimate from conversation summary
 */
function getTokenUsageFromSummary(input, maxTokens) {
  const summary = input?.conversation_summary || '';
  const estimated = Math.ceil(summary.length / 4);
  const current = Math.min(estimated, maxTokens);
  return { current, max: maxTokens, percentage: Math.round((current / maxTokens) * 100), cachePercentage: null };
}

function getProgressBar(percentage, width = 15) {
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;
  const bar = '█'.repeat(filled) + '░'.repeat(empty);

  let color = '\x1b[92m'; // green
  if (percentage >= 75) color = '\x1b[91m'; // red
  else if (percentage >= 50) color = '\x1b[93m'; // yellow
  else if (percentage >= 25) color = '\x1b[96m'; // cyan

  return `${color}[${bar}]\x1b[0m`;
}

function formatTokens(tokens) {
  if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(0)}K`;
  return tokens.toString();
}

function formatCachePercentage(cachePercentage) {
  if (cachePercentage === null || cachePercentage === undefined) return '';

  const value = cachePercentage.toFixed(1);
  let color = '\x1b[92m'; // green
  if (cachePercentage < 50) color = '\x1b[91m'; // red
  else if (cachePercentage < 80) color = '\x1b[93m'; // yellow

  return `${color}C: ${value}%\x1b[0m`;
}

function main() {
  try {
    // Read stdin
    let input = {};
    let transcriptPath = null;

    try {
      const stdin = readFileSync(0, 'utf-8');
      if (stdin.trim()) {
        input = JSON.parse(stdin);
        transcriptPath = input.transcript_path || input.transcriptPath;
      }
    } catch { }

    const gitInfo = getGitInfo();

    // Try to get real token usage from transcript first
    let tokenUsage = getTokenUsageFromTranscript(transcriptPath, 200000);

    // Fallback to summary-based estimation if no transcript data
    if (tokenUsage.current === 0) {
      tokenUsage = getTokenUsageFromSummary(input, 200000);
    }

    const progressBar = getProgressBar(tokenUsage.percentage);

    const branch = gitInfo.branch || 'no-git';
    const dirty = gitInfo.dirty ? '*' : '';
    const relativePath = gitInfo.relativePath === '.' ? '~' : `~/${gitInfo.relativePath}`;

    // Build git changes display
    let gitChanges = '';
    if (gitInfo.insertions > 0 || gitInfo.deletions > 0) {
      const changes = [];
      if (gitInfo.insertions > 0) changes.push(`\x1b[32m+${gitInfo.insertions}\x1b[0m`);
      if (gitInfo.deletions > 0) changes.push(`\x1b[31m-${gitInfo.deletions}\x1b[0m`);
      if (gitInfo.modifications > 0) changes.push(`\x1b[33m[${gitInfo.modifications}]\x1b[0m`);
      gitChanges = changes.join(' ');
    }

    const tokenCount = formatTokens(tokenUsage.current);
    const maxToken = formatTokens(tokenUsage.max);

    // Build statusline components
    const components = [
      `\x1b[1m\x1b[90m${branch}${dirty}\x1b[0m`,
      relativePath,
      progressBar,
      `\x1b[90m${tokenUsage.percentage}%\x1b[0m (\x1b[90m${tokenCount}/${maxToken}\x1b[0m)`,
    ];

    if (gitChanges) components.push(gitChanges);

    const cacheStr = formatCachePercentage(tokenUsage.cachePercentage);
    if (cacheStr) components.push(cacheStr);

    const statusline = components.join(' \x1b[90m▸\x1b[0m ');

    // Output both as systemMessage (visible) and additionalContext (in context)
    const output = {
      hookSpecificOutput: {
        hookEventName: 'PostToolUse',
        systemMessage: statusline,
        additionalContext: `## 📊 Real-time Statusline\n\n${statusline}\n\n---\n\n### Current Context\n- **Token Usage**: ${tokenUsage.percentage}% (${tokenUsage.current} / ${tokenUsage.max} tokens)\n- **Git Branch**: ${gitInfo.branch || 'N/A'}${gitInfo.dirty ? ' (dirty)' : ''}\n- **Path**: ${gitInfo.relativePath}\n- **Changes**: ${gitChanges || 'None'}`
      }
    };

    writeFileSync(1, JSON.stringify(output) + '\n');

    // Also log to stderr for debugging
    writeFileSync(2, `[Statusline:PostToolUse] Updated: ${tokenUsage.percentage}% (${tokenCount}/${maxToken})\n`);
  } catch (error) {
    // Silently fail - don't break the tool execution
    writeFileSync(1, JSON.stringify({ hookSpecificOutput: { hookEventName: 'PostToolUse' } }) + '\n');
  }

  process.exit(0);
}

main();
