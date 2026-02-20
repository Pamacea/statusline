#!/usr/bin/env node
/**
 * Claude Code Enhanced Statusline Script v0.7.0
 *
 * Features:
 * - Real-time token tracking from current session
 * - Git branch with staged/unstaged changes
 * - Modified files count
 * - Model version display (4.5)
 * - Cost tracking
 * - Enhanced progress bar
 * - Vim mode indicator
 * - Cache percentage display
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

// Configuration
const CONFIG = {
  maxTokens: 200000,
  progressBarWidth: 15,
  showModel: true,
  showVimMode: true,
  showCache: true,
  colors: {
    low: 'green',
    medium: 'yellow',
    high: 'red'
  },
  vim: {
    enabled: true,
    showLabel: true,
    activeText: 'vim',
    inactiveText: 'normal',
    colorWhenActive: 'green',
    colorWhenInactive: 'red'
  },
  cache: {
    enabled: true,
    showLabel: true,
    format: 'percentage', // 'percentage', 'bar', or 'both'
    prefix: 'C:',
    progressBar: {
      enabled: false, // Désactivé - on garde que le pourcentage
      length: 10,
      style: 'filled',
      color: 'progressive',
      background: 'none'
    },
    colorThresholds: {
      low: 30,
      medium: 60,
      high: 90
    }
  }
};

// ANSI Color codes
const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[91m',
  green: '\x1b[92m',
  yellow: '\x1b[93m',
  blue: '\x1b[94m',
  magenta: '\x1b[95m',
  cyan: '\x1b[96m',
  white: '\x1b[97m',
  gray: '\x1b[90m',
  orange: '\x1b[38;5;208m',
  peach: '\x1b[38;5;213m'
};

/**
 * Get current session ID and file
 */
function getCurrentSessionFile() {
  const homeDir = process.env.HOME || process.env.USERPROFILE;
  const projectsDir = join(homeDir, '.claude', 'projects');

  try {
    // Get current project path hash (match Claude's format)
    // C:\Users\Yanis\Projects\-plugins\claude-statusline -> C--Users-Yanis-Projects--plugins-claude-statusline
    const cwd = process.cwd();
    const projectHash = cwd
      .replace(/:/g, '-')      // Replace colon with dash (C: -> C-)
      .replace(/[\/\\]/g, '-'); // Replace all slashes with dashes

    // List session files for this project
    const projectDir = join(projectsDir, projectHash);
    if (!existsSync(projectDir)) {
      return null;
    }

    const files = readdirSync(projectDir)
      .filter(f => f.endsWith('.jsonl'))
      .map(f => ({
        path: join(projectDir, f),
        mtime: statSync(join(projectDir, f)).mtime.getTime()
      }))
      .sort((a, b) => b.mtime - a.mtime);  // Sort by modification time, newest first

    // Return most recent file
    return files.length > 0 ? files[0].path : null;
  } catch (error) {
    return null;
  }
}

/**
 * Read session duration from current session file
 */
