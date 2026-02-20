/**
 * Pure statusline renderer - no I/O, no side effects
 *
 * ARCHITECTURE: Raw data in, formatted string out.
 * ALL config decisions happen here, not in data preparation.
 */

import type { StatuslineConfig } from "./types.js";
import {
  colors,
  formatCachePercentage,
  formatCost,
  formatDuration,
  formatPath,
  formatProgressBar,
  formatResetTime,
  formatTokens,
  formatVimMode,
} from "./formatters.js";

/**
 * Git status interface for rendering
 */
export interface GitStatus {
  branch: string;
  hasChanges: boolean;
  staged: {
    added: number;
    deleted: number;
    files: number;
  };
  unstaged: {
    added: number;
    deleted: number;
    files: number;
  };
}

const WEEKLY_HOURS = 168; // 7 days * 24 hours
const FIVE_HOUR_MINUTES = 300; // 5 hours * 60 minutes

// ─────────────────────────────────────────────────────────────
// RAW DATA TYPES - No pre-formatting, just raw values
// ─────────────────────────────────────────────────────────────

export interface GitChanges {
  files: number;
  added: number;
  deleted: number;
}

export interface RawGitData {
  branch: string;
  dirty: boolean;
  staged: GitChanges;
  unstaged: GitChanges;
}

export interface UsageLimit {
  utilization: number;
  resets_at: string | null;
}

export interface RawStatuslineData {
  git: RawGitData | null;
  path: string;
  modelName: string;
  cost: number;
  durationMs: number;
  contextTokens: number | null;
  contextPercentage: number | null;
  usageLimits?: {
    five_hour: UsageLimit | null;
    seven_day: UsageLimit | null;
  };
  periodCost?: number;
  todayCost?: number;
  vimModeActive?: boolean;
  cachePercentage?: number | null;
}

// Legacy interface for backwards compatibility
export interface StatuslineData {
  branch: string;
  dirPath: string;
  modelName: string;
  sessionCost: string;
  sessionDuration: string;
  contextTokens: number | null;
  contextPercentage: number | null;
  usageLimits?: {
    five_hour: UsageLimit | null;
    seven_day: UsageLimit | null;
  };
  periodCost?: number;
  todayCost?: number;
}

// ─────────────────────────────────────────────────────────────
// FORMATTING - All config-aware formatting in one place
// ─────────────────────────────────────────────────────────────

function formatGitPart(
  git: RawGitData | null,
  config: StatuslineConfig["git"],
): string {
  if (!git || !config.enabled) return "";

  const parts: string[] = [];

  if (config.showBranch) {
    parts.push(colors.lightGray(git.branch));
  }

  if (git.dirty && config.showDirtyIndicator) {
    // Append to branch name without space
    if (parts.length > 0) {
      parts[parts.length - 1] += colors.purple("*");
    } else {
      parts.push(colors.purple("*"));
    }
  }

  const changeParts: string[] = [];

  // Show staged changes first (with cyan color to indicate staged)
  if (config.showStaged && (git.staged.files > 0 || git.staged.added > 0 || git.staged.deleted > 0)) {
    const stagedParts: string[] = [];
    if (git.staged.added > 0) stagedParts.push(colors.cyan(`+${git.staged.added}`));
    if (git.staged.deleted > 0) stagedParts.push(colors.cyan(`-${git.staged.deleted}`));
    if (config.showStaged && git.staged.files > 0) stagedParts.push(colors.cyan(`[${git.staged.files}]`));

    if (stagedParts.length > 0) {
      changeParts.push(stagedParts.join(" "));
    }
  }

  // Show unstaged changes (with standard green/red colors)
  if (config.showUnstaged || config.showChanges) {
    const unstagedParts: string[] = [];
    if (git.unstaged.added > 0) unstagedParts.push(colors.green(`+${git.unstaged.added}`));
    if (git.unstaged.deleted > 0) unstagedParts.push(colors.red(`-${git.unstaged.deleted}`));
    if (config.showUnstaged && git.unstaged.files > 0) {
      unstagedParts.push(colors.yellow(`[${git.unstaged.files}]`));
    }

    if (unstagedParts.length > 0) {
      changeParts.push(unstagedParts.join(" "));
    }
  }

  // Fallback to total changes if detailed display is disabled
  if (changeParts.length === 0 && config.showChanges) {
    const totalAdded = git.staged.added + git.unstaged.added;
    const totalDeleted = git.staged.deleted + git.unstaged.deleted;

    if (totalAdded > 0) changeParts.push(colors.green(`+${totalAdded}`));
    if (totalDeleted > 0) changeParts.push(colors.red(`-${totalDeleted}`));

    const totalFiles = git.staged.files + git.unstaged.files;
    if (totalFiles > 0) {
      changeParts.push(colors.yellow(`[${totalFiles}]`));
    }
  }

  if (changeParts.length > 0) {
    parts.push(changeParts.join(" "));
  }

  return parts.join(" ");
}