function getSessionDuration(sessionFile) {
  if (!sessionFile || !existsSync(sessionFile)) {
    return 0;
  }

  try {
    const content = readFileSync(sessionFile, 'utf-8');
    const lines = content.trim().split('\n');

    // Find first and last messages with timestamps
    let firstTimestamp = null;
    let lastTimestamp = null;

    for (let i = 0; i < lines.length; i++) {
      try {
        const parsed = JSON.parse(lines[i]);
        if (parsed.timestamp) {
          if (!firstTimestamp) {
            firstTimestamp = new Date(parsed.timestamp).getTime();
          }
          lastTimestamp = new Date(parsed.timestamp).getTime();
        }
      } catch {
        continue;
      }
    }

    if (firstTimestamp && lastTimestamp) {
      return lastTimestamp - firstTimestamp;
    }
  } catch {
    // Ignore
  }

  return 0;
}
function getSessionTokens() {
  const sessionFile = getCurrentSessionFile();

  if (!sessionFile || !existsSync(sessionFile)) {
    return { current: 0, max: CONFIG.maxTokens, cost: 0, model: 'Claude Sonnet 4.5', duration: 0, inputTokens: 0, cacheReadTokens: 0, cacheCreationTokens: 0 };
  }

  try {
    // Read last line of session file
    const content = readFileSync(sessionFile, 'utf-8');
    const lines = content.trim().split('\n');

    // Find the last line with usage data
    let lastData = null;
    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        const parsed = JSON.parse(lines[i]);
        if (parsed.message?.usage) {
          lastData = parsed;
          break;
        }
      } catch {
        continue;
      }
    }

    if (!lastData || !lastData.message?.usage) {
      return { current: 0, max: CONFIG.maxTokens, cost: 0, model: 'Claude Sonnet 4.5', duration: getSessionDuration(sessionFile), inputTokens: 0, cacheReadTokens: 0, cacheCreationTokens: 0 };
    }

    const usage = lastData.message.usage;

    // Calculate total tokens
    const inputTokens = usage.input_tokens || 0;
    const cacheReadTokens = usage.cache_read_input_tokens || 0;
    const cacheCreationTokens = usage.cache_creation_input_tokens || 0;
    const outputTokens = usage.output_tokens || 0;
    const totalTokens = inputTokens + cacheReadTokens + outputTokens;

    // Extract model name
    const model = lastData.message.model || 'Claude Sonnet 4.5';

    // Cost calculation (Sonnet 4.5 pricing: $3/M input, $15/M output)
    const cost = ((inputTokens * 3) / 1000000) + ((outputTokens * 15) / 1000000);

    return {
      current: totalTokens,
      max: CONFIG.maxTokens,
      cost: cost,
      model: model,
      duration: getSessionDuration(sessionFile),
      inputTokens: inputTokens,
      cacheReadTokens: cacheReadTokens,
      cacheCreationTokens: cacheCreationTokens
    };
  } catch (error) {
    return { current: 0, max: CONFIG.maxTokens, cost: 0, model: 'Claude Sonnet 4.5', duration: 0, inputTokens: 0, cacheReadTokens: 0, cacheCreationTokens: 0 };
  }
}

/**
 * Get git information for current directory
 */
function getGitInfo() {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD 2>nul || echo ""', {
      cwd: process.cwd(),
      encoding: 'utf-8',
      shell: true,
      windowsHide: true
    }).trim();

    const root = execSync('git rev-parse --show-toplevel 2>nul || echo .', {
      cwd: process.cwd(),
      encoding: 'utf-8',
      shell: true,
      windowsHide: true
    }).trim();

    const relative = execSync('git rev-parse --show-prefix 2>nul || echo .', {
      cwd: process.cwd(),
      encoding: 'utf-8',
      shell: true,
      windowsHide: true
    }).trim().replace(/\\$/, '').replace(/\/$/, '') || '.';

    // Check dirty state and get detailed status
    const status = execSync('git status --porcelain 2>nul', {
      cwd: process.cwd(),
      encoding: 'utf-8',
      shell: true,
      windowsHide: true
    }).trim();

    const dirty = status.length > 0;

    // Count staged and unstaged files
    const stagedFiles = status.split('\n').filter(line =>
      line && (line.startsWith('M') || line.startsWith('A') || line.startsWith('D') || line.startsWith('R'))
    ).length;

    const unstagedFiles = status.split('\n').filter(line =>
      line && (line[1] === 'M' || line[1] === 'D' || line.startsWith('??'))
    ).length;

    // Get staged changes
    let stagedInsertions = 0;
    let stagedDeletions = 0;
    try {
      const stagedStat = execSync('git diff --staged --shortstat 2>nul', {
        cwd: process.cwd(),
        encoding: 'utf-8',
        shell: true,
        windowsHide: true
      }).trim();

      const stagedInsertMatch = stagedStat.match(/(\d+) insertion/);
      const stagedDeleteMatch = stagedStat.match(/(\d+) deletion/);

      if (stagedInsertMatch) stagedInsertions = parseInt(stagedInsertMatch[1], 10);
      if (stagedDeleteMatch) stagedDeletions = parseInt(stagedDeleteMatch[1], 10);
    } catch {
      // Ignore staged diff errors
    }

    // Get unstaged changes
    let unstagedInsertions = 0;
    let unstagedDeletions = 0;
    try {
      const unstagedStat = execSync('git diff --shortstat 2>nul', {
        cwd: process.cwd(),
        encoding: 'utf-8',
        shell: true,
        windowsHide: true
      }).trim();

      const unstagedInsertMatch = unstagedStat.match(/(\d+) insertion/);
      const unstagedDeleteMatch = unstagedStat.match(/(\d+) deletion/);

      if (unstagedInsertMatch) unstagedInsertions = parseInt(unstagedInsertMatch[1], 10);
      if (unstagedDeleteMatch) unstagedDeletions = parseInt(unstagedDeleteMatch[1], 10);
    } catch {
      // Ignore unstaged diff errors
    }

    return {
      branch,
      root,
      relative,
      dirty,
      stagedFiles,
      unstagedFiles,
      stagedInsertions,
      stagedDeletions,
      unstagedInsertions,
      unstagedDeletions
    };
  } catch {
    return {
      branch: '',
      root: '.',
      relative: '.',
      dirty: false,
      stagedFiles: 0,
      unstagedFiles: 0,
      stagedInsertions: 0,
      stagedDeletions: 0,
      unstagedInsertions: 0,
      unstagedDeletions: 0
    };
  }
}

/**
 * Format token count for display
 */
function formatTokenCount(count) {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(0)}K`;
  }
  return count.toString();
}

/**
 * Format duration in ms to human readable
 */
function formatDuration(ms) {
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours > 0) {
    return mins > 0 ? `${hours}h${mins}m` : `${hours}h`;
  }
  return `${mins}m`;
}

/**
 * Extract model version (e.g., "4.5" from "Claude Sonnet 4.5")
 */
function extractModelVersion(modelName) {
  // Handle both "Claude Sonnet 4.5" and "glm-4.7" formats
  const match = modelName.match(/(\d+\.\d+(?:\.\d+)?)/);
  return match ? match[1] : null;
}

/**
 * Create a progress bar with enhanced colors
 */
function createProgressBar(percentage, width = CONFIG.progressBarWidth) {
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;

  // Use better characters for progress bar
  const bar = '━'.repeat(filled) + (empty > 0 ? '╸' : '') + '─'.repeat(Math.max(0, empty - 1));

  // Enhanced colors with better gradients
  let colorCode = '\x1b[92m';  // green
  if (percentage >= 90) colorCode = '\x1b[91m';  // red
  else if (percentage >= 70) colorCode = '\x1b[38;5;208m';  // orange
  else if (percentage >= 40) colorCode = '\x1b[93m';  // yellow

  return `\x1b[1m${colorCode}[${bar}]\x1b[0m`;
}

/**
 * Check if Vim mode is active
 * Detects by checking if VIM or VIMRUNTIME environment variables are set
 */
function isVimModeActive() {
  return !!(process.env.VIM || process.env.VIMRUNTIME);
}

/**
 * Calculate cache percentage from session data
 *
 * Le pourcentage de cache représente: quel pourcentage des tokens d'entrée
 * TOTAUX ont été servis depuis le cache (économies) ?
 *
 * Formule: cache_read / (input_tokens + cache_read) * 100
 *
 * Note: input_tokens n'inclut PAS cache_read_tokens dans l'API
 */
function getCachePercentage(sessionData) {
  if (!sessionData) {
    return null;
  }

  const cacheRead = sessionData.cacheReadTokens || 0;
  const inputTokens = sessionData.inputTokens || 0;

  // Si pas de tokens du tout
  if (inputTokens === 0 && cacheRead === 0) {
    return 0;
  }

  // Total des tokens d'entrée (incluant le cache)
  const totalInputTokens = inputTokens + cacheRead;

  if (totalInputTokens === 0) {
    return 0;
  }

  // Pourcentage réel de tokens venant du cache
  const percentage = (cacheRead / totalInputTokens) * 100;

  return percentage;
}

/**
 * Format vim mode indicator
 */
function formatVimMode(isActive) {
  if (!CONFIG.vim.enabled) {
    return '';
  }

  const activeText = CONFIG.vim.activeText;
  const inactiveText = CONFIG.vim.inactiveText;

  if (!CONFIG.vim.showLabel && !isActive) {
    return '';
  }

  // Bold + couleur
  const bold = '\x1b[1m';

  if (isActive) {
    const colorCode = CONFIG.vim.colorWhenActive === 'green' ? '\x1b[92m' :
                      CONFIG.vim.colorWhenActive === 'red' ? '\x1b[91m' :
                      CONFIG.vim.colorWhenActive === 'yellow' ? '\x1b[93m' :
                      CONFIG.vim.colorWhenActive === 'gray' ? '\x1b[90m' :
                      '\x1b[92m';
    return `${bold}${colorCode}${activeText}\x1b[0m`;
  }

  const colorCode = CONFIG.vim.colorWhenInactive === 'green' ? '\x1b[92m' :
                    CONFIG.vim.colorWhenInactive === 'red' ? '\x1b[91m' :
                    CONFIG.vim.colorWhenInactive === 'yellow' ? '\x1b[93m' :
                    CONFIG.vim.colorWhenInactive === 'gray' ? '\x1b[90m' :
                    '\x1b[90m';
  return `${bold}${colorCode}${inactiveText}\x1b[0m`;
}

/**
 * Format cache percentage indicator
 */
function formatCachePercentage(cachePercentage) {
  if (!CONFIG.cache.enabled || cachePercentage === null || cachePercentage === undefined) {
    return '';
  }

  const parts = [];

  // Prefix/Label en bold
  if (CONFIG.cache.showLabel) {
    parts.push(`\x1b[1m\x1b[90m${CONFIG.cache.prefix}\x1b[0m`);
  }

  // Progress bar (désactivée pour l'instant)
  if (CONFIG.cache.progressBar.enabled) {
    parts.push(createProgressBar(cachePercentage, CONFIG.cache.progressBar.length));
  }

  // Percentage value avec couleur dynamique selon les seuils
  if (CONFIG.cache.format === 'percentage' || CONFIG.cache.format === 'both') {
    const displayValue = cachePercentage.toFixed(1);

    // Déterminer la couleur selon le pourcentage
    let colorCode;
    const thresholds = CONFIG.cache.colorThresholds;

    if (cachePercentage >= thresholds.high) {
      colorCode = '\x1b[92m'; // green - haut niveau de cache (bon!)
    } else if (cachePercentage >= thresholds.medium) {
      colorCode = '\x1b[93m'; // yellow - moyen
    } else {
      colorCode = '\x1b[91m'; // red - faible niveau de cache
    }

    // Bold pour le pourcentage avec le symbole % en couleur
    parts.push(`\x1b[1m${colorCode}${displayValue}%\x1b[0m`);
  }

  return parts.join(' ');
}

/**
 * Format git changes for display - enhanced v0.6.0
 */
function formatGitChanges(gitInfo) {
  const parts = [];

  // Staged changes (cyan)
  if (gitInfo.stagedInsertions > 0 || gitInfo.stagedDeletions > 0 || gitInfo.stagedFiles > 0) {
    const stagedParts = [];
    if (gitInfo.stagedInsertions > 0) stagedParts.push(`\x1b[96m+${gitInfo.stagedInsertions}\x1b[0m`);
    if (gitInfo.stagedDeletions > 0) stagedParts.push(`\x1b[96m-${gitInfo.stagedDeletions}\x1b[0m`);
    if (gitInfo.stagedFiles > 0) stagedParts.push(`\x1b[96m[${gitInfo.stagedFiles}]\x1b[0m`);

    if (stagedParts.length > 0) {
      parts.push(stagedParts.join(' '));
    }
  }

  // Unstaged changes (green/red/yellow)
  if (gitInfo.unstagedInsertions > 0 || gitInfo.unstagedDeletions > 0 || gitInfo.unstagedFiles > 0) {
    const unstagedParts = [];
    if (gitInfo.unstagedInsertions > 0) unstagedParts.push(`\x1b[92m+${gitInfo.unstagedInsertions}\x1b[0m`);
    if (gitInfo.unstagedDeletions > 0) unstagedParts.push(`\x1b[91m-${gitInfo.unstagedDeletions}\x1b[0m`);
    if (gitInfo.unstagedFiles > 0) unstagedParts.push(`\x1b[93m[${gitInfo.unstagedFiles}]\x1b[0m`);

    if (unstagedParts.length > 0) {
      parts.push(unstagedParts.join(' '));
    }
  }

  // Join staged and unstaged with space, no separator between them
  return parts.length > 0 ? ` \x1b[90m▸\x1b[0m ${parts.join(' ')}` : '';
}

/**
 * Get project name/path for display
 */
function getProjectPath(gitInfo) {
  if (!gitInfo.branch) {
    return process.cwd().split(/[/\\]/).pop() || '.';
  }

  if (gitInfo.relative === '.' || gitInfo.relative === '') {
    return gitInfo.root.split(/[/\\]/).pop() || '.';
  }

  const projectName = gitInfo.root.split(/[/\\]/).pop() || '.';
  return `${projectName}/${gitInfo.relative}`;
}

/**
 * Main function
 */
function main() {
  const gitInfo = getGitInfo();
  const sessionData = getSessionTokens();
  const { current, max, cost, model, duration, inputTokens, cacheReadTokens, cacheCreationTokens } = sessionData;
  const percentage = Math.min(100, Math.round((current / max) * 100));

  // Build statusline components
  const branch = gitInfo.branch || 'no-git';
  const dirtyMarker = gitInfo.dirty ? `\x1b[95m*\x1b[0m` : '';
  const projectPath = getProjectPath(gitInfo);
  const progressBar = createProgressBar(percentage);
  const currentDisplay = formatTokenCount(current);
  const maxDisplay = formatTokenCount(max);
  const gitChanges = formatGitChanges(gitInfo);

  // Extract model version
  const modelVersion = extractModelVersion(model);
  const modelDisplay = modelVersion
    ? `\x1b[38;5;213m${modelVersion}\x1b[0m`
    : '';

  // Cost display (show more decimals for small amounts)
  let costDisplay = '';
  if (cost > 0) {
    if (cost < 0.01) {
      costDisplay = `\x1b[92m$${cost.toFixed(4)}\x1b[0m`;  // 4 decimals for <$0.01
    } else {
      costDisplay = `\x1b[92m$${cost.toFixed(2)}\x1b[0m`;  // 2 decimals otherwise
    }
  }

  // Duration display
  const durationDisplay = duration > 0
    ? `\x1b[90m${formatDuration(duration)}\x1b[0m`
    : '';

  // Vim mode indicator
  const vimModeActive = isVimModeActive();
  const vimDisplay = formatVimMode(vimModeActive);

  // Cache percentage indicator
  const cacheData = {
    inputTokens: inputTokens,
    cacheReadTokens: cacheReadTokens,
    cacheCreationTokens: cacheCreationTokens
  };
  const cachePercentage = getCachePercentage(cacheData);
  const cacheDisplay = formatCachePercentage(cachePercentage);

  // Build final statusline on ONE line with better separators
  // New order: Branch ▸ Path ▸ Git changes ▸ Model ▸ Cost ▸ Progress ▸ Tokens ▸ Vim ▸ Cache ▸ Duration
  let statusline =
    `\x1b[1m\x1b[97m${branch}${dirtyMarker}\x1b[0m` +
    ` \x1b[90m▸\x1b[0m ` +
    `\x1b[90m${projectPath}\x1b[0m` +
    gitChanges +
    (modelDisplay ? ` \x1b[90m▸\x1b[0m ${modelDisplay}` : '') +
    (costDisplay ? ` \x1b[90m▸\x1b[0m ${costDisplay}` : '') +
    ` \x1b[90m▸\x1b[0m ` +
    progressBar +
    ` \x1b[90m▸\x1b[0m ` +
    `\x1b[1m${percentage}% (${currentDisplay}/${maxDisplay})\x1b[0m`;

  // Add vim mode indicator if enabled and available
  if (vimDisplay) {
    statusline += ` \x1b[90m▸\x1b[0m ${vimDisplay}`;
  }

  // Add cache indicator if enabled and available
  if (cacheDisplay) {
    statusline += ` \x1b[90m▸\x1b[0m ${cacheDisplay}`;
  }

  // Add duration display at the end
  if (durationDisplay) {
    statusline += ` \x1b[90m▸\x1b[0m ${durationDisplay}`;
  }

  // Output to stdout
  console.log(statusline);
}

main();