function formatSessionPart(
  cost: number,
  durationMs: number,
  contextTokens: number | null,
  contextPercentage: number | null,
  maxTokens: number,
  config: StatuslineConfig["session"],
): string {
  // No context data yet - show placeholder
  if (contextTokens === null || contextPercentage === null) {
    return `${colors.gray("S:")} ${colors.gray("-")}`;
  }

  const items: string[] = [];

  // Progress bar + percentage FIRST (changed order)
  if (config.percentage.enabled) {
    const pctParts: string[] = [];

    if (config.percentage.progressBar.enabled) {
      pctParts.push(
        formatProgressBar({
          percentage: contextPercentage,
          length: config.percentage.progressBar.length,
          style: config.percentage.progressBar.style,
          colorMode: config.percentage.progressBar.color,
          background: config.percentage.progressBar.background,
        }),
      );
    }

    if (config.percentage.showValue) {
      pctParts.push(
        `${colors.bold(colors.lightGray(contextPercentage.toString()))}${colors.gray("%")} ${colors.gray("(")}${formatTokens(contextTokens, config.tokens.showDecimals)}${colors.gray("/")}${formatTokens(maxTokens, config.tokens.showDecimals)}${colors.gray(")")}`,
      );
    }

    if (pctParts.length > 0) {
      items.push(pctParts.join(" "));
    }
  }

  // Duration LAST (added at the end)
  if (config.duration.enabled && durationMs > 0) {
    items.push(colors.gray(formatDuration(durationMs)));
  }

  if (items.length === 0) return "";

  const sep = config.infoSeparator
    ? ` ${colors.gray(config.infoSeparator)} `
    : " ";

  return items.join(sep);
}

function formatPacingDelta(delta: number): string {
  const sign = delta >= 0 ? "+" : "";
  const value = `${sign}${delta.toFixed(1)}%`;

  if (delta > 5) return colors.green(value);
  if (delta > 0) return colors.lightGray(value);
  if (delta > -10) return colors.yellow(value);
  return colors.red(value);
}

function calculateFiveHourDelta(
  utilization: number,
  resetsAt: string | null,
): number {
  if (!resetsAt) return 0;

  const resetDate = new Date(resetsAt);
  const now = new Date();
  const diffMs = resetDate.getTime() - now.getTime();
  const minutesRemaining = Math.max(0, diffMs / 60000);
  const timeElapsedPercent =
    ((FIVE_HOUR_MINUTES - minutesRemaining) / FIVE_HOUR_MINUTES) * 100;

  return utilization - timeElapsedPercent;
}

function calculateWeeklyDelta(
  utilization: number,
  resetsAt: string | null,
): number {
  if (!resetsAt) return 0;

  const resetDate = new Date(resetsAt);
  const now = new Date();
  const diffMs = resetDate.getTime() - now.getTime();
  const hoursRemaining = Math.max(0, diffMs / 3600000);
  const timeElapsedPercent =
    ((WEEKLY_HOURS - hoursRemaining) / WEEKLY_HOURS) * 100;

  return utilization - timeElapsedPercent;
}

function formatLimitsPart(
  fiveHour: UsageLimit | null,
  periodCost: number,
  config: StatuslineConfig["limits"],
): string {
  if (!config.enabled || !fiveHour) return "";

  const parts: string[] = [];

  if (config.cost.enabled && periodCost > 0) {
    parts.push(
      `${colors.gray("$")}${colors.dimWhite(formatCost(periodCost, config.cost.format))}`,
    );
  }

  if (config.percentage.enabled) {
    if (config.percentage.progressBar.enabled) {
      parts.push(
        formatProgressBar({
          percentage: fiveHour.utilization,
          length: config.percentage.progressBar.length,
          style: config.percentage.progressBar.style,
          colorMode: config.percentage.progressBar.color,
          background: config.percentage.progressBar.background,
        }),
      );
    }

    if (config.percentage.showValue) {
      parts.push(
        `${colors.lightGray(fiveHour.utilization.toString())}${colors.gray("%")}`,
      );
    }
  }

  if (config.showPacingDelta && fiveHour.resets_at) {
    const delta = calculateFiveHourDelta(fiveHour.utilization, fiveHour.resets_at);
    parts.push(
      `${colors.gray("(")}${formatPacingDelta(delta)}${colors.gray(")")}`,
    );
  }

  if (config.showTimeLeft && fiveHour.resets_at) {
    parts.push(colors.gray(`(${formatResetTime(fiveHour.resets_at)})`));
  }

  return parts.length > 0 ? `${colors.gray("L:")} ${parts.join(" ")}` : "";
}

function shouldShowWeekly(
  config: StatuslineConfig["weeklyUsage"],
  fiveHourUtilization: number | null,
): boolean {
  if (config.enabled === true) return true;
  if (config.enabled === false) return false;
  if (config.enabled === "90%" && fiveHourUtilization !== null) {
    return fiveHourUtilization >= 90;
  }
  return false;
}

function formatWeeklyPart(
  sevenDay: UsageLimit | null,
  fiveHourUtilization: number | null,
  periodCost: number,
  config: StatuslineConfig["weeklyUsage"],
): string {
  if (!shouldShowWeekly(config, fiveHourUtilization) || !sevenDay) return "";

  const parts: string[] = [];

  if (config.cost.enabled && periodCost > 0) {
    parts.push(
      `${colors.gray("$")}${colors.dimWhite(formatCost(periodCost, config.cost.format))}`,
    );
  }

  if (config.percentage.enabled) {
    if (config.percentage.progressBar.enabled) {
      parts.push(
        formatProgressBar({
          percentage: sevenDay.utilization,
          length: config.percentage.progressBar.length,
          style: config.percentage.progressBar.style,
          colorMode: config.percentage.progressBar.color,
          background: config.percentage.progressBar.background,
        }),
      );
    }

    if (config.percentage.showValue) {
      parts.push(
        `${colors.lightGray(sevenDay.utilization.toString())}${colors.gray("%")}`,
      );
    }
  }

  if (config.showPacingDelta && sevenDay.resets_at) {
    const delta = calculateWeeklyDelta(sevenDay.utilization, sevenDay.resets_at);
    parts.push(
      `${colors.gray("(")}${formatPacingDelta(delta)}${colors.gray(")")}`,
    );
  }

  if (config.showTimeLeft && sevenDay.resets_at) {
    parts.push(colors.gray(`(${formatResetTime(sevenDay.resets_at)})`));
  }

  return parts.length > 0 ? `${colors.gray("W:")} ${parts.join(" ")}` : "";
}

function formatDailyPart(
  todayCost: number,
  config: StatuslineConfig["dailySpend"],
): string {
  if (!config.cost.enabled || todayCost <= 0) return "";

  return `${colors.gray("D:")} ${colors.gray("$")}${colors.dimWhite(
    formatCost(todayCost, config.cost.format),
  )}`;
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

/**
 * Extract model version number from display name
 * Examples: "Claude Sonnet 4.5" -> "4.5", "Claude Opus 4.6" -> "4.6"
 */
function extractModelVersion(modelName: string): string | null {
  // Match version number (X.Y or X.Y.Z)
  const match = modelName.match(/(\d+\.\d+(?:\.\d+)?)/);
  return match ? match[1] : null;
}

// ─────────────────────────────────────────────────────────────
// MAIN RENDER FUNCTION - Raw data + config = output
// ─────────────────────────────────────────────────────────────

export function renderStatuslineRaw(
  data: RawStatuslineData,
  config: StatuslineConfig,
): string {
  const sep = colors.gray(config.separator);
  const sections: string[] = [];

  // Line 1: Git + Path + Model
  const line1Parts: string[] = [];

  const gitPart = formatGitPart(data.git, config.git);
  if (gitPart) line1Parts.push(gitPart);

  const pathPart = formatPath(data.path, config.pathDisplayMode);
  line1Parts.push(colors.gray(pathPart));

  // Extract model version (e.g., "4.7" from "glm-4.7") - no "S:" prefix
  const modelVersion = extractModelVersion(data.modelName);
  if (modelVersion) {
    line1Parts.push(colors.peach(modelVersion));
  } else if (config.showSonnetModel || !data.modelName.toLowerCase().includes("sonnet")) {
    line1Parts.push(colors.peach(data.modelName));
  }

  // Cost display
  if (config.session.cost.enabled && data.cost > 0) {
    const costStr = formatCost(data.cost, config.session.cost.format);
    line1Parts.push(colors.green(costStr));
  }

  sections.push(line1Parts.join(` ${sep} `));

  // Line 2: Session info
  const sessionPart = formatSessionPart(
    data.cost,
    data.durationMs,
    data.contextTokens,
    data.contextPercentage,
    config.context.maxContextTokens,
    config.session,
  );

  if (sessionPart) sections.push(sessionPart);

  // Limits
  const limitsPart = formatLimitsPart(
    data.usageLimits?.five_hour ?? null,
    data.periodCost ?? 0,
    config.limits,
  );

  if (limitsPart) sections.push(limitsPart);

  // Weekly
  const weeklyPart = formatWeeklyPart(
    data.usageLimits?.seven_day ?? null,
    data.usageLimits?.five_hour?.utilization ?? null,
    data.periodCost ?? 0,
    config.weeklyUsage,
  );

  if (weeklyPart) sections.push(weeklyPart);

  // Daily
  const dailyPart = formatDailyPart(data.todayCost ?? 0, config.dailySpend);

  if (dailyPart) sections.push(dailyPart);

  // Vim mode indicator
  if (config.vim?.enabled) {
    const vimPart = formatVimMode(
      data.vimModeActive || false,
      {
        enabled: config.vim.enabled,
        showLabel: config.vim.showLabel,
        activeText: config.vim.activeText,
        inactiveText: config.vim.inactiveText,
        colorWhenActive: config.vim.colorWhenActive,
        colorWhenInactive: config.vim.colorWhenInactive,
      },
    );
    if (vimPart) sections.push(vimPart);
  }

  // Cache percentage indicator
  if (config.cache?.enabled) {
    const cachePart = formatCachePercentage(
      data.cachePercentage || null,
      {
        enabled: config.cache.enabled,
        showLabel: config.cache.showLabel,
        format: config.cache.format,
        prefix: config.cache.prefix,
        progressBar: config.cache.progressBar,
        colorThresholds: config.cache.colorThresholds,
      },
    );
    if (cachePart) sections.push(cachePart);
  }

  const output = sections.join(` ${sep} `);

  if (config.oneLine) return output;

  // Two-line mode: break after line1
  const line1 = sections[0];
  const rest = sections.slice(1).join(` ${sep} `);

  return rest ? `${line1}\n${rest}` : line1;
}

// ─────────────────────────────────────────────────────────────
// LEGACY SUPPORT - For backwards compatibility with old data format
// ─────────────────────────────────────────────────────────────

export function renderStatusline(
  data: StatuslineData,
  config: StatuslineConfig,
): string {
  // Convert legacy format to raw format
  const rawData: RawStatuslineData = {
    git: parseGitFromBranch(data.branch),
    path: data.dirPath.startsWith("~") ? data.dirPath : data.dirPath,
    modelName: data.modelName,
    cost: parseFloat(data.sessionCost.replace(/[$,]/g, "")) || 0,
    durationMs: parseDurationToMs(data.sessionDuration),
    contextTokens: data.contextTokens,
    contextPercentage: data.contextPercentage,
    usageLimits: data.usageLimits,
    periodCost: data.periodCost,
    todayCost: data.todayCost,
  };

  return renderStatuslineRaw(rawData, config);
}

// Helper to parse legacy branch string back to git data
function parseGitFromBranch(branch: string): RawGitData | null {
  if (!branch) return null;

  // Parse "main* +10 -5" format
  const dirty = branch.includes("*");
  const branchName =
    branch.replace(/\*.*$/, "").replace(/\*/g, "").trim() || "main";

  const addMatch = branch.match(/\+(\d+)/);
  const delMatch = branch.match(/-(\d+)/);

  const added = addMatch ? parseInt(addMatch[1], 10) : 0;
  const deleted = delMatch ? parseInt(delMatch[1], 10) : 0;

  return {
    branch: branchName,
    dirty,
    staged: {
      files: 0,
      added: Math.floor(added / 2),
      deleted: Math.floor(deleted / 2),
    },
    unstaged: {
      files: 0,
      added: Math.ceil(added / 2),
      deleted: Math.ceil(deleted / 2),
    },
  };
}

// Helper to parse "12m" or "1h 30m" back to ms
function parseDurationToMs(duration: string): number {
  let ms = 0;

  const hourMatch = duration.match(/(\d+)h/);
  const minMatch = duration.match(/(\d+)m/);

  if (hourMatch) ms += parseInt(hourMatch[1], 10) * 3600000;
  if (minMatch) ms += parseInt(minMatch[1], 10) * 60000;

  return ms || 720000; // Default 12 minutes
}
